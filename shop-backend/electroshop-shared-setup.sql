-- ELECTROSHOP ONLY: additive installation inside the existing Naya project.
-- No Naya tables, functions, policies, users, data or payment settings are replaced.
-- Orders and payments remain disabled. Administrator membership is assigned separately.
begin;

-- 001-schema.sql
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


-- After creating the administrator user in Authentication, run this separately:
-- insert into public.electroshop_admins (user_id) values ('ADMIN_USER_UUID');


-- 002-store-rules.sql
alter table public.electroshop_products add column if not exists variants jsonb not null default '[]'::jsonb;
alter table public.electroshop_products add column if not exists featured boolean not null default false;
alter table public.electroshop_products add column if not exists pickup_only boolean not null default false;
alter table public.electroshop_product_images add column if not exists color_value text;
alter table public.electroshop_orders add column if not exists fulfillment_method text not null default 'shipping' check(fulfillment_method in ('pickup','shipping'));
alter table public.electroshop_orders add column if not exists payment_method_details text;
alter table public.electroshop_orders drop constraint if exists electroshop_orders_fulfillment_status_check;
alter table public.electroshop_orders add constraint electroshop_orders_fulfillment_status_check check(fulfillment_status in ('new','preparing','awaiting_shipment','shipped','delivered','returning','returned','cancelled','ready_for_pickup','collected'));
create table if not exists public.electroshop_settings(id boolean primary key default true check(id),orders_enabled boolean not null default false,shipping_amount numeric(12,2) check(shipping_amount>=0));
insert into public.electroshop_settings(id) values(true) on conflict do nothing;
alter table public.electroshop_settings enable row level security;
grant select,update on public.electroshop_settings to authenticated;
drop policy if exists "electroshop admin settings" on public.electroshop_settings;
create policy "electroshop admin settings" on public.electroshop_settings for all to authenticated using(public.is_electroshop_admin()) with check(public.is_electroshop_admin());
grant execute on function public.is_electroshop_admin() to anon;
update storage.buckets set file_size_limit=52428800,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm','video/quicktime'] where id='electroshop-product-images';

create or replace function public.create_electroshop_order(p_customer jsonb,p_items jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 v_id uuid; v_number text; v_item jsonb; v_product public.electroshop_products%rowtype;
 v_quantity integer; v_price numeric(12,2); v_total numeric(12,2):=0; v_shipping numeric(12,2):=0;
 v_method text:=p_customer->>'fulfillmentMethod'; v_options jsonb; v_key text; v_expected boolean; v_variant jsonb;
begin
 if not coalesce((select orders_enabled from public.electroshop_settings where id),false) then raise exception 'ההזמנות טרם נפתחו'; end if;
 if v_method is null or v_method not in ('pickup','shipping') then raise exception 'יש לבחור איסוף עצמי או משלוח'; end if;
 if jsonb_typeof(p_items) is distinct from 'array' then raise exception 'סל לא תקין'; end if;
 if jsonb_array_length(p_items) not between 1 and 100 then raise exception 'סל לא תקין'; end if;
 if coalesce(trim(p_customer->>'fullName'),'')='' or coalesce(trim(p_customer->>'phone'),'')='' or coalesce(p_customer->>'email','') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'יש להשלים פרטי לקוח תקינים'; end if;
 if v_method='shipping' then
   if coalesce(trim(p_customer->>'city'),'')='' or coalesce(trim(p_customer->>'address'),'')='' then raise exception 'יש להשלים כתובת למשלוח'; end if;
   select shipping_amount into v_shipping from public.electroshop_settings where id;
   if v_shipping is null then raise exception 'המשלוחים טרם הוגדרו'; end if;
 end if;
 v_number:='ES-'||to_char(now(),'YYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
 insert into public.electroshop_orders(order_number,customer_name,customer_email,customer_phone,country,city,address,postal_code,customer_note,currency,subtotal,shipping_amount,total,fulfillment_method)
 values(v_number,trim(p_customer->>'fullName'),trim(p_customer->>'email'),trim(p_customer->>'phone'),'ישראל',case when v_method='pickup' then 'חולון' else trim(p_customer->>'city') end,case when v_method='pickup' then 'המרכבה 31' else trim(p_customer->>'address') end,coalesce(p_customer->>'postalCode',''),coalesce(p_customer->>'notes',''),'ILS',0,v_shipping,0,v_method) returning id into v_id;
 for v_item in select value from jsonb_array_elements(p_items) loop
   if coalesce(v_item->>'quantity','') !~ '^([1-9]|1[0-9]|20)$' then raise exception 'כמות לא תקינה'; end if;
   v_quantity:=(v_item->>'quantity')::integer;
   select * into v_product from public.electroshop_products where id=(v_item->>'productId')::uuid and active for share;
   if not found then raise exception 'המוצר אינו זמין'; end if;
   if v_product.pickup_only and v_method<>'pickup' then raise exception 'המוצר זמין באיסוף עצמי בלבד'; end if;
   v_options:=jsonb_build_object('color',coalesce(v_item->>'color',''),'size',coalesce(v_item->>'size',''),'style',coalesce(v_item->>'style',''));
   foreach v_key in array array['color','size','style'] loop
     select exists(select 1 from public.electroshop_product_options where product_id=v_product.id and option_type=v_key and active) into v_expected;
     if (v_expected and not exists(select 1 from public.electroshop_product_options where product_id=v_product.id and option_type=v_key and active and value_he=v_options->>v_key)) or (not v_expected and v_options->>v_key<>'') then raise exception 'יש לבחור אפשרות מוצר תקינה'; end if;
   end loop;
   v_price:=v_product.price_ils;
   select value into v_variant from jsonb_array_elements(v_product.variants) where coalesce(value->>'color','')=v_options->>'color' and coalesce(value->>'size','')=v_options->>'size' and coalesce(value->>'style','')=v_options->>'style' limit 1;
   if v_variant->>'price' is not null and v_variant->>'price'<>'' then v_price:=(v_variant->>'price')::numeric; end if;
   if v_price<0 then raise exception 'מחיר מוצר לא תקין'; end if;
   insert into public.electroshop_order_items(order_id,product_id,sku,product_name_he,product_name_en,unit_price,quantity,selected_options,primary_image_path)
   values(v_id,v_product.id,v_product.sku,v_product.name_he,v_product.name_en,v_price,v_quantity,v_options,coalesce((select storage_path from public.electroshop_product_images where product_id=v_product.id order by is_primary desc,sort_order limit 1),''));
   v_total:=v_total+v_price*v_quantity;
 end loop;
 update public.electroshop_orders set subtotal=v_total,total=v_total+v_shipping where id=v_id;
 return jsonb_build_object('id',v_id,'order_number',v_number,'total_ils',v_total+v_shipping,'fulfillment_method',v_method,'payment_status','pending');
end;$$;
revoke all on function public.create_electroshop_order(jsonb,jsonb) from public;
grant execute on function public.create_electroshop_order(jsonb,jsonb) to anon,authenticated;


-- 003-payment-fields.sql
alter table public.electroshop_orders
  add column if not exists payment_provider text,
  add column if not exists payment_transaction_id text,
  add column if not exists payment_response_code text,
  add column if not exists payment_card_last4 text,
  add column if not exists payment_paid_at timestamptz,
  add column if not exists payment_callback_received_at timestamptz;

alter table public.electroshop_orders
  add column if not exists payment_request_id text,
  add column if not exists payment_link text;

create unique index if not exists electroshop_orders_payment_transaction_unique
  on public.electroshop_orders(payment_transaction_id)
  where payment_transaction_id is not null;

grant select, update on table public.electroshop_orders to service_role;
grant select on table public.electroshop_order_items to service_role;



-- 004-import-existing-products.sql
do $seed$ declare product_uuid uuid; begin
if not exists(select 1 from public.electroshop_products where sku='ELECTRO-001') then
 insert into public.electroshop_products(sku,name_he,name_en,description_he,description_en,category,regular_price_ils,price_ils,featured,sort_order)
 values('ELECTRO-001','Audio Live Mixer S30','Audio Live Mixer S30','מיקסר אודיו S30 עם אפקטים ל-DJ, שינויי קול, הקלטת מוזיקה וכרטיס קול מובנה.

ללא סוללה מובנית
המכשיר פועל באמצעות מקור מתח חיצוני ואינו כולל סוללה פנימית.

מתאם כלול באריזה
המוצר מגיע עם מתאם מתאים, כך שאין צורך לרכוש אותו בנפרד.

איכות שמע גבוהה
כרטיס הקול של S30 מיועד להקלטת אודיו ומספק צליל ברור ומדויק.

מתח AC יציב
הפעלה באמצעות מתח AC מאפשרת עבודה יציבה ומתאימה להקלטות באולפן וגם לשימוש בהופעות חיות.

אפקטים ושינויי קול
כולל אפשרויות לשינוי הקול ואפקטים המאפשרים להתנסות בגוונים וסגנונות קול שונים.','S30 audio mixer with DJ mixing effects, voice-changing features, music recording and built-in sound card.

No Built-in Battery
The device operates using an external power source and does not include a built-in battery.

Adapter Included
The S30 comes with an adapter, eliminating the need to purchase one separately.

High-Quality Sound
The S30 sound card is designed for audio recording and delivers clear and precise sound.

Stable AC Power
AC-powered operation provides stable performance suitable for both studio recording and live applications.

Voice-Changing Effects
Built-in voice-changing features allow users to experiment with different vocal tones, effects and styles.','pro-audio',379,379,true,1) returning id into product_uuid;
 insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product01-main.jpg',true,0);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product01-01.jpg',false,1);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product01-02.jpg',false,2);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product01-03.jpg',false,3);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product01-04.jpg',false,4);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product01-05.jpg',false,5);
end if;
if not exists(select 1 from public.electroshop_products where sku='ELECTRO-002') then
 insert into public.electroshop_products(sku,name_he,name_en,description_he,description_en,category,regular_price_ils,price_ils,featured,sort_order)
 values('ELECTRO-002','M-VAVE SMK-25 Mini MIDI Keyboard','M-VAVE SMK-25 Mini MIDI Keyboard','מקלדת MIDI קומפקטית עם 25 קלידים רגישים לעוצמת לחיצה, Bluetooth, סוללה נטענת וחיבור USB-C. מתאימה למחשב, Mac, iOS ו-Android.

חיבור USB
חברו את הכבל דרך יציאת USB-C למחשב Windows או Mac. המקלדת מזוהה אוטומטית וגם נטענת בזמן החיבור. נורית אדומה מציינת טעינה ונורית ירוקה מציינת שהטעינה הושלמה.

חיבור Bluetooth
לחיצה ממושכת על כפתור BT מפעילה את החיבור האלחוטי. נורית מהבהבת מציינת שה-Bluetooth פעיל, ונורית קבועה מציינת חיבור מוצלח.

חיבור אלחוטי ישיר
ניתן להתחבר ל-Windows, Mac, iOS ו-Android באמצעות Bluetooth. ב-Windows נדרשים Bluetooth 5.0 ודרייבר BLE MIDI מתאים. ב-iOS וב-Android נדרשת תוכנה התומכת ב-BLE MIDI והחיבור מתבצע מתוך התוכנה.

MIDI OUT
ניתן לשנות בתוכנה את מצב חיבור הפדל מ-Pedal ל-MIDI OUT, ולאחר מכן להשתמש בחיבור 3.5 מ״מ כיציאת MIDI לחיבור לסינתיסייזר או ציוד MIDI אחר. חיבור MIDI אלחוטי דורש מתאם MIDI אלחוטי נוסף הנמכר בנפרד.

קלידים ובקרות
25 קלידים רגישים לעוצמת לחיצה ובקר סיבובי 360° הניתן להקצאה.

חיבורים
יציאת 3.5 מ״מ לפדל Sustain, חיבור USB-C, חיבור אלחוטי ל-Windows/Mac/iOS/Android ותמיכה ב-MIDI OUT אלחוטי באמצעות התקן MIDI נוסף.

סוללה
סוללה נטענת 780mAh. ניתן להפעיל את המקלדת גם באמצעות USB. באריזה כלול כבל USB בלבד.

מידות ומשקל
מידות: 348 × 105 × 38 מ״מ. משקל: 460 גרם.

מה כלול באריזה
מקלדת SMK-25 MINI MIDI, כבל USB ומדריך למשתמש.','Compact 25-key velocity-sensitive MIDI keyboard with Bluetooth, rechargeable battery and USB-C connectivity. Compatible with Windows, Mac, iOS and Android.

USB Connection
Connect the keyboard to a Windows PC or Mac through the USB-C port. It is recognized automatically and charges at the same time. Red light indicates charging and green light indicates charging is complete.

Bluetooth Connection
Press and hold the BT button to activate wireless mode. A flashing light indicates Bluetooth is active, while a steady light indicates a successful connection.

Direct Wireless Connection
Connect directly to Windows, Mac, iOS or Android via Bluetooth. Windows requires Bluetooth 5.0 and a compatible BLE MIDI driver. iOS and Android require software that supports BLE MIDI, with the connection made inside the software.

MIDI OUT
The pedal port can be changed from Pedal mode to MIDI OUT in the software, allowing the 3.5 mm port to connect to a hardware synthesizer or other MIDI equipment. Wireless MIDI OUT requires an additional wireless MIDI adapter sold separately.

Keys & Controls
25 velocity-sensitive keys and one assignable endless 360-degree encoder.

Connections
3.5 mm sustain pedal port, USB-C, wireless connectivity with Windows/Mac/iOS/Android, and wireless MIDI OUT support with an additional MIDI device.

Power
Built-in 780mAh rechargeable battery or USB bus power. USB cable is included.

Dimensions & Weight
Dimensions: 348 × 105 × 38 mm. Weight: 460 g.

Package Includes
1 × SMK-25 MINI MIDI Keyboard, 1 × USB connection cable and 1 × user manual.','pro-audio',399,399,true,2) returning id into product_uuid;
 insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product02-main.jpg',true,0);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product02-01.jpg',false,1);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product02-02.jpg',false,2);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product02-03.jpg',false,3);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product02-04.jpg',false,4);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product02-05.jpg',false,5);
