import fs from 'fs/promises';
import path from 'path';

async function recurse(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await recurse(target);
      continue;
    }
    if (!target.endsWith('.ts') && !target.endsWith('.tsx')) continue;

    let text = await fs.readFile(target, 'utf8');
    if (!text.includes('setHeaders(CORS)')) continue;

    if (!text.includes('function addCorsHeaders(')) {
      const idx = text.indexOf('const CORS = new Map([');
      if (idx !== -1) {
        const after = text.indexOf(');', idx);
        if (after !== -1) {
          const helper = `\n\nfunction addCorsHeaders(res) {\n  for (const [key, value] of CORS) {\n    res.setHeader(key, value);\n  }\n  return res;\n}\n`;
          text = text.slice(0, after + 2) + helper + text.slice(after + 2);
        }
      }
    }

    text = text.replace(/res\.status\((\d+)\)\.setHeaders\(CORS\)\.json\(/g, 'addCorsHeaders(res).status($1).json(');
    text = text.replace(/res\.status\((\d+)\)\.setHeaders\(CORS\)\.end\(\)/g, 'addCorsHeaders(res).status($1).end()');
    text = text.replace(/res\.status\((\d+)\)\.setHeaders\(CORS\)\.send\(/g, 'addCorsHeaders(res).status($1).send(');
    text = text.replace(/function addCorsHeaders\(res\) \{/g, 'function addCorsHeaders(res: VercelResponse) {');

    await fs.writeFile(target, text, 'utf8');
    console.log('patched', target);
  }
}

recurse(path.resolve('api')).catch((err) => { console.error(err); process.exit(1); });
