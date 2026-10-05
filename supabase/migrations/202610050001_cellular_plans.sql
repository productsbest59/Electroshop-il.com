begin;
-- Separate catalogue: no changes to products, orders, articles or existing permissions.
create table public.electroshop_cellular_catalogues (
  provider text primary key check (provider in ('pelephone','partner','019')),
  checked_at timestamptz not null,
  updated_at timestamptz not null default now(),
  plans jsonb not null check (jsonb_typeof(plans) = 'array')
);
create table public.electroshop_cellular_proposals (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('pelephone','partner','019')),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  checked_at timestamptz not null,
  base_updated_at timestamptz,
  plans jsonb not null check (jsonb_typeof(plans) = 'array')
);
alter table public.electroshop_cellular_catalogues enable row level security;
alter table public.electroshop_cellular_proposals enable row level security;
create policy "Public sanitized cellular catalogue" on public.electroshop_cellular_catalogues for select to anon, authenticated using (true);
create policy "Admin reads own cellular proposals" on public.electroshop_cellular_proposals for select to authenticated using (created_by = auth.uid() and public.is_electroshop_admin());
create policy "Admin creates cellular proposals" on public.electroshop_cellular_proposals for insert to authenticated with check (created_by = auth.uid() and public.is_electroshop_admin());
revoke all on public.electroshop_cellular_catalogues, public.electroshop_cellular_proposals from anon, authenticated;
grant select on public.electroshop_cellular_catalogues to anon, authenticated;
grant select, insert on public.electroshop_cellular_proposals to authenticated;

-- Validate a strict public-field allowlist before anything becomes public.
create function public.electroshop_validate_cellular_plans(p_plans jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare p jsonb; field text; value jsonb; item jsonb; seen text[] := '{}';
begin
  if jsonb_typeof(p_plans) <> 'array' or jsonb_array_length(p_plans) not between 1 and 60 or octet_length(p_plans::text) > 350000 then return false; end if;
  for p in select * from jsonb_array_elements(p_plans) loop
    if jsonb_typeof(p) <> 'object' or not p ?& array['id','name','data','price','priceTerms','priceSummary','features','terms','warnings'] then return false; end if;
    for field in select jsonb_object_keys(p) loop
      if field not in ('id','name','data','price','priceTerms','priceSummary','features','terms','warnings') then return false; end if;
    end loop;
    for field in select unnest(array['id','name','data','priceTerms','priceSummary']) loop
      if jsonb_typeof(p->field) <> 'string' or length(p->>field) not between 1 and 5000 then return false; end if;
    end loop;
    if (p->>'id') = any(seen) then return false; end if;
    seen := array_append(seen,p->>'id');
    if jsonb_typeof(p->'price') <> 'number' or (p->>'price')::numeric <= 0 or (p->>'price')::numeric > 1000 then return false; end if;
    for field in select unnest(array['features','terms','warnings']) loop
      value := p->field;
      if jsonb_typeof(value) <> 'array' or jsonb_array_length(value) > 30 then return false; end if;
      for item in select * from jsonb_array_elements(value) loop
        if jsonb_typeof(item) <> 'string' or length(item #>> '{}') > 3000 then return false; end if;
      end loop;
    end loop;
    if p::text ~* '(https?://|retailcode|dealercode|<script|<iframe|<img)' then return false; end if;
  end loop;
  return true;
exception when others then return false;
end;
$$;
create function public.electroshop_publish_cellular(p_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare proposal public.electroshop_cellular_proposals; current_version timestamptz;
begin
  if auth.uid() is null or not public.is_electroshop_admin() then raise exception 'Admin access required'; end if;
  select * into proposal from public.electroshop_cellular_proposals where id=p_id and created_by=auth.uid();
  if not found or proposal.created_at < now()-interval '2 hours' then raise exception 'Proposal missing or expired; sync again'; end if;
  perform pg_advisory_xact_lock(hashtextextended('electroshop_cellular:'||proposal.provider,0));
  select updated_at into current_version from public.electroshop_cellular_catalogues where provider=proposal.provider;
  if current_version is distinct from proposal.base_updated_at then raise exception 'Catalogue changed; sync again before publishing'; end if;
  if not public.electroshop_validate_cellular_plans(proposal.plans) then raise exception 'Invalid public catalogue'; end if;
  insert into public.electroshop_cellular_catalogues(provider, checked_at, plans)
  values(proposal.provider,proposal.checked_at,proposal.plans)
  on conflict(provider) do update set plans=excluded.plans, checked_at=excluded.checked_at, updated_at=now();
  delete from public.electroshop_cellular_proposals where id=proposal.id;
  return jsonb_build_object('provider',proposal.provider,'count',jsonb_array_length(proposal.plans));
end;
$$;
revoke all on function public.electroshop_validate_cellular_plans(jsonb) from public, anon, authenticated;
revoke all on function public.electroshop_publish_cellular(uuid) from public, anon;
grant execute on function public.electroshop_publish_cellular(uuid) to authenticated;
commit;
