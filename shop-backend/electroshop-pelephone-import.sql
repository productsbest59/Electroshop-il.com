begin;
alter table public.electroshop_products add column if not exists source_url text;
alter table public.electroshop_products add column if not exists source_synced_at timestamptz;
create or replace function public.electroshop_import_device(p jsonb) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare pid uuid; existed boolean; v jsonb; n integer:=0;
begin
 if not public.is_electroshop_admin() then raise exception 'אין הרשאת מנהל'; end if;
 if p->>'sku' !~ '^PELEPHONE-[0-9]+$' or jsonb_array_length(p->'variants')<1 or jsonb_array_length(p->'images')<1 or (p->>'price')::numeric<=0 then raise exception 'נתוני ייבוא לא תקינים'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p->>'sku',0));
 select id into pid from public.electroshop_products where sku=p->>'sku';existed:=found;
 insert into public.electroshop_products(sku,name_he,name_en,description_he,description_en,category,regular_price_ils,price_ils,variants,source_url,source_synced_at)
 values(p->>'sku',p->>'name_he',p->>'name_en',p->>'description_he',p->>'description_en','smartphones',(p->>'price')::numeric,(p->>'price')::numeric,p->'variants',p->>'source_url',now())
 on conflict(sku) do update set name_he=excluded.name_he,name_en=excluded.name_en,description_he=excluded.description_he,description_en=excluded.description_en,regular_price_ils=excluded.regular_price_ils,price_ils=excluded.price_ils,variants=excluded.variants,source_url=excluded.source_url,source_synced_at=excluded.source_synced_at
 returning id into pid;
 delete from public.electroshop_product_images where product_id=pid;
 for v in select value from jsonb_array_elements(p->'images') loop
 insert into public.electroshop_product_images(product_id,storage_path,is_primary,sort_order,color_value) values(pid,v->>'url',n=0,n,v->>'color');n:=n+1;
 end loop;
 delete from public.electroshop_product_options where product_id=pid;
 insert into public.electroshop_product_options(product_id,option_type,value_he,value_en)
 select distinct pid,k,value->>k,value->>k from jsonb_array_elements(p->'variants') cross join unnest(array['color','size']) k where coalesce(value->>k,'')<>'';
 return jsonb_build_object('status',case when existed then 'updated' else 'added' end,'id',pid);
end $$;
revoke all on function public.electroshop_import_device(jsonb) from public;
grant execute on function public.electroshop_import_device(jsonb) to authenticated;
create or replace function public.electroshop_validate_device_order_item() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
declare p public.electroshop_products%rowtype; v jsonb;
begin
 select * into p from public.electroshop_products where id=new.product_id;
 if p.sku like 'PELEPHONE-%' then
 select value into v from jsonb_array_elements(p.variants) where coalesce(value->>'color','')=coalesce(new.selected_options->>'color','') and coalesce(value->>'size','')=coalesce(new.selected_options->>'size','') and coalesce(value->>'style','')=coalesce(new.selected_options->>'style','') limit 1;
 if v is null or coalesce((v->>'available')::boolean,false)=false then raise exception 'שילוב הצבע והנפח אינו זמין כרגע'; end if;
 if new.unit_price<>(v->>'price')::numeric then raise exception 'מחיר המכשיר השתנה, יש לרענן את העגלה';end if;
 end if;return new;
end $$;
drop trigger if exists electroshop_device_order_validation on public.electroshop_order_items;
create trigger electroshop_device_order_validation before insert on public.electroshop_order_items for each row execute function public.electroshop_validate_device_order_item();
insert into public.electroshop_categories(slug,name_he,name_en,description_he,description_en,sort_order,active)
values('smartphones','מכשירים','Devices','מכשירי פלאפון — בחרו נפח אחסון וצבע','Pelephone devices — choose storage and colour',7,true) on conflict(slug) do nothing;
commit;
