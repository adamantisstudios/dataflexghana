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

-- Optional safety if your database has no status constraint:
-- The code now uses 'cancelled' for storefront compliance submissions and
-- 'Cancelled' for main compliance form submissions.