end if;
if not exists(select 1 from public.electroshop_products where sku='ELECTRO-003') then
 insert into public.electroshop_products(sku,name_he,name_en,description_he,description_en,category,regular_price_ils,price_ils,featured,sort_order)
 values('ELECTRO-003','All-in-One High-Quality Audio Recording','All-in-One High-Quality Audio Recording','ערכת אולפן All-in-One הכוללת מיקסר אודיו RGB ומיקרופון דינמי, המתאימה להקלטות, גיימינג, פודקאסטים, סטרימינג ועוד.

פתרון מלא לפודקאסטים והקלטות
ערכת FIFINE All-in-One כוללת את הציוד הדרוש להקלטת אודיו באיכות גבוהה, עם מיקרופון דינמי ומיקסר אודיו RGB לשימוש בסטרימינג, פודקאסטים ואולפן.

דפוס קליטה Cardioid
המיקרופון קולט בעיקר את הצליל המגיע מלפנים ומסייע בהפחתת רעשי רקע, לקבלת הקלטת קול ברורה יותר בסביבה ביתית או באולפן.

חיבור קווי יציב
החיבור הקווי מספק העברת אודיו יציבה ללא תלות באות אלחוטי, ומתאים לסטרימינג חי, הקלטות וגיימינג.

מיקרופון דינמי
המיקרופון הדינמי מיועד להפקת קול ברור ומפורט עבור פודקאסטים, סטרימינג ויצירת תוכן.

מיקסר אודיו RGB
המיקסר המצורף כולל תאורת RGB המוסיפה אפקטים צבעוניים לעמדת הסטרימינג או ההקלטה.

מידות ומשקל האריזה
מידות האריזה: 31 × 28 × 10 ס״מ. משקל: 1.535 ק״ג.

תקנים
לפי פרטי המוצר, הערכה מצוינת כבעלת תקני CE, FCC ו-KC.','All-in-One Kit with RGB Audio Mixer, Streaming Studio Set with Dynamic Mic for Recording, Gaming, Podcasting and more.

Complete Podcasting Solution
Complete all-in-one kit for high-quality audio recording, including a dynamic microphone and RGB audio mixer for streaming, podcasting, gaming and studio use.

Cardioid Pickup Pattern
Captures sound primarily from the front while helping reduce unwanted background noise for clearer voice recordings.

Stable Wired Connectivity
Wired connection provides consistent audio transmission without relying on a wireless signal, suitable for live streaming, recording and gaming.

Dynamic Microphone
Designed to deliver clear and detailed voice reproduction for podcasting, streaming and content creation.

RGB Audio Mixer
The included mixer features RGB lighting effects that add a colorful visual element to your streaming or recording setup.

Package Dimensions & Weight
Package dimensions: 31 × 28 × 10 cm. Weight: 1.535 kg.

Certifications
According to the product information, the kit is listed with CE, FCC and KC certifications.','pro-audio',549,549,true,3) returning id into product_uuid;
 insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product03-main.jpg',true,0);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product03-01.jpg',false,1);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product03-02.jpg',false,2);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product03-03.jpg',false,3);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product03-04.jpg',false,4);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product03-video.mp4',false,5);
