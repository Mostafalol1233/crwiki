import React, { useMemo, useRef, useEffect } from 'react';
import DOMPurify from "isomorphic-dompurify";

interface RawHtmlPreviewProps {
  html: string;
  className?: string;
  isFullPage?: boolean;
}

const RawHtmlPreview: React.FC<RawHtmlPreviewProps> = ({ html, className, isFullPage }) => {
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

    // Sanitize to match the detail pages
    return DOMPurify.sanitize(out, {
      ADD_TAGS: ['style', 'iframe'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'target'],
      FORCE_BODY: true,
      ALLOW_UNKNOWN_PROTOCOLS: true,
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
    <div className={`raw-html-preview-container ${className || ""}`}>
      <div 
        className="prose prose-sm sm:prose-base md:prose-lg lg:prose-xl dark:prose-invert max-w-none 
                   prose-img:rounded-xl prose-img:shadow-lg prose-img:mx-auto
                   prose-headings:text-primary prose-a:text-primary hover:prose-a:text-primary/80
                   prose-table:border prose-table:border-collapse prose-td:border prose-td:p-2 prose-th:bg-muted"
        dangerouslySetInnerHTML={{ __html: processedHtml }} 
      />
      <style>{`
        .raw-html-preview-container img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 1.5rem auto;
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
        /* Forum specific colors */
        .raw-html-preview-container .post-color-orange { color: #ff9900 !important; }
        .raw-html-preview-container .post-color-yellow { color: #ffff00 !important; }
        .raw-html-preview-container .post-color-green { color: #00ff00 !important; }
      `}</style>
    </div>
  );
};

export default RawHtmlPreview;
