# OOP JS Persistence Design

## Design Principles

1. **Simple, elegant syntax above all else** — the API should read naturally at the call site
2. **`Thing` stays ignorant** — domain objects call `this.save()`, never care how or where
3. **Swappable backends** — change storage without changing application code
4. **Local-first** — works without a server, graduates to cloud without redesign
5. **Human-readable snapshots** — `.json` files remain the source of truth you can open and read

---

## Core Concepts

### The Framework Stack
- `View` — UI layer, `.el`, jQuery-like API (`.ac()`, `.rc()`, etc.)
- `Thing` (domain objects) — call `this.save()`, unaware of *how* saving works
- `Saver` — persistence abstraction, swappable strategies
- `Strategy` — concrete backends: FileSaver, SQLiteSaver, D1Saver, DOSaver, R2Saver

### Naming: `Saver`
**Chosen over** `Data`, `Store`, `Storage`, `Component`.  
Rationale: the call chain `thing.save() → this.saver.save()` reads naturally, and the name implies *action* not just state.

### Saver Inheritance
Children inherit their parent's Saver — no config needed. `parent.add(child)` establishes the relationship; child adopts `parent.saver`. Explicit override only when intentional.

---

## Two Kinds of Things

Most persistent objects are one of two types. The type determines the storage strategy — and they rarely need to cross over.

### Documents
Self-contained JSON blobs. Loaded whole, used whole. Shape is arbitrary or runtime-defined.

- Design files, canvases, layers
- Blog posts, rich content
- User preferences
- Form schemas

**Storage:** real filesystem (`.json`), or SQLite/D1/DO with a `data TEXT` JSON column, or R2 object storage. The container changes; the JSON content is identical across all of them.

### Records
Flat, fixed-schema rows. Queried, filtered, joined across many instances.

- Users, permissions, roles
- Orders, line items
- Log entries, audit trail

**Storage:** SQLite (local or D1). These don't move around the folder hierarchy — they live in `/data/Users.db` and stay there. You don't drag a User into a Project folder.

### The Switching Dilemma — Mostly Dissolved
Documents stay documents; Records stay records. You're rarely converting between them. Drag-and-drop reorganization is almost entirely within the Document world — moving files/folders around — which is just `rename()` on the filesystem. No migration, no `parent_id`, just the OS doing what it's always done.

The remaining cross-type edge case (e.g. moving a SQL-backed Document to a filesystem path) uses explicit `thing.migrate(targetSaver)` — never silent, never automatic.

---

## Document Storage: Containers

Same JSON content, different housing:

| Container | Where | Notes |
|---|---|---|
| `.json` file | Local filesystem | Canonical, portable, works in 100 years |
| SQLite row (`data TEXT`) | Local `.db` or D1/DO | Cloud tradeoff; no real filesystem available |
| R2 object | Cloudflare R2 | Flushed snapshots, CDN-served, public reads |

**Real filesystem is the gold standard** — tangible, portable, no DB dependency, survives any toolchain change. A Web FS UI showing actual `/path/to/thing.json` files is a feature, not a simplification.

**SQLite-backed Documents** are the cloud tradeoff. Cloudflare and most providers don't offer real per-user filesystems. A D1/DO row with a JSON column is a reasonable substitute — same content, different container. DO buffers live state; R2 holds the durable flushed snapshot.

---

## Saver Strategies

| Saver | Container | Type |
|---|---|---|
| `FileSaver` | `.json` on local filesystem | Document |
| `SQLiteSaver` | Local `.db` (via `better-sqlite3`) | Document or Record |
| `D1Saver` | Cloudflare D1 | Document (JSON col) or Record |
| `DOSaver` | Cloudflare Durable Object | Live deltas + SQLite |
| `R2Saver` | Cloudflare R2 | Flushed snapshots only |
| `LocalStorageSaver` | Browser `localStorage` | Document (small data) |

Savers are swappable per-instance or per-class without touching domain code:

```js
thing.saver = new D1Saver()           // swap instance
Thing.use(new FileSaver())            // all new instances
await thing.migrate(new FileSaver())  // explicit migration
```

---

## Delta Streaming & SQLite

### Snapshot + Delta Model
- **Snapshots** — periodic full state as `.json` (human-readable, portable baseline)
- **Deltas** — append-only changesets in SQLite (locally or D1/DO in the cloud)
- **Replay** = load snapshot + apply deltas in order

SQLite is the universal delta log. Same schema everywhere: `better-sqlite3` locally, D1/DO in the cloud.

### Delta Format

```json
{ "ts": 1719000000000, "user": "alice", "path": "app.project.tasks.42.title", "op": "set", "val": "New title" }
{ "ts": 1719000002000, "user": "bob",   "path": "app.project.tasks", "op": "push", "val": { "id": 43 } }
```

