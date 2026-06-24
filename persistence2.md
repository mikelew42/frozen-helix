# JS Item / ORM — Design Notes

## Pattern

Based on Active Record (Martin Fowler, 2003): an object that wraps a data row/doc,
encapsulates persistence, and adds domain logic. Named because the object is "active"
— it carries behavior (save, delete, find), not just data.

---

## Class Hierarchy

```js
class Item { ... }          // base: get/set, save, saver
class List extends Item {}  // container: .items, find, save_all (future)

// Subclass only to add schema/logic, not to encode storage type:
class User extends Item {}
```

`List` vs `Item`: everything is an `Item`. A List is an Item that has `.items` (children).
Every item can have a `.list` (parent) and `.items` (children) — avoids the classic
File/Folder regret of two separate classes.

---

## Reactivity: .get() / .set()

```js
item.get('name')         // reads from this.data
item.set('name', 'Bob')  // writes to this.data, fires reactive events
```

- `.set()` → in-memory only, triggers UI updates
- `.save()` → explicit persistence, async
- **Do not auto-save on `.set()`** — backfires on keystroke-level input
- Optional: `item.auto_save()` with debounce, off by default

Proxy (`user.name = 'Bob'`) is ergonomically nicer but harder to debug.
Start with `.get/.set`, wrap with Proxy later — internals won't change.

---

## Persistence: Saver Pattern

```js
item.save()  →  item.saver.save(item.data)
```

The `saver` is the swappable backend. `Item` doesn't care where data goes.
Saver resolves via inheritance:

```js
get saver() { return this._saver ?? this.parent?.saver }
```

Set the saver at the root (e.g. the app or list), and children inherit it automatically.

### Saver backends (future):
| Saver | Target |
|---|---|
| `JsonSaver` | `.json` file |
| `SQLiteSaver` | SQLite / D1 / DO |
| `SQLiteJsonSaver` | JSON blob stored in SQLite |

---

## MVP Scope

For now: keep it simple.

```js
item.get(key)
item.set(key, val)
item.save()          // → this.saver.save(this.data)
item.auto_save()     // debounced save, opt-in
```

Bulk ops, batching, SQL transactions — deferred until needed.

---

## JSON vs SQL Items

| | JSON / Doc | SQL / Record |
|---|---|---|
| Structure | freeform, nested, fluid | flat, schema-bound |
| `.set()` | anything goes | columns only (trust dev, skip validation for now) |
| Children | nested in `.data` blob | separate rows + `parent_id` |
| Saver via `.parent` | natural — whole tree, one write | works for finding saver, not data shape |
| Deep trees | free | requires FK design per relationship |

**SQL tree pattern:**
```sql
items: id, parent_id, root_id, type, ...
```
- `parent_id` → immediate parent
- `root_id` → fetch entire tree in one query: `WHERE root_id = ?`
- On `add(child)`: set `child.parent_id`, `child.root_id`, save

SQL items save individually — no parent delegation needed. Each record fires its own update directly against its table row.

**Hybrid option**: JSON blob column in SQLite — semi-structured data, still queryable at top level. Good middle ground.

---

## Client-side SQLite / Offline

SQLite runs in the browser via WASM + OPFS (Origin Private File System):
- **SQLite WASM** (official) + OPFS = real durable on-device storage
- For single-user local apps: no server needed at all

Sync (multi-device / multi-user) is the hard part — tools exist (Electric SQL, PowerSync, CR-SQLite) but defer until needed.

**ORM on server (Node):** Drizzle is the best fit — close to SQL, good D1/SQLite support, doesn't fight a custom Item system. Prisma is heavier and wants to own your data layer. For MVP, raw SQL is fine.

---

## Socket Transport: Deltas

Current: client sends full snapshot → server writes file.

Target: send **deltas** instead.

```js
// delta shape (unified for JSON + SQL):
{ id: 'user_1', table: 'users', op: 'set', key: 'name', value: 'Bob', ts: 1234 }
```

Same delta format works for both savers — the saver interprets it:
- `JsonSaver` → patch `data[key]`, write file
- `SQLiteSaver` → `UPDATE users SET name = ? WHERE id = ?`

**Delta log → snapshot pattern:**
```
client → delta → socket → append log.jsonl
                               ↓ (flush/compaction)
                          snapshot.json / SQLite
```

On reload: server sends raw deltas, client replays. Server never needs to instantiate objects.

**Server-side object mirroring** (instantiating Item classes server-side) is cleaner for validation but duplicates logic. If offline support is a goal, client must replay deltas independently anyway — so client is already the source of truth. Lean into that.

**Phased rollout:**
```
Phase 1 (current): client → full snapshot → socket → file.json
Phase 2:           client → delta → socket → log.jsonl → client replays on reload
Phase 3:           server flushes log.jsonl → snapshot.json + SQLite routing
Phase 4 (if needed): offline via SQLite WASM + delta sync on reconnect
```

---

## Dirty Tracking + auto_save()

`.set()` accumulates changes into `_dirty` — a map, not a log. Multiple sets on the same key just overwrite. Only the latest value per key is sent.

```js
set(key, val) {
  this.data[key] = val
  this._dirty[key] = val  // overwrites, never accumulates keystrokes
  this.auto_save()
}

auto_save() {
  clearTimeout(this._save_timer)
  this._save_timer = setTimeout(() => this.save(), 500)
}

save() {
  if (!Object.keys(this._dirty).length) return
  const patch = { jspath: this.path, patch: this._dirty }
  this._dirty = {}        // clear BEFORE the async send, not after
  this.saver.save(patch)
}
```

Clearing `_dirty` before the send is critical — clearing after the `await` would wipe any `.set()` calls that arrived while the request was in flight.

**Delta shape:**
```js
{ jspath: 'app.users.user_1', patch: { name: 'Bob' }, ts: 1234 }
// translates to: app.get('users').get('user_1').set('name', 'Bob')
```

**Item path** — computed by walking `.parent` chain. Slightly costly but always correct, even if items are moved.

---

## The Notion Bug (optimistic UI + server echo)

The "text disappears" bug is not a debounce problem — it's server echo overwriting local state mid-type:

```
client types 'foo' → shows 'foo' immediately (optimistic)
server saves, broadcasts delta back
client receives echo → re-renders from server state → clobbers local edit
```

Fix: skip server echoes for keys currently in `_dirty`:

```js
apply_server_delta(delta) {
  for (const [key, val] of Object.entries(delta.patch)) {
    if (key in this._dirty) continue  // user is editing this, ignore
    this.data[key] = val
  }
}
```

Only apply remote updates to fields the local client isn't actively changing.

---

## Planned (Post-MVP)

**Selection API** — multi-select for DataGrid bulk actions:
```js
selection.add(item)
selection.remove(item)
selection.clear()
selection.save_all()   // loop .save() — fine for small sets
selection.bulk_save()  // batched SQL — for large sets (future)
```

**DataGrid / List View** — `List` doubles as a queryable grid:
```
filter UI → query params → SQL WHERE → Item[] → Selection
```

**Bulk SQL** (when needed, not before):
```js
User.bulk_insert(rows)
User.update_where({ status: 'pending' }, { status: 'active' })
```
SQLite bottleneck is transaction overhead (disk sync per write), not raw speed.
1,000 individual saves = seconds. 1,000 in one transaction = milliseconds.
For a single-user app doing normal CRUD, atomic saves are fine indefinitely.