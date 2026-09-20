begin;
alter table public.electroshop_products add column if not exists categories text[] not null default '{}';
alter table public.electroshop_categories add column if not exists aliases text[] not null default '{}';
update public.electroshop_products set categories=array[category] where cardinality(categories)=0 and coalesce(category,'')<>'';

create or replace function public.electroshop_normalize_categories() returns trigger language plpgsql set search_path=public as $$
declare selected text[]; primary_slug text;
begin
  if TG_OP='UPDATE' and new.categories is not distinct from old.categories and new.category is distinct from old.category then
    new.categories:=array_remove(new.categories,old.category);
  end if;
  select coalesce(c.slug,new.category) into primary_slug from (select 1) dummy left join electroshop_categories c on c.slug=new.category or new.category=any(c.aliases);
  select coalesce(array_agg(distinct slug order by slug),'{}') into selected from (
    select coalesce(c.slug,x) slug from unnest(coalesce(new.categories,'{}')||array[primary_slug]) x
    left join electroshop_categories c on c.slug=x or x=any(c.aliases) where coalesce(x,'')<>''
  ) s;
  new.categories:=selected; new.category:=coalesce(nullif(primary_slug,''),selected[1],'');
  return new;
end $$;
drop trigger if exists electroshop_product_categories on public.electroshop_products;
create trigger electroshop_product_categories before insert or update of category,categories on public.electroshop_products for each row execute function public.electroshop_normalize_categories();

create or replace function public.electroshop_category_aliases() returns trigger language plpgsql set search_path=public as $$
begin
  perform pg_advisory_xact_lock(824701);
  if exists(select 1 from electroshop_categories c where (TG_OP='INSERT' or c.slug<>old.slug) and (c.slug=new.slug or new.slug=any(c.aliases))) then
    raise exception 'מזהה הקטגוריה כבר בשימוש. יש לבחור מזהה אחר.';
  end if;
  if TG_OP='UPDATE' then
    new.aliases:=old.aliases;
    if new.slug<>old.slug then new.aliases:=array_remove(array_append(old.aliases,old.slug),new.slug); end if;
  else new.aliases:='{}'; end if;
  return new;
end $$;
drop trigger if exists electroshop_category_aliases on public.electroshop_categories;
create trigger electroshop_category_aliases before insert or update on public.electroshop_categories for each row execute function public.electroshop_category_aliases();

create or replace function public.electroshop_reassign_category() returns trigger language plpgsql set search_path=public as $$
begin
  if new.slug<>old.slug then
    update electroshop_products set category=case when category=old.slug then new.slug else category end,
      categories=array_replace(categories,old.slug,new.slug)
      where category=old.slug or old.slug=any(categories);
  end if;
  return new;
end $$;
drop trigger if exists electroshop_category_reassign on public.electroshop_categories;
create trigger electroshop_category_reassign after update of slug on public.electroshop_categories for each row execute function public.electroshop_reassign_category();
-- Delivery eligibility follows category membership, including renamed device categories.
do $$
declare f record; definition text;
begin
  for f in select oid from pg_proc where pronamespace='public'::regnamespace and proname='create_electroshop_bit_order' loop
    definition:=pg_get_functiondef(f.oid);
    definition:=replace(definition,'v_product.category=''smartphones''',
      '(exists(select 1 from public.electroshop_categories c where (c.slug=''smartphones'' or ''smartphones''=any(c.aliases)) and c.slug=any(v_product.categories)))');
    execute definition;
  end loop;
end $$;
notify pgrst,'reload schema';
commit;
