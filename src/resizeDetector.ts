import {event} from './event.js';

process.stdout.on('resize', () => {
  const data = {
    windowSize: {
      width: process.stdout.columns,
      height: process.stdout.rows,
    },
  };
  event.emit('update', data);
});
