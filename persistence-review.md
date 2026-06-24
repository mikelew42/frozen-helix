# Persistence Review: What We Have, What's Broken, What's Next

## What Exists

### Layer 1: File (`ext/File/`)

Two versions coexist (`File.js` and `File/0/File0.js`). `File0` is the cleaner one:

- Wraps a single `.json` file on the server filesystem.
- On construction: builds `this.url`/`this.full`, then `this.fetch()` (GET the file).
- On save: batches via `Promise.resolve().then(() => send())` — deduplicates rapid saves.
- On send: calls `socket.async_rpc("write", path, json)` over WebSocket.
- On fetch failure: initializes `this.data = {}` and immediately writes the file (create on first use).
- Exposes: `save()`, `delete()`, `this.ready` (Promise that resolves when loaded).

**Key fact:** `File` is not really a "Saver" yet — it's a concrete implementation that mixes transport, identity (path), and storage format (JSON) all in one class.

---

### Layer 2: Dir (`ext/Dir/`)

Single version:

- Wraps a directory. On construction calls `socket.ls(path)` which mkdir's as a side effect.
- Exposes `.file(name)` and `.dir(name)` — factory methods that return child `File`/`Dir` instances and assign them as named properties on the Dir instance (`this[name] = new File(...)`).
- `rm()` deletes the directory.

**Key fact:** `Dir` is mostly a namespace/factory helper — it doesn't own data, it manufactures `File` instances with the right path prefix.

---

### Layer 3: Component (`ext/Component/`)

Also has version churn (`Component.js`, `Component/0/Component0.js`, `Component/1/Component1.js`). `Component0` is the clearest:

- Constructor calls `assign()`, `instantiate()`, `initialize()`.
- `instantiate_component()` calls `load()`, which sets `this.ready`.
- `load()` base: sets `this.data = { name, type }` and warns "implement in subclass".
- `FileComponent` overrides `load()` to create a `File0`, await it, then set `this.data = file.data` and **`this.saver = this.file`**.
- Children set via `set(name, child)` — if child has `.setup()`, calls `child.setup(this, name)`.
- `setup(parent, name)` inherits the parent's saver: `this.saver = parent.saver`.
- `changed()` → `this.save()` → `this.saver.save()`.
- `toJSON()` returns `this.data` — lets JSON.stringify traverse the object graph.

**Key fact:** `this.saver = this.file` means the File IS the Saver today. The swap point exists but nothing else plugs into it.

---

### Layer 4: ListComponent (`ext/List/Component/ListComponent.js`)

Mixes `List` and `Component` together:

- `instantiate()` calls both `instantiate_component()` and `instantiate_children()`.
- `instantiate_children()` walks `this.children[]`, looks up type by name via `get_Type()`, and reinstantiates each child with its saved data.
- `changed()` explicitly calls `List.prototype.changed.call(this)` — had to override because Component's `changed` was masking List's.
- `update()` saves and notifies views.
- `adopt(child)` — called when adding to a list — calls `child.setup(this)` to wire the saver.

---

### Layer 5: Server Directory (`Server/plugins/Directory.js`)

Standalone — no relation to File/Dir:

- Watches `public/` with chokidar (excluding `.json` and `.git`).
- On any add/unlink: rebuilds `public/directory.json` and `public/framework/directory.json`.
- `build_dir()` recursively maps filesystem into `{ name, path, type, full, children[] }` objects.

---

### Layer 6: Client Directory (`ext/Directory/Directory.js`)

Also standalone:

- Fetches `directory.json`, filters to only navigable entries (`page.js`, `index.html`, `.page.js`).
- Renders a navigation tree; tracks active path.
- Used as the sidebar/nav in the framework shell.

---

## Design Dilemmas

### 1. Version Churn — Which Is Canonical?

