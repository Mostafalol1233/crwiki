import assert from 'assert';
import { parseFlexibleDate, formatEnglishDate } from '../../backend-deploy-full/seo-utils.js';

const cases = [
  { in: 'dec', outMonth: 'December' },
  { in: 'Dec 2025', outMonth: 'December', outYear: 2025 },
  { in: '12-2025', outMonth: 'December', outYear: 2025 },
  { in: '12/2025', outMonth: 'December', outYear: 2025 },
  { in: '2025-12-15', outMonth: 'December', outYear: 2025, outDay: 15 },
];

for (const c of cases) {
  const parsed = parseFlexibleDate(c.in, Date.UTC(2025, 11, 15));
  assert.strictEqual(parsed.month, c.outMonth);
  if (c.outYear) assert.strictEqual(parsed.year, c.outYear);
  if (c.outDay) assert.strictEqual(parsed.day, c.outDay);
  const formatted = formatEnglishDate(parsed);
  assert.ok(formatted.includes(c.outMonth));
}

console.log('unit-date.test.js: OK');

