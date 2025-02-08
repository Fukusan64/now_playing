import {initEventEmitter} from './event.js';
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
  mediaState: {
    status: 'Stopped',
    title: '',
    artist: '',
    length: '00:00',
    position: '00:00',
    progress: 0,
  },
  timeSkipSeconds: 0,
  exited: false,
};
const event = initEventEmitter(initState, ['update', 'exit']);

display.setup(event);
playerEventDetector.setup(event);
resizeDetector.setup(event);
controller.setup(event);

event.emit('update', {});

process.on('exit', () => {
  event.emit('exit', {exited: true});
});
