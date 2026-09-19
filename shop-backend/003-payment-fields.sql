begin;

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

commit;
