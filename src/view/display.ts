import type {CurrentState} from '../model/types.js';
import type {StateManager} from '../model/stateManager.js';

import eaw from 'eastasianwidth';
import {
  cursorHide,
  cursorRestorePosition,
  cursorSavePosition,
  cursorShow,
  cursorUp,
  eraseDown,
} from 'ansi-escapes';

const playerSelector = (data: Readonly<CurrentState>) => {
  const {selectedPlayer} = data;
  return 'h < ' + selectedPlayer + ' > ;';
};

const info = (data: Readonly<CurrentState>) => {
  if (!data.selectedPlayer) return '';
  const mediaState = data.playbackStatus[data.selectedPlayer];
  if (!mediaState) return '';
  const title = eaw.slice(mediaState.title, 0, data.windowSize.width - 8);
  const artist = eaw.slice(mediaState.artist, 0, data.windowSize.width - 8);
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
  if (!data.selectedPlayer) return '';
  const mediaState = data.playbackStatus[data.selectedPlayer];
  if (!mediaState) return '';
  const barLength = data.windowSize.width;
  const bar = '-'.repeat(barLength).split('');
  const currentPosition = Math.min(
    barLength - 1,
    Math.floor(barLength * progress(mediaState.length, mediaState.position)),
  );
  const fontColorRed = '\x1b[31m';
  const fontColorGray = '\x1b[90m';
  const resetStyle = '\x1b[0m';

  bar[currentPosition] += fontColorGray;

  const cursorPosition = Math.min(
    barLength - 1,
    Math.floor(
      barLength *
        progress(
          mediaState.length,
          mediaState.position + data.timeSkipSeconds * 1e6,
        ),
    ),
  );
  bar[cursorPosition] = 'o' + bar[cursorPosition].slice(1);
  return fontColorRed + bar.join('') + resetStyle;
};

// 秒数を時間:分:秒に変換
const formatTime = (sec: number) => {
  const hour = Math.floor(sec / 3600);
  const minute = Math.floor((sec % 3600) / 60);
  const second = Math.floor(sec % 60);
  return `${hour > 0 ? hour + ':' : ''}${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
};

const time = (data: Readonly<CurrentState>) => {
  if (!data.selectedPlayer) return '';
  const mediaState = data.playbackStatus[data.selectedPlayer];
  if (!mediaState) return '';
  let timeSkipSeconds = '';
  if (data.timeSkipSeconds !== 0) {
    const sign = data.timeSkipSeconds > 0 ? '+' : '-';
    const skipTime = formatTime(Math.abs(data.timeSkipSeconds));
    timeSkipSeconds = `${sign}${skipTime}`;
  }
  const position = formatTime(mediaState.position / 1e6);
  const length = formatTime(mediaState.length / 1e6);
  const padding =
    data.windowSize.width -
    position.length -
    timeSkipSeconds.length -
    length.length;
  return `${position}${timeSkipSeconds}${' '.repeat(padding)}${length}`;
};

const controller = (data: Readonly<CurrentState>) => {
  if (!data.selectedPlayer) return '';
  const mediaState = data.playbackStatus[data.selectedPlayer];
  if (!mediaState) return '';
  const isPlaying = mediaState.status === 'Playing';
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

const player = (data: Readonly<CurrentState>) =>
  [
    playerSelector(data),
    info(data),
    seekBar(data),
    time(data),
    controller(data),
  ].join('\n');

const miniPlayer = (data: Readonly<CurrentState>) => {
  if (!data.selectedPlayer) return '';
  const mediaState = data.playbackStatus[data.selectedPlayer];
  if (!mediaState) return '';
  const barLength = data.windowSize.width;
  const currentPosition = Math.min(
    barLength - 1,
    Math.floor(barLength * progress(mediaState.length, mediaState.position)),
  );

  let timeSkipSeconds = '';
  if (data.timeSkipSeconds !== 0) {
    const sign = data.timeSkipSeconds > 0 ? '+' : '-';
    const skipTime = formatTime(Math.abs(data.timeSkipSeconds));
    timeSkipSeconds = `${sign}${skipTime}`;
  }
  const position = formatTime(mediaState.position / 1e6);

  const {title, artist, status} = mediaState;
  const isPlaying = status === 'Playing';
  const info =
    `${isPlaying ? '▶' : '⏸'}` +
    `${position}${timeSkipSeconds} ` +
    `${title}${artist ? '@' : ''}${artist}`;
  const text = info + ' '.repeat(Math.max(0, barLength - eaw.length(info)));

  const bgRed = '\x1b[101m';
  const resetStyle = '\x1b[0m';

  return (
    bgRed +
    eaw.slice(text, 0, currentPosition) +
    resetStyle +
    eaw.slice(text, currentPosition, barLength)
  );
};

let isFirstRender = true;
const display = (data: Readonly<CurrentState>) => {
  if (isFirstRender) {
    // Note: 描画範囲の確保
    process.stdout.write(cursorHide + '\n'.repeat(7) + cursorUp(7));
    isFirstRender = false;
  }
  process.stdout.write(cursorSavePosition + eraseDown);
  if (data.windowSize.width <= 24) {
    process.stdout.write(
      'Terminal window is too small.' + cursorRestorePosition,
    );
    return;
  }
  if (data.windowSize.height > 6) {
    process.stdout.write(player(data) + cursorRestorePosition);
  } else {
    process.stdout.write(miniPlayer(data) + cursorRestorePosition);
  }
};

export const setup = (
  stateManager: StateManager<CurrentState, 'update' | 'exit'>,
) => {
  stateManager.on('update', display);
  stateManager.on('exit', () => {
    process.stdout.write(cursorShow);
  });
};