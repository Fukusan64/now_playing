import type {StateManager} from '../model/stateManager.js';
import {CurrentState} from '../model/types.js';

export const setup = (
  stateManager: StateManager<CurrentState, 'update' | 'exit'>,
) => {
  stateManager.on('update', ({selectedPlayer, playbackStatus, thumbnail}) => {
    if (!selectedPlayer || !playbackStatus[selectedPlayer]) return;
    const {artUrl} = playbackStatus[selectedPlayer];
    if (thumbnail.currentArtUrl !== artUrl) {
      stateManager.emit('update', {
        thumbnail: {
          lastArtUrl: thumbnail.currentArtUrl,
          currentArtUrl: artUrl,
        },
      });
    }
  });
};
