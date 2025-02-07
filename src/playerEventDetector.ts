import type {EventEmitter} from './event.js';

import {spawn} from 'node:child_process';
import rl from 'node:readline';
import {parseStringPromise} from 'xml2js';
import {CurrentState} from './types.js';

const format = [
  '<metadata>',
  '  <status>{{markup_escape(status)}}</status>',
  '  <title>{{markup_escape(title)}}</title>',
  '  <artist>{{markup_escape(artist)}}</artist>',
  '  <length>{{markup_escape(duration(mpris:length))}}</length>',
  '  <position>{{markup_escape(duration(position))}}</position>',
  '  <progress>{{markup_escape((0+position) / mpris:length)}}</progress>',
  '</metadata>',
] as const;

export const setup = (event: EventEmitter<CurrentState, 'update' | 'exit'>) => {
  const playerCtl = spawn('playerctl', [
    'metadata',
    '-F',
    '--format',
    format.join(''),
  ]);

  process.nextTick(() => event.emit('update', {}));
  event.on('exit', () => playerCtl.kill());

  rl.createInterface({input: playerCtl.stdout}).on('line', async line => {
    const data: {metadata: CurrentState['metadata']} | null =
      await parseStringPromise(line, {explicitArray: false})
        .then(val => {
          val.progress = Number(val.progress);
          return val;
        })
        .catch(() => null);
    if (data === null) {
      return;
    }
    event.emit('update', data);
  });

  playerCtl.addListener('error', e => {
    console.error(e);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  });
};
