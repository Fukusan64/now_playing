import {spawn} from 'node:child_process';
import {parseStringPromise} from 'xml2js';
import {MediaState} from './types.js';

const format = [
  '<mediaState>',
  '  <status>{{markup_escape(status)}}</status>',
  '  <title>{{markup_escape(title)}}</title>',
  '  <artist>{{markup_escape(artist)}}</artist>',
  '  <length>{{markup_escape(mpris:length)}}</length>',
  '  <position>{{markup_escape(position)}}</position>',
  '</mediaState>',
] as const;

export const getPlayers = () =>
  new Promise<string[]>(resolve => {
    const playerCtl = spawn('playerctl', ['-l']);
    let players = '';
    playerCtl.stdout.on('data', data => {
      players += data.toString();
    });
    playerCtl.on('exit', () => {
      resolve(players.split('\n').filter(v => v !== ''));
    });
  });

export const getInitialPlaybackStatus = async (players: string[]) => {
  const entries = await Promise.all(
    players.map(
      player =>
        new Promise<[string, MediaState | null]>(resolve => {
          const playerCtl = spawn('playerctl', [
            'metadata',
            '-p',
            player,
            '--format',
            format.join(''),
          ]);
          let xml = '';
          playerCtl.stdout.on('data', data => {
            xml += data.toString();
          });
          playerCtl.on('exit', async () => {
            const data: {mediaState: MediaState} | null =
              await parseStringPromise(xml, {explicitArray: false})
                .then(val => {
                  val.mediaState.position = Number(val.mediaState.position);
                  val.mediaState.length = Number(val.mediaState.length);
                  return val;
                })
                .catch(() => null);
            resolve([player, data ? data.mediaState : null]);
          });
        }),
    ),
  );
  // nullを除外してfromEntries
  return Object.fromEntries(
    entries.filter(([, state]) => state !== null) as [string, MediaState][],
  );
};

export const playPause = (player: string) => {
  spawn('playerctl', ['play-pause', '-p', player]);
};

export const next = (player: string) => {
  spawn('playerctl', ['next', '-p', player]);
};

export const previous = (player: string) => {
  spawn('playerctl', ['previous', '-p', player]);
};

export const seek = (
  player: string,
  position: number,
  callback: (code: number | null) => void,
) => {
  spawn('playerctl', [
    'position',
    `${Math.max(0.01, position)}`,
    '-p',
    player,
  ]).on('exit', callback);
};
