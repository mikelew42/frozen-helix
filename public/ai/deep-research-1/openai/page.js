import app, { div, h1, h2, p, section, ul, li, a, View, span } from "/app.js";

View.stylesheet("/ai/styles.css");

app.$root.ac("page research-subpage");

section.c("hero", () => {
    h1("OpenAI Deep Research");
    p.c("lead", "An advanced AI agent designed for autonomous, multi-step internet research and structured report generation.");
});

section.c("details", () => {
    div.c("card pad mb", () => {
        h2("Source & Details");
        p(() => {
            span("Official URL: ");
            a("https://openai.com/index/deep-research/").href("https://openai.com/index/deep-research/").attr("target", "_blank");
        });
        
        h2("Core Features");
        ul(() => {
            li("Autonomous multi-step investigation of complex topics.");
            li("Powered by optimized o3 reasoning models.");
            li("Cross-references hundreds of authoritative sources.");
            li("Generates formal, analyst-grade reports with full citations.");
        });
    });

    div.c("quotes card pad mb", () => {
        h2("Key Insights & Quotes");
        p.c("italic", "\"Deep Research conducts in-depth investigations, scouring the web for authoritative sources and synthesizing findings into structured reports.\"");
        p.c("italic", "\"Built for the most complex, multi-step investigations that require thoroughness rather than quick facts.\"");
    });

    div.c("conclusion card pad", () => {
        h2("Conclusion & Utility");
        p("OpenAI Deep Research is highly effective for high-stakes projects like market analysis, competitive intelligence, and literature reviews. Its ability to cross-verify facts across multiple domains makes it a powerful tool for ensuring accuracy in complex research tasks.");
    });
});

section.c("navigation", () => {
    a("← Back to Deep Research").href("../");
});
