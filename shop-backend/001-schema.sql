begin;

-- gen_random_uuid() is built into the project PostgreSQL version.

create table if not exists public.electroshop_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_electroshop_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.electroshop_admins where user_id = auth.uid()
  );
$$;

revoke all on function public.is_electroshop_admin() from public;
grant execute on function public.is_electroshop_admin() to authenticated;

create table if not exists public.electroshop_products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name_he text not null,
  name_en text not null,
  description_he text not null default '',
  description_en text not null default '',
  category text not null default 'other',
  regular_price_ils numeric(12,2) not null check (regular_price_ils >= 0),
  price_ils numeric(12,2) not null check (price_ils >= 0),
  price_usd numeric(12,2) check (price_usd is null or price_usd >= 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.electroshop_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.electroshop_products(id) on delete cascade,
  storage_path text not null,
  alt_he text not null default '',
  alt_en text not null default '',
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists electroshop_product_one_primary_image
on public.electroshop_product_images(product_id)
where is_primary;

create table if not exists public.electroshop_product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.electroshop_products(id) on delete cascade,
  option_type text not null check (option_type in ('color','size','style')),
  value_he text not null,
  value_en text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(product_id, option_type, value_he)
);

create table if not exists public.electroshop_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  country text not null,
  city text not null,
  address text not null,
  postal_code text not null default '',
  customer_note text not null default '',
  admin_note text not null default '',
  currency text not null default 'ILS' check (currency in ('ILS','USD')),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  shipping_amount numeric(12,2) not null default 0 check (shipping_amount >= 0),
  total numeric(12,2) not null check (total >= 0),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  fulfillment_status text not null default 'new' check (fulfillment_status in ('new','preparing','awaiting_shipment','shipped','delivered','cancelled')),
  tranzila_transaction_id text,
  tracking_number text not null default '',
  paid_at timestamptz,
  shipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.electroshop_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.electroshop_orders(id) on delete cascade,
  product_id uuid references public.electroshop_products(id) on delete set null,
  sku text not null,
  product_name_he text not null,
  product_name_en text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  selected_options jsonb not null default '{}'::jsonb,
  primary_image_path text not null default '',
  created_at timestamptz not null default now()
);

create or replace function public.electroshop_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists electroshop_products_set_updated_at on public.electroshop_products;
create trigger electroshop_products_set_updated_at before update on public.electroshop_products
for each row execute function public.electroshop_set_updated_at();

drop trigger if exists electroshop_orders_set_updated_at on public.electroshop_orders;
create trigger electroshop_orders_set_updated_at before update on public.electroshop_orders
for each row execute function public.electroshop_set_updated_at();

alter table public.electroshop_admins enable row level security;
alter table public.electroshop_products enable row level security;
alter table public.electroshop_product_images enable row level security;
alter table public.electroshop_product_options enable row level security;
alter table public.electroshop_orders enable row level security;
alter table public.electroshop_order_items enable row level security;

revoke all on public.electroshop_admins,public.electroshop_products,public.electroshop_product_images,public.electroshop_product_options,public.electroshop_orders,public.electroshop_order_items from public,anon,authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.electroshop_products, public.electroshop_product_images, public.electroshop_product_options to anon, authenticated;
grant select, insert, update, delete on public.electroshop_products, public.electroshop_product_images, public.electroshop_product_options to authenticated;
grant select on public.electroshop_admins to authenticated;
grant select, insert, update, delete on public.electroshop_orders, public.electroshop_order_items to authenticated;

drop policy if exists "electroshop active electroshop_products are public" on public.electroshop_products;
create policy "electroshop active electroshop_products are public" on public.electroshop_products
for select using (active or public.is_electroshop_admin());

drop policy if exists "electroshop admins manage electroshop_products" on public.electroshop_products;
create policy "electroshop admins manage electroshop_products" on public.electroshop_products
for all to authenticated using (public.is_electroshop_admin()) with check (public.is_electroshop_admin());

