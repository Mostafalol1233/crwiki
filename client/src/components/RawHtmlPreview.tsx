import React, { useMemo } from 'react';
import DOMPurify from "isomorphic-dompurify";

interface RawHtmlPreviewProps {
  html: string;
  className?: string;
}

const RawHtmlPreview: React.FC<RawHtmlPreviewProps> = ({ html, className }) => {
  const processedHtml = useMemo(() => {
    let out = String(html || "");
    
    // Transform YouTube links to embeds as seen in EventDetail.tsx
    out = out.replace(
      /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/g, 
      (_m, id) => `<div class="aspect-video mb-8"><iframe src="https://www.youtube.com/embed/${id}" width="100%" height="100%" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`
    );

    // Sanitize to match the detail pages
    return DOMPurify.sanitize(out, {
      ADD_TAGS: ['style', 'script', 'iframe'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'target'],
      FORCE_BODY: true,
      ALLOW_UNKNOWN_PROTOCOLS: true,
    });
  }, [html]);

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
