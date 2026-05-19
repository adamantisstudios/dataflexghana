/** Dispatched when a storefront Paystack order is captured (client confirm fallback). */
export const STOREFRONT_ORDERS_CHANGED_EVENT = "storefront-orders-changed"

export function dispatchStorefrontOrdersChanged(detail: {
  agentId: string
  reference?: string
}) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(STOREFRONT_ORDERS_CHANGED_EVENT, { detail }))
}
