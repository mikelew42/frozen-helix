import app, { div, h1, h2, p, section, ul, li, a, View, span } from "/app.js";

View.stylesheet("/ai/styles.css");

app.$root.ac("page research-subpage");

section.c("hero", () => {
    h1("Google Gemini Deep Research");
    p.c("lead", "A sophisticated research tool integrated into Gemini Advanced, capable of multi-hour investigations.");
});

section.c("details", () => {
    div.c("card pad mb", () => {
        h2("Source & Details");
        p(() => {
            span("Official URL: ");
            a("blog.google/technology/ai/google-gemini-deep-research/").href("https://blog.google/technology/ai/google-gemini-deep-research/").attr("target", "_blank");
        });
        
        h2("Core Features");
        ul(() => {
            li("Autonomous planning and execution of complex research tracks.");
            li("Integration with Google Workspace (Gmail, Drive) for personalized context.");
            li("Generates comprehensive reports exportable directly to Google Docs.");
            li("Uses agentic reasoning to identify and fill knowledge gaps.");
        });
    });

    div.c("quotes card pad mb", () => {
        h2("Key Insights & Quotes");
        p.c("italic", "\"Acts as a personal AI research assistant that can conduct extensive, multi-hour investigations across numerous sources.\"");
        p.c("italic", "\"Leverages agentic reasoning workflows to continuously search, browse, and process information.\"");
    });

    div.c("conclusion card pad", () => {
        h2("Conclusion & Utility");
        p("Gemini Deep Research is optimal for users already embedded in the Google ecosystem. Its strength lies in its ability to synthesize vast amounts of public information while potentially leveraging private data for highly contextualized executive summaries and drug discovery research.");
    });
});

section.c("navigation", () => {
    a("← Back to Deep Research").href("../");
});