`File.js` vs `File/0/File0.js`. `Component.js` vs `Component/0/Component0.js` vs `Component/1/Component1.js`. Each is a rework of the previous, but none of them were cleaned up. You end up with imports scattered across versions.

**The dilemma:** How do you iterate on an API used in multiple places without either breaking callers or accumulating dead code?

**Possible approaches:**
- Pick one version as canonical, delete the others, update all imports.
- Keep versioned folders but add a top-level re-export (`File/index.js → File/0/File0.js`) and always import from the short path.

---

### 2. "Component" Is the Wrong Name

`Component` implies UI. These are domain objects / persistent things. The name makes it hard to reason about them separately from views.

**The dilemma:** Rename to `Thing` (from `persistence.md`), `Model`, or something else?

**Recommendation:** `Thing` matches the design doc and the call-site reading (`thing.save()`). It's intentionally generic — domain subclasses can be named properly (`Design`, `Project`, `Step`).

---

### 3. `Saver` Exists Conceptually But Isn't a Real Interface

`this.saver = this.file` works, but it's an informal duck-type contract, not a defined interface. Nothing prevents a saver from being missing, having the wrong API, or silently doing nothing.

**The dilemma:** Define `Saver` as an explicit base class with a standard interface, or keep it as pure duck typing?

**Recommendation:** Define `Saver` with the five methods from the design doc:
```js
class Saver {
  async load()   {} // → data object
  async save()   {} // no args; reads this.thing.data
  async delete() {}
  async find()   {} // query
  async migrate(targetSaver) {}
}
```
`FileSaver` is the first concrete implementation. `Thing` holds `this.saver`, calls `this.saver.save()`. Nothing else changes.

---

### 4. `File` IS the Saver — Mixing Identity and Transport

A `File` knows its path (identity), its format (JSON), and its transport (WebSocket RPC). Those are three separate concerns. If you want to swap to `LocalStorageSaver` or `D1Saver`, you'd have to rewrite everything.

**The dilemma:** How to decouple path/identity from transport/storage?

**Recommendation:** `FileSaver` should take `{ path }` as config (identity) and use a shared transport internally. The transport (`socket.async_rpc`) can stay inside `FileSaver` for now — it's the right transport for this backend. Future savers bring their own transport.

---

### 5. `setup(parent, name)` Does Too Many Things

`child.setup(parent, name)` is called in at least three contexts:
- When a parent creates a child via `set(name, child)`.
- When a list adopts a child via `adopt(child)`.
- In the constructor when `this.parent` is passed directly.

It does: set `this.parent`, set `this.name`, inherit `this.saver`, possibly attach `this.data` to `parent.data[name]`.

That's four concerns in one method, with inconsistent behavior across versions (`Component0` sets `this.saver`; `Component1` sets `parent.data[name]`; `ListComponent.adopt()` is different again).

**The dilemma:** How to separate "establish parent/child relationship" from "inherit saver" from "register data on parent"?

**Recommendation:** Break it apart:
- `thing.parent = parent` — just a reference.
- `thing.saver = parent.saver` — explicit inheritance, not magic.
- `parent.data[name] = thing` — done at save time via `toJSON`, not at setup time.

---

### 6. `ready` Promise Chains Are Fragile

`File0.ready`, `Component0.ready`, `ListComponent.ready` — each layer wraps the previous. Several places have timing comments about "which resolves first", `_res()` being called at the wrong time, etc.

**The dilemma:** How to have a reliable `await thing.ready` that means "data is loaded and children are instantiated"?

**Possible approaches:**
- Single `ready` per thing; `instantiate` is always sync; async loading is explicit (`await thing.load()`).
- Or: keep `ready`, but ensure it's always a clean single Promise that never races.

---

### 7. `Directory` Doesn't Use File/Dir Abstractions

