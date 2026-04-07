import app, { View, el, div, h1, h2, h3, h4, p, section, ul, li, code, a } from "/app.js";
import { GridNavItem } from "./icon-layouts/components.js";

View.stylesheet("/ai/styles.css");

app.$root.ac("page ai-template");

// Hero Section
section.c("hero", () => {
    h1("AI Content Template");
    p.c("lead", "This is a sample template page that AI can use to create future posts, articles, and content. It demonstrates various content structures, layouts, and components available in the framework.");
});

// Projects Navigation
section.c("projects", () => {
    h2("AI Projects");
    div.c("icon-grid", () => {
        new GridNavItem({ name: "trending_up", label: "Instagram Success", path: "/ai/instagram-success/" });
        new GridNavItem({ name: "layers", label: "Icon Layouts", path: "/ai/icon-layouts/" });
        new GridNavItem({ name: "explore", label: "Navigation Explorer", path: "/ai/navigation-explorer/" });
        new GridNavItem({ name: "image", label: "Image Exploration", path: "/ai/image-exploration/" });
        new GridNavItem({ name: "search", label: "Deep Research", path: "/ai/deep-research/" });
        new GridNavItem({ name: "article", label: "Markdown Renderer", path: "/ai/markdown-renderer/" });
    });
});

// Article/Blog Post Section
section.c("article", () => {
    h2("Sample Article Section");
    
    p("This is an introductory paragraph for an article. It sets the context and introduces the main topic. Articles typically start with a compelling opening that hooks the reader and provides an overview of what's to come.");
    
    h3("Subsection with Details");
    p("Here's a more detailed section that dives deeper into a specific aspect of the topic. You can include multiple paragraphs to fully explore ideas and provide comprehensive information.");
    
    p("Additional paragraphs help break up the content and make it more digestible. Each paragraph should focus on a single idea or concept, making the content easier to scan and understand.");
    
    h3("Lists and Structured Content");
    p("When presenting multiple related items, lists are very effective:");
    
    ul(() => {
        li("First key point or feature");
        li("Second important item to highlight");
        li("Third element in the series");
        li("Additional items as needed");
    });
});

// Code Examples Section
section.c("code-example", () => {
    h2("Code Examples");
    p("When sharing code snippets, use the code element for inline code like ", code("const x = 42;"), " or pre blocks for larger examples:");
    
    el("pre", `function createContent(title, body) {
    return {
        title,
        body,
        timestamp: Date.now()
    };
}`);
});

// Multi-Column Layout Section
section.c("columns", () => {
    h2("Multi-Column Content");
    
    div.c("flex gap wrap", () => {
        div.c("flex-1 card", () => {
            h3("Feature 1");
            p("Description of the first feature or concept. This layout works well for comparing multiple items or presenting related information side by side.");
        });
        
        div.c("flex-1 card", () => {
            h3("Feature 2");
            p("Description of the second feature. The cards will stack on smaller screens and sit side by side on larger displays.");
        });
        
        div.c("flex-1 card", () => {
            h3("Feature 3");
            p("Description of the third feature. You can add as many columns as needed, though 2-4 is typically optimal for readability.");
        });
    });
});

// Call-to-Action Section
section.c("cta", () => {
    h2("Next Steps");
    p("End your content with a clear call-to-action or conclusion that guides the reader on what to do next.");
    
    div.c("flex gap", () => {
        el("button").ac("prim").text("Primary Action");
        el("button").ac("bg").text("Secondary Action");
    });
});

// Usage Instructions (commented out, but helpful for AI reference)
/*
USAGE INSTRUCTIONS FOR AI:

1. STRUCTURE:
   - Always start with app.$root.ac("page") or similar page class
   - Use sections to organize content logically
   - Import necessary elements from /app.js

2. COMMON ELEMENTS:
   - h1, h2, h3, h4 for headings (hierarchy matters)
   - p for paragraphs
   - ul/li for lists
   - div with classes for layout (flex, gap, wrap, card, etc.)
   - section for major content blocks
   - code for inline code, pre for code blocks
   - el("button") for buttons with .ac("prim") or .ac("bg") for styling

3. LAYOUT CLASSES:
   - "flex" - flexbox container
   - "gap" - spacing between flex items
   - "wrap" - allow items to wrap
   - "flex-1" - item grows to fill space
   - "card" - card styling with padding/borders
   - "pad" - padding
   - "mb" - margin bottom

4. STYLING:
   - Use View.stylesheet(import.meta, "styles.css") to load custom CSS
   - Add classes with .c() or .ac() methods
   - Keep styling semantic and minimal

5. CONTENT TIPS:
   - Start with a clear h1 title
   - Use sections to break up content
   - Include a mix of text, lists, and interactive elements
   - End with a call-to-action when appropriate
*/
