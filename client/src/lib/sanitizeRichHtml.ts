import DOMPurify from "isomorphic-dompurify";

/**
 * Content editors can store complete HTML layouts, not only the small subset
 * understood by the visual editor. Keep presentation markup and dimensions,
 * while still removing executable event handlers and script URLs.
 *
 * JavaScript is intentionally not executed from article content. Authors can
 * still import and save it in HTML Source mode or display it in <pre><code>.
 */
export function sanitizeRichHtml(html: string): string {
  return DOMPurify.sanitize(String(html || ""), {
    ADD_TAGS: [
      "iframe", "style", "section", "article", "header", "footer", "main",
      "aside", "figure", "figcaption", "details", "summary", "video",
      "audio", "source", "canvas",
    ],
    ADD_ATTR: [
      "style", "class", "id", "width", "height", "loading", "decoding",
      "target", "allow", "allowfullscreen", "frameborder", "scrolling",
      "poster", "controls", "autoplay", "muted", "loop", "playsinline",
      "data-id", "data-type", "data-align", "data-width", "data-height",
    ],
    FORCE_BODY: true,
    FORBID_TAGS: ["script", "object", "embed", "form"],
    FORBID_ATTR: [
      "onerror", "onload", "onclick", "onmouseover", "onfocus", "onmouseenter",
      "onmouseleave", "onkeydown", "onkeyup", "onsubmit", "action",
    ],
  });
}

export default sanitizeRichHtml;