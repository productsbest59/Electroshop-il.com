begin;
create sequence if not exists public.electroshop_order_number_seq start with 1001;
revoke all on sequence public.electroshop_order_number_seq from public, anon, authenticated;
do $$
declare f record; old_expression text := 'v_number:=''ES-''||to_char(now(),''YYMMDD'')||''-''||upper(substr(replace(gen_random_uuid()::text,''-'',''''),1,8));'; definition text; changed integer:=0; existing_max bigint;
begin
 select max(substring(order_number from '^ES-([0-9]+)$')::bigint) into existing_max from public.electroshop_orders where order_number ~ '^ES-[0-9]+$';
 if existing_max is not null then perform setval('public.electroshop_order_number_seq',greatest(existing_max,(select last_value from public.electroshop_order_number_seq)),true); end if;
 for f in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f' and p.proname like '%electroshop%' and position(old_expression in p.prosrc)>0 loop
  definition:=pg_get_functiondef(f.oid);
  execute replace(definition,old_expression,'v_number:=''ES-''||nextval(''public.electroshop_order_number_seq'')::text;');
  changed:=changed+1;
 end loop;
 if changed=0 then raise exception 'No matching order generators found'; end if;
end $$;
commit;
