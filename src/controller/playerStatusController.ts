import type {StateManager} from '../model/stateManager.js';
import * as playerService from '../model/playerService.js';

import {spawn, ChildProcessWithoutNullStreams} from 'node:child_process';
import rl from 'node:readline';
import {parseStringPromise} from 'xml2js';
import {CurrentState, MediaState} from '../model/types.js';

const format = [
  '<mediaState>',
  '  <status>{{markup_escape(status)}}</status>',
  '  <title>{{markup_escape(title)}}</title>',
  '  <artist>{{markup_escape(artist)}}</artist>',
  '  <length>{{markup_escape(mpris:length)}}</length>',
  '  <position>{{markup_escape(position)}}</position>',
  '</mediaState>',
] as const;

let playerCtl: ChildProcessWithoutNullStreams | undefined;
const updatePlayerCtl = (
  stateManager: StateManager<CurrentState, 'update' | 'exit'>,
) => {
  if (playerCtl) {
    playerCtl.kill();
  }
  const selectedPlayer = stateManager.currentState.selectedPlayer;
  if (!selectedPlayer) return;
  playerCtl = spawn('playerctl', [
    'metadata',
    '-F',
    '-p',
    selectedPlayer,
    '--format',
    format.join(''),
  ]);
  stateManager.on('exit', () => playerCtl?.kill());
  rl.createInterface({input: playerCtl.stdout}).on('line', async line => {
    const data: {mediaState: MediaState} | null = await parseStringPromise(
      line,
      {
        explicitArray: false,
      },
    )
      .then(val => {
        val.mediaState.position = Number(val.mediaState.position);
        val.mediaState.length = Number(val.mediaState.length);
        return val;
      })
      .catch(() => null);
    if (data === null) return;

    if (data.mediaState.status === 'Stopped') {
      stateManager.emit('update', {
        playbackStatus: {
          [selectedPlayer]: {
            status: 'Stopped',
            title: '',
            artist: '',
            length: 0,
            position: 0,
          },
        },
      });
      return;
    }
    stateManager.emit('update', {
      playbackStatus: {[selectedPlayer]: data.mediaState},
    });
  });
};

export const setup = async (
  stateManager: StateManager<CurrentState, 'update' | 'exit'>,
) => {
  const players = await playerService.getPlayers();
  const playbackStatus = await playerService.getInitialPlaybackStatus(players);
  stateManager.emit('update', {
    players,
    selectedPlayer: players[0],
    playbackStatus,
  });
  updatePlayerCtl(stateManager);

  setInterval(async () => {
    const players = await playerService.getPlayers();
    const selectedPlayer = stateManager.currentState.selectedPlayer;
    const playbackStatus = await playerService.getInitialPlaybackStatus(players);
    stateManager.emit('update', {
      players,
      selectedPlayer:
        selectedPlayer && players.includes(selectedPlayer)
          ? selectedPlayer
          : players[0],
      playbackStatus,
    });
  }, 1000);

  stateManager.on('update', () => {
    if (
      playerCtl?.spawnargs[4] !== stateManager.currentState.selectedPlayer &&
      stateManager.currentState.selectedPlayer
    ) {
      updatePlayerCtl(stateManager);
    }
  });

  playerCtl?.addListener('error', e => {
    console.error(e);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  });
};