import type {StateManager} from './stateManager.js';

import {spawn} from 'node:child_process';
import readline from 'node:readline';
import {CurrentState} from './types.js';

const debounce = <T extends unknown[]>(
  fn: (...args: T) => void,
  ms: number,
) => {
  let timeout: NodeJS.Timeout;
  return (...args: T) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn(...args);
    }, ms);
  };
};

const skipCommand = debounce(
  (sec: number, callBack: (code: number | null) => void) => {
    let current = '';
    spawn('playerctl', ['position'])
      .on('exit', () => {
        spawn('playerctl', [
          'position',
          `${Math.max(0.01, Number(current) + sec)}`,
        ]).on('exit', callBack);
      })
      .stdout.on('data', data => (current += data.toString()));
  },
  300,
);

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

export const setup = (
  stateManager: StateManager<CurrentState, 'exit' | 'update'>,
) => {
  let timeSkipSeconds = 0;
  process.stdin.on('keypress', (_, key) => {
    if (key.ctrl && key.name === 'c') {
      // eslint-disable-next-line n/no-process-exit
      process.exit();
    }
    switch (key.sequence) {
      case 'J':
        spawn('playerctl', ['previous']);
        break;
      case 'j':
        timeSkipSeconds -= 5;
        stateManager.emit('update', {timeSkipSeconds});
        skipCommand(timeSkipSeconds, () => {
          timeSkipSeconds = 0;
          stateManager.emit('update', {timeSkipSeconds});
        });
        break;
      case 'k':
        spawn('playerctl', ['play-pause']);
        break;
      case 'l':
        timeSkipSeconds += 5;
        stateManager.emit('update', {timeSkipSeconds});
        skipCommand(timeSkipSeconds, () => {
          timeSkipSeconds = 0;
          stateManager.emit('update', {timeSkipSeconds});
        });
        break;
      case 'L':
        spawn('playerctl', ['next']);
        break;
    }
  });

  stateManager.on('exit', () => process.stdin.setRawMode(false));
};
