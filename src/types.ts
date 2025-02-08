export type CurrentState = {
  windowSize: {width: number; height: number};
  mediaState: {
    status: 'Playing' | 'Paused' | 'Stopped';
    title: string;
    artist: string;
    length: string;
    position: string;
    progress: number;
  };
  timeSkipSeconds: number;
  exited: boolean;
};
