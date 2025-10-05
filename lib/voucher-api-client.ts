/**
 * Voucher API Client with Production-Ready Fallback System
 *
 * This client handles the complex authentication and fallback logic
 * for voucher products and orders, ensuring reliability in production.
 */

interface VoucherProduct {
  id: string
  title: string
  description: string
  image_url: string
  price: number
  quantity: number
  status: "published" | "hidden" | "out_of_stock"
  created_at: string
}

interface ApiResponse<T> {
  success?: boolean
  products?: T[]
  orders?: T[]
  error?: string
  total?: number
}

export class VoucherApiClient {
  private static instance: VoucherApiClient
  private baseUrl: string

  constructor() {
    this.baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  }

  static getInstance(): VoucherApiClient {
    if (!VoucherApiClient.instance) {
      VoucherApiClient.instance = new VoucherApiClient()
    }
    return VoucherApiClient.instance
  }

  /**
   * Fetch voucher products with multiple fallback endpoints
   */
  async fetchProducts(): Promise<VoucherProduct[]> {
    console.log("🛒 VoucherApiClient: Fetching products...")

    // Get agent authentication data
    const agentData = this.getAgentData()
    if (!agentData) {
      throw new Error("Agent not authenticated")
    }

    const authToken = btoa(agentData)

    // Define API endpoints in order of preference
    const endpoints = [
      {
        url: "/api/agent/voucher/products",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        name: "Primary (Authenticated)",
      },
      {
        url: "/api/agents/voucher/products",
        headers: {
          "Content-Type": "application/json",
        },
        name: "Fallback (Simple)",
      },
    ]

    let lastError: Error | null = null

    // Try each endpoint
    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Trying ${endpoint.name}: ${endpoint.url}`)

        const response = await fetch(endpoint.url, {
          method: "GET",
          headers: endpoint.headers,
          cache: "no-cache",
          // Add timeout for production
          signal: AbortSignal.timeout(10000), // 10 second timeout
        })

        console.log(`📡 Response from ${endpoint.name}:`, response.status)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          console.error(`❌ Error from ${endpoint.name}:`, errorData)
          lastError = new Error(errorData.error || `HTTP ${response.status}`)
          continue
        }

        const result: ApiResponse<VoucherProduct> = await response.json()
        console.log(`✅ Success from ${endpoint.name}:`, result)

        // Handle different response formats
        let products: VoucherProduct[] = []

        if (result.success !== undefined) {
          // Format from authenticated endpoint
          if (!result.success) {
            lastError = new Error(result.error || "Failed to load products")
            continue
          }
          products = result.products || []
        } else if (result.products !== undefined) {
          // Format from simple endpoint
          products = result.products || []
        } else if (Array.isArray(result)) {
          // Direct array response
          products = result as VoucherProduct[]
        } else {
          lastError = new Error("Unexpected response format")
          continue
        }

        console.log(`✅ Successfully loaded ${products.length} products from ${endpoint.name}`)
        return products
      } catch (error) {
        console.error(`❌ Network error with ${endpoint.name}:`, error)
        lastError = error instanceof Error ? error : new Error("Network error")
        continue
      }
    }

    console.log("🔄 All endpoints failed, returning empty array")
    return []
  }

  /**
   * Fetch voucher orders
   */
  async fetchOrders(): Promise<any[]> {
    console.log("📦 VoucherApiClient: Fetching orders...")

    const agentData = this.getAgentData()
    if (!agentData) {
      throw new Error("Agent not authenticated")
    }

    const authToken = btoa(agentData)

    try {
      const response = await fetch("/api/agent/voucher/orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        cache: "no-cache",
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result: ApiResponse<any> = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to load orders")
      }

      return result.orders || []
    } catch (error) {
      console.error("❌ Error fetching orders:", error)
      // Return empty array for orders if failed
      return []
    }
  }

  /**
   * Create a new voucher order
   */
  async createOrder(orderData: any): Promise<any> {
    console.log("🛍️ VoucherApiClient: Creating order...")

    const agentData = this.getAgentData()
    if (!agentData) {
      throw new Error("Agent not authenticated")
    }

    const authToken = btoa(agentData)

    const response = await fetch("/api/agent/voucher/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        product_id: orderData.product_id,
        quantity: orderData.quantity,
        payment_reference: orderData.payment_reference,
        payment_number: "0557943392",
        delivery_method: orderData.delivery_method,
        delivery_contact: orderData.delivery_contact,
      }),
      signal: AbortSignal.timeout(15000), // 15 second timeout for orders
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || "Failed to create order")
    }

    return result
  }

  /**
   * Get agent data from localStorage
   */
  private getAgentData(): string | null {
    if (typeof window === "undefined") {
      return null
    }

    return localStorage.getItem("agent")
  }
}

// Export singleton instance
export const voucherApiClient = VoucherApiClient.getInstance()
