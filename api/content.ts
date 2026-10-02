import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * GET /api/content — LLM-friendly markdown index for CrossFire Wiki.
 * Intentionally DB-free (static curated map) so AI crawlers never hit a 500.
 * For full DB coverage use /sitemap.xml (XML) alongside this file.
 */
const BASE = "https://crossfire.wiki";

const SECTIONS: Array<{ title: string; links: Array<[string, string]> }> = [
  {
    title: "Core wiki",
    links: [
      ["Weapons", "/weapons"],
      ["Mercenaries", "/mercenaries"],
      ["Game modes", "/modes"],
      ["Maps", "/maps"],
      ["Ranks", "/ranks"],
      ["Ribbons", "/ribbons"],
      ["Global wiki", "/global-wiki"],
      ["Content hub", "/content-hub"],
    ],
  },
  {
    title: "News & events",
    links: [
      ["News", "/news"],
      ["Events", "/events"],
      ["Blog posts", "/posts"],
      ["Tutorials", "/tutorials"],
      ["Videos", "/videos"],
      ["Competition", "/competition"],
    ],
  },
  {
    title: "Community & support",
    links: [
      ["Forum", "/forum"],
      ["FAQ", "/faq"],
      ["Support", "/support"],
      ["Sellers", "/sellers"],
      ["About", "/about"],
      ["Download", "/download"],
      ["Contact", "/contact"],
    ],
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");

  const lines: string[] = [];
  lines.push(`# CrossFire Wiki`);
  lines.push(``);
  lines.push(`> Independent CrossFire reference in English and Arabic. Base: ${BASE}`);
  lines.push(``);
  for (const section of SECTIONS) {
    lines.push(`## ${section.title}`);
    lines.push(``);
    for (const [label, path] of section.links) {
      lines.push(`- [${label}](${BASE}${path})`);
    }
    lines.push(``);
  }
  lines.push(`## Notes`);
  lines.push(``);
  lines.push(`- Arabic routes use \`/ar/*\`, e.g. ${BASE}/ar/weapons.`);
  lines.push(`- Full URL list: ${BASE}/sitemap.xml`);
  lines.push(`- Contact: contact@crossfire.wiki`);
  lines.push(``);

  return res.status(200).send(lines.join("\n"));
}
