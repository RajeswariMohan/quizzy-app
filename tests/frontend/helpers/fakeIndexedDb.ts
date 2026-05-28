import { vi } from 'vitest';

/**
 * Minimal IndexedDB stub for Vitest (demo video storage tests).
 */
export function installFakeIndexedDB(): void {
  const databases = new Map<string, Map<string, Map<string, unknown>>>();

  const getStore = (dbName: string, storeName: string) => {
    if (!databases.has(dbName)) {
      databases.set(dbName, new Map());
    }
    const db = databases.get(dbName)!;
    if (!db.has(storeName)) {
      db.set(storeName, new Map());
    }
    return db.get(storeName)!;
  };

  class FakeIDBRequest<T> {
    result: T | undefined;
    error: Error | null = null;
    onsuccess: ((ev: Event) => void) | null = null;
    onerror: ((ev: Event) => void) | null = null;

    succeed(result: T) {
      this.result = result;
      queueMicrotask(() => this.onsuccess?.(new Event('success')));
    }

    fail(err: Error) {
      this.error = err;
      queueMicrotask(() => this.onerror?.(new Event('error')));
    }
  }

  const fakeIndexedDB = {
    open(dbName: string, _version?: number) {
      const request = new FakeIDBRequest<IDBDatabase>();

      const db = {
        transaction(storeName: string, _mode: IDBTransactionMode) {
          const data = getStore(dbName, storeName);
          let oncomplete: (() => void) | null = null;

          const tx = {
            objectStore: () => ({
              put(value: unknown, key: string) {
                data.set(key, value);
                queueMicrotask(() => oncomplete?.());
                return new FakeIDBRequest<string>();
              },
              get(key: string) {
                const req = new FakeIDBRequest<unknown>();
                req.succeed(data.get(key));
                return req;
              },
              delete(key: string) {
                data.delete(key);
                queueMicrotask(() => oncomplete?.());
                return new FakeIDBRequest<undefined>();
              },
            }),
            get oncomplete() {
              return oncomplete;
            },
            set oncomplete(handler: (() => void) | null) {
              oncomplete = handler;
            },
            onerror: null as (() => void) | null,
          };

          return tx as unknown as IDBTransaction;
        },
        close() {
          /* no-op */
        },
        objectStoreNames: {
          contains: () => true,
        },
      } as unknown as IDBDatabase;

      request.succeed(db);
      return request as unknown as IDBOpenDBRequest;
    },
  };

  vi.stubGlobal('indexedDB', fakeIndexedDB);
}