```sql
CREATE TABLE deltas (
  id    INTEGER PRIMARY KEY,
  ts    INTEGER NOT NULL,
  user  TEXT,
  path  TEXT NOT NULL,   -- JS dot-path: "app.project.tasks.42.title"
  op    TEXT NOT NULL,   -- "set" | "delete" | "push" | "splice" ...
  val   TEXT,            -- JSON-encoded value
  meta  TEXT
);
```

### Path Traversal
No registry. `app.get(path)` / `app.set(path, val)` split on `.` and walk segments. Throws if a segment doesn't exist. Array indices work as string keys on both arrays and plain objects.

```js
socket.on('delta', delta => applyDelta(app, delta.path, delta.op, delta.val))
```

One WebSocket channel routes all deltas for the entire app via `path`.

### Open Questions on Deltas
- `op` vocabulary — minimal (`set`/`delete`) or richer (`push`/`splice`/`merge`)?
- Snapshot trigger — time-based, count-based, or manual?
- Conflict strategy — last-write-wins or vector clocks?

---

## Database Scope

### Path-Scoped DBs (Documents)
DB lives alongside the content it belongs to, relative to `window.location.pathname`:

```
/design/abc123/design.db     ← all layers/state for this design
/project/xyz/project.db      ← everything for this project
```

Self-contained, portable, deletable. Mirrors filesystem intuition.

### Class-Level DBs (Records)
Records don't belong to any path — they live in a central data directory:

```
/data/User/Users.db
/data/Order/Orders.db
```

Framework code lives in `/framework/` (git submodule) — no data stored there.

### Two-Layer Model

| Layer | Owns | Where |
|---|---|---|
| **Scoped DB** | Instance data, local delta log | Path-scoped `.db` or DO |
| **Global DB** | Action log, recents, search index | `/data/global.db` or hub DO |

Every delta fans out to both: scoped DB owns the data, global DB owns the timeline (as lightweight `{ ts, user, path, op, db_ref }` pointers — no content duplication).

### Cloudflare Architecture

```
[browser] ←WebSocket→ [DO: live deltas + SQLite]
                              ↓ (periodic flush)
                         [R2: thing.json snapshot]
                              ↑ (cold load, CDN)
                         [unauthenticated browser]
```

- Unauthenticated: fetch `.json` from R2 — fast, cheap, no DB hit
- Authenticated: connect to DO — live deltas, full query power
- R2 writes on snapshot only — not per-delta (cost + propagation reasons)

### Open Questions on DB Scope
- Who owns schema versioning across DBs?
- Does the global delta log store enough to reconstruct state, or just pointers?
- One DO per scoped resource, or one DO per site with internal routing?

---

## Workspace Manifest

The workspace needs a registry of every Thing it manages — where it lives and how to talk to it. This is itself a Document, saved as `workspace.json` locally (and optionally mirrored to the cloud). It's the single file you need to reconstruct everything else.

```json
{
  "things": [
    { "id": "abc123", "type": "Design",  "saver": "FileSaver", "path": "/design/abc123.json" },
    { "id": "def456", "type": "Design",  "saver": "DOSaver",   "url": "wss://do.example.com/def456" },
    { "id": "ghi789", "type": "Project", "saver": "D1Saver",   "db": "my-d1", "table": "projects" }
  ]
}
```

On load, the workspace reads the manifest, instantiates each `Thing` with the right `Saver` already configured. The `Thing` never knows — it just calls `this.save()`.

### Embedded Things
If a Thing is embedded inside a parent Document (not top-level in the workspace), the saver config lives in the parent's data rather than the workspace manifest:

```json
{
  "id": "project-1",
  "name": "My Project",
  "children": [
    { "id": "abc123", "type": "Design", "saver": "DOSaver", "url": "wss://...", "embedded": false }
  ]
}
```

`embedded: false` signals that this child has its own independent Saver — it's referenced, not owned. An embedded child with no saver config just inherits the parent's.

---

## Sync Strategies

Two distinct models for local+remote coexistence:

### 1. Mirrored (Cloud Backup / Local Cache)
The same object is written to both local and remote on every save. Local is a cache; remote is the backup. Reads come from local (fast); writes fan out to both.

```js
thing.savers = [
  { saver: new FileSaver(), role: 'primary' },
  { saver: new DOSaver(),   role: 'mirror'  }
]
```

- Simple mental model — one thing, two copies
- Local always has a working copy, even offline
- Good default for most Documents
- Conflict risk low if only one device writes at a time

### 2. Federated (Independent Remotes)
Different instances live in different places and are edited independently. Changes are beamed as deltas — not full rewrites. A local image and a remote image are distinct objects that may sync on demand, or not at all.

```js
// local instance
localDesign.saver = new FileSaver({ path: '/design/abc123.json' })

// remote instance — edits beam deltas only
remoteDesign.saver = new DOSaver({ url: 'wss://...' })
```

