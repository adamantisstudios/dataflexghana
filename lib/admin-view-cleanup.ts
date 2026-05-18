/** Admin UI-only cleanup: hides records from dashboard views without deleting from DB */

const HIDDEN_DATA_ORDERS_KEY = "admin_hidden_data_orders"
const HIDDEN_DATA_ORDERS_LOG_KEY = "admin_hidden_data_orders_log"

function readHiddenSet(storageKey: string): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((id): id is string => typeof id === "string" && id.length > 0))
  } catch {
    return new Set()
  }
}

function writeHiddenSet(storageKey: string, ids: Set<string>): void {
  if (typeof window === "undefined") return
  localStorage.setItem(storageKey, JSON.stringify([...ids]))
}

export function getHiddenDataOrderIds(): Set<string> {
  return readHiddenSet(HIDDEN_DATA_ORDERS_KEY)
}

export function hideDataOrderIds(orderIds: string[]): void {
  if (!orderIds.length) return
  const hidden = getHiddenDataOrderIds()
  for (const id of orderIds) hidden.add(id)
  writeHiddenSet(HIDDEN_DATA_ORDERS_KEY, hidden)
}

export function filterVisibleDataOrders<T extends { id: string }>(orders: T[]): T[] {
  const hidden = getHiddenDataOrderIds()
  if (hidden.size === 0) return orders
  return orders.filter((o) => !hidden.has(o.id))
}

export function getHiddenDataOrdersLogIds(): Set<string> {
  return readHiddenSet(HIDDEN_DATA_ORDERS_LOG_KEY)
}

export function hideDataOrdersLogIds(logIds: string[]): void {
  if (!logIds.length) return
  const hidden = getHiddenDataOrdersLogIds()
  for (const id of logIds) hidden.add(id)
  writeHiddenSet(HIDDEN_DATA_ORDERS_LOG_KEY, hidden)
}

export function filterVisibleDataOrdersLog<T extends { id: string }>(entries: T[]): T[] {
  const hidden = getHiddenDataOrdersLogIds()
  if (hidden.size === 0) return entries
  return entries.filter((e) => !hidden.has(e.id))
}
