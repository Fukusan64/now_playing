import type {EventEmitter} from './event.js';

import {spawn} from 'node:child_process';
import readline from 'node:readline';
import {CurrentState} from './types.js';

const command: {[key: string]: string[]} = {
  J: ['previous'],
  j: ['position', '5-'],
  k: ['play-pause'],
  l: ['position', '5+'],
  L: ['next'],
};
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

export const setup = (event: EventEmitter<CurrentState, 'exit'>) => {
  process.stdin.on('keypress', (_, key) => {
    if (key.ctrl && key.name === 'c') {
      // eslint-disable-next-line n/no-process-exit
      process.exit();
    }
    const currentCommand = command[key.sequence];
    if (!currentCommand) return;

    spawn('playerctl', currentCommand);
  });

  event.on('exit', () => process.stdin.setRawMode(false));
};
