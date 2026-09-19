begin;
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
commit;
