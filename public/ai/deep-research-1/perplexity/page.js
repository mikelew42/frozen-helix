import app, { div, h1, h2, p, section, ul, li, a, View } from "/app.js";

View.stylesheet("/ai/styles.css");

app.$root.ac("page research-subpage");

section.c("hero", () => {
    h1("Perplexity Deep Research");
    p.c("lead", "A high-speed research engine that prioritizes real-time transparency and citation depth.");
});

section.c("details", () => {
    div.c("card pad mb", () => {
        h2("Source & Details");
        p(() => {
            app.span("Official URL: ");
            a("www.perplexity.ai/hub/deep-research").href("https://www.perplexity.ai/hub/deep-research").attr("target", "_blank");
        });
        
        h2("Core Features");
        ul(() => {
            li("Multi-pass querying system conducting 20-50 targeted searches per report.");
            li("Lightning fast execution, typically completing reports in under 3 minutes.");
            li("Real-time transparency, allowing users to watch the research process unfold.");
            li("Integrated reasoning engine for intelligent synthesis beyond simple summaries.");
        });
    });

    div.c("quotes card pad mb", () => {
        h2("Key Insights & Quotes");
        p.c("italic", "\"Mimics a human analyst by interpreting queries, formulating research plans, and synthesizing everything into comprehensive reports.\"");
        p.c("italic", "\"Revolutionizes the way professionals approach complex inquiries by automating exhaustive analysis in minutes.\"");
    });

    div.c("conclusion card pad", () => {
        h2("Conclusion & Utility");
        p("Perplexity Deep Research is the go-to tool for rapid insights and exploration where speed is a priority without sacrificing depth. Its multi-pass query clustering makes it exceptionally good at discovering niche information that single-pass LLMs might miss.");
    });
});

section.c("navigation", () => {
    a("← Back to Deep Research").href("../");
});
