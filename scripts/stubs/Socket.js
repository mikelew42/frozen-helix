// In-memory stub for Socket.js — used for Node testing of FileSaver etc.
const store = new Map();

class StubSocket {
    async async_rpc(method, path, ...args) {
        if (method === 'write') {
            store.set(path, args[0]);
            return { ok: true };
        }
        if (method === 'rm') {
            store.delete(path);
            return { ok: true };
        }
        if (method === 'ls') {
            if (store.has(path)) return { data: store.get(path) };
            throw new Error(`not found: ${path}`);
        }
        throw new Error(`unknown method: ${method}`);
    }

    // Expose store for test assertions
    static get _store() { return store; }
    static _clear() { store.clear(); }

    static singleton() {
        if (!this._instance) this._instance = new StubSocket();
        return this._instance;
    }
}

export default StubSocket;
