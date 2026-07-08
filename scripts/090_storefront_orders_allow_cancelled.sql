-- Allow storefront orders to be cancelled.
-- Production previously only allowed: Pending, Processing, Completed
-- which caused storefront_orders_status_check violations on cancel.

alter table public.storefront_orders
  drop constraint if exists storefront_orders_status_check;

alter table public.storefront_orders
  add constraint storefront_orders_status_check
  check (
    status in (
      'Pending',
      'Processing',
      'Completed',
      'Cancelled',
      'Canceled',
      'pending',
      'processing',
      'completed',
      'cancelled',
      'canceled'
    )
  );
