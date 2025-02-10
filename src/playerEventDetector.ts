import type {StateManager} from './stateManager.js';

import {spawn} from 'node:child_process';
import rl from 'node:readline';
import {parseStringPromise} from 'xml2js';
import {CurrentState} from './types.js';

const format = [
  '<mediaState>',
  '  <status>{{markup_escape(status)}}</status>',
  '  <title>{{markup_escape(title)}}</title>',
  '  <artist>{{markup_escape(artist)}}</artist>',
  '  <length>{{markup_escape(mpris:length)}}</length>',
  '  <position>{{markup_escape(position)}}</position>',
  '  <progress>{{markup_escape((0+position) / mpris:length)}}</progress>',
  '</mediaState>',
] as const;

export const setup = (
  stateManager: StateManager<CurrentState, 'update' | 'exit'>,
) => {
  const playerCtl = spawn('playerctl', [
    'metadata',
    '-F',
    '--format',
    format.join(''),
  ]);

  stateManager.on('exit', () => playerCtl.kill());
  rl.createInterface({input: playerCtl.stdout}).on('line', async line => {
    const data: {mediaState: CurrentState['mediaState']} | null =
      await parseStringPromise(line, {explicitArray: false})
        .then(val => {
          val.mediaState.progress = Number(val.mediaState.progress);
          val.mediaState.position = Number(val.mediaState.position);
          val.mediaState.length = Number(val.mediaState.length);
          return val;
        })
        .catch(() => null);
    if (data === null) {
      return;
    }
    stateManager.emit('update', data);
  });

  playerCtl.addListener('error', e => {
    console.error(e);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  });
};
