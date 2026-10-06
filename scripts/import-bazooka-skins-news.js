import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const base = String(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
const key = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_KEY || process.env.service_role;
if (!base || !key) throw new Error('Supabase URL/service key is missing');
const imagePath = '/home/ubuntu/upload/1000641465.jpg';
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };

async function upload() {
  const file = await fs.readFile(imagePath);
  const objectPath = `whatsapp-archive/bazooka-${Date.now()}-${crypto.randomUUID()}.jpg`;
  const url = `${base}/storage/v1/object/media/${objectPath.split('/').map(encodeURIComponent).join('/')}`;
  const response = await fetch(url, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'false', 'cache-control': '31536000' }, body: file });
  if (!response.ok) throw new Error(`Image upload failed: ${response.status} ${(await response.text()).slice(0, 250)}`);
  return `${base}/storage/v1/object/public/media/${objectPath.split('/').map(encodeURIComponent).join('/')}`;
}
async function rest(pathname, init = {}) {
  const response = await fetch(`${base}/rest/v1/${pathname}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  const text = await response.text(); let body; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(`${response.status} ${text}`); return body;
}

const image = await upload();
const slug = 'bazooka-cassandra-and-armored-terminator-prices-and-bonuses';
const content = `<h2>ملخص الخبر</h2><p>تم تداول تفاصيل جديدة عن أسعار ومزايا البازوكا وبعض السكنات الخاصة بالموسم الخامس والنصف. الأسعار بالعملة المذكورة في المصدر، وقد تختلف حسب الإصدار أو المنطقة.</p><section class="skin-profile"><h2>البازوكا</h2><figure><img src="${image}" alt="البازوكا" loading="lazy" /><figcaption>البازوكا</figcaption></figure><p><strong>السعر:</strong> 10,000 قطعة نقدية.</p><p><strong>الميزة:</strong> تسمح بإطلاق قذيفتين متتاليتين من دون إعادة تلقيم بين الطلقتين.</p></section><section class="skin-profile"><h2>سكن كاساندرا</h2><p><strong>السعر:</strong> 16,000 قطعة نقدية.</p><p><strong>المزايا:</strong> زيادة الضرر بنسبة 10%. عند الوقوف دون حركة تستعيد 300 نقطة صحة كل ثانية. وعند إصابة بطل حليف بمسدسها، تستعيد صحته ويحصل على زيادة في سرعة الحركة وسرعة الهجوم لمدة 10 ثوانٍ.</p></section><section class="skin-profile"><h2>سكن أرمورد تيرميناتور للموسم الخامس والنصف</h2><p><strong>السعر:</strong> 16,000 قطعة نقدية.</p><p><strong>المزايا:</strong> زيادة الصحة بنسبة 5% وزيادة الضرر بنسبة 10%. يوفر الدرع تقليلًا للضرر بنسبة 70%، مقارنة بنسبة 40% في السكن العادي. كما يزداد مدى مهارة الصرخة، ويمكنها استهداف لاعب واحد حتى عبر الجدران.</p></section><h2>تنبيه</h2><p>هذه التفاصيل منقولة من محتوى المجتمع وليست إعلانًا رسميًا نهائيًا. سنحدّث الخبر إذا ظهرت قيم مؤكدة داخل اللعبة أو من المصدر الرسمي.</p>`;
const row = { title: 'أسعار ومزايا البازوكا وكاساندرا وأرمورد تيرميناتور', title_ar: 'أسعار ومزايا البازوكا وكاساندرا وأرمورد تيرميناتور', news_slug: slug, date_range: 'تحديث أكتوبر 2026', image_url: image, images: [image], category: 'تحديثات', content, content_ar: content, html_content: content, raw_html_content: content, author: 'كروس فاير ويكي', featured: true, preview_on_home: true, breaking: false, seo_title: 'أسعار ومزايا البازوكا وكاساندرا وأرمورد تيرميناتور', seo_description: 'تفاصيل أسعار ومزايا البازوكا وسكن كاساندرا وسكن أرمورد تيرميناتور.', source_url: 'https://whatsapp.com/channel/0029Vb6jrI44yltQQfvkg41o/655', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
const existing = await rest(`news?news_slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`);
if (Array.isArray(existing) && existing[0]?.id) await rest(`news?id=eq.${encodeURIComponent(existing[0].id)}`, { method: 'PATCH', body: JSON.stringify(row) });
else await rest('news', { method: 'POST', body: JSON.stringify(row) });
const check = await rest(`news?news_slug=eq.${encodeURIComponent(slug)}&select=id,title,image_url,featured,preview_on_home&limit=1`);
console.log(JSON.stringify({ news: check[0], image }, null, 2));
