import React, { useMemo, useRef, useEffect } from 'react';
import DOMPurify from "isomorphic-dompurify";

interface RawHtmlPreviewProps {
  html: string;
  className?: string;
  isFullPage?: boolean;
  isRTL?: boolean;
}

const RawHtmlPreview: React.FC<RawHtmlPreviewProps> = ({ html, className, isFullPage, isRTL = false }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const processedHtml = useMemo(() => {
    let out = String(html || "");
    
    // Transform YouTube links to embeds as seen in EventDetail.tsx
    out = out.replace(
      /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/g, 
      (_m, id) => `<div class="aspect-video mb-8"><iframe src="https://www.youtube.com/embed/${id}" width="100%" height="100%" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`
    );

    // If it's a full page (contains <html> or <body>), we don't want to sanitize as strictly 
    // because it will be in an iframe.
    if (isFullPage || out.includes('<html') || out.includes('<body')) {
      return out;
    }

    // Sanitize — preserve inline colors/styles from forum posts; block dangerous attrs
    return DOMPurify.sanitize(out, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'target', 'style'],
      FORCE_BODY: true,
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    });
  }, [html, isFullPage]);

  useEffect(() => {
    if (iframeRef.current && (isFullPage || processedHtml.includes('<html') || processedHtml.includes('<body'))) {
      const doc = iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(processedHtml);
        doc.close();
      }
    }
  }, [processedHtml, isFullPage]);

  if (isFullPage || processedHtml.includes('<html') || processedHtml.includes('<body')) {
    return (
      <iframe
        ref={iframeRef}
        title="Mirrored Content"
        className={`w-full border-0 min-h-[600px] ${className || ""}`}
        sandbox="allow-same-origin allow-popups allow-scripts"
      />
    );
  }

  return (
    <div className={`raw-html-preview-container ${className || ""}`} dir={isRTL ? "rtl" : "ltr"}>
      <div 
        className={`prose prose-sm sm:prose-base md:prose-lg lg:prose-xl dark:prose-invert max-w-none
                   prose-img:mx-auto prose-img:rounded-2xl prose-img:border prose-img:border-primary/10 prose-img:shadow-2xl
                   prose-headings:scroll-mt-24 prose-headings:text-primary prose-a:text-primary hover:prose-a:text-primary/80
                   prose-strong:text-foreground prose-li:marker:text-primary prose-blockquote:border-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:rounded-r-xl
                   prose-table:border prose-table:border-collapse prose-td:border prose-td:p-2 prose-th:bg-muted prose-th:text-foreground ${isRTL ? "text-right prose-table:[direction:rtl]" : "text-left"}`}
        dangerouslySetInnerHTML={{ __html: processedHtml }} 
      />
      <style>{`
        .raw-html-preview-container img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 1.5rem auto;
        }
        .raw-html-preview-container h2,
        .raw-html-preview-container h3,
        .raw-html-preview-container h4 {
          position: relative;
        }
        .raw-html-preview-container h2::before,
        .raw-html-preview-container h3::before,
        .raw-html-preview-container h4::before {
          content: "";
          position: absolute;
          inset-inline-start: -1rem;
          top: 0.25em;
          width: 4px;
          height: calc(100% - 0.5em);
          border-radius: 9999px;
          background: linear-gradient(180deg, rgba(234,179,8,0.9), rgba(239,68,68,0.65));
        }
        .raw-html-preview-container table {
          width: 100% !important;
          margin: 1rem 0;
        }
        .raw-html-preview-container iframe {
          width: 100%;
          aspect-ratio: 16/9;
          border-radius: 0.75rem;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        }
        /* CrossFire forum post colors — class-based */
        .raw-html-preview-container .post-color-orange { color: #ff9900 !important; }
        .raw-html-preview-container .post-color-yellow { color: #f5d020 !important; }
        .raw-html-preview-container .post-color-green  { color: #4ade80 !important; }
        .raw-html-preview-container .post-color-blue   { color: #60a5fa !important; }
        .raw-html-preview-container .post-color-red    { color: #f87171 !important; }
        .raw-html-preview-container .post-color-purple { color: #c084fc !important; }
        .raw-html-preview-container .post-color-white  { color: #f4f4f5 !important; }
        .raw-html-preview-container .post-color-cyan   { color: #22d3ee !important; }
        /* Preserve inline style colors from forum spans — prose must not override */
        .raw-html-preview-container span[style*="color"] { color: revert !important; }
        .raw-html-preview-container font[color] { color: revert !important; }
        .raw-html-preview-container p[style*="color"],
        .raw-html-preview-container div[style*="color"],
        .raw-html-preview-container li[style*="color"] { color: revert !important; }
        /* Keep spacing/lists from forum content */
        .raw-html-preview-container ul { padding-left: 1.5rem; margin: 0.75rem 0; }
        .raw-html-preview-container li { margin-bottom: 0.35rem; }
        .raw-html-preview-container b, .raw-html-preview-container strong { color: inherit; }
      `}</style>
    </div>
  );
};

export default RawHtmlPreview;
