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

create table if not exists weapons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists weapon_regions (
  id uuid primary key default gen_random_uuid(),
  weapon_id uuid references weapons(id) on delete cascade,
  region_id uuid references regions(id) on delete cascade,
  available boolean default false,
  damage integer,
  notes text,
  created_at timestamptz default now(),
  unique (weapon_id, region_id)
);

create table if not exists maps (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  region_slug text,
  content text,
  created_at timestamptz default now()
);

create index if not exists regions_slug_idx on regions(slug);
create index if not exists weapons_slug_idx on weapons(slug);
create index if not exists weapon_regions_region_idx on weapon_regions(region_id);
create index if not exists events_region_slug_idx on events(region_slug);
