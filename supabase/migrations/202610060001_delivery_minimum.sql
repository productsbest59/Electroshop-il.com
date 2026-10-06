begin;

-- Only Electroshop orders are affected. No existing orders/products are rewritten.
-- Order creators insert a temporary subtotal=0, then calculate prices in the DB.
-- A deferred trigger validates the final saved row at transaction commit, so the
-- check uses authoritative product/variant prices for Bit, PayPal and Tranzila.
create or replace function public.electroshop_validate_delivery_minimum()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare final_order public.electroshop_orders%rowtype;
begin
  if TG_OP = 'UPDATE' then
    -- Old orders may still be marked paid/preparing/collected without applying
    -- the new minimum retroactively. Only financial/delivery changes recheck it.
    if NEW.subtotal is not distinct from OLD.subtotal
       and NEW.total is not distinct from OLD.total
       and NEW.fulfillment_method is not distinct from OLD.fulfillment_method then
      return null;
    end if;
  end if;
  select * into final_order from public.electroshop_orders where id=NEW.id;
  if not found then return null; end if;
  if final_order.fulfillment_method='shipping' and final_order.subtotal < 100 then
    raise exception 'בהזמנה מתחת ל-100 ₪ ניתן לבחור איסוף עצמי.';
  end if;
  if final_order.fulfillment_method='shipping' and exists (
    select 1 from public.electroshop_order_items i
    join public.electroshop_products p on p.id=i.product_id
    where i.order_id=final_order.id and (
      p.pickup_only or p.category='guitars' or 'guitars'=any(p.categories)
      or exists (select 1 from public.electroshop_categories c
        where (c.slug='guitars' or 'guitars'=any(c.aliases)) and c.slug=any(p.categories))
    )
  ) then
    raise exception 'העגלה כוללת גיטרה או מוצר באיסוף עצמי בלבד. יש לבחור איסוף עצמי.';
  end if;
  return null;
end;
$$;
revoke all on function public.electroshop_validate_delivery_minimum() from public,anon,authenticated;
drop trigger if exists electroshop_delivery_minimum on public.electroshop_orders;
create constraint trigger electroshop_delivery_minimum
after insert or update on public.electroshop_orders
deferrable initially deferred for each row
execute function public.electroshop_validate_delivery_minimum();

commit;
