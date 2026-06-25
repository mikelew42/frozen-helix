// Node test stub — replaces browser-only View/View.js during Node test runs.
export class View {
    static stylesheet() {}
    ac() { return this; }
    rc() { return this; }
    append() { return this; }
}
const noop = () => new View();
export const el = noop;
export const div = noop;
export const h1 = noop;
export const h2 = noop;
export const p = noop;
export const is = {};
export const icon = noop;
export const pre = noop;
export const a = noop;
export default View;
