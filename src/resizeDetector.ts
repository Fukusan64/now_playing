import type {EventEmitter} from './event.js';

import {CurrentState} from './types.js';

export const setup = (event: EventEmitter<CurrentState, 'update'>) => {
  process.stdout.on('resize', () => {
    const data = {
      windowSize: {
        width: process.stdout.columns,
        height: process.stdout.rows,
      },
    };
    event.emit('update', data);
  });
};
