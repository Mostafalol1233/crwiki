import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import ws from 'ws';

const SUPABASE_URL = 'https://qywburkldwdkegztsgjj.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws }
});

async function main() {
  console.log('🔧 Setting up Supabase tables and data...\n');

  // 1. Create announcements table
  const { error: annErr } = await supabase.rpc('exec_sql', { sql: `
    CREATE TABLE IF NOT EXISTS announcements (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      type TEXT NOT NULL DEFAULT 'global',
      seller_slug TEXT DEFAULT '',
      content_html TEXT DEFAULT '',
      content_html_en TEXT DEFAULT '',
      content_html_ar TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      link_url TEXT DEFAULT '',
      active BOOLEAN DEFAULT TRUE,
      dismissible BOOLEAN DEFAULT TRUE,
      direction TEXT DEFAULT 'auto',
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS announcements_type_idx ON announcements(type);
    CREATE INDEX IF NOT EXISTS announcements_seller_slug_idx ON announcements(seller_slug);
  `}).catch(() => null);

  // Try direct insert approach instead
  const testAnn = await supabase.from('announcements').select('id').limit(1);
  if (testAnn.error?.message?.includes('does not exist')) {
    console.log('❌ announcements table missing - need to create via SQL editor');
    console.log('Run this SQL in Supabase dashboard:');
    console.log(`
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL DEFAULT 'global',
  seller_slug TEXT DEFAULT '',
  content_html TEXT DEFAULT '',
  content_html_en TEXT DEFAULT '',
  content_html_ar TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  link_url TEXT DEFAULT '',
  active BOOLEAN DEFAULT TRUE,
  dismissible BOOLEAN DEFAULT TRUE,
  direction TEXT DEFAULT 'auto',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
    `);
  } else {
    console.log('✅ announcements table exists');
  }

  // 2. Create admin_users table
  const testAdmin = await supabase.from('admin_users').select('id').limit(1);
  if (testAdmin.error?.message?.includes('does not exist')) {
    console.log('❌ admin_users table missing');
  } else {
    // Insert super admin if not exists
    const hash = await bcrypt.hash('CrossFireWiki@2024', 10);
    const { error: insertErr } = await supabase.from('admin_users').upsert([{
      username: 'admin',
      password_hash: hash,
      role: 'super_admin',
      permissions: {}
    }], { onConflict: 'username', ignoreDuplicates: true });
    if (insertErr) console.log('Admin insert:', insertErr.message);
    else console.log('✅ Admin user ready');
  }

  // 3. Add giveaway event
  const { error: eventErr } = await supabase.from('events').upsert([{
    title: '✦•┈ 🎁 Giveaway - Site Comeback! ┈•✦',
    title_ar: '✦•┈ 🎁🐑 Giveaway عودة الموقع - الـ 5 فائزين ┈•✦',
    event_name_slug: 'giveaway-site-comeback-2024',
    description: `<div style="text-align:center">
<h2>🎁 CrossFire Wiki is BACK! 🎉</h2>
<p>To celebrate the return of CrossFire Wiki, we're running a special Giveaway!</p>
<h3>🏆 5 Winners Total</h3>
<div style="display:flex;justify-content:center;gap:40px;flex-wrap:wrap;margin:20px 0">
<div><strong>Season Pass 3</strong><br/>3 winners 🎮</div>
<div><strong>Mercenary Pass</strong><br/>2 winners ⚔️</div>
</div>
<p>Vote in the poll below to choose how prizes are distributed!</p>
<h3>🗳️ Distribution Options:</h3>
<ol style="text-align:left;max-width:500px;margin:0 auto">
<li>All 5 winners get Mercenary Pass 🎮</li>
<li>All 5 winners get Season Pass - Month 6 🎮</li>
<li>Split: 3 Mercenary Pass + 2 Season Pass</li>
</ol>
<p><strong>👑 CrossFire Wiki Team ✨</strong></p>
</div>`,
    description_ar: `<div style="text-align:center;direction:rtl">
<h2>🎁 CrossFire Wiki رجع تاني! 🎉</h2>
<p>بمناسبة عودة الموقع، عملنالكم Giveaway مخصوص! 🔥</p>
<p>هنبدأ من غير أي شروط 👌 دلوقتي دوركم تختاروا الجوائز بنفسكم 👇</p>
<h3>🏆 5 فائزين</h3>
<div style="margin:20px 0">
<p><strong>Season Pass 3</strong> - 3 فائزين 🎮</p>
<p><strong>Mercenary Pass - Falling Petals</strong> - 2 فائزين ⚔️</p>
</div>
<h3>🗳️ طرق التوزيع:</h3>
<ol>
<li>كل فائز ياخد Mercenary Pass 🎮 - إجمالي 5 جوائز</li>
<li>كل فائز ياخد Season Pass - شهر 6 🎮 - إجمالي 5 جوائز</li>
<li>تقسيم: 3 Mercenary Pass + 2 Season Pass</li>
</ol>
<p><strong>👑 CrossFire Wiki ✨</strong></p>
<p>كل سنة وانتو طيبين يا أبطال ❤️</p>
</div>`,
    date: '2024-06-10',
    type: 'upcoming',
    image_url: '/giveaway-eid.png',
    featured: true,
    seo_title: 'CrossFire Wiki Giveaway - 5 Winners - Season Pass & Mercenary Pass',
    seo_description: 'CrossFire Wiki is back! Join our exclusive giveaway to win Season Pass 3 and Mercenary Pass Falling Petals. 5 winners total!',
    sort_order: 1,
  }], { onConflict: 'event_name_slug', ignoreDuplicates: true });
  
  if (eventErr) console.log('❌ Event error:', eventErr.message);
  else console.log('✅ Giveaway event added!');

  console.log('\n✅ Setup complete!');
}

main().catch(console.error);
