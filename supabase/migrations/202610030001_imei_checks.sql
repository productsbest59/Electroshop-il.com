begin;

create table if not exists public.electroshop_imei_checks (
  id uuid primary key default gen_random_uuid(),
  public_token uuid not null default gen_random_uuid() unique,
  request_id uuid unique,
  identifier text not null,
  identifier_last4 text not null,
  customer_name text,
  customer_email text,
  check_type text not null check (check_type in ('basic','full','gsx')),
  amount_ils numeric(10,2) not null default 0 check (amount_ils >= 0),
  payment_status text not null default 'not_required' check (payment_status in ('not_required','pending','paid','failed')),
  payment_request_id text,
  payment_transaction_id text,
  payment_response_code text,
  check_status text not null default 'pending' check (check_status in ('pending','processing','completed','failed')),
  report jsonb,
  error_message text,
  request_ip_hash text,
  email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create unique index if not exists electroshop_imei_payment_request_unique
  on public.electroshop_imei_checks(payment_request_id)
  where payment_request_id is not null;
create index if not exists electroshop_imei_checks_ip_created_idx
  on public.electroshop_imei_checks(request_ip_hash,created_at desc);
create index if not exists electroshop_imei_checks_email_created_idx
  on public.electroshop_imei_checks(customer_email,created_at desc);

alter table public.electroshop_imei_checks enable row level security;
revoke all on table public.electroshop_imei_checks from public, anon, authenticated;
grant all on table public.electroshop_imei_checks to service_role;

commit;
