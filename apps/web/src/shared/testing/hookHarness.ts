// A minimal stand-in for React's hooks, so hooks can run under the node test environment without a DOM.
// Use it through vi.mock('react', ...) and drive the hook with renderHook.
type Deps = readonly unknown[] | undefined;

interface Slot {
  value?: unknown;
  deps?: Deps;
  cleanup?: void | (() => void);
  set?: (next: unknown) => void;
}

interface Instance {
  slots: Slot[];
  cursor: number;
  effects: (() => void)[];
  dirty: boolean;
  running: boolean;
  schedule: () => void;
}

let current: Instance | null = null;

function slot(): { inst: Instance; slot: Slot; fresh: boolean } {
  const inst = current;
  if (inst === null) throw new Error('Hooks can only run inside renderHook.');
  const index = inst.cursor++;
  const fresh = inst.slots[index] === undefined;
  if (fresh) inst.slots[index] = {};
  return { inst, slot: inst.slots[index], fresh };
}

const depsChanged = (a: Deps, b: Deps): boolean =>
  a === undefined || b === undefined || a.length !== b.length || a.some((value, i) => !Object.is(value, b[i]));

export const fakeReact = {
  useState<T>(initial: T | (() => T)): [T, (next: T | ((prev: T) => T)) => void] {
    const { inst, slot: s, fresh } = slot();
    if (fresh) s.value = typeof initial === 'function' ? (initial as () => T)() : initial;
    s.set ??= (next) => {
      const value = typeof next === 'function' ? (next as (prev: unknown) => unknown)(s.value) : next;
      if (Object.is(value, s.value)) return;
      s.value = value;
      inst.dirty = true;
      inst.schedule();
    };
    return [s.value as T, s.set as (next: T | ((prev: T) => T)) => void];
  },
  useEffect(effect: () => void | (() => void), deps?: Deps): void {
    const { inst, slot: s } = slot();
    if (!depsChanged(s.deps, deps)) return;
    inst.effects.push(() => {
      if (typeof s.cleanup === 'function') s.cleanup();
      s.deps = deps;
      s.cleanup = effect();
    });
  },
  useRef<T>(initial: T): { current: T } {
    const { slot: s, fresh } = slot();
    if (fresh) s.value = { current: initial };
    return s.value as { current: T };
  },
  useMemo<T>(factory: () => T, deps: Deps): T {
    const { slot: s } = slot();
    if (depsChanged(s.deps, deps)) {
      s.value = factory();
      s.deps = deps;
    }
    return s.value as T;
  },
  useCallback<T>(callback: T, deps: Deps): T {
    return fakeReact.useMemo(() => callback, deps);
  },
};

export interface RenderedHook<P, R> {
  readonly result: R;
  rerender: (props: P) => void;
  unmount: () => void;
}

export function renderHook<P, R>(hook: (props: P) => R, initialProps: P): RenderedHook<P, R> {
  let props = initialProps;
  let result: R;
  const inst: Instance = {
    slots: [],
    cursor: 0,
    effects: [],
    dirty: false,
    running: false,
    schedule: () => {
      if (!inst.running) run();
    },
  };

  function run(): void {
    inst.running = true;
    try {
      do {
        inst.dirty = false;
        inst.cursor = 0;
        current = inst;
        try {
          result = hook(props);
        } finally {
          current = null;
        }
        const pending = inst.effects.splice(0);
        pending.forEach((effect) => effect());
      } while (inst.dirty);
    } finally {
      inst.running = false;
    }
  }

  run();
  return {
    get result() {
      return result;
    },
    rerender: (next) => {
      props = next;
      run();
    },
    unmount: () => inst.slots.forEach((s) => typeof s.cleanup === 'function' && s.cleanup()),
  };
}
