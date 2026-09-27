alter table public.electroshop_orders
  add column if not exists customer_email_claimed_at timestamptz,
  add column if not exists customer_email_sent_at timestamptz,
  add column if not exists customer_email_message_id text,
  add column if not exists customer_email_error text;
