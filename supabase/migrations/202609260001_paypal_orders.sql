begin;
alter table public.electroshop_orders add column if not exists paypal_checkout_id uuid;
create unique index if not exists electroshop_paypal_checkout_unique on public.electroshop_orders(paypal_checkout_id) where paypal_checkout_id is not null;
CREATE OR REPLACE FUNCTION public.create_electroshop_paypal_order(p_customer jsonb, p_items jsonb, p_request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
 v_existing public.electroshop_orders%rowtype; v_id uuid; v_number text; v_item jsonb; v_product public.electroshop_products%rowtype;
 v_quantity integer; v_price numeric(12,2); v_total numeric(12,2):=0; v_shipping numeric(12,2):=0;
 v_method text:=p_customer->>'fulfillmentMethod'; v_options jsonb; v_key text; v_expected boolean; v_variant jsonb;
begin

 if p_request_id is null then raise exception 'מזהה בקשה חסר'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 select * into v_existing from public.electroshop_orders where paypal_checkout_id=p_request_id;
 if found then return jsonb_build_object('id',v_existing.id,'order_number',v_existing.order_number,'total_ils',v_existing.total,'shipping_ils',v_existing.shipping_amount,'payment_status',v_existing.payment_status); end if;
 if v_method is null or v_method not in ('pickup','shipping') then raise exception 'יש לבחור איסוף עצמי או משלוח'; end if;
 if jsonb_typeof(p_items) is distinct from 'array' then raise exception 'סל לא תקין'; end if;
 if jsonb_array_length(p_items) not between 1 and 100 then raise exception 'סל לא תקין'; end if;
 if coalesce(trim(p_customer->>'fullName'),'')='' or coalesce(trim(p_customer->>'phone'),'')='' or coalesce(p_customer->>'email','') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'יש להשלים פרטי לקוח תקינים'; end if;
 if v_method='shipping' then
   if coalesce(trim(p_customer->>'city'),'')='' or coalesce(trim(p_customer->>'address'),'')='' then raise exception 'יש להשלים כתובת למשלוח'; end if;
   v_shipping:=0;
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
   if v_method='shipping' and ((exists(select 1 from public.electroshop_categories c where (c.slug='smartphones' or 'smartphones'=any(c.aliases)) and c.slug=any(v_product.categories))) or v_product.sku like 'PELEPHONE-%') then v_shipping:=50; end if;
   if v_product.pickup_only and v_method<>'pickup' then raise exception 'המוצר זמין באיסוף עצמי בלבד'; end if;
   v_options:=jsonb_build_object('color',coalesce(v_item->>'color',''),'size',coalesce(v_item->>'size',''),'style',coalesce(v_item->>'style',''));
   foreach v_key in array array['color','size','style'] loop
     select exists(select 1 from public.electroshop_product_options where product_id=v_product.id and option_type=v_key and active) into v_expected;
     if (v_expected and not exists(select 1 from public.electroshop_product_options where product_id=v_product.id and option_type=v_key and active and value_he=v_options->>v_key)) or (not v_expected and v_options->>v_key<>'') then raise exception 'יש לבחור אפשרות מוצר תקינה'; end if;
   end loop;
   v_price:=v_product.price_ils;
   select value into v_variant from jsonb_array_elements(v_product.variants) where coalesce(value->>'color','')=v_options->>'color' and coalesce(value->>'size','')=v_options->>'size' and coalesce(value->>'style','')=v_options->>'style' limit 1;
   if v_variant->>'price' is not null and v_variant->>'price'<>'' then v_price:=(v_variant->>'price')::numeric; end if;
   if v_product.sku like 'PELEPHONE-%' and coalesce(v_variant->>'available','false') <> 'true' then raise exception 'האפשרות שנבחרה אינה זמינה'; end if;
   if v_price<0 then raise exception 'מחיר מוצר לא תקין'; end if;
   insert into public.electroshop_order_items(order_id,product_id,sku,product_name_he,product_name_en,unit_price,quantity,selected_options,primary_image_path)
   values(v_id,v_product.id,v_product.sku,v_product.name_he,v_product.name_en,v_price,v_quantity,v_options,coalesce((select storage_path from public.electroshop_product_images where product_id=v_product.id order by is_primary desc,sort_order limit 1),''));
   v_total:=v_total+v_price*v_quantity;
 end loop;
 update public.electroshop_orders set subtotal=v_total,shipping_amount=v_shipping,total=v_total+v_shipping,payment_provider='paypal',paypal_checkout_id=p_request_id where id=v_id;
 return jsonb_build_object('id',v_id,'order_number',v_number,'total_ils',v_total+v_shipping,'shipping_ils',v_shipping,'fulfillment_method',v_method,'payment_status','pending');
end;$function$;


revoke all on function public.create_electroshop_paypal_order(jsonb,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.create_electroshop_paypal_order(jsonb,jsonb,uuid) to service_role;
commit;

