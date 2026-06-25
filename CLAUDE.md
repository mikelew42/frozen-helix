# frozen-helix

A local-first JS framework and app platform. Static HTML + ES modules served from Node, with a WebSocket channel to the local filesystem for persistence. No bundler, no build step, no React.

## Tech Stack

- **Server**: Node.js, custom HTTP + WebSocket server (`Server/` submodule)
- **Framework**: Vanilla ES modules in `public/framework/` (git submodule)
- **Transport**: WebSocket via `Socket` singleton → `socket.async_rpc("write"|"rm"|"ls", ...)`
- **Persistence**: JSON files on local filesystem, written via Socket

No React, Vue, or JSX. No bundler. Imports are bare `/framework/...` paths served directly.

---

## Key Architectural Concepts

### View / UI Layer
The framework's UI primitive is `View` (see `.claude/skills/view-guide`). Element helpers like `div`, `el`, `h1`, `p` create View instances. Pages are `page.js` files that run imperatively on load.

### Item — Domain Objects
`Item` is the base class for persistent domain objects (Active Record pattern). An Item wraps a `data` object, exposes `get(key)`/`set(key, val)`, and delegates persistence to a swappable `Saver`.

Key rule: **Item stays ignorant of storage**. It calls `this.save()`, never knowing whether that goes to a file, SQLite, or LocalStorage.

### Saver — Persistence Backends
A `Saver` is a plain object or class instance assigned to `item.saver`. It implements:
- `save(item, patch)` — persist the dirty patch (or full data)
- `load(item)` — populate `item.data` from storage → returns Promise
- `delete(item)` — remove from storage

`item.saver` resolves via the parent chain: `this._saver ?? this.parent?.saver`. Set the saver at the root; children inherit automatically.

Current backend: `FileSaver` (JSON file over WebSocket RPC). Future: `SQLiteSaver`, `DOSaver`, `LocalStorageSaver`.

### List — Ordered Collections
`List` (canonical: `core/List/0/List0.js`) is the framework's ordered-collection primitive. Use it wherever you'd reach for an array of domain objects or renderable children.

Key rule: **lean into List**. If a class manages a group of things — test cases, nav items, children — make that group a `List` subclass with a paired `View`. This keeps the framework consistent and gives rendering, hierarchy, and traversal for free. Examples: `Test.List` (list of test cases), `Nav.List` (list of nav items), `Item.children` (list of sub-items).

`ext/List/List.js` is the original location — still present for backwards compat. New code imports from `core/List/0/List0.js`.

### Directory
`Server/plugins/Directory.js` watches `public/` and writes `directory.json` — a full filesystem listing used by the client-side nav (`ext/Directory/Directory.js`).

---

## Class Progression Pattern

Complex classes evolve through numbered subfolders: `0/`, `1/`, `2/`, etc.

```
framework/core/Item/
  readme.md         ← design doc, open questions, next steps
  0/
    Item0.js        ← MVP: in-memory only, get/set/dirty/save
    page.js         ← test page for Item0
  1/
    Item1.js        ← adds: saver pattern + async load() via saver
    page.js
  2/
    Item2.js        ← adds: children, parent chain, list support
    page.js
```

**Rules:**
- Each level must be fully functional and testable on its own.
- Higher levels extend lower ones but **never break the lower-level contract**.
- Domain code (e.g. `Thing1`) imports a specific level (`Item3`) and that import never breaks even as `Item4`, `Item5` are added.
- No level is deleted once code depends on it.
- The `readme.md` in each module folder is the design doc — open questions, decisions, next steps.

**Default version re-export:** A module can publish a stable default by re-exporting the current blessed level from a top-level file:
```
core/Item/Item.js  →  export { default } from "./2/Item2.js";
```
Consumers then choose: `import Item from "/framework/core/Item/Item.js"` (stable default, nicer path) or `import Item2 from "/framework/core/Item/2/Item2.js"` (pinned version, explicit). The top-level re-export moves forward when a new level is promoted; pinned imports never change.

Note: this whole versioning system may evolve if the framework moves toward git submodules or npm packages — the right model for stability guarantees will depend on that distribution story.

This pattern applies to all framework modules: `Component/0/`, `File/0/`, `List/0/`, etc.

---

## File Layout

```
frozen-helix/
  Server/              ← Node server (git submodule)
  scripts/             ← Node tooling (ESM loader, test runner, browser stubs)
    loader.mjs         ← maps /framework/... to public/framework/...
    register.mjs       ← loads the loader via module.register()
    run-all.mjs        ← runs all *.test.js under public/framework/
    stubs/             ← App.js, View.js, Socket.js, localStorage.js for Node tests
  public/
    framework/         ← framework (git submodule)
      core/            ← fundamental primitives
        Item/          ← Item0–Item9 + Item.js (→ Item9)
        List/          ← List0–List8 + List.js (→ List8)
        Test/          ← Test0, Test1
        View/          ← DOM abstraction
        App/           ← App singleton
        Events/        ← on/off/emit base class
      ext/             ← extensions built on core
        File/          ← FileSaver (WebSocket RPC)
        CollectionSaver/ ← Persist whole List to one JSON file
        MemorySaver/   ← In-memory saver for tests
        LocalStorageSaver/ ← browser localStorage
        Store/         ← Named Item registry (Store.item(name) → FileSaver-backed Item9)
        Notes/         ← NoteItem + NoteList demo
        Todo/          ← TodoItem + TodoList demo
        Socket/        ← WebSocket singleton
        Directory/     ← filesystem listing nav
      lib/             ← pure utilities (util.js, is.js)
      dum/             ← DOM utility layer
    app.js             ← single entry point, exports everything including Item/List/Store/Savers
    directory.json     ← auto-generated filesystem listing
  persistence.md       ← early design doc: Saver, backends, delta model
  persistence2.md      ← later design doc: Item/ORM, dirty tracking, delta shape
  persistence-review.md ← code review of existing File/Component/Dir/Directory
```

