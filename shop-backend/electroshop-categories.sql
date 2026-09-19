begin;
create table if not exists public.electroshop_categories (
 slug text primary key check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 name_he text not null check(length(trim(name_he)) between 1 and 100),
 name_en text not null check(length(trim(name_en)) between 1 and 100),
 description_he text not null default '',
 description_en text not null default '',
 image_path text not null default '',
 sort_order integer not null default 0,
 active boolean not null default true
);
alter table public.electroshop_categories enable row level security;
grant select on public.electroshop_categories to anon,authenticated;
grant insert,update on public.electroshop_categories to authenticated;
drop policy if exists "electroshop category read" on public.electroshop_categories;
create policy "electroshop category read" on public.electroshop_categories for select using(active or public.is_electroshop_admin());
drop policy if exists "electroshop category insert" on public.electroshop_categories;
create policy "electroshop category insert" on public.electroshop_categories for insert to authenticated with check(public.is_electroshop_admin());
drop policy if exists "electroshop category update" on public.electroshop_categories;
create policy "electroshop category update" on public.electroshop_categories for update to authenticated using(public.is_electroshop_admin()) with check(public.is_electroshop_admin());
insert into public.electroshop_categories(slug,name_he,name_en,description_he,description_en,sort_order) values
('mobile','אביזרי סלולר','Mobile accessories','כיסויים, מגני מסך ואביזרים','Cases, screen protectors and accessories',1),
('pro-audio','פרו אודיו','Pro audio','מיקסרים, מיקרופונים וציוד אולפן','Mixers, microphones and studio equipment',2),
('car-mounts','תושבות לרכב','Car mounts','אחיזה יציבה ונוחה לכל נסיעה','A steady, convenient hold on every drive',3),
('guitars','גיטרות','Guitars','כלי נגינה באיסוף עצמי מהחנות','Musical instruments for collection at our store',4),
('chargers-cables','מטענים וכבלים','Chargers & cables','טעינה וחיבורים לכל יום','Everyday charging and connections',5)
on conflict(slug) do nothing;
commit;
