export type MediaState = {
  status: 'Playing' | 'Paused' | 'Stopped';
  title: string;
  artist: string;
  length: number;
  position: number;
};

export type CurrentState = {
  windowSize: {width: number; height: number};
  players: string[];
  selectedPlayer?: string;
  playbackStatus: {[player: string]: MediaState};
  timeSkipSeconds: number;
  exited: boolean;
};
