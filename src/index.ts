import {initStateManager} from './model/stateManager.js';
import * as display from './view/display.js';
import * as playerStatusController from './controller/playerStatusController.js';
import * as resizeController from './controller/resizeController.js';
import * as keyboardController from './controller/keyboardController.js';
import * as thumbnailController from './controller/thumbnailController.js';
import {CurrentState} from './model/types.js';

const showThumbnail = process.argv.includes('--thumbnail');

const initState: CurrentState = {
  windowSize: {
    width: process.stdout.columns,
    height: process.stdout.rows,
  },
  players: [],
  playbackStatus: {},
  timeSkipSeconds: 0,
  exited: false,
  thumbnail: {
    show: showThumbnail,
  },
};
const stateManager = initStateManager(initState, ['update', 'exit']);

const main = async () => {
  display.setup(stateManager);
  await playerStatusController.setup(stateManager);
  thumbnailController.setup(stateManager);
  resizeController.setup(stateManager);
  keyboardController.setup(stateManager);

  stateManager.emit('update', {});

  process.on('exit', () => {
    stateManager.emit('exit', {exited: true});
  });
};

await main();