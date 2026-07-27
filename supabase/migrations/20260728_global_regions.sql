create table if not exists regions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_name text,
  base_domain text,
  focus text,
  status text default 'active',
  seo_title text,
  seo_description text,
  created_at timestamptz default now()
);

create table if not exists entity_regions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  region_id uuid references regions(id) on delete cascade,
  available boolean default false,
  damage integer,
  notes text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  unique (entity_type, entity_id, region_id)
);

create index if not exists entity_regions_region_idx on entity_regions(region_id);
create index if not exists entity_regions_entity_idx on entity_regions(entity_type, entity_id);

insert into regions (slug, name, short_name, base_domain, focus, status, seo_title, seo_description)
values
  ('west', 'CrossFire West', 'CF West', 'z8games.com', 'Official West builds, shop, and seasonal events', 'active', 'CrossFire West | Global Wiki', 'Explore CrossFire West weapons, events, and regional coverage in the global wiki.'),
  ('china', 'CrossFire China', 'CF China', 'cf.qq.com', 'Largest content volume and patch note coverage', 'active', 'CrossFire China | Global Wiki', 'Browse the broadest Chinese CrossFire content archive and patch-note coverage.'),
  ('vietnam', 'CrossFire Vietnam', 'CF Vietnam', 'cf.vtcgame.vn', 'Community and regional event tracking', 'active', 'CrossFire Vietnam | Global Wiki', 'Track Vietnam-focused CrossFire content, events, and locally discussed weapons.'),
  ('brazil', 'CrossFire Brazil', 'CF Brazil', 'crossfire.lat', 'Regional availability and localized content', 'active', 'CrossFire Brazil | Global Wiki', 'Discover Brazil-specific CrossFire availability notes and community coverage.'),
  ('philippines', 'CrossFire Philippines', 'CF PH', 'crossfire.ph', 'Localized events and community content', 'active', 'CrossFire Philippines | Global Wiki', 'Follow the Philippines CrossFire community, updates, and regional weapon notes.'),
  ('korea', 'CrossFire Korea', 'CF Korea', 'crossfire.co.kr', 'Korean client trends and localized updates', 'active', 'CrossFire Korea | Global Wiki', 'Explore Korean CrossFire content, regional updates, and live community notes.'),
  ('russia', 'CrossFire Russia', 'CF Russia', 'crossfire.rus', 'Russia-specific community and regional tracking', 'active', 'CrossFire Russia | Global Wiki', 'Track Russia-focused CrossFire updates, weapon availability, and community records.')
on conflict (slug) do nothing;