drop policy if exists "electroshop active product images are public" on public.electroshop_product_images;
create policy "electroshop active product images are public" on public.electroshop_product_images
for select using (
  exists (select 1 from public.electroshop_products p where p.id = product_id and p.active)
  or public.is_electroshop_admin()
);

drop policy if exists "electroshop admins manage product images" on public.electroshop_product_images;
create policy "electroshop admins manage product images" on public.electroshop_product_images
for all to authenticated using (public.is_electroshop_admin()) with check (public.is_electroshop_admin());

drop policy if exists "electroshop active product options are public" on public.electroshop_product_options;
create policy "electroshop active product options are public" on public.electroshop_product_options
for select using (
  active and exists (select 1 from public.electroshop_products p where p.id = product_id and p.active)
  or public.is_electroshop_admin()
);

drop policy if exists "electroshop admins manage product options" on public.electroshop_product_options;
create policy "electroshop admins manage product options" on public.electroshop_product_options
for all to authenticated using (public.is_electroshop_admin()) with check (public.is_electroshop_admin());

drop policy if exists "electroshop admins read admin list" on public.electroshop_admins;
create policy "electroshop admins read admin list" on public.electroshop_admins
for select to authenticated using (public.is_electroshop_admin());

drop policy if exists "electroshop admins manage electroshop_orders" on public.electroshop_orders;
create policy "electroshop admins manage electroshop_orders" on public.electroshop_orders
for all to authenticated using (public.is_electroshop_admin()) with check (public.is_electroshop_admin());

drop policy if exists "electroshop admins manage order items" on public.electroshop_order_items;
create policy "electroshop admins manage order items" on public.electroshop_order_items
for all to authenticated using (public.is_electroshop_admin()) with check (public.is_electroshop_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('electroshop-product-images','electroshop-product-images',true,10485760,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "electroshop public reads product image files" on storage.objects;
create policy "electroshop public reads product image files" on storage.objects
for select using (bucket_id = 'electroshop-product-images');

drop policy if exists "electroshop admins upload product image files" on storage.objects;
create policy "electroshop admins upload product image files" on storage.objects
for insert to authenticated with check (
  bucket_id = 'electroshop-product-images' and public.is_electroshop_admin()
);

drop policy if exists "electroshop admins update product image files" on storage.objects;
create policy "electroshop admins update product image files" on storage.objects
for update to authenticated using (
  bucket_id = 'electroshop-product-images' and public.is_electroshop_admin()
) with check (
  bucket_id = 'electroshop-product-images' and public.is_electroshop_admin()
);

drop policy if exists "electroshop admins delete product image files" on storage.objects;
create policy "electroshop admins delete product image files" on storage.objects
for delete to authenticated using (
  bucket_id = 'electroshop-product-images' and public.is_electroshop_admin()
);

drop policy if exists "electroshop bucket insert guard" on storage.objects;
create policy "electroshop bucket insert guard" on storage.objects as restrictive for insert to anon,authenticated
with check(bucket_id <> 'electroshop-product-images' or public.is_electroshop_admin());
drop policy if exists "electroshop bucket update guard" on storage.objects;
create policy "electroshop bucket update guard" on storage.objects as restrictive for update to anon,authenticated
using(bucket_id <> 'electroshop-product-images' or public.is_electroshop_admin())
with check(bucket_id <> 'electroshop-product-images' or public.is_electroshop_admin());
drop policy if exists "electroshop bucket delete guard" on storage.objects;
create policy "electroshop bucket delete guard" on storage.objects as restrictive for delete to anon,authenticated
using(bucket_id <> 'electroshop-product-images' or public.is_electroshop_admin());

commit;

-- After creating the administrator user in Authentication, run this separately:
-- insert into public.electroshop_admins (user_id) values ('ADMIN_USER_UUID');
