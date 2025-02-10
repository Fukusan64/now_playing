import type {StateManager} from './stateManager.js';

import {CurrentState} from './types.js';

export const setup = (stateManager: StateManager<CurrentState, 'update'>) => {
  process.stdout.on('resize', () => {
    const data = {
      windowSize: {
        width: process.stdout.columns,
        height: process.stdout.rows,
      },
    };
    stateManager.emit('update', data);
  });
};
