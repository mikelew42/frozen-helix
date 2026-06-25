// Node test stub — replaces browser-only App/App.js during Node test runs.
class StubView {
    ac() { return this; }
    rc() { return this; }
    append() { return this; }
    static stylesheet() {}
}
const noop = () => new StubView();

export { StubView as View, noop as el, noop as div, noop as h1, noop as h2, noop as p, noop as icon };
export const test = () => {};
export const assert = () => {};
export default { stylesheet() {} };
