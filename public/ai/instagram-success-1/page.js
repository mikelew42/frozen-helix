import app, { View, el, div, h1, h2, h3, h4, p, section, ul, li, code, a, span, icon } from "/app.js";

View.stylesheet("/ai/instagram-success/styles.css");

app.$root.ac("page instagram-success-page");

// Hero Section
section.c("hero", () => {
    div.c("hero-content", () => {
        h1("Instagram Success 2026");
        p.c("lead", "Strategic Research & Growth Foundations for the Next Generation of Creators.");
        div.c("badges", () => {
            span.c("badge", "Video-First");
            span.c("badge", "SEO-Driven");
            span.c("badge", "Community-Focused");
        });
    });
});

// Key Strategies Section
section.c("strategies", () => {
    h2("Core Growth Pillars");
    div.c("grid gap", () => {
        strategy_card("Reels Mastery", "Video content continues to dominate. Prioritize high-retention, immersive Reels to crack the discovery algorithm.", "movie");
        strategy_card("Semantic SEO", "Shift from hashtag-stuffing to keyword-rich captions. Instagram's AI now understands context and audio cues.", "search");
        strategy_card("Authentic Community", "Move beyond 'likes'. Engagement is now measured by saves, shares, and deep DM interactions.", "groups");
        strategy_card("Consistent Rhythm", "Buffer data suggests 3-5 posts per week is the 'sweet spot' for sustainable growth without burnout.", "calendar_month");
    });
});

// Sources & Findings
section.c("sources-index", () => {
    h2("Research Sources & Summaries");
    div.c("sources-list", () => {
        source_item(
            "Micky Weis",
            "https://mickyweis.com",
            "Highlighting the continued dominance of video-first experiences and the prioritization of immersive content in the 2026 landscape."
        );
        source_item(
            "Miss Ink",
            "https://miss-ink.com",
            "Focuses on the shift toward authentic community building where saves and shares outweigh vanity metrics like likes."
        );
        source_item(
            "Buffer",
            "https://buffer.com",
            "Provides data-backed consistency recommendations, suggesting 3-5 high-quality posts per week for optimal reach."
        );
        source_item(
            "EME Marketing",
            "https://eme-marketing.com",
            "Emphasizes profile optimization and auditing, ensuring your 'digital storefront' is always conversion-ready."
        );
        source_item(
            "SNK Creation",
            "https://snkcreation.com",
            "Detailed breakdown of the transition from traditional hashtags to keyword-based SEO for discovery."
        );
        source_item(
            "Black Pug Studio",
            "https://blackpugstudio.com",
            "Explores the integration of AI tools for content ideation while maintaining a crucial 'human touch' for engagement."
        );
    });
});

// Quick Checklist / Action Items
section.c("checklist-section", () => {
    div.c("card checklist-card", () => {
        h2("Immediate Action Plan");
        ul.c("checklist", () => {
            li("Audit bio for SEO keywords.");
            li("Switch to a 3-post-per-week Reels schedule.");
            li("Respond to every DM with a personalized video or voice note.");
            li("Add captions with 3-5 high-intent keywords.");
            li("A/B test carousel vs. Reel formats for education.");
        });
    });
});

// Helper Components
function strategy_card(title, description, icon_name) {
    div.c("card strategy-card", () => {
        icon(icon_name);
        h3(title);
        p(description);
    });
}

function source_item(name, url, summary) {
    div.c("source-entry card", () => {
        div.c("source-header", () => {
            h4(name);
            a("Visit Source").href(url).attr("target", "_blank").ac("source-link");
        });
        p(summary);
    });
}