---

## Persistence Evolution (Where We Are)

The old system used `File` + `Component` (see `ext/File/`, `ext/Component/`). These work but are messy — "Component" mixes UI and persistence concerns, and version churn left dead code behind.

The new system replaces `Component` with `Item`. The migration is additive: old Component code stays, new Item code is written fresh in `core/Item/`.

**Current phase:** Item0–Item9 and List0–List8 fully implemented with Node test suites. Savers: FileSaver (per-item), CollectionSaver (whole List → one file), LocalStorageSaver, MemorySaver — all with Node tests. Test0 (Node-runnable) and Test1 (browser renderer via View) both implemented. Demo apps: ext/Todo/, ext/Notes/. Higher-level: ext/Store/ (named Item registry). **26 suites, 26/26 passing. 21/21 Playwright browser tests passing.**

- `core/Item/Item.js` → Item9 (checkpoint/undo/redo)
- `core/List/List.js` → List8 (index_by: O(1) lookup)
- All `.test.js` files are Node-runnable via `node scripts/run-all.mjs` (26/26 passing)
- `Test1.View` renders test suites in the browser with collapsible `<details>/<summary>` — passed suites collapse by default; all page.js files use it
- `tests/browser/framework.spec.js` — 21 Playwright tests, one per framework page; run with `npx playwright test`
- `framework/page.js` — summary/index page with full Item/List/Saver/module reference tables

**Item progression:** Item0 (get/set) → Item1 (async load/save) → Item2 (children) → Item3 (jspath/delta) → Item4 (reactive List children) → Item5 (reactive set() events) → Item6 (once/save events/batch) → Item7 (computed fields) → Item8 (schema/type coercion) → Item9 (checkpoint/undo/redo)

**List progression:** List0 (traversal/parent) → List1 (add/remove events) → List2 (derived/filtered lists) → List3 (sorted derived) → List4 (reactive transform) → List5 (reactive filter via Item5 change events) → List6 (group_by / group_by_reactive) → List7 (sort_reactive) → List8 (index_by: O(1) lookup Map)

---

## Dev Conventions

- **No comments** unless the WHY is non-obvious.
- **No console.log clutter** in committed code (use it while debugging, remove it).
- **`ready` promises** — `item.ready` should mean "data loaded, children instantiated, ready to call get/set".
- **`toJSON()`** — nested Items implement `toJSON(){ return this.data }` so `JSON.stringify` traverses the object graph naturally.
- **`app.js`** is the single import entry point for pages: `import app, { el, div, h1, test } from "/app.js"`.
- **Constructor args via Object.assign** — the standard constructor pattern is `constructor(...args){ this.assign(...args) }` where `assign` does `Object.assign(this, ...args)`. This means `new Foo({ key: val })` works for any named property, in any order, all optional. Prefer this over positional arguments or custom destructuring. Subclasses call `super(...args)` and add their own defaults before or after.
- **Class-attached test suites** — test suites live on the class they test: `Item0.test = new Test0({ class: Item0 })`. The `.test.js` file (e.g. `Item0.test.js`) sets this up and re-exports the class. Higher levels import the lower class from its `.test.js` file to get the suite attached: `import Item0 from "../0/Item0.test.js"`. Then `Item1.test.add(Item0.test)` inherits the full contract.
- **Run node tests after edits** — after editing a class that has a `.test.js` file, run it: `node --import ./scripts/register.mjs public/framework/core/Item/0/Item0.test.js`. The `register.mjs` loader maps `/framework/...` imports and stubs browser-only modules (App, View). Exit 0 = all passed; failures print to stdout with ✓/✗ per assertion. Do this before reporting a change as working. If no `.test.js` exists yet, note it as a gap.
- **`readme.md` per module** — every module folder (`core/Foo/`, `ext/Bar/`) should have a `readme.md` design doc. When working in a module, check for its readme and update it: record decisions made, clear up questions that got answered, note new open questions, and add direction when a conversation leads somewhere. Keep readmes living documents, not snapshots.
- **Node-only guard in `.test.js` files** — do NOT use `import { fileURLToPath } from 'url'` at the top level (browser page.js files import test files and this crashes them). Use this pattern at the bottom instead:
  ```js
  if (typeof process !== 'undefined' && process.argv[1] === (await import('url')).fileURLToPath(import.meta.url)) {
      await suite.run();
      suite.print();
  }
  ```
  The `&&` short-circuits in the browser so `import('url')` is never evaluated.
