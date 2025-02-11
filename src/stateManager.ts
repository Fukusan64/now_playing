type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P];
};

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

const mergeState = <T>(
  currentState: Readonly<T>,
  newState: RecursivePartial<T>,
) => {
  const copiedCurrentState: T = structuredClone(currentState);
  mergeDeep(copiedCurrentState, newState);
  return copiedCurrentState;
};

export type StateManager<T, EventList extends string = never> = {
  on(name: EventList, callback: (state: Readonly<T>) => void): void;
  emit(name: EventList, newState: RecursivePartial<T>): void;
  readonly currentState: T;
};

export const initStateManager = <T, EventList extends string>(
  init: T,
  eventList: EventList[],
): StateManager<T, EventList> => {
  let currentState = init;
  const listener = new Map<EventList, ((state: Readonly<T>) => void)[]>();
  return {
    on(name: EventList, callback: (state: Readonly<T>) => void) {
      if (!eventList.includes(name)) {
        throw new Error(`Event ${name} is not in the list`);
      }
      listener.set(name, [...(listener.get(name) ?? []), callback]);
    },
    emit(name: EventList, newState: RecursivePartial<T>) {
      if (!eventList.includes(name)) {
        throw new Error(`Event ${name} is not in the list`);
      }
      currentState = mergeState(currentState, newState);
      listener.get(name)?.forEach(v => v(currentState));
    },
    get currentState() {
      return structuredClone(currentState);
    },
  };
};
