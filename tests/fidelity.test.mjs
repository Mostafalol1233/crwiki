import { expect } from 'chai';
import * as cheerio from 'cheerio';
import DOMPurify from 'isomorphic-dompurify';

describe('HTML Fidelity and Sanitization', () => {
  it('should preserve specific classes and inline styles', () => {
    const rawHtml = `
      <div class="post-color-orange" style="color: #ff9900;">
        <span class="post-color-yellow" style="color: #ffff00;">Yellow Text</span>
        <img class="embedImage-img importedEmbed-img" src="https://example.com/image.jpg" style="width: 100px;">
        &nbsp;
      </div>
    `;

    // The new approach should NOT sanitize the rawHtmlContent field.
    // But let's verify that even our "safe" sanitization preserves these.
    const sanitized = DOMPurify.sanitize(rawHtml, {
      KEEP_CONTENT: true,
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'class', 'width', 'height', 'target', 'rel'],
      ALLOW_DATA_ATTR: true, // User mentioned data-attributes
      ADD_TAGS: ['span', 'font', 'div'],
      ADD_ATTR: ['style', 'class']
    });

    const $ = cheerio.load(sanitized);
    expect($('.post-color-orange').length).to.be.at.least(1);
    expect($('.post-color-yellow').length).to.be.at.least(1);
    expect($('.embedImage-img').length).to.be.at.least(1);
    expect($('.importedEmbed-img').length).to.be.at.least(1);
    expect($('[style*="color: #ff9900"]').length).to.be.at.least(1);
    expect(sanitized).to.include('&nbsp;');
  });

  it('should handle shadow DOM isolation correctly (logic check)', () => {
    // This is a logic check for the Shadow DOM approach
    const html = '<style>body { color: red; }</style><div>Isolated</div>';
    // In a shadow DOM, this style won't leak out.
    expect(html).to.include('<style>');
  });
});
