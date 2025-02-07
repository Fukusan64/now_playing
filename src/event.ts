import {CurrentState} from './types.js';

export const eventList = ['update', 'exit'] as const;

let currentState: CurrentState = {
  windowSize: {
    width: process.stdout.columns,
    height: process.stdout.rows,
  },
  metadata: {
    status: 'Stopped',
    title: '',
    artist: '',
    length: '--:--',
    position: '--:--',
    progress: '0',
  },
  exited: false,
};

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P];
};
const mergeState = (
  currentState: Readonly<CurrentState>,
  newState: RecursivePartial<CurrentState>,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mergeDeep = (target: any, source: any) => {
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object && key in target) {
        mergeDeep(target[key], source[key]);
      } else if (key in target) {
        target[key] = source[key];
      }
    }
    return target;
  };
  const copiedCurrentState: CurrentState = structuredClone(currentState);
  mergeDeep(copiedCurrentState, newState);
  return copiedCurrentState;
};

const listener = new Map<
  (typeof eventList)[number],
  ((state: Readonly<CurrentState>) => void)[]
>();
export const event = {
  on(
    name: (typeof eventList)[number],
    callback: (state: Readonly<CurrentState>) => void,
  ) {
    listener.set(name, [...(listener.get(name) ?? []), callback]);
  },
  emit(
    name: (typeof eventList)[number],
    newState: RecursivePartial<CurrentState>,
  ) {
    currentState = mergeState(currentState, newState);
    listener.get(name)?.forEach(v => v(currentState));
  },
};
