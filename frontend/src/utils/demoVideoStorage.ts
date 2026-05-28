const DB_NAME = 'quizzy-public';
const STORE_NAME = 'demo-video';
const VIDEO_KEY = 'landing-demo';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/** Persist an uploaded demo video for this browser (no server upload). */
export async function saveDemoVideoBlob(blob: Blob): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE_NAME).put(blob, VIDEO_KEY);
  });
}

export async function loadDemoVideoBlob(): Promise<Blob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => db.close();
    const request = tx.objectStore(STORE_NAME).get(VIDEO_KEY);
    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function clearDemoVideoBlob(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE_NAME).delete(VIDEO_KEY);
  });
}