- Better for collaboration (multiple independent editors)
- Delta sync means only changes travel over the wire
- Conflict resolution becomes a real concern
- More complex — explicit sync triggers needed

### Which to Use
- **Mirrored** — default for personal Documents; simple, safe, offline-capable
- **Federated** — opt-in for shared/collaborative Documents; more power, more complexity

The Saver interface should support both, but Mirrored should be the zero-config default.

---

## Cloudflare Bindings

CF resources (D1, R2, KV, DO) are not HTTP endpoints — they're **bindings**: a permission and an API in one, accessed as `env.BINDING_NAME` inside a Worker. Your browser never talks to them directly; it talks to your Worker, which talks to the resources.

```
browser → fetch('/api/thing/abc123')
        → Worker (your API layer)
        → env.BUCKET.get('design/abc123.json')   ← R2
        → env.DB.prepare('SELECT ...')            ← D1
        → env.DO.get('abc123').fetch(...)         ← DO
```

The Worker is the gatekeeper. Your `app.cloud` wrapper is just a thin client to your own Worker API — it never needs CF credentials.

### Path Scheme Unification
CF resource keys are arbitrary strings — they can mirror your filesystem paths exactly:

| Context | Path |
|---|---|
| Local filesystem | `/design/abc123.json` |
| R2 key | `design/abc123.json` |
| Worker route | `GET /design/abc123` |
| DO name | `design/abc123` |

Same string, three contexts. The Worker routes on the URL path and maps it to the right binding and key. Local and cloud use identical paths — only the backend differs.

### Workers as Your API
Pages Functions or Workers handle all CF resource access. For your static site framework, a thin API layer under `/api/` (or matched by path pattern) is all you need:

```js
// Worker route: GET /design/:id
const obj = await env.BUCKET.get(`design/${id}.json`)
return new Response(obj.body, { headers: { 'etag': obj.etag } })

// Worker route: POST /design/:id/delta
const delta = await req.json()
await env.DO.get(id).fetch('/delta', { method: 'POST', body: JSON.stringify(delta) })
```

---

## Local Development (Offline-First)

Cloudflare's **Miniflare** (built into `wrangler dev`) simulates the entire CF stack locally — fully offline, no account needed, no billing.

```
browser → fetch('/api/thing/abc123')
        → wrangler dev (localhost:8787)
        → Miniflare (local simulators)
        → .wrangler/state/d1/    ← local SQLite
        → .wrangler/state/r2/    ← local blob store
        → .wrangler/state/do/    ← local DO state
```

Miniflare runs the actual `workerd` V8 runtime — same engine as production. KV, D1, R2, DO, Queues all have local simulators backed by SQLite. Zero code change between local and deployed.

### Persistence
Local state survives restarts in `.wrangler/state/`. Add it to `.gitignore`. Reset anytime by deleting the folder.

### Remote Bindings (Optional)
If you need to test against real data, mark individual bindings `remote: true` in `wrangler.toml` — that binding proxies to the deployed CF resource while everything else stays local. Useful for testing against production schemas without deploying code.

### Dev Workflow
```
wrangler dev          ← fully local, offline, free
wrangler dev          ← with remote: true on specific bindings → hybrid
wrangler deploy       ← push to CF, identical behavior
```

No "works on my machine" surprises — the local runtime is the production runtime.

---

## Plugin System & `use()`

```js
ClassA.use(ClassB)
// → whenever new ClassA(), calls ClassB.setup(instance)
// → typically: new ClassB({ a: instance })
```

- Event-based, not direct coupling
- Enables a UI to wire up behaviors without hardcoding
- Example: `Thing.use(FileSaver)` attaches persistence without `Thing` knowing the details

---

## Open Design Questions

1. **Opt-in vs. opt-out saving** — `new Thing({ save: true })` vs. `Thing.use(Saver)` as the signal?
2. **Identity / primary key** — how does each instance know its own ID for update vs. insert?
3. **Conflict resolution** — last-write-wins, versioning, or optimistic locking?
4. **Snapshot trigger** — time, delta count, or manual?
5. **Op vocabulary** — minimal (`set`/`delete`) or rich (`push`/`splice`/`merge`)?
6. **Query interface** — what does `saver.find()` look like across backends?
7. **OPFS** — wa-sqlite is Chrome/Edge only; Firefox local story?
8. **Schema versioning** — who owns migrations across distributed DBs?

---

## Next Steps

- [ ] Define `Saver` base interface (`.save()`, `.load()`, `.delete()`, `.find()`, `.migrate()`)
- [ ] Implement `FileSaver` as reference (Node + WebSocket + `.json` snapshots)
- [ ] Add `SQLiteSaver` with `better-sqlite3` delta log
- [ ] Sketch `applyDelta(app, path, op, val)` traversal utility
- [ ] Prototype Web FS UI (real folder/file browser over actual filesystem)
- [ ] Prototype Cloudflare DO → R2 snapshot pipeline