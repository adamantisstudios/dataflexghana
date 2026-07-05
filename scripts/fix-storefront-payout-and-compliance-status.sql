-- One-time cleanup for storefront Referral Hub payout requests.
-- Run this after deploying the code fix if agents requested storefront payouts
-- before this change. It restores pending storefront payout amounts that the old
-- endpoint deducted immediately, then marks those withdrawal rows as restored.

alter table if exists public.withdrawals
  add column if not exists source text;

update public.withdrawals
set source = 'storefront'
where source is distinct from 'storefront'
  and coalesce(admin_notes, '') ilike '%source:storefront%';

with to_restore as (
  select
    agent_id,
    sum(coalesce(amount, 0)) as amount_to_restore
  from public.withdrawals
  where source = 'storefront'
    and status in ('requested', 'pending', 'processing')
    and coalesce(admin_notes, '') ilike '%source:storefront%'
    and coalesce(admin_notes, '') not ilike '%balance_restored_20260705%'
  group by agent_id
),
updated_profiles as (
  update public.agent_store_profiles p
  set storefront_commission_balance = coalesce(p.storefront_commission_balance, 0) + r.amount_to_restore
  from to_restore r
  where p.agent_id = r.agent_id
  returning p.agent_id
),
inserted_profiles as (
  insert into public.agent_store_profiles (agent_id, storefront_commission_balance)
  select r.agent_id, r.amount_to_restore
  from to_restore r
  where not exists (
    select 1 from updated_profiles u where u.agent_id = r.agent_id
  )
  on conflict (agent_id) do nothing
  returning agent_id
)
update public.withdrawals w
set admin_notes = trim(both ' ' from coalesce(w.admin_notes, '') || ' | balance_restored_20260705')
where w.source = 'storefront'
  and w.status in ('requested', 'pending', 'processing')
  and coalesce(w.admin_notes, '') ilike '%source:storefront%'
  and coalesce(w.admin_notes, '') not ilike '%balance_restored_20260705%';

-- Required for the admin Compliance tab Cancel action.
-- Production currently rejects "Cancelled" with:
--   form_submissions_status_check violation
alter table if exists public.form_submissions
  drop constraint if exists form_submissions_status_check;

alter table if exists public.form_submissions
  add constraint form_submissions_status_check
  check (
    status in (
      'Pending',
      'Processing',
      'Completed',
      'Delivered',
      'Cancelled',
      'Canceled',
      'pending',
      'processing',
      'completed',
      'delivered',
      'cancelled',
      'canceled'
    )
  );

-- Optional safety for storefront compliance submissions if that table has a
-- status check constraint in production.
do $$
declare
  constraint_name text;
begin
  select c.conname into constraint_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'storefront_compliance_submissions'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%status%'
  limit 1;

  if constraint_name is not null then
    execute format(
      'alter table public.storefront_compliance_submissions drop constraint %I',
      constraint_name
    );
  end if;

  if to_regclass('public.storefront_compliance_submissions') is not null then
    execute 'alter table public.storefront_compliance_submissions
      drop constraint if exists storefront_compliance_submissions_status_check';
    execute 'alter table public.storefront_compliance_submissions
      add constraint storefront_compliance_submissions_status_check
      check (status in (''pending'', ''processing'', ''completed'', ''cancelled'', ''canceled'', ''rejected''))';
  end if;
end $$;
