export const GROCERY_STATUSES = [
  "new_request",
  "reviewing",
  "contacted_customer",
  "awaiting_payment",
  "processing",
  "delivered",
  "cancelled",
] as const

export type GroceryRequestStatus = (typeof GROCERY_STATUSES)[number]

export const GROCERY_STATUS_LABELS: Record<GroceryRequestStatus, string> = {
  new_request: "New request",
  reviewing: "Reviewing",
  contacted_customer: "Contacted customer",
  awaiting_payment: "Awaiting payment",
  processing: "Processing",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

export interface GroceryRequest {
  id: string
  full_name: string
  phone: string
  whatsapp: string | null
  email: string | null
  address: string | null
  landmark: string | null
  delivery_time: string | null
  shopping_list: string
  attachments: string[]
  notes: string | null
  status: GroceryRequestStatus
  estimated_price: number | null
  delivery_fee: number | null
  admin_notes: string | null
  paystack_reference: string | null
  created_at: string
}

export interface GroceryRequestFormPayload {
  full_name: string
  phone: string
  whatsapp?: string
  email?: string
  address?: string
  landmark?: string
  delivery_time?: string
  shopping_list: string
  attachments?: string[]
  notes?: string
  paystack_reference: string
}
