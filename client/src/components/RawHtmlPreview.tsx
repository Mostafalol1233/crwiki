import React, { useEffect, useRef } from 'react';

interface RawHtmlPreviewProps {
  html: string;
  className?: string;
}

const RawHtmlPreview: React.FC<RawHtmlPreviewProps> = ({ html, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Clear existing shadow root if any
      const shadowRoot = containerRef.current.shadowRoot || containerRef.current.attachShadow({ mode: 'open' });
      
      // Create a container inside shadow DOM
      shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            all: initial;
            font-family: inherit;
          }
          .raw-content-container {
            width: 100%;
            height: 100%;
            overflow: auto;
            background: transparent;
            color: inherit;
          }
          /* Ensure images and tables don't overflow */
          img { max-width: 100%; height: auto; }
          table { width: 100%; border-collapse: collapse; }
          
          /* Preserve forum specific classes if any */
          .post-color-orange { color: #ff9900 !important; }
          .post-color-yellow { color: #ffff00 !important; }
          .post-color-green { color: #00ff00 !important; }
          .embedImage-img, .importedEmbed-img { max-width: 100%; height: auto; display: block; margin: 10px 0; }
        </style>
        <div class="raw-content-container">
          ${html}
        </div>
      `;
      
      // Handle potential scripts if needed, though usually better to avoid
      // But user mentioned "JavaScript event handlers" should be preserved.
      // Scripts in innerHTML won't run. If needed, we'd have to manually execute them.
    }
  }, [html]);

  return <div ref={containerRef} className={className} />;
};

export default RawHtmlPreview;
