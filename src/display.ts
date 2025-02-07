import type {CurrentState} from './types.js';
import type {EventEmitter} from './event.js';

import eaw from 'eastasianwidth';
import {
  cursorHide,
  cursorRestorePosition,
  cursorSavePosition,
  cursorShow,
  cursorUp,
  eraseDown,
} from 'ansi-escapes';

const info = (data: Readonly<CurrentState>) => {
  const title = eaw.slice(data.metadata.title, 0, data.windowSize.width - 8);
  const artist = eaw.slice(data.metadata.artist, 0, data.windowSize.width - 8);
  return [`Title:  ${title}`, `Artist: ${artist}`].join('\n');
};

const progress = (data: Readonly<CurrentState>) => {
  const barLength = data.windowSize.width;
  const bar = '-'.repeat(barLength).split('');
  const pos = Math.floor(barLength * data.metadata.progress);
  const fontColorRed = '\x1b[31m';
  const fontColorGray = '\x1b[90m';
  const resetFontColor = '\x1b[39m';
  bar[pos] = 'o' + fontColorGray;
  return fontColorRed + bar.join('') + resetFontColor;
};

const time = (data: Readonly<CurrentState>) => {
  const padding =
    data.windowSize.width -
    data.metadata.position.length -
    data.metadata.length.length;
  return `${data.metadata.position}${' '.repeat(padding)}${data.metadata.length}`;
};

const controller = (data: Readonly<CurrentState>) => {
  const isPlaying = data.metadata.status === 'Playing';
  const controller = [
    `<<    <    ${isPlaying ? '|>' : '||'}    >    >>`,
    ' J    j    k     l    L ',
  ];
  const controllerWidth = 24;
  const marginLeft = Math.max(
    0,
    Math.floor((data.windowSize.width - controllerWidth) / 2),
  );
  return controller.map(str => ' '.repeat(marginLeft) + str).join('\n');
};

let isFirstRender = true;
const display = (data: Readonly<CurrentState>) => {
  if (isFirstRender) {
    // Note: 描画範囲の確保
    process.stdout.write(cursorHide + '\n'.repeat(6) + cursorUp(6));
    isFirstRender = false;
  }
  process.stdout.write(cursorSavePosition + eraseDown);
  if (data.windowSize.width <= 24 || data.windowSize.height <= 5) {
    process.stdout.write(
      'Terminal window is too small.' + cursorRestorePosition,
    );
    return;
  }
  const output = [
    info(data),
    progress(data),
    time(data),
    controller(data),
  ].join('\n');
  process.stdout.write(output + cursorRestorePosition);
};

export const setup = (event: EventEmitter<CurrentState, 'update' | 'exit'>) => {
  event.on('update', display);
  event.on('exit', () => {
    process.stdout.write(cursorShow);
  });
};
