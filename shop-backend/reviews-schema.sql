-- Review selection is private. Only the authenticated Edge Function uses service_role.
-- Google review text is never persisted; only selected review IDs are saved.
create table if not exists public.electroshop_review_selection (
 id boolean primary key default true check(id),
 review_ids jsonb not null default '[]'::jsonb check(jsonb_typeof(review_ids)='array'),
 updated_at timestamptz not null default now()
);
alter table public.electroshop_review_selection enable row level security;
revoke all on public.electroshop_review_selection from anon, authenticated;
grant all on public.electroshop_review_selection to service_role;
insert into public.electroshop_review_selection(id) values(true) on conflict do nothing;