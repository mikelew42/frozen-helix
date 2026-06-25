// Stub for browser localStorage, used in Node test environments.
// Injected as global.localStorage by test files that need it.

class LocalStorageStub {
    constructor() { this._store = new Map(); }
    getItem(key) { return this._store.has(key) ? this._store.get(key) : null; }
    setItem(key, val) { this._store.set(key, String(val)); }
    removeItem(key) { this._store.delete(key); }
    clear() { this._store.clear(); }
    get length() { return this._store.size; }
    key(n) { return [...this._store.keys()][n] ?? null; }
    _reset() { this._store.clear(); }
}

export default new LocalStorageStub();
