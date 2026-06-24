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
  public/
    framework/         ← framework (git submodule)
      core/            ← fundamental primitives (View, App, Events, Item, ...)
      ext/             ← extensions built on core (Socket, Directory, List, ...)
      lib/             ← pure utilities (util.js, is.js)
      dum/             ← DOM utility layer
    app.js             ← single entry point, re-exports everything
    directory.json     ← auto-generated filesystem listing
  persistence.md       ← early design doc: Saver, backends, delta model
  persistence2.md      ← later design doc: Item/ORM, dirty tracking, delta shape
  persistence-review.md ← code review of existing File/Component/Dir/Directory
```

---

## Persistence Evolution (Where We Are)

The old system used `File` + `Component` (see `ext/File/`, `ext/Component/`). These work but are messy — "Component" mixes UI and persistence concerns, and version churn left dead code behind.

The new system replaces `Component` with `Item`. The migration is additive: old Component code stays, new Item code is written fresh in `core/Item/`.

**Current phase:** Item0 (in-memory get/set/dirty/save with injected saver). No file I/O yet.

---

## Dev Conventions

- **No comments** unless the WHY is non-obvious.
- **No console.log clutter** in committed code (use it while debugging, remove it).
- **`ready` promises** — `item.ready` should mean "data loaded, children instantiated, ready to call get/set".
- **`toJSON()`** — nested Items implement `toJSON(){ return this.data }` so `JSON.stringify` traverses the object graph naturally.
- **`app.js`** is the single import entry point for pages: `import app, { el, div, h1, test } from "/app.js"`.
- **Constructor args via Object.assign** — the standard constructor pattern is `constructor(...args){ this.assign(...args) }` where `assign` does `Object.assign(this, ...args)`. This means `new Foo({ key: val })` works for any named property, in any order, all optional. Prefer this over positional arguments or custom destructuring. Subclasses call `super(...args)` and add their own defaults before or after.
- **Class-attached test suites** — test suites live on the class they test: `Item0.test = new Test0({ class: Item0 })`. The `.test.js` file (e.g. `Item0.test.js`) sets this up and re-exports the class. Higher levels import the lower class from its `.test.js` file to get the suite attached: `import Item0 from "../0/Item0.test.js"`. Then `Item1.test.add(Item0.test)` inherits the full contract.
- **Run node tests after edits** — after editing a class that has a `.test.js` file, run it: `node public/framework/core/Item/0/Item0.test.js`. This is the primary feedback loop for pure-logic classes. Exit 0 = all passed; failures print to stdout with ✓/✗ per assertion. Do this before reporting a change as working. If no `.test.js` exists yet, note it as a gap.
- **`readme.md` per module** — every module folder (`core/Foo/`, `ext/Bar/`) should have a `readme.md` design doc. When working in a module, check for its readme and update it: record decisions made, clear up questions that got answered, note new open questions, and add direction when a conversation leads somewhere. Keep readmes living documents, not snapshots.
