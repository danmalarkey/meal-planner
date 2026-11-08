begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.billing_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  stripe_product_id text,
  stripe_price_id text,
  stripe_subscription_status text,
  billing_interval text check (billing_interval is null or billing_interval in ('day', 'week', 'month', 'year')),
  price_unit_amount bigint check (price_unit_amount is null or price_unit_amount >= 0),
  price_currency text check (price_currency is null or price_currency ~ '^[a-z]{3}$'),
  cancel_at_period_end boolean not null default false,
  scheduled_cancel_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger billing_accounts_set_updated_at
before update on public.billing_accounts
for each row execute function public.set_updated_at();

alter table public.billing_accounts enable row level security;
alter table public.billing_accounts force row level security;

create policy billing_accounts_select_own
on public.billing_accounts for select to authenticated
using (user_id = auth.uid());

revoke all on table public.billing_accounts from public, anon;
grant select on table public.billing_accounts to authenticated;

create table public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  stripe_created_at timestamptz not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;
alter table public.stripe_webhook_events force row level security;
revoke all on table public.stripe_webhook_events from public, anon, authenticated;

create table public.billing_checkout_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  attempt_token uuid not null unique,
  billing_interval text not null check (billing_interval in ('month', 'year')),
  stripe_checkout_session_id text unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.billing_checkout_attempts enable row level security;
alter table public.billing_checkout_attempts force row level security;
revoke all on table public.billing_checkout_attempts from public, anon, authenticated;

create or replace function public.claim_billing_checkout(
  p_user_id uuid,
  p_attempt_token uuid,
  p_billing_interval text,
  p_expires_at timestamptz
)
returns table (
  claimed boolean,
  attempt_token uuid,
  billing_interval text,
  stripe_checkout_session_id text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  claimed_attempt public.billing_checkout_attempts%rowtype;
begin
  if p_billing_interval not in ('month', 'year') or p_expires_at <= now() then
    raise exception 'Invalid billing checkout claim';
  end if;

  insert into public.billing_checkout_attempts (user_id, attempt_token, billing_interval, expires_at)
  values (p_user_id, p_attempt_token, p_billing_interval, p_expires_at)
  on conflict (user_id) do update
    set attempt_token = excluded.attempt_token,
        billing_interval = excluded.billing_interval,
        stripe_checkout_session_id = null,
        expires_at = excluded.expires_at,
        created_at = now()
    where public.billing_checkout_attempts.expires_at <= now()
  returning * into claimed_attempt;

  if claimed_attempt.user_id is not null then
    return query select true, claimed_attempt.attempt_token, claimed_attempt.billing_interval,
      claimed_attempt.stripe_checkout_session_id, claimed_attempt.expires_at;
    return;
  end if;

  return query
  select false, attempt.attempt_token, attempt.billing_interval,
    attempt.stripe_checkout_session_id, attempt.expires_at
  from public.billing_checkout_attempts attempt
  where attempt.user_id = p_user_id;
end;
$$;

revoke all on function public.claim_billing_checkout(uuid, uuid, text, timestamptz)
from public, anon, authenticated;
grant execute on function public.claim_billing_checkout(uuid, uuid, text, timestamptz)
to service_role;

commit;
