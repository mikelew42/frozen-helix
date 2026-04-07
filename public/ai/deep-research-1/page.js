import app, { div, h1, h2, h3, p, section, a, View } from "/app.js";
import { GridNavItem } from "../icon-layouts/components.js";

View.stylesheet("/ai/styles.css");

app.$root.ac("page research-main");

section.c("hero", () => {
    h1("AI Deep Research Explorer");
    p.c("lead", "A comparative analysis of the leading autonomous research agents that are redefining how we gather, verify, and synthesize complex information from the web.");
});

section.c("summary", () => {
    h2("Project Summary & Findings");
    p("The core finding from this research is the shift from 'Single-Turn Retrieval' to 'Agentic Reasoning'. Traditional LLMs provide answers based on pre-trained knowledge or single searches. In contrast, Deep Research agents perform multi-step loops: planning, searching, evaluating, and refining.");
    
    div.c("flex gap wrap mb", () => {
        div.c("flex-1 card pad", () => {
            h3("Agentic Reasoning");
            p("All three platforms utilize a 'think-before-you-act' loop. They assess what they don't know and formulate new queries to fill those gaps, mimicking a human researcher's workflow.");
        });
        div.c("flex-1 card pad", () => {
            h3("Citations & Verification");
            p("Deep research tools prioritize accuracy by cross-referencing multiple authoritative sources. This significantly reduces hallucinations in complex topics where facts change rapidly.");
        });
        div.c("flex-1 card pad", () => {
            h3("Automated Synthesis");
            p("The end product is no longer just a snippet but a structured, analyst-grade report with executive summaries, detailed evidence, and formatted citations.");
        });
    });
});

section.c("projects", () => {
    h2("Research Deep Dives");
    div.c("icon-grid", () => {
        new GridNavItem({ name: "search", label: "OpenAI Deep Research", path: "openai/" });
        new GridNavItem({ name: "search", label: "Gemini Deep Research", path: "google/" });
        new GridNavItem({ name: "search", label: "Perplexity Deep Research", path: "perplexity/" });
    });
});

section.c("navigation", () => {
    a("← Back to AI Overview").href("/ai/");
});