The server-side `Directory.js` uses `fs.writeFileSync` directly. The client-side `Directory.js` uses raw `fetch`. Neither uses the `File`/`Dir`/`Component` system. This is actually fine for the server side (it's a build step), but it means the filesystem abstraction isn't reused where it could be.

**The dilemma:** Should the server Directory plugin use a `File` instance to write `directory.json`?

**Recommendation:** No — the Directory plugin is a build step that runs once on startup, not a persistent domain object. But the client-side Directory *could* just be a `File`-backed read (fetch + watch for changes). Low priority.

---

### 8. Type Registry Is on the Constructor, Not on a Saver

`Component0.types = []` and `get_Type(type)` are on the class. When you do `FileComponent.types.push(ListComponent, P)`, you're registering which classes can be deserialized. This works but it means:
- You have to remember to push types before loading.
- The registry is on the class that happens to be the root, not on anything that has semantic meaning for "I know how to deserialize these".

**Possible approach:** Move type registry to `Saver` or to `Thing` as a class-level map. Or use a module-level registry.

---

## What a Clean `Saver` Refactor Looks Like

```
Thing (was: Component0)
  - this.data        ← the JSON data blob
  - this.saver       ← Saver instance (injected or inherited)
  - this.ready       ← Promise that resolves when loaded
  - save()           → this.saver.save()
  - set(k, v)        → this.data[k] = v; this.changed()
  - get(k)           → this.data[k]
  - changed()        → this.save()
  - toJSON()         → this.data

FileSaver extends Saver
  - this.thing       ← back-reference to Thing
  - this.path        ← "/design/abc.json"
  - load()           ← fetch + parse
  - save()           ← debounce → socket.async_rpc("write", ...)
  - delete()         ← socket.async_rpc("rm", ...)

LocalStorageSaver extends Saver  (browser, offline)
  - same interface

DOSaver extends Saver            (future)
  - same interface, different transport
```

Usage:
```js
// Root thing with its own file
const doc = new Thing({ saver: new FileSaver({ path: "/design/abc.json" }) });
await doc.ready;

// Child inherits saver from parent
const child = new Thing({ parent: doc });
// child.saver === doc.saver

// Or explicit different saver
const child2 = new Thing({ saver: new FileSaver({ path: "/other/child.json" }) });
```

---

## Suggested Rename Map

| Old Name | New Name | Reason |
|---|---|---|
| `Component` | `Thing` | Domain objects, not UI components |
| `FileComponent` | `Thing` with `FileSaver` | The "file" part belongs to the saver |
| `Component.File` | `FileSaver` | Clearer what it is |
| `file.save()` | `saver.save()` | Saver is the abstraction |
| `component.saver = file` | `thing.saver = new FileSaver(...)` | Explicit type |

---

## Open Questions Remaining

1. **Snapshot trigger** — time, delta count, or manual? (unchanged from design doc)
2. **Op vocabulary for deltas** — minimal (`set`/`delete`) or rich (`push`/`splice`/`merge`)?
3. **Type registry** — where does the "string name → class" map live?
4. **`ready` contract** — what exactly does `await thing.ready` guarantee? Just "loaded from disk"? Or also "children instantiated"?
5. **Conflict resolution** — last-write-wins for now, but when does it bite us?
6. **`Dir` role** — is Dir still needed if FileSaver handles path construction? Or does Dir become a `DirSaver` that manages a collection?

---

## Suggested Next Steps (In Order)

1. **Define `Saver` base class** with `.save()`, `.load()`, `.delete()` — even as stubs.
2. **Rename `Component0` → `Thing`** with `this.saver` as the only persistence coupling.
3. **Convert `File0` → `FileSaver`** — same logic, new name, accepts `{ thing, path }`.
4. **Wire `Thing` + `FileSaver`** in a single test page to validate the interface.
5. **Port `FileComponent`** to just be `new Thing({ saver: new FileSaver(...) })`.
6. **Port `ListComponent`** — `ListThing`? or just `Thing` with children support built in?
7. **Clean up version folders** — one canonical version, no `0/`, `1/` subdirs.
