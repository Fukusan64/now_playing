import {initStateManager} from './stateManager.js';
import * as display from './display.js';
import * as playerEventDetector from './playerEventDetector.js';
import * as resizeDetector from './resizeDetector.js';
import * as controller from './controller.js';
import {CurrentState} from './types.js';

const initState: CurrentState = {
  windowSize: {
    width: process.stdout.columns,
    height: process.stdout.rows,
  },
  players: [],
  playbackStatus: {},
  timeSkipSeconds: 0,
  exited: false,
};
const stateManager = initStateManager(initState, ['update', 'exit']);

const main = async () => {
  display.setup(stateManager);
  await playerEventDetector.setup(stateManager);
  resizeDetector.setup(stateManager);
  controller.setup(stateManager);

  stateManager.emit('update', {});

  process.on('exit', () => {
    stateManager.emit('exit', {exited: true});
  });
};

await main();
