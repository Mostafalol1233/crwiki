import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const base = String(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim().replace(/[\r\n]/g, '').replace(/\/$/, '');
const key = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_KEY || process.env.service_role;
if (!base || !key) throw new Error('Supabase URL/service key is missing');
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };

async function rest(path, init = {}) {
  const response = await fetch(`${base}/rest/v1/${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  const text = await response.text();
  let body; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(`${response.status}: ${text}`);
  return body;
}

async function upload(localPath) {
  const file = await fs.readFile(localPath);
  const object = `leaks/gigi-white-friday-${crypto.randomUUID()}.jpg`;
  const response = await fetch(`${base}/storage/v1/object/media/${object}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'false', 'cache-control': '31536000' },
    body: file,
  });
  if (!response.ok) throw new Error(`Image upload failed: ${response.status} ${await response.text()}`);
  return `${base}/storage/v1/object/public/media/${object}`;
}

const slug = 'gigi-noble-character-leak-white-friday';
const image = await upload('/home/ubuntu/upload/1000662568.jpg');
const sourceLabel = 'Community leak — White Friday teaser';
const now = new Date().toISOString();

const titleEn = 'GIGI Noble Character Leak: White Friday Teaser';
const titleAr = 'تسريب شخصية GIGI Noble: تلميح White Friday';
const descriptionEn = 'A community leak suggests that GIGI may be the next CrossFire event character, with a Noble-style slot system. Nothing has been officially confirmed yet.';
const descriptionAr = 'تسريب مجتمعي يشير إلى احتمال وصول شخصية GIGI ضمن فعالية قادمة بنظام خانات شبيه بشخصيات Noble، من دون تأكيد رسمي حتى الآن.';
const contentEn = `<h2>Is GIGI the next event character? 👑</h2><p>A new community leak is pointing toward <strong>GIGI</strong> as a possible upcoming CrossFire event character. The shared White Friday teaser shows two characters beside a countdown, but it does not display an official name or a confirmed release notice.</p><h2>What the leak claims ⚡</h2><p>According to the circulating information, GIGI may follow the usual <strong>Noble-style system</strong>, with several ability slots and randomly assigned bonuses. The exact number of slots, available effects, acquisition method and release region have not been confirmed.</p><ul><li>Possible character name: GIGI, GIGI Noble or another final title.</li><li>Possible design: a Noble-style character with multiple random bonus slots.</li><li>Release timing: not confirmed; the White Friday countdown is only visual context.</li></ul><h2>Important verification note ⚠️</h2><p>This is a rumor report based on community-shared material, not an official CrossFire announcement. Treat the name, abilities, slot system and release date as unconfirmed until the publisher publishes a formal event notice or the character appears in the live game.</p><p><strong>CrossFire Wiki will update this report when reliable information becomes available.</strong> 👑✨</p>`;
const contentAr = `<h2>هل ستكون GIGI هي شخصية الحدث القادمة؟ 👑</h2><p>يشير تسريب متداول بين مجتمع اللاعبين إلى احتمال وصول شخصية <strong>GIGI</strong> ضمن فعالية قادمة في كروس فاير. تُظهر صورة تلميح White Friday شخصيتين بجوار عداد تنازلي، لكنها لا تعرض اسمًا رسميًا أو إعلانًا مؤكدًا عن موعد الإصدار.</p><h2>ماذا يقول التسريب؟ ⚡</h2><p>بحسب المعلومات المتداولة، قد تعمل GIGI بنظام قريب من شخصيات <strong>Noble</strong> المعتاد، مع عدة خانات لقدرات أو مزايا يتم تحديدها عشوائيًا. وحتى الآن لا يوجد تأكيد لعدد الخانات أو نوع المزايا أو طريقة الحصول على الشخصية أو المنطقة التي ستصل إليها أولًا.</p><ul><li>الاسم المحتمل: GIGI أو GIGI Noble أو اسم نهائي مختلف.</li><li>النظام المحتمل: شخصية بنظام خانات ومزايا عشوائية شبيه بشخصيات Noble.</li><li>موعد الإصدار: غير مؤكد، والعداد الظاهر في الصورة لا يُعد إعلانًا رسميًا.</li></ul><h2>تنبيه مهم قبل تداول الخبر ⚠️</h2><p>هذا تقرير عن تسريب مجتمعي مبني على مادة متداولة، وليس إعلانًا رسميًا من CrossFire. لذلك يجب اعتبار الاسم والقدرات ونظام الخانات وموعد الإصدار معلومات غير مؤكدة إلى أن تنشر الشركة إعلانًا رسميًا أو تظهر الشخصية داخل النسخة الحية من اللعبة.</p><p><strong>ستحدّث CrossFire Wiki الخبر عند ظهور معلومات موثوقة.</strong> 👑✨</p>`;

