/*
 * 자동 저장
 * ------------------------------------------------------------
 * 작업 내용을 이 컴퓨터의 브라우저 안에 저장해요. (IndexedDB)
 * 사진까지 저장해야 해서, 용량이 작은 localStorage 대신 IndexedDB를 써요.
 *
 * 알아둘 점: 이 저장은 "이 컴퓨터의 이 브라우저"에만 남아요.
 * 다른 컴퓨터로 옮기거나 백업하려면 '작업 파일로 저장'을 쓰세요.
 */
window.HometeoStorage = (function () {
  const DB_NAME = 'hometeo';
  const STORE = 'projects';
  const KEY = 'current';
  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) { reject(new Error('no-indexeddb')); return; }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function run(mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req && req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  return {
    save: (data) => run('readwrite', (s) => s.put(data, KEY)),
    load: () => run('readonly', (s) => s.get(KEY)),
    clear: () => run('readwrite', (s) => s.delete(KEY))
  };
})();