end if;
if not exists(select 1 from public.electroshop_products where sku='ELECTRO-004') then
 insert into public.electroshop_products(sku,name_he,name_en,description_he,description_en,category,regular_price_ils,price_ils,featured,sort_order)
 values('ELECTRO-004','OneOdio Studio Pro DJ Headphone','OneOdio Studio Pro DJ Headphone','אוזניות DJ ואולפן מקצועיות עם דרייברים 50 מ״מ, צליל Hi-Fi, מבנה Over-Ear נוח, כבלים נתיקים ומיקרופון.

דרייברים מקצועיים 50 מ״מ
דרייברים עם מגנטים Neodymium המספקים צליל Hi-Fi עשיר ומפורט, בהירות גבוהה ובס עמוק.

כבלים נתיקים וחיבורים גמישים
כולל כבל 3.5mm ל-6.3mm באורך 2.6 מטר וכבל 3.5mm ל-3.5mm באורך 1.2 מטר.

מבנה Over-Ear נוח
כריות Memory Foam ומבנה אטום מספקים נוחות בשימוש ממושך ובידוד רעשים טוב יותר.

מיקרופון מובנה
מתאים גם לשיחות, גיימינג וצ''אט קולי במכשירים תואמים.

ל-DJ, אולפן ומוניטורינג
מתאים למוניטורינג מקצועי, מיקסינג, הקלטה ועבודת DJ.

תכולת האריזה
אוזניות Studio DJ, כבל 3.5mm ל-6.3mm באורך 2.6 מ׳, כבל 3.5mm ל-3.5mm באורך 1.2 מ׳, נרתיק ואריזה מקורית של OneOdio.','Professional studio and DJ over-ear headphones with 50mm drivers, Hi-Fi sound, detachable cables and microphone.

Professional 50mm Drivers
50mm drivers with neodymium magnets deliver rich, detailed Hi-Fi audio, excellent clarity and deep bass.

Detachable Cables
Includes a 2.6m 3.5mm-to-6.3mm cable and a 1.2m 3.5mm-to-3.5mm cable.

Over-Ear Memory Foam Design
Sealed over-ear earcups with memory foam pads provide comfort and improved sound isolation.

Integrated Microphone
Suitable for calls, gaming and voice chat on compatible devices.

Professional DJ & Studio Monitoring
Designed for DJ monitoring, studio work, mixing and recording.

Package Contents
Studio DJ Headphone, 2.6m 3.5mm-to-6.3mm cable, 1.2m 3.5mm-to-3.5mm cable, pouch and OneOdio retail box.','pro-audio',349,349,true,4) returning id into product_uuid;
 insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product04-main.jpg',true,0);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product04-01.jpg',false,1);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product04-02.jpg',false,2);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product04-03.jpg',false,3);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product04-04.jpg',false,4);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product04-05.jpg',false,5);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/proaudio/product04-video.mp4',false,6);
end if;
if not exists(select 1 from public.electroshop_products where sku='ELECTRO-005') then
 insert into public.electroshop_products(sku,name_he,name_en,description_he,description_en,category,regular_price_ils,price_ils,featured,sort_order)
 values('ELECTRO-005','תושבת מגנטית לרכב','Magnetic car mount','מעמד מגנטי איכותי לרכב עם נעילה אחורית חזקה, מגנטים עוצמתיים, סיבוב 360° ותופסן כבל.','Magnetic car mount with rear lock, 360 degree rotation and cable clip.','car-mounts',89,89,false,5) returning id into product_uuid;
 insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/heb01.jpg',true,0);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/heb02.jpg',false,1);
insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order) values(product_uuid,'images/heb03.jpg',false,2);
end if;
end $seed$;

notify pgrst, 'reload schema';
commit;