const newsRow = {
  title: titleEn, title_ar: titleAr, news_slug: slug,
  date_range: 'November 2026 — Unconfirmed', image_url: image, images: [image], category: 'Leaks',
  content: contentEn, content_ar: contentAr, html_content: contentEn, raw_html_content: contentEn,
  author: 'CrossFire Wiki Editorial', featured: true, preview_on_home: true, breaking: false,
  source_url: sourceLabel, seo_title: titleEn, seo_description: descriptionEn,
  seo_keywords: ['CrossFire', 'GIGI', 'Noble character', 'White Friday', 'leak'], canonical_url: `https://crossfire.wiki/news/${slug}`,
  created_at: now, updated_at: now,
};

const existingNews = await rest(`news?news_slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`);
let newsId;
if (existingNews?.[0]?.id) {
  newsId = existingNews[0].id;
  await rest(`news?id=eq.${encodeURIComponent(newsId)}`, { method: 'PATCH', body: JSON.stringify(newsRow) });
} else {
  const created = await rest('news', { method: 'POST', body: JSON.stringify(newsRow) });
  newsId = created?.[0]?.id || null;
}

const announcementTitleEn = 'Exclusive Leak: Is GIGI the Next Event Character? 👑';
const announcementTitleAr = 'تسريب حصري: هل ستكون GIGI شخصية الحدث القادمة؟ 👑';
const announcementEn = `<p><strong>A new community leak points to GIGI as a possible upcoming CrossFire event character.</strong> The rumor suggests a Noble-style system with multiple random bonus slots, but nothing is officially confirmed yet.</p><p><a href="https://crossfire.wiki/news/${slug}">Read the full bilingual report</a> and follow CrossFire Wiki for verified updates.</p>`;
const announcementAr = `<p><strong>تسريب مجتمعي جديد يشير إلى احتمال وصول GIGI كشخصية للحدث القادم في كروس فاير.</strong> ويذكر التسريب نظامًا شبيهًا بشخصيات Noble مع عدة خانات لمزايا عشوائية، لكن لا يوجد تأكيد رسمي حتى الآن.</p><p><a href="https://crossfire.wiki/news/${slug}">اقرأ التقرير الكامل باللغتين</a> وتابع CrossFire Wiki لأي تحديث موثوق.</p>`;
const announcementRow = {
  title_en: announcementTitleEn, title_ar: announcementTitleAr,
  content_en: announcementEn, content_ar: announcementAr, type: 'info', target: 'global', display: 'banner',
  active: true, dismissible: true, image_url: image, link_url: `https://crossfire.wiki/news/${slug}`,
  direction: 'auto', theme: 'royal-gold', updated_at: now,
};
const existingAnnouncements = await rest(`announcements?title_en=eq.${encodeURIComponent(announcementTitleEn)}&target=eq.global&select=id&limit=10`);
let announcementId;
if (existingAnnouncements?.[0]?.id) {
  announcementId = existingAnnouncements[0].id;
  await rest(`announcements?id=eq.${encodeURIComponent(announcementId)}`, { method: 'PATCH', body: JSON.stringify(announcementRow) });
} else {
  const created = await rest('announcements', { method: 'POST', body: JSON.stringify({ ...announcementRow, created_at: now }) });
  announcementId = created?.[0]?.id || null;
}

console.log(JSON.stringify({ newsId, announcementId, image, slug, status: 'upserted' }, null, 2));
