import { useEffect, useMemo, useState } from "react";
import { sanitizeRichHtml } from "@/lib/sanitizeRichHtml";

interface AdvancedHtmlRendererProps {
  html: string;
  className?: string;
  dir?: "ltr" | "rtl";
  iframeTitle?: string;
}

const ADVANCED_MARKUP_PATTERN = /<(?:html|head|body|style|script|link|meta|section|main|article|header|footer|canvas|svg|iframe)\b/i;

function transformEmbeds(input: string) {
  return String(input || "").replace(
    /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/g,
    (_m, id) => `<div class="aspect-video mb-8"><iframe src="https://www.youtube.com/embed/${id}" width="560" height="315" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`,
  );
}

function buildSrcDoc(html: string) {
  const source = transformEmbeds(html);
  if (/<html[\s>]/i.test(source)) return source;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  :root { color-scheme: dark; }
  html, body { margin: 0; min-height: 100%; background: transparent; color: #f8fafc; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  img, video, iframe { max-width: 100%; }
  * { box-sizing: border-box; }
</style>
</head>
<body>
${source}
<script>
  const sendHeight = () => parent.postMessage({ type: 'crwiki-content-height', height: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) }, '*');
  addEventListener('load', sendHeight);
  new ResizeObserver(sendHeight).observe(document.documentElement);
  setTimeout(sendHeight, 100);
</script>
</body>
</html>`;
}

export function isAdvancedHtml(html: string) {
  return ADVANCED_MARKUP_PATTERN.test(String(html || ""));
}

export default function AdvancedHtmlRenderer({ html, className, dir, iframeTitle = "Custom HTML content" }: AdvancedHtmlRendererProps) {
  const [height, setHeight] = useState(900);
  const sourceHtml = String(html || "");
  const advanced = isAdvancedHtml(sourceHtml);
  const renderedHtml = useMemo(() => transformEmbeds(sourceHtml), [sourceHtml]);
  const srcDoc = useMemo(() => buildSrcDoc(sourceHtml), [sourceHtml]);

  useEffect(() => {
    if (typeof window === "undefined" || !advanced) return undefined;
    const handler = (event: MessageEvent) => {
      const nextHeight = Number(event.data?.height || 0);
      if (event.data?.type === "crwiki-content-height" && nextHeight > 0) {
        setHeight(Math.min(Math.max(nextHeight, 480), 6000));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [advanced]);

  if (!advanced) {
    return <div className={className} dir={dir} dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(renderedHtml) }} />;
  }

  return (
    <iframe
      title={iframeTitle}
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
      referrerPolicy="no-referrer"
      className={className}
      style={{ width: "100%", height, border: 0, display: "block", background: "transparent" }}
    />
  );
}
