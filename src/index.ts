import {event} from './event.js';
import './display.js';
import './playerEventDetector.js';
import './resizeDetector.js';
import './controller.js';

process.on('exit', () => {
  event.emit('exit', {exited: true});
});
