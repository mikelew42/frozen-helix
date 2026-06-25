import Lew42 from "./framework/ext/Lew42/Lew42.js";
import dum from "./framework/dum/dum.js";
import "./framework/core/View/ResizeObserver.js";

const app = new Lew42();

app.dum = dum;

export default app;
export { app };
export * from "./framework/ext/Lew42/Lew42.js";
export { dum };

// Framework primitives — importable from /app.js for convenience
export { default as Item  } from "./framework/core/Item/Item.js";
export { default as List  } from "./framework/core/List/List.js";
export { default as Store } from "./framework/ext/Store/Store.js";
export { default as FileSaver          } from "./framework/ext/File/FileSaver.js";
export { default as MemorySaver        } from "./framework/ext/MemorySaver/MemorySaver.js";
export { default as LocalStorageSaver  } from "./framework/ext/LocalStorageSaver/LocalStorageSaver.js";
export { default as CollectionSaver   } from "./framework/ext/CollectionSaver/CollectionSaver.js";
export * from "./framework/ext/Bind/bind.js";