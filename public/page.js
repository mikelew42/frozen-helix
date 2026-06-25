import app, { el, div, h1, h2, p } from "/app.js";

h1("frozen-helix");
p("Local-first JS framework and app platform. Static HTML + ES modules + WebSocket persistence.");

div(() => {
    h2("Framework");
    el("a", "Core (Item/List/Test)").attr("href", "/framework/core/");
    el("br");
    el("a", "Reference").attr("href", "/framework/");

    h2("Demos");
    el("a", "Notes App").attr("href", "/framework/ext/Notes/");
    el("br");
    el("a", "Todo App").attr("href", "/framework/ext/Todo/");
    el("br");
    el("a", "List8 — User Directory").attr("href", "/framework/core/List/8/");
    el("br");
    el("a", "List7 — Leaderboard").attr("href", "/framework/core/List/7/");
    el("br");
    el("a", "List6 — Kanban").attr("href", "/framework/core/List/6/");
    el("br");
    el("a", "List5 — Reactive Filter").attr("href", "/framework/core/List/5/");
    el("br");
    el("a", "Item9 — Text Editor with Undo").attr("href", "/framework/core/Item/9/");
    el("br");
    el("a", "Item8 — Product Form with Schema").attr("href", "/framework/core/Item/8/");

    h2("Dev");
    el("a", "Styles").attr("href", "/styles/");
});