import type {EventEmitter} from './event.js';

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
    const absSec = Math.abs(sec);
    const sign = sec > 0 ? '+' : '-';
    spawn('playerctl', ['position', `${absSec}${sign}`]).on('exit', callBack);
  },
  300,
);

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

export const setup = (event: EventEmitter<CurrentState, 'exit' | 'update'>) => {
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
        event.emit('update', {timeSkipSeconds});
        skipCommand(timeSkipSeconds, () => {
          timeSkipSeconds = 0;
          event.emit('update', {timeSkipSeconds});
        });
        break;
      case 'k':
        spawn('playerctl', ['play-pause']);
        break;
      case 'l':
        timeSkipSeconds += 5;
        event.emit('update', {timeSkipSeconds});
        skipCommand(timeSkipSeconds, () => {
          timeSkipSeconds = 0;
          event.emit('update', {timeSkipSeconds});
        });
        break;
      case 'L':
        spawn('playerctl', ['next']);
        break;
    }
  });

  event.on('exit', () => process.stdin.setRawMode(false));
};
