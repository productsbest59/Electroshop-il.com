create table if not exists public.electroshop_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title_he text not null,
  title_en text not null default '',
  excerpt_he text not null default '',
  excerpt_en text not null default '',
  content_he text not null default '',
  content_en text not null default '',
  cover_path text,
  cover_alt_he text not null default '',
  cover_alt_en text not null default '',
  seo_title_he text not null default '',
  seo_title_en text not null default '',
  seo_description_he text not null default '',
  seo_description_en text not null default '',
  status text not null default 'draft' check (status in ('draft','published')),
  sort_order integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.electroshop_articles enable row level security;
drop policy if exists "Public reads published Electroshop articles" on public.electroshop_articles;
create policy "Public reads published Electroshop articles" on public.electroshop_articles for select
using (status = 'published' or public.is_electroshop_admin());
drop policy if exists "Electroshop admins manage articles" on public.electroshop_articles;
create policy "Electroshop admins manage articles" on public.electroshop_articles for all
using (public.is_electroshop_admin()) with check (public.is_electroshop_admin());

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('electroshop-article-images','electroshop-article-images',true,8388608,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public=true,file_size_limit=8388608,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "Public reads Electroshop article images" on storage.objects;
create policy "Public reads Electroshop article images" on storage.objects for select using (bucket_id='electroshop-article-images');
drop policy if exists "Electroshop admins upload article images" on storage.objects;
create policy "Electroshop admins upload article images" on storage.objects for insert with check (bucket_id='electroshop-article-images' and public.is_electroshop_admin());
drop policy if exists "Electroshop admins update article images" on storage.objects;
create policy "Electroshop admins update article images" on storage.objects for update using (bucket_id='electroshop-article-images' and public.is_electroshop_admin());
drop policy if exists "Electroshop admins delete article images" on storage.objects;
create policy "Electroshop admins delete article images" on storage.objects for delete using (bucket_id='electroshop-article-images' and public.is_electroshop_admin());
