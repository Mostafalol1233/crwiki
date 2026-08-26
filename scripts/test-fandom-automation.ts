import assert from "node:assert/strict";
import { buildFandomDraft, discoverFandomCategory, scrapeFandomPage } from "../server/fandomAutomation.js";

const root = "https://crossfirefps.fandom.com/wiki/Weapons";
const page = await scrapeFandomPage(root);
const discovered = await discoverFandomCategory(root, "Weapons", 5);
const draft = buildFandomDraft(page);
assert.equal(draft.status, "draft");
assert.match(draft.content_en, /crossfirefps\.fandom\.com/);
assert.doesNotMatch(page.contentHtml, /<script\b/i);
assert.doesNotMatch(page.contentHtml, /<form\b/i);
console.log(JSON.stringify({
  title: page.title,
  sourceUrl: page.sourceUrl,
  textLength: page.text.length,
  htmlLength: page.contentHtml.length,
  images: page.imageUrls.length,
  videos: page.videoUrls.length,
  links: page.links.length,
  sections: page.sections.length,
  discovered: discovered.length,
  draftStatus: draft.status,
}, null, 2));
