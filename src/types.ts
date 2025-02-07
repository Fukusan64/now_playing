export type CurrentState = {
  windowSize: {width: number; height: number};
  metadata: {
    status: 'Playing' | 'Paused' | 'Stopped';
    title: string;
    artist: string;
    length: string;
    position: string;
    progress: string;
  };
  exited: boolean;
};
