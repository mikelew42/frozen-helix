# scripts/

Node tooling for running framework test files outside the browser.

---

## How it works

The framework uses browser-absolute imports like `/framework/core/Foo/Foo.js`. Node can't resolve these without help. Two files wire it up:

- **`loader.mjs`** — ESM hook that maps `/framework/...` → `public/framework/...` and stubs out browser-only modules (App, View)
- **`register.mjs`** — calls `module.register('./loader.mjs', ...)` to activate the hook (required by Node 20+ hook API)

**Important:** use `--import ./scripts/register.mjs`, NOT `--import ./scripts/loader.mjs`. The former registers the hook; the latter would only run the module code without activating it.

---

## Running a test file

```sh
node --import ./scripts/register.mjs public/framework/core/Item/0/Item0.test.js
```

Or via the wrapper:

```sh
./scripts/run-tests.sh public/framework/core/Item/0/Item0.test.js
```

---

## Running all test files

```sh
node scripts/run-all.mjs
```

Recursively finds all `*.test.js` files under `public/framework/`, runs each as a subprocess, prints results, and exits 1 if any fail. Excludes `game/` (uses Vitest) and any folder starting with `.`.

---

## Browser-only module stubs

Some modules (App.js, View.js) use browser APIs at import time and crash Node. The loader redirects them to lightweight stubs in `scripts/stubs/`:

| Import | Stub |
|---|---|
| `/framework/core/App/App.js` | `scripts/stubs/App.js` |
| `/framework/core/View/View.js` | `scripts/stubs/View.js` |
| `/framework/ext/Socket/Socket.js` | `scripts/stubs/Socket.js` |

The `Socket.js` stub uses an in-memory Map instead of WebSocket. Import the stub directly to call `Socket._clear()` between tests or `Socket._store` to inspect writes. FileSaver tests also set `global.fetch` to read from the same in-memory store so load/save round-trips work end-to-end.

The stubs export the same names with no-op implementations. This lets modules that only USE those names at call-site (e.g. `render()`) be imported safely in Node — the pure logic methods are fully testable.

To add a new stub: add a file to `scripts/stubs/` and add its entry to the `STUBS` map in `loader.mjs`.

---

## Current test files — 26 suites (run-all finds them all)

```
core/Item/0..9 — Item0 through Item9 (each inherits lower contract)
core/List/0..8 — List0 through List8 (each inherits lower contract)
ext/File/FileSaver.test.js          — FileSaver (save/load/delete/round-trip via Socket stub)
ext/CollectionSaver/*.test.js       — CollectionSaver (whole List → one JSON file)
ext/MemorySaver/MemorySaver.test.js — MemorySaver (in-memory saver for tests)
ext/LocalStorageSaver/*.test.js     — LocalStorageSaver (browser localStorage via stub)
ext/Store/Store.test.js             — Store (named Item registry)
ext/Notes/NoteItem.test.js          — NoteItem + NoteList (demo domain classes)
ext/Todo/TodoItem.test.js           — TodoItem + TodoList (demo domain classes)
```

Also need `localStorage` stub for LocalStorageSaver tests — injected in the test file itself
(not through the loader, because localStorage is not imported, it's a global).

---

## Stubs

| Import | Stub |
|---|---|
| `/framework/core/App/App.js` | `scripts/stubs/App.js` |
| `/framework/core/View/View.js` | `scripts/stubs/View.js` |
| `/framework/ext/Socket/Socket.js` | `scripts/stubs/Socket.js` |

There is also `scripts/stubs/localStorage.js` — imported directly in test files that need it
(`const { default: ls } = await import(stubPath); global.localStorage = ls;`).

---

## Resolved gaps

- **Exit code** — `Test0.print()` now sets `process.exitCode = 1` on failure. CI can rely on exit code.
- **Async tests** — `Test0.run()` is async. Test functions can be `async`. Use `await test.run()` at the entry point guard.
- **game/ excluded** — `run-all.mjs` skips the `game/` directory (uses Vitest).

## Remaining gaps

- **No watcher** — no chokidar-based auto-runner yet. Run files individually.
- **Playwright track** — browser/View tests not yet integrated.
