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
  const title = eaw.slice(data.mediaState.title, 0, data.windowSize.width - 8);
  const artist = eaw.slice(
    data.mediaState.artist,
    0,
    data.windowSize.width - 8,
  );
  return [`Title:  ${title}`, `Artist: ${artist}`].join('\n');
};

// 曲の長さと再生位置から進捗度を0~1で算出
// 範囲を超える場合は0,1に設定
const progress = (length: number, position: number) => {
  if (length === 0) return 0;
  const progress = position / length;
  if (progress < 0) return 0;
  if (progress > 1) return 1;
  return progress;
};

const seekBar = (data: Readonly<CurrentState>) => {
  const barLength = data.windowSize.width;
  const bar = '-'.repeat(barLength).split('');
  const currentPosition = Math.min(
    barLength - 1,
    Math.floor(
      barLength * progress(data.mediaState.length, data.mediaState.position),
    ),
  );
  const fontColorRed = '\x1b[31m';
  const fontColorGray = '\x1b[90m';
  const resetFontColor = '\x1b[39m';

  bar[currentPosition] += fontColorGray;

  const cursorPosition = Math.min(
    barLength - 1,
    Math.floor(
      barLength *
        progress(
          data.mediaState.length,
          data.mediaState.position + data.timeSkipSeconds * 1e6,
        ),
    ),
  );
  bar[cursorPosition] = 'o' + bar[cursorPosition].slice(1);
  return fontColorRed + bar.join('') + resetFontColor;
};

// 秒数を時間:分:秒に変換
const formatTime = (sec: number) => {
  const hour = Math.floor(sec / 3600);
  const minute = Math.floor((sec % 3600) / 60);
  const second = Math.floor(sec % 60);
  return `${hour > 0 ? hour + ':' : ''}${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
};

const time = (data: Readonly<CurrentState>) => {
  let timeSkipSeconds = '';
  if (data.timeSkipSeconds !== 0) {
    const sign = data.timeSkipSeconds > 0 ? '+' : '-';
    const skipTime = formatTime(Math.abs(data.timeSkipSeconds));
    timeSkipSeconds = `${sign}${skipTime}`;
  }
  const position = formatTime(data.mediaState.position / 1e6);
  const length = formatTime(data.mediaState.length / 1e6);
  const padding =
    data.windowSize.width -
    position.length -
    timeSkipSeconds.length -
    length.length;
  return `${position}${timeSkipSeconds}${' '.repeat(padding)}${length}`;
};

const controller = (data: Readonly<CurrentState>) => {
  const isPlaying = data.mediaState.status === 'Playing';
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
  const output = [info(data), seekBar(data), time(data), controller(data)].join(
    '\n',
  );
  process.stdout.write(output + cursorRestorePosition);
};

export const setup = (event: EventEmitter<CurrentState, 'update' | 'exit'>) => {
  event.on('update', display);
  event.on('exit', () => {
    process.stdout.write(cursorShow);
  });
};
