type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const createMemoryStorage = (): StorageLike => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
};

const memoryLocalStorage = createMemoryStorage();
const memorySessionStorage = createMemoryStorage();

const canUseStorage = (storage: Storage): boolean => {
  try {
    const probeKey = '__circles_storage_probe__';
    storage.setItem(probeKey, '1');
    storage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
};

const getBrowserStorage = (type: 'local' | 'session'): StorageLike => {
  if (typeof window === 'undefined') {
    return type === 'local' ? memoryLocalStorage : memorySessionStorage;
  }

  let candidate: Storage | null = null;
  try {
    candidate = type === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    candidate = null;
  }

  if (candidate && canUseStorage(candidate)) {
    return candidate;
  }

  return type === 'local' ? memoryLocalStorage : memorySessionStorage;
};

export const safeLocalStorage: StorageLike = getBrowserStorage('local');
export const safeSessionStorage: StorageLike = getBrowserStorage('session');
