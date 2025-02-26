export type CurrentState = {
  windowSize: {width: number; height: number};
  mediaState: {
    status: 'Playing' | 'Paused' | 'Stopped';
    title: string;
    artist: string;
    length: number;
    position: number;
  };
  timeSkipSeconds: number;
  exited: boolean;
};
