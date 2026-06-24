---
trigger: always_on
---

FRAMEWORK DOCUMENTATION
=======================

This document describes the core architecture and common use cases for the custom framework used in this project.

CORE DESIGN PHILOSOPHY
----------------------
The framework is a minimalist, reactive-inspired library that prioritizes a declarative UI building experience using a Captor Pattern. It automates page routing and ensures resources (styles and fonts) are loaded before rendering.

Must use `../../relative/path.js` relative imports in order to work on a GitHub CDN. 

CORE CLASSES
------------

1. App (public/framework/App.js)
   The main entry point of the application.
   - Initialization: Sets up the basic layout shell (Header, Main, Root).
   - Routing: Automatically imports page.js files based on the browser's URL path.
   - Resource Management: Tracks CSS and fonts, preventing FOUC (Flash of Unstyled Content) by waiting for them to load before "ready".
   - Usage:
     const app = new App();
     app.font("Montserrat");

2. View (public/framework/View.js)
   The base class for all UI components.
   - Helper Functions: Exports div, h1, p, el, etc., for easy element creation.
   - Use .ac() for .addClass(), .rc() for .removeClass(), and .tc() for .toggleClass()
   - Chaining: Supports a fluent API (.ac(), .append(), .click(), .attr()).
   - Captor Pattern: Functions executed within a View context automatically attach new views to that parent.
   - Example:
     div.c("container", () => {
         h1("Title"); // Automatically appended to "container"
         p("Content");
     });

3. Socket (public/framework/Socket.js)
   A singleton wrapper for WebSocket communication.
   - RPC Handling: Simple rpc(method, ...args) for sending commands.
   - Requests: request(obj) returns a promise for a response.
   - Hot Reload: Integrated reload() method for developer productivity.

COMMON USE CASES
----------------

Creating a Page
---------------
Pages are typically located in public/ and are named page.js or something.page.js.

Example:
import app, { div, h1, p } from "/app.js";

h1("My New Page");
div.c("content", () => {
    p("Welcome to the new page!");
});

Building Stateful Components
----------------------------
Extend the View class to create reusable components.

Example:
import { View, button } from "/framework/View.js";

class Counter extends View {
    render() {
        this.count = 0;
        this.btn = button('Count: ' + this.count).click(() => {
            this.count++;
            this.btn.text('Count: ' + this.count);
        });
    }
}

PROJECT STRUCTURE
-----------------
- /Server/: Pluggable Server.  This is a git submodule.
- /public/framework/: Core library files.  This is a git submodule.
- /public/app.js: Application entry and configuration.
- /public/page.js: Default home page.
- /public/[path]/page.js: Sub-pages.

DEV SERVER
----------
- Start: node server.js
- Access: http://localhost/ (no port number)