import type {StateManager} from '../model/stateManager.js';
import * as playerService from '../model/playerService.js';
import readline from 'node:readline';
import {CurrentState} from '../model/types.js';

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
  (
    stateManager: StateManager<CurrentState>,
    callBack: (code: number | null) => void,
  ) => {
    const state = stateManager.currentState;
    if (!state.selectedPlayer) return;
    const mediaState = state.playbackStatus[state.selectedPlayer];
    if (!mediaState) return;
    const nextPosition = mediaState.position / 1e6 + state.timeSkipSeconds;
    playerService.seek(state.selectedPlayer, nextPosition, callBack);
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
    const state = stateManager.currentState;
    if (!state.selectedPlayer) return;
    switch (key.sequence) {
      case 'h': {
        const index = state.players.indexOf(state.selectedPlayer);
        stateManager.emit('update', {
          selectedPlayer: state.players.at(index - 1),
        });
        break;
      }
      case 'J':
        playerService.previous(state.selectedPlayer);
        break;
      case 'j':
        timeSkipSeconds -= 5;
        stateManager.emit('update', {timeSkipSeconds});
        skipCommand(stateManager, () => {
          timeSkipSeconds = 0;
          stateManager.emit('update', {timeSkipSeconds});
        });
        break;
      case 'k':
        playerService.playPause(state.selectedPlayer);
        break;
      case 'l':
        timeSkipSeconds += 5;
        stateManager.emit('update', {timeSkipSeconds});
        skipCommand(stateManager, () => {
          timeSkipSeconds = 0;
          stateManager.emit('update', {timeSkipSeconds});
        });
        break;
      case 'L':
        playerService.next(state.selectedPlayer);
        break;
      case ';': {
        const index = state.players.indexOf(state.selectedPlayer);
        const length = state.players.length;
        stateManager.emit('update', {
          selectedPlayer: state.players.at((index + 1) % length),
        });
        break;
      }
    }
  });

  stateManager.on('exit', () => process.stdin.setRawMode(false));
};