import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const base = String(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
const key = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_KEY || process.env.service_role;
if (!base || !key) throw new Error('Supabase URL/service key is missing');
const root = '/home/ubuntu/crwiki/tmp_archiveNew';
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };

async function rest(pathname, init = {}) {
  const response = await fetch(`${base}/rest/v1/${pathname}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  const text = await response.text();
  let body; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(`${response.status} ${text}`);
  return body;
}

async function upload(fileName) {
  const file = await fs.readFile(path.join(root, fileName));
  const ext = path.extname(fileName).toLowerCase() || '.jpg';
  const objectPath = `whatsapp-archive/${Date.now()}-${crypto.randomUUID()}${ext}`;
  const url = `${base}/storage/v1/object/media/${objectPath.split('/').map(encodeURIComponent).join('/')}`;
  const response = await fetch(url, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'false', 'cache-control': '31536000' }, body: file });
  if (!response.ok) throw new Error(`Upload ${fileName} failed: ${response.status} ${(await response.text()).slice(0, 200)}`);
  return `${base}/storage/v1/object/public/media/${objectPath.split('/').map(encodeURIComponent).join('/')}`;
}

const files = [
  'IMG-20260920-WA0075.jpg', 'IMG-20260924-WA0158..jpg', 'IMG-20260926-WA0069..jpg',
  'IMG-20261006-WA0000.jpg', 'IMG-20261006-WA0001.jpg', 'IMG-20261006-WA0002.jpg',
  'IMG-20261006-WA0003.jpg', 'IMG-20261006-WA0004.jpg', 'IMG-20261006-WA0005.jpg',
  'IMG-20261006-WA0006.jpg', 'IMG-20261006-WA0007.jpg', 'IMG-20261006-WA0008.jpg',
  'IMG-20261006-WA0009.jpg', 'IMG-20261006-WA0011.jpg',
];
const uploaded = {};
for (const file of files) uploaded[file] = await upload(file);

const oldMappings = {
  'crossfire-destiny-sisters-trilogy': [uploaded['IMG-20260920-WA0075.jpg'], uploaded['IMG-20260924-WA0158..jpg']],
  'crossfire-urd-character-guide': [uploaded['IMG-20260924-WA0158..jpg']],
  'crossfire-verdandi-character-guide': [uploaded['IMG-20260924-WA0158..jpg']],
  'crossfire-alexandrina-arrabella-lore': [uploaded['IMG-20260926-WA0069..jpg']],
  'crossfire-alexandrina-abilities-breakdown': [uploaded['IMG-20260926-WA0069..jpg']],
};
for (const [slug, gallery] of Object.entries(oldMappings)) {
  await rest(`posts?post_slug=eq.${encodeURIComponent(slug)}`, { method: 'PATCH', body: JSON.stringify({ image_url: gallery[0], gallery, preview_on_home: true }) });
}

const newGallery = files.filter((f) => f.startsWith('IMG-20261006-')).map((f) => uploaded[f]);
const slug = 'zombie-hero-skins-bonuses-and-abilities-october-2026';
const content = `<h2>ملخص سريع</h2><p>وصلت تفاصيل جديدة عن سكنات أبطال طور الزومبي. المعلومات التالية منقولة من محتوى المجتمع، لذلك يجب اعتبار نسب الزيادة والتأثيرات وصفًا إرشاديًا إلى أن يتم تأكيدها داخل الإصدار الفعلي.</p><h2>الزيادات المشتركة</h2><ul><li><strong>Frost Commando</strong> و<strong>Master Hunter</strong> و<strong>Master Ascetic Hero</strong>: زيادة ضرر بنسبة 10% وزيادة صحة بنسبة 7%.</li><li><strong>Demon Terminator</strong> و<strong>Fire Terminator</strong> و<strong>Void Terminator</strong> و<strong>Queen Terminator</strong> و<strong>Outlaw Terminator</strong> و<strong>Armor Terminator</strong>: زيادة ضرر بنسبة 10% وزيادة صحة بنسبة 5%.</li><li><strong>Mystic Hero</strong>: زيادة ضرر بنسبة 10%، مع زيادة صحة قدرها 300 نقطة عن كل ثانية من الثبات.</li></ul><h2>تأثيرات خاصة</h2><ul><li><strong>Master Ascetic Hero:</strong> الدرع ينخفض إلى 4000، لكن سرعة الهجوم ترتفع بعد كسر الدرع.</li><li><strong>Demon Terminator:</strong> يضيف 500 نقطة صحة مع كل هجوم، وتستمر إبطالات مهارة G على الجنود والأبطال مدة أطول.</li><li><strong>Fire Terminator:</strong> كرة النار تمتد لمسافة أكبر من النسخة الأصلية، وتؤذي من يقترب منها بعد اصطدامها.</li><li><strong>Void Terminator:</strong> يتغير لون الانتقال الآني إلى الأحمر بدلًا من البنفسجي.</li><li><strong>Armor Terminator:</strong> ترتفع حماية الدرع من 40% إلى 70%، ويزداد مدى الصرخة 35% مع إمكانية تركيزها على لاعب واحد حتى عبر الجدران.</li><li><strong>Mystic Hero:</strong> إصابة حليف بمسدسها تمنح الأبطال زيادة في سرعة الحركة وسرعة الهجوم.</li></ul><h2>الصور</h2><p>تمت إضافة صور السكنات المرفقة إلى معرض الخبر. الصور توضيحية للمحتوى المرسل وليست تصنيفًا رسميًا منفصلًا لكل صورة.</p><h2>تنبيه المصدر</h2><p>هذه التفاصيل مجتمعية وغير مؤكدة رسميًا. قد تختلف القيم حسب المنطقة أو تحديث اللعبة، وسنحدّث الخبر عند ظهور تأكيد رسمي.</p>`;
const row = {
  title: 'تفاصيل سكنات أبطال الزومبي ومزاياها الجديدة', title_ar: 'تفاصيل سكنات أبطال الزومبي ومزاياها الجديدة', news_slug: slug,
  date_range: 'تحديث أكتوبر 2026', image_url: newGallery[0], images: newGallery, category: 'Zombie Mode', content, content_ar: content, html_content: content,
  raw_html_content: content, author: 'CrossFire Wiki', featured: true, preview_on_home: true, breaking: false,
  seo_title: 'تفاصيل سكنات أبطال الزومبي ومزاياها الجديدة', seo_description: 'تفاصيل الزيادات والتأثيرات الخاصة بسكنات أبطال الزومبي الجديدة مع معرض الصور.', source_url: 'https://whatsapp.com/channel/0029Vb6jrI44yltQQfvkg41o/655', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
};
const existing = await rest(`news?news_slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`);
if (Array.isArray(existing) && existing[0]?.id) await rest(`news?id=eq.${encodeURIComponent(existing[0].id)}`, { method: 'PATCH', body: JSON.stringify(row) });
else await rest('news', { method: 'POST', body: JSON.stringify(row) });
console.log(JSON.stringify({ uploaded: Object.keys(uploaded).length, mappedPosts: Object.keys(oldMappings).length, newsSlug: slug, featured: true, previewOnHome: true }, null, 2));
