import { supabase } from "./supabase"
import { getStoredAdmin } from "./auth"

// Wholesale Product Types
export interface ProductVariant {
  type: string
  values: string[]
}

export interface WholesaleProduct {
  id: string
  name: string
  description: string
  category: string
  price: number
  quantity: number
  delivery_time: string
  commission_value: number
  image_urls: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
  created_by_name?: string
  submitted_by_agent_id?: string
  variants?: ProductVariant[] | string | null
  variant_metadata?: Record<string, unknown> | null
}

export interface WholesaleOrder {
  id: string
  agent_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_amount: number
  commission_per_item: number
  commission_amount: number
  payment_method: "wallet" | "manual"
  payment_reference?: string
  delivery_address: string
  delivery_phone: string
  status: "pending" | "confirmed" | "processing" | "in_transit" | "delivered" | "completed" | "canceled"
  admin_notes?: string
  commission_paid: boolean
  variant_data?: Record<string, string> | null
  created_at: string
  updated_at: string
  agents?: any
  wholesale_products?: WholesaleProduct
}

export const WHOLESALE_CATEGORIES = [
  "Electronics",
  "Fashion & Clothing",
  "Home & Garden",
  "Health & Beauty",
  "Sports & Outdoors",
  "Books & Media",
  "Toys & Games",
  "Food & Beverages",
  "Automotive",
  "Office Supplies",
  "Pet Supplies",
  "Baby & Kids",
  "Jewelry & Accessories",
  "Industrial & Tools",
  "Travel & Luggage",
  "Gifts & Crafts",
  "Art & Stationery",
  "Medical & Pharmacy",
  "Building & Construction",
  "Garden & Outdoor",
  "Musical Instruments",
  "Other",
] as const

export type WholesaleCategory = (typeof WHOLESALE_CATEGORIES)[number]

// Enhanced error handling with session validation
class WholesaleError extends Error {
  constructor(
    message: string,
    public originalError?: any,
    public isSessionError = false,
  ) {
    super(message)
    this.name = "WholesaleError"
  }
}

// Session-aware timeout wrapper for database operations
async function withSessionValidation<T>(
  promise: Promise<T>,
  timeoutMs = 8000,
  operation = "Database operation",
): Promise<T> {
  // Check localStorage-based authentication first
  const admin = getStoredAdmin()
  if (!admin) {
    throw new WholesaleError("Authentication required. Please refresh the page and log in again.", null, true)
  }

  // Verify admin is active
  if (!admin.is_active) {
    throw new WholesaleError("Your account is not active. Please contact support.", null, true)
  }

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new WholesaleError(`${operation} timed out after ${timeoutMs}ms`))
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } catch (error) {
    if (error instanceof WholesaleError && error.message.includes("timed out")) {
      throw error
    }

    // Check if error is session-related
    if (error && typeof error === "object" && "message" in error) {
      const errorMessage = (error as any).message?.toLowerCase() || ""
      if (
        errorMessage.includes("jwt") ||
        errorMessage.includes("token") ||
        errorMessage.includes("unauthorized") ||
        errorMessage.includes("session")
      ) {
        throw new WholesaleError("Your session has expired. Please refresh the page and try again.", error, true)
      }
    }

    throw new WholesaleError(`${operation} failed: ${error instanceof Error ? error.message : "Unknown error"}`, error)
  }
}

// Update the timeout wrapper function name and add session validation
async function withTimeout<T>(promise: Promise<T>, timeoutMs = 8000, operation = "Database operation"): Promise<T> {
  return withSessionValidation(promise, timeoutMs, operation)
}

// Product Management Functions
export async function createWholesaleProduct(
  product: Omit<WholesaleProduct, "id" | "commission_amount" | "created_at" | "updated_at">,
): Promise<WholesaleProduct> {
  try {
    // Enhanced validation
    if (!product.name?.trim()) {
      throw new WholesaleError("Product name is required")
    }
    if (!product.category) {
      throw new WholesaleError("Product category is required")
    }
    if (!product.price || product.price <= 0) {
      throw new WholesaleError("Valid product price is required")
    }
    if (product.commission_value < 0) {
      throw new WholesaleError("Commission value must be 0 or greater")
    }

    // Set defaults for optional fields
    const productData = {
      name: product.name.trim(),
      description: product.description?.trim() || "",
      category: product.category,
      price: product.price,
      commission_value: product.commission_value,
      quantity: product.quantity || 0,
      delivery_time: product.delivery_time?.trim() || "2-3 business days",
      image_urls: product.image_urls?.length > 0 ? product.image_urls : ["/placeholder.svg"],
      is_active: product.is_active,
      variants: product.variants || null,
      submitted_by_agent_id: product.submitted_by_agent_id || null,
    }

    // Try the optimized database function first with shorter timeout
    try {
      const rpcPromise = supabase.rpc("create_wholesale_product_safe", {
        p_name: productData.name,
        p_description: productData.description,
        p_category: productData.category,
        p_price: productData.price,
        p_commission_value: productData.commission_value,
        p_quantity: productData.quantity,
        p_delivery_time: productData.delivery_time,
        p_image_urls: productData.image_urls,
        p_is_active: productData.is_active,
        p_created_by: null,
        p_submitted_by_agent_id: productData.submitted_by_agent_id,
      })

      const { data, error } = await withTimeout(rpcPromise, 8000, "Create product")

      if (error) {
        // If the optimized function doesn't exist, fall back to direct insert
        if (
          error.code === "PGRST202" ||
          error.message?.includes("function") ||
          error.message?.includes("does not exist")
        ) {
          return await createWholesaleProductFallback(productData)
        }

        throw new WholesaleError(`Failed to create product: ${error.message}`, error)
      }

      if (!data || data.length === 0) {
        return await createWholesaleProductFallback(productData)
      }

      const createdProduct = Array.isArray(data) ? data[0] : data
      return createdProduct
    } catch (rpcError) {
      return await createWholesaleProductFallback(productData)
    }
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    throw new WholesaleError("An unexpected error occurred while creating the product", error)
  }
}

// Improved fallback method with better error handling
async function createWholesaleProductFallback(productData: any): Promise<WholesaleProduct> {
  try {
    // Direct insert with shorter timeout
    const insertPromise = supabase.from("wholesale_products").insert(productData).select().single()

    const { data, error } = await withTimeout(insertPromise, 8000, "Create product fallback")

    if (error) {
      // Handle specific database errors with better messages
      if (error.code === "23514") {
        // Check constraint violation
        if (error.message.includes("commission_value")) {
          throw new WholesaleError("Commission value must be 0 or greater")
        }
        if (error.message.includes("price")) {
          throw new WholesaleError("Product price must be greater than 0")
        }
        if (error.message.includes("quantity")) {
          throw new WholesaleError("Product quantity cannot be negative")
        }
        throw new WholesaleError("Invalid data provided. Please check all fields.")
      }

      if (error.code === "23505") {
        // Unique constraint violation
        throw new WholesaleError("A product with this name already exists")
      }

      if (error.code === "42703") {
        // Column does not exist
        throw new WholesaleError("Database schema mismatch. Please contact support.")
      }

      if (error.message?.includes("timeout") || error.message?.includes("connection")) {
        throw new WholesaleError("Database connection timeout. Please check your internet connection and try again.")
      }

      throw new WholesaleError(`Failed to create product: ${error.message}`, error)
    }

    if (!data) {
      throw new WholesaleError("No data returned from product creation")
    }

    return data
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    throw new WholesaleError("Product creation failed. Please try again or contact support.", error)
  }
}

export async function getWholesaleProducts(): Promise<WholesaleProduct[]> {
  try {
    const { data, error } = await supabase
      .from("wholesale_products")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error fetching products:", error)
      throw new WholesaleError(`Failed to fetch products: ${error.message}`, error)
    }

    return data || []
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("Unexpected error fetching products:", error)
    throw new WholesaleError("An unexpected error occurred while fetching products", error)
  }
}

export async function getActiveWholesaleProducts(): Promise<WholesaleProduct[]> {
  try {
    const { data, error } = await supabase
      .from("wholesale_products")
      .select("*")
      .eq("is_active", true)
      .gt("quantity", 0)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error fetching active products:", error)
      throw new WholesaleError(`Failed to fetch active products: ${error.message}`, error)
    }

    // Fetch agent names for the created_by IDs
    const createdByIds = [...new Set((data || []).map((p: any) => p.created_by).filter(Boolean))]
    let agentMap: Record<string, string> = {}
    
    if (createdByIds.length > 0) {
      const { data: agents, error: agentError } = await supabase
        .from("agents")
        .select("id, full_name")
        .in("id", createdByIds)
      
      if (!agentError && agents) {
        agentMap = agents.reduce((acc: any, agent: any) => {
          acc[agent.id] = agent.full_name
          return acc
        }, {})
      }
    }

    // Transform data to include agent names
    const transformedData = (data || []).map((product: any) => ({
      ...product,
      created_by_name: agentMap[product.created_by] || null,
    }))

    return transformedData
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("Unexpected error fetching active products:", error)
    throw new WholesaleError("An unexpected error occurred while fetching active products", error)
  }
}

// Get all wholesale products (including inactive) for admin panel with agent information
export async function getAllWholesaleProducts(): Promise<WholesaleProduct[]> {
  try {
    // Fetch all products without using relationship syntax
    const queryPromise = supabase
      .from("wholesale_products")
      .select("*")
      .order("created_at", { ascending: false })

    const { data, error } = await withTimeout(queryPromise, 10000, "Fetch all products")

    if (error) {
      console.error("Supabase error fetching all products:", error)
      throw new WholesaleError(`Failed to fetch all products: ${error.message}`, error)
    }

    // Fetch agent names for the created_by IDs
    const createdByIds = [...new Set((data || []).map((p: any) => p.created_by).filter(Boolean))]
    let agentMap: Record<string, string> = {}
    
    if (createdByIds.length > 0) {
      const { data: agents, error: agentError } = await supabase
        .from("agents")
        .select("id, full_name")
        .in("id", createdByIds)
      
      if (!agentError && agents) {
        agentMap = agents.reduce((acc: any, agent: any) => {
          acc[agent.id] = agent.full_name
          return acc
        }, {})
      }
    }

    // Transform data to include agent names
    const transformedData = (data || []).map((product: any) => ({
      ...product,
      created_by_name: agentMap[product.created_by] || null,
    }))

    return transformedData
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("Unexpected error fetching all products:", error)
    throw new WholesaleError("An unexpected error occurred while fetching all products", error)
  }
}

export async function getRecentWholesaleProducts(limit = 6): Promise<WholesaleProduct[]> {
  try {
    const { data, error } = await supabase
      .from("wholesale_products")
      .select("*")
      .eq("is_active", true)
      .gt("quantity", 0)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Supabase error fetching recent products:", error)
      throw new WholesaleError(`Failed to fetch recent products: ${error.message}`, error)
    }

    // Fetch agent names for the created_by IDs
    const createdByIds = [...new Set((data || []).map((p: any) => p.created_by).filter(Boolean))]
    let agentMap: Record<string, string> = {}
    
    if (createdByIds.length > 0) {
      const { data: agents, error: agentError } = await supabase
        .from("agents")
        .select("id, full_name")
        .in("id", createdByIds)
      
      if (!agentError && agents) {
        agentMap = agents.reduce((acc: any, agent: any) => {
          acc[agent.id] = agent.full_name
          return acc
        }, {})
      }
    }

    // Transform data to include agent names
    const transformedData = (data || []).map((product: any) => ({
      ...product,
      created_by_name: product.agents?.full_name || null,
    }))

    return transformedData
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("Unexpected error fetching recent products:", error)
    throw new WholesaleError("An unexpected error occurred while fetching recent products", error)
  }
}

export async function getWholesaleProductById(id: string): Promise<WholesaleProduct | null> {
  try {
    if (!id?.trim()) {
      throw new WholesaleError("Product ID is required")
    }

    const { data, error } = await supabase
      .from("wholesale_products")
      .select(
        `
        *,
        agents:created_by(id, full_name)
      `,
      )
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return null // Product not found
      }
      console.error("Supabase error fetching product by ID:", error)
      throw new WholesaleError(`Failed to fetch product: ${error.message}`, error)
    }

    // Transform data to flatten agent information
    const transformedData = {
      ...data,
      created_by_name: data?.agents?.full_name || null,
    }

    return transformedData
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("Unexpected error fetching product by ID:", error)
    throw new WholesaleError("An unexpected error occurred while fetching the product", error)
  }
}

export async function updateWholesaleProduct(
  id: string,
  updates: Partial<WholesaleProduct>,
): Promise<WholesaleProduct> {
  try {
    if (!id?.trim()) {
      throw new WholesaleError("Product ID is required")
    }

    // Validate updates if provided
    if (updates.name !== undefined && !updates.name?.trim()) {
      throw new WholesaleError("Product name cannot be empty")
    }
    if (updates.description !== undefined && !updates.description?.trim()) {
      throw new WholesaleError("Product description cannot be empty")
    }
    if (updates.price !== undefined && updates.price <= 0) {
      throw new WholesaleError("Product price must be greater than 0")
    }
    if (updates.quantity !== undefined && updates.quantity < 0) {
      throw new WholesaleError("Product quantity cannot be negative")
    }
    if (updates.commission_value !== undefined && updates.commission_value < 0) {
      throw new WholesaleError("Commission value must be 0 or greater")
    }
    if (updates.image_urls !== undefined && updates.image_urls.length === 0) {
      throw new WholesaleError("At least one product image is required")
    }

    // Validate image URLs if provided
    if (updates.image_urls) {
      for (const url of updates.image_urls) {
        try {
          new URL(url)
        } catch {
          throw new WholesaleError(`Invalid image URL: ${url}`)
        }
      }
    }

    const updatePromise = supabase.from("wholesale_products").update(updates).eq("id", id).select().single()

    const { data, error } = await withTimeout(updatePromise, 15000, "Update product")

    if (error) {
      console.error("Supabase error updating product:", error)
      throw new WholesaleError(`Failed to update product: ${error.message}`, error)
    }

    if (!data) {
      throw new WholesaleError("Product not found or no changes made")
    }

    return data
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("Unexpected error updating product:", error)
    throw new WholesaleError("An unexpected error occurred while updating the product", error)
  }
}

export async function deleteWholesaleProduct(id: string): Promise<void> {
  try {
    if (!id?.trim()) {
      throw new WholesaleError("Product ID is required")
    }

    // Check if product has any orders first with timeout
    const ordersCheckPromise = supabase.from("wholesale_orders").select("id").eq("product_id", id).limit(1)

    const { data: orders, error: ordersError } = await withTimeout(ordersCheckPromise, 8000, "Check product orders")

    // FIXED: Only prevent deletion if we successfully found actual orders
    if (ordersError) {
      console.warn("Warning: Could not check product orders before deletion:", ordersError)
      // Continue with deletion - don't throw error for order check failures
    } else if (orders && orders.length > 0) {
      // Only throw error if we successfully found existing orders
      throw new WholesaleError("Cannot delete product with existing orders. Deactivate it instead.")
    }

    const deletePromise = supabase.from("wholesale_products").delete().eq("id", id)

    const { error } = await withTimeout(deletePromise, 10000, "Delete product")

    if (error) {
      console.error("Supabase error deleting product:", error)
      throw new WholesaleError(`Failed to delete product: ${error.message}`, error)
    }
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("Unexpected error deleting product:", error)
    throw new WholesaleError("An unexpected error occurred while deleting the product", error)
  }
}

// Order Management Functions
export async function createWholesaleOrder(
  order: Omit<WholesaleOrder, "id" | "created_at" | "updated_at">,
): Promise<WholesaleOrder> {
  try {
    // Validate required fields
    if (!order.agent_id?.trim()) {
      throw new WholesaleError("Agent ID is required")
    }
    if (!order.product_id?.trim()) {
      throw new WholesaleError("Product ID is required")
    }
    if (!order.quantity || order.quantity <= 0) {
      throw new WholesaleError("Valid quantity is required")
    }
    if (!order.delivery_address?.trim()) {
      throw new WholesaleError("Delivery address is required")
    }
    if (!order.delivery_phone?.trim()) {
      throw new WholesaleError("Delivery phone is required")
    }

    const { data, error } = await supabase
      .from("wholesale_orders")
      .insert(order)
      .select(`
        *,
        agents(full_name, phone_number, momo_number),
        wholesale_products(name, price, image_urls, category)
      `)
      .single()

    if (error) {
      console.error("Supabase error creating order:", error)
      throw new WholesaleError(`Failed to create order: ${error.message}`, error)
    }

    if (!data) {
      throw new WholesaleError("No data returned from order creation")
    }

    return data
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("Unexpected error creating order:", error)
    throw new WholesaleError("An unexpected error occurred while creating the order", error)
  }
}

export async function getWholesaleOrders(): Promise<WholesaleOrder[]> {
  try {
    console.log("🔄 Starting wholesale orders fetch...")

    // First try the admin API (for admin dashboard usage)
    try {
      return await getWholesaleOrdersAdmin()
    } catch (adminApiError) {
      console.warn("⚠️ Admin API failed, falling back to direct database access:", adminApiError)

      // Fall back to the original method with enhanced error handling
      let retryCount = 0
      const maxRetries = 3
      let lastError = null

      while (retryCount < maxRetries) {
        try {
          console.log(`📡 Attempt ${retryCount + 1}/${maxRetries} - Fetching wholesale orders...`)

          const queryPromise = supabase
            .from("wholesale_orders")
            .select(`
              *,
              agents(full_name, phone_number, momo_number, region),
              wholesale_products(name, price, image_urls, category, delivery_time, commission_value)
            `)
            .order("created_at", { ascending: false })

          const { data, error } = await withTimeout(queryPromise, 15000, "Fetch wholesale orders")

          if (error) {
            console.error(`❌ Attempt ${retryCount + 1} failed with error:`, error)
            lastError = error

            // Handle specific error cases
            if (error.code === "PGRST301") {
              // Row Level Security error - try with admin client if available
              console.warn("🔒 RLS error detected, this might be expected for admin operations")
            }

            // If it's a timeout or connection error, retry
            if (
              error.message?.includes("timeout") ||
              error.message?.includes("connection") ||
              error.message?.includes("network") ||
              error.code === "PGRST301"
            ) {
              retryCount++
              if (retryCount < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, retryCount), 5000) // Exponential backoff, max 5s
                console.log(`⏳ Retrying in ${delay}ms...`)
                await new Promise((resolve) => setTimeout(resolve, delay))
                continue
              }
            }

            // For non-retryable errors, break immediately
            break
          }

          // Success case
          const orders = data || []
          console.log(`✅ Successfully fetched ${orders.length} wholesale orders on attempt ${retryCount + 1}`)
          return orders
        } catch (attemptError) {
          console.error(`❌ Attempt ${retryCount + 1} threw exception:`, attemptError)
          lastError = attemptError
          retryCount++

          if (retryCount < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 5000)
            console.log(`⏳ Retrying in ${delay}ms...`)
            await new Promise((resolve) => setTimeout(resolve, delay))
          }
        }
      }

      // All retries failed, try fallback method
      console.warn("⚠️ All direct database attempts failed, trying fallback method...")
      try {
        return await getWholesaleOrdersFallback()
      } catch (fallbackError) {
        console.error("❌ Fallback method also failed:", fallbackError)

        // Final error handling
        const finalError = lastError || fallbackError
        if (finalError && typeof finalError === "object" && "message" in finalError) {
          throw new WholesaleError(
            `Failed to fetch wholesale orders after ${maxRetries} attempts: ${(finalError as any).message}`,
            finalError,
          )
        } else {
          throw new WholesaleError(
            `Failed to fetch wholesale orders after ${maxRetries} attempts: Unknown error`,
            finalError,
          )
        }
      }
    }
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("❌ Unexpected error fetching wholesale orders:", error)
    throw new WholesaleError("An unexpected error occurred while fetching wholesale orders", error)
  }
}

// Fallback method for fetching wholesale orders when main method fails
async function getWholesaleOrdersFallback(): Promise<WholesaleOrder[]> {
  try {
    console.log("🔄 Using fallback method to fetch wholesale orders...")

    // Try a simpler query first
    const { data: basicOrders, error: basicError } = await supabase
      .from("wholesale_orders")
      .select("*")
      .order("created_at", { ascending: false })

    if (basicError) {
      console.error("❌ Basic orders query failed:", basicError)
      throw new WholesaleError(`Fallback basic query failed: ${basicError.message}`, basicError)
    }

    if (!basicOrders || basicOrders.length === 0) {
      console.log("ℹ️ No orders found in fallback method")
      return []
    }

    console.log(`📦 Found ${basicOrders.length} orders, enriching with related data...`)

    // Enrich orders with agent and product data separately
    const enrichedOrders = await Promise.all(
      basicOrders.map(async (order) => {
        const enrichedOrder = { ...order }

        // Try to get agent data
        try {
          const { data: agentData, error: agentError } = await supabase
            .from("agents")
            .select("full_name, phone_number, momo_number, region")
            .eq("id", order.agent_id)
            .single()

          if (!agentError && agentData) {
            enrichedOrder.agents = agentData
          } else {
            console.warn(`⚠️ Could not fetch agent data for order ${order.id}:`, agentError)
            enrichedOrder.agents = { full_name: "Unknown Agent", phone_number: "", momo_number: "", region: "" }
          }
        } catch (agentFetchError) {
          console.warn(`⚠️ Exception fetching agent for order ${order.id}:`, agentFetchError)
          enrichedOrder.agents = { full_name: "Unknown Agent", phone_number: "", momo_number: "", region: "" }
        }

        // Try to get product data
        try {
          const { data: productData, error: productError } = await supabase
            .from("wholesale_products")
            .select("name, price, image_urls, category, delivery_time, commission_value")
            .eq("id", order.product_id)
            .single()

          if (!productError && productData) {
            enrichedOrder.wholesale_products = productData
          } else {
            console.warn(`⚠️ Could not fetch product data for order ${order.id}:`, productError)
            enrichedOrder.wholesale_products = {
              name: "Unknown Product",
              price: 0,
              image_urls: ["/placeholder.svg"],
              category: "Other",
              delivery_time: "2-3 business days",
              commission_value: 0,
            }
          }
        } catch (productFetchError) {
          console.warn(`⚠️ Exception fetching product for order ${order.id}:`, productFetchError)
          enrichedOrder.wholesale_products = {
            name: "Unknown Product",
            price: 0,
            image_urls: ["/placeholder.svg"],
            category: "Other",
            delivery_time: "2-3 business days",
            commission_value: 0,
          }
        }

        return enrichedOrder
      }),
    )

    console.log(`✅ Successfully enriched ${enrichedOrders.length} orders using fallback method`)
    return enrichedOrders
  } catch (error) {
    console.error("❌ Error in fallback wholesale orders fetch:", error)
    if (error instanceof WholesaleError) {
      throw error
    }
    throw new WholesaleError("Fallback method failed to fetch wholesale orders", error)
  }
}

export async function getWholesaleOrdersByAgent(agentId: string): Promise<WholesaleOrder[]> {
  try {
    if (!agentId?.trim()) {
      throw new WholesaleError("Agent ID is required")
    }

    // CRITICAL FIX: Use API endpoint instead of direct database access to bypass RLS
    return await getWholesaleOrdersByAgentAPI(agentId)
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("Unexpected error fetching agent orders:", error)
    throw new WholesaleError("An unexpected error occurred while fetching agent orders", error)
  }
}

// NEW: API-based function to fetch agent wholesale orders (bypasses RLS)
export async function getWholesaleOrdersByAgentAPI(agentId: string): Promise<WholesaleOrder[]> {
  try {
    if (!agentId?.trim()) {
      throw new WholesaleError("Agent ID is required")
    }

    console.log("🔍 Fetching agent wholesale orders via API for agent:", agentId)

    const response = await fetch(`/api/agent/wholesale/orders?agent_id=${encodeURIComponent(agentId)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      console.error("❌ API error fetching agent orders:", errorData)
      throw new WholesaleError(`Failed to fetch orders: ${errorData.error || "API request failed"}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new WholesaleError(`Failed to fetch orders: ${result.error || "API request failed"}`)
    }

    console.log("✅ Successfully fetched agent orders via API:", {
      agent_id: agentId,
      orders_count: result.orders?.length || 0,
    })

    if (result.orders && result.orders.length > 0) {
      console.log("[v0] First order from API:", result.orders[0])
      console.log("[v0] First order variant_data from API:", result.orders[0].variant_data)
    }

    return result.orders || []
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("❌ Unexpected error in API-based order fetching:", error)
    throw new WholesaleError("An unexpected error occurred while fetching agent orders via API", error)
  }
}

export async function updateWholesaleOrderStatus(
  id: string,
  status: WholesaleOrder["status"],
  adminNotes?: string,
): Promise<WholesaleOrder> {
  try {
    if (!id?.trim()) {
      throw new WholesaleError("Order ID is required")
    }
    if (!status) {
      throw new WholesaleError("Order status is required")
    }

    const updates: any = { status }
    if (adminNotes) updates.admin_notes = adminNotes

    const { data, error } = await supabase
      .from("wholesale_orders")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        agents(full_name, phone_number),
        wholesale_products(name, price, image_urls)
      `)
      .single()

    if (error) {
      console.error("Supabase error updating order status:", error)
      throw new WholesaleError(`Failed to update order status: ${error.message}`, error)
    }

    if (!data) {
      throw new WholesaleError("Order not found")
    }

    // The database trigger will automatically handle commission creation when status is 'delivered'
    // No additional logic needed here as the trigger handles both commissions and withdrawals tables

    return data
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("Unexpected error updating order status:", error)
    throw new WholesaleError("An unexpected error occurred while updating order status", error)
  }
}

export async function updateWholesaleOrderCommissionPaid(id: string, paid: boolean): Promise<void> {
  try {
    if (!id?.trim()) {
      throw new WholesaleError("Order ID is required")
    }

    // CRITICAL FIX: When marking commission as paid, this should add to agent's pending payout
    // The database trigger will handle creating the commission record
    const { error } = await supabase.from("wholesale_orders").update({ commission_paid: paid }).eq("id", id)

    if (error) {
      console.error("Supabase error updating commission status:", error)
      throw new WholesaleError(`Failed to update commission status: ${error.message}`, error)
    }

    // If marking as paid, the database trigger will:
    // 1. Create a commission record with status 'earned'
    // 2. Make it available for manual withdrawal requests by the agent
    // No automatic withdrawal request is created - agent must manually request payout
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("Unexpected error updating commission status:", error)
    throw new WholesaleError("An unexpected error occurred while updating commission status", error)
  }
}

export async function deleteWholesaleOrder(id: string): Promise<void> {
  try {
    if (!id?.trim()) {
      throw new WholesaleError("Order ID is required")
    }

    const { error } = await supabase.from("wholesale_orders").delete().eq("id", id)

    if (error) {
      console.error("Supabase error deleting order:", error)
      throw new WholesaleError(`Failed to delete order: ${error.message}`, error)
    }
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("Unexpected error deleting order:", error)
    throw new WholesaleError("An unexpected error occurred while deleting the order", error)
  }
}

// NEW: Admin API functions for bypassing RLS
export async function getWholesaleOrdersAdmin(): Promise<WholesaleOrder[]> {
  try {
    console.log("🔄 Using admin API to fetch wholesale orders...")

    const response = await fetch("/api/admin/wholesale/orders", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      console.error("❌ Admin API error fetching orders:", errorData)
      throw new WholesaleError(`Failed to fetch orders: ${errorData.error || "API request failed"}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new WholesaleError(`Failed to fetch orders: ${result.error || "API request failed"}`)
    }

    console.log("✅ Successfully fetched orders via admin API:", {
      orders_count: result.orders?.length || 0,
    })

    if (result.orders && result.orders.length > 0) {
      console.log("[v0] First order from admin API:", result.orders[0])
      console.log("[v0] First order variant_data from admin API:", result.orders[0].variant_data)
    }

    return result.orders || []
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("❌ Unexpected error in admin API order fetching:", error)
    throw new WholesaleError("An unexpected error occurred while fetching orders via admin API", error)
  }
}

export async function updateWholesaleOrderStatusAdmin(
  id: string,
  status: WholesaleOrder["status"],
  adminNotes?: string,
): Promise<WholesaleOrder> {
  try {
    if (!id?.trim()) {
      throw new WholesaleError("Order ID is required")
    }
    if (!status) {
      throw new WholesaleError("Order status is required")
    }

    console.log("🔄 Using admin API to update order status:", { id, status, adminNotes })

    const response = await fetch("/api/admin/wholesale/orders", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: id,
        status,
        adminNotes,
      }),
    })

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch (parseError) {
        errorData = {
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: `Failed to parse error response: ${parseError.message}`,
        }
      }

      console.error("❌ Admin API error updating order status:", {
        status: response.status,
        statusText: response.statusText,
        errorData,
        url: response.url,
      })

      throw new WholesaleError(
        `Failed to update order status: ${errorData.error || `HTTP ${response.status}`}. ${errorData.details || ""}`,
      )
    }

    const result = await response.json()

    if (!result.success) {
      throw new WholesaleError(`Failed to update order status: ${result.error || "API request failed"}`)
    }

    console.log("✅ Successfully updated order status via admin API:", { id, status })

    return result.order
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("❌ Unexpected error in admin API order status update:", error)
    throw new WholesaleError("An unexpected error occurred while updating order status via admin API", error)
  }
}

export async function updateWholesaleOrderCommissionPaidAdmin(id: string, paid: boolean): Promise<void> {
  try {
    if (!id?.trim()) {
      throw new WholesaleError("Order ID is required")
    }

    console.log("🔄 Using admin API to update commission paid status:", { id, paid })

    const response = await fetch("/api/admin/wholesale/orders", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: id,
        commissionPaid: paid,
      }),
    })

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch (parseError) {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
      }

      console.error("❌ Admin API error updating commission status:", errorData)
      throw new WholesaleError(`Failed to update commission status: ${errorData.error || `HTTP ${response.status}`}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new WholesaleError(`Failed to update commission status: ${result.error || "API request failed"}`)
    }

    console.log("✅ Successfully updated commission status via admin API:", { id, paid })
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("❌ Unexpected error in admin API commission status update:", error)
    throw new WholesaleError(
      `Unexpected error updating commission status: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

export async function deleteWholesaleOrderAdmin(id: string): Promise<void> {
  try {
    if (!id?.trim()) {
      throw new WholesaleError("Order ID is required")
    }

    console.log("🔄 Using admin API to delete order:", id)

    const response = await fetch(`/api/admin/wholesale/orders?orderId=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      console.error("❌ Admin API error deleting order:", errorData)
      throw new WholesaleError(`Failed to delete order: ${errorData.error || "API request failed"}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new WholesaleError(`Failed to delete order: ${result.error || "API request failed"}`)
    }

    console.log("✅ Successfully deleted order via admin API:", id)
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("❌ Unexpected error in admin API order deletion:", error)
    throw new WholesaleError("An unexpected error occurred while deleting order via admin API", error)
  }
}

// Utility Functions
export function generateWholesaleOrderReference(): string {
  const characters = "0123456789"
  let result = ""
  for (let i = 0; i < 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

function calculateWholesaleCommission(commissionValue: number, quantity: number): number {
  if (commissionValue < 0 || quantity < 0) {
    throw new WholesaleError("Invalid commission value or quantity")
  }
  return commissionValue * quantity
}

// Stock Management
export async function updateProductStock(productId: string, quantityOrdered: number): Promise<void> {
  try {
    if (!productId?.trim()) {
      throw new WholesaleError("Product ID is required")
    }
    if (quantityOrdered <= 0) {
      throw new WholesaleError("Quantity ordered must be greater than 0")
    }

    // Get current product
    const product = await getWholesaleProductById(productId)
    if (!product) {
      throw new WholesaleError("Product not found")
    }

    // Update stock
    const newQuantity = product.quantity - quantityOrdered
    if (newQuantity < 0) {
      throw new WholesaleError("Insufficient stock available")
    }

    await updateWholesaleProduct(productId, { quantity: newQuantity })
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("Unexpected error updating product stock:", error)
    throw new WholesaleError("An unexpected error occurred while updating product stock", error)
  }
}

// Search and Filter Functions
export async function searchWholesaleProducts(query: string, category?: string): Promise<WholesaleProduct[]> {
  try {
    let queryBuilder = supabase.from("wholesale_products").select("*").eq("is_active", true)

    if (query?.trim()) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    if (category && category !== "All") {
      queryBuilder = queryBuilder.eq("category", category)
    }

    const { data, error } = await queryBuilder.order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error searching products:", error)
      throw new WholesaleError(`Failed to search products: ${error.message}`, error)
    }

    return data || []
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("Unexpected error searching products:", error)
    throw new WholesaleError("An unexpected error occurred while searching products", error)
  }
}

// CRITICAL FIX: Add commission system functions
export async function getAgentCommissionBalance(agentId: string): Promise<number> {
  try {
    console.log("Loading commission balance for agent:", agentId)

    // Get unpaid referral commissions
    const { data: referralCommissions } = await supabase
      .from("referrals")
      .select("id, services(commission_amount)")
      .eq("agent_id", agentId)
      .eq("status", "completed")
      .neq("commission_paid", true)

    const unpaidReferralCommission = (referralCommissions || []).reduce(
      (sum, r) => sum + (Number(r.services?.commission_amount) || 0),
      0,
    )

    // Get unpaid data order commissions
    const { data: dataOrderCommissions } = await supabase
      .from("data_orders")
      .select("commission_amount")
      .eq("agent_id", agentId)
      .eq("status", "completed")
      .neq("commission_paid", true)

    const unpaidDataCommission = (dataOrderCommissions || []).reduce(
      (sum, d) => sum + (Number(d.commission_amount) || 0),
      0,
    )

    // Get unpaid wholesale commissions
    const { data: wholesaleCommissions } = await supabase
      .from("wholesale_orders")
      .select("commission_amount")
      .eq("agent_id", agentId)
      .eq("status", "delivered")
      .neq("commission_paid", true)

    const unpaidWholesaleCommission = (wholesaleCommissions || []).reduce(
      (sum, w) => sum + (Number(w.commission_amount) || 0),
      0,
    )

    // Get paid withdrawals (money already taken out of the system)
    const { data: paidWithdrawals } = await supabase
      .from("withdrawals")
      .select("amount")
      .eq("agent_id", agentId)
      .eq("status", "paid")

    const totalPaidWithdrawals = (paidWithdrawals || []).reduce((sum, w) => sum + (Number(w.amount) || 0), 0)

    // Get pending withdrawals (money reserved but not yet paid)
    const { data: pendingWithdrawals } = await supabase
      .from("withdrawals")
      .select("amount")
      .eq("agent_id", agentId)
      .in("status", ["requested", "processing"])

    const totalPendingWithdrawals = (pendingWithdrawals || []).reduce((sum, w) => sum + (Number(w.amount) || 0), 0)

    // Calculate available balance
    const totalUnpaidCommissions = unpaidReferralCommission + unpaidDataCommission + unpaidWholesaleCommission
    const availableBalance = Math.max(0, totalUnpaidCommissions - totalPaidWithdrawals - totalPendingWithdrawals)

    console.log("Commission balance calculated:", {
      unpaidReferralCommission,
      unpaidDataCommission,
      unpaidWholesaleCommission,
      totalPaidWithdrawals,
      totalPendingWithdrawals,
      availableBalance,
    })

    return availableBalance
  } catch (error) {
    console.error("Error calculating commission balance:", error)
    return 0
  }
}

export async function getAgentCommissionBreakdown(agentId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc("get_agent_commission_breakdown", { agent_uuid: agentId })

    if (error) {
      console.error("Error getting commission breakdown:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAgentCommissionBreakdown:", error)
    return []
  }
}

export async function validateWithdrawalRequest(
  agentId: string,
  amount: number,
): Promise<{ isValid: boolean; errorMessage?: string }> {
  try {
    console.log("[v0] Starting validateWithdrawalRequest:", { agentId, amount })

    const availableBalance = await getAgentCommissionBalance(agentId)

    console.log("[v0] Validation balance check:", {
      agentId,
      requestedAmount: amount,
      availableBalance,
      isValid: availableBalance >= amount,
    })

    if (availableBalance >= amount) {
      console.log("[v0] Withdrawal validation PASSED")
      return { isValid: true }
    } else {
      const errorMessage = `Insufficient commission balance. Available: ${availableBalance.toFixed(2)}, Requested: ${amount.toFixed(2)}`
      console.log("[v0] Withdrawal validation FAILED:", errorMessage)
      return {
        isValid: false,
        errorMessage,
      }
    }
  } catch (error) {
    console.error("[v0] Error in validateWithdrawalRequest:", error)
    return {
      isValid: false,
      errorMessage: "Failed to validate withdrawal request",
    }
  }
}

// New function to validate withdrawal request before processing
/*export async function validateWithdrawalRequest(
  agentId: string,
  amount: number,
): Promise<{
  isValid: boolean
  errorMessage?: string
  availableBalance: number
  commissionSources: any[]
}> {
  try {
    // First try the database function
    const { data, error } = await supabase.rpc("validate_withdrawal_request", {
      agent_uuid: agentId,
      withdrawal_amount: amount,
    })

    if (error) {
      console.error("Error validating withdrawal request:", error)

      // If the function doesn't exist, use fallback validation
      if (
        error.code === "PGRST202" ||
        error.message?.includes("function") ||
        error.message?.includes("does not exist")
      ) {
        console.log("Database function not found, using fallback validation")
        return await validateWithdrawalRequestFallback(agentId, amount)
      }

      return {
        isValid: false,
        errorMessage: "Failed to validate withdrawal request",
        availableBalance: 0,
        commissionSources: [],
      }
    }

    const result = data?.[0] || {}
    return {
      isValid: result.is_valid || false,
      errorMessage: result.error_message,
      availableBalance: Number(result.available_balance) || 0,
      commissionSources: result.commission_sources || [],
    }
  } catch (error) {
    console.error("Error in validateWithdrawalRequest:", error)

    // Use fallback validation if any error occurs
    try {
      return await validateWithdrawalRequestFallback(agentId, amount)
    } catch (fallbackError) {
      console.error("Fallback validation also failed:", fallbackError)
      return {
        isValid: false,
        errorMessage: "Failed to validate withdrawal request",
        availableBalance: 0,
        commissionSources: [],
      }
    }
  }
}

// Fallback validation function when database function is not available
async function validateWithdrawalRequestFallback(
  agentId: string,
  amount: number,
): Promise<{
  isValid: boolean
  errorMessage?: string
  availableBalance: number
  commissionSources: any[]
}> {
  try {
    console.log("[v0] validateWithdrawalRequestFallback called with:", { agentId, amount })

    // Validate inputs
    if (!agentId?.trim()) {
      return {
        isValid: false,
        errorMessage: "Agent ID is required",
        availableBalance: 0,
        commissionSources: [],
      }
    }

    if (!amount || amount <= 0) {
      return {
        isValid: false,
        errorMessage: "Withdrawal amount must be greater than 0",
        availableBalance: 0,
        commissionSources: [],
      }
    }

    console.log("[v0] About to call getAgentCommissionBalance for agent:", agentId)

    // Get available balance using existing function
    const availableBalance = await getAgentCommissionBalance(agentId)

    console.log("[v0] getAgentCommissionBalance returned:", availableBalance)
    console.log("[v0] Requested amount:", amount)
    console.log("[v0] Balance check:", { availableBalance, amount, sufficient: amount <= availableBalance })

    // Get commission sources manually
    const commissionSources = []

    // Get referral commissions
    try {
      const { data: referrals, error: referralsError } = await supabase
        .from("referrals")
        .select(`
          id,
          created_at,
          services (commission_amount, name)
        `)
        .eq("agent_id", agentId)
        .eq("status", "completed")
        .or("commission_paid.is.null,commission_paid.eq.false")

      console.log("[v0] Referrals query result:", { count: referrals?.length || 0, error: referralsError })

      if (!referralsError && referrals) {
        referrals.forEach((r) => {
          commissionSources.push({
            source_type: "referral",
            source_name: r.services?.name || "Unknown Service",
            commission_amount: r.services?.commission_amount || 0,
            created_at: r.created_at,
          })
        })
      }
    } catch (error) {
      console.warn("Error fetching referral commissions:", error)
    }

    // Get data order commissions
    try {
      const { data: dataOrders, error: dataOrdersError } = await supabase
        .from("data_orders")
        .select("id, commission_amount, created_at")
        .eq("agent_id", agentId)
        .eq("status", "completed")
        .or("commission_paid.is.null,commission_paid.eq.false")

      console.log("[v0] Data orders query result:", { count: dataOrders?.length || 0, error: dataOrdersError })

      if (!dataOrdersError && dataOrders) {
        dataOrders.forEach((d) => {
          commissionSources.push({
            source_type: "data_order",
            source_name: `Data Order #${d.id}`,
            commission_amount: d.commission_amount || 0,
            created_at: d.created_at,
          })
        })
      }
    } catch (error) {
      console.warn("Error fetching data order commissions:", error)
    }

    // Get wholesale commissions
    try {
      const { data: commissions, error: commissionsError } = await supabase
        .from("commissions")
        .select("*")
        .eq("agent_id", agentId)
        .eq("source_type", "wholesale_order")
        .eq("status", "earned")

      console.log("[v0] Wholesale commissions query result:", {
        count: commissions?.length || 0,
        error: commissionsError,
      })

      if (!commissionsError && commissions) {
        commissions.forEach((c) => {
          commissionSources.push({
            source_type: "wholesale_order",
            source_name: `Wholesale Commission #${c.source_id}`,
            commission_amount: c.amount || 0,
            created_at: c.created_at,
          })
        })
      }
    } catch (error) {
      console.warn("Error fetching wholesale commissions:", error)
    }

    console.log("[v0] Total commission sources found:", commissionSources.length)
    console.log(
      "[v0] Commission sources breakdown:",
      commissionSources.map((s) => ({ type: s.source_type, amount: s.commission_amount })),
    )

    // Validate amount against available balance
    if (amount > availableBalance) {
      console.log("[v0] VALIDATION FAILED - Insufficient balance")
      return {
        isValid: false,
        errorMessage: `Insufficient commission balance. Available: ${availableBalance.toFixed(2)}, Requested: ${amount.toFixed(2)}`,
        availableBalance,
        commissionSources,
      }
    }

    console.log("[v0] VALIDATION PASSED - Sufficient balance")
    return {
      isValid: true,
      errorMessage: "Valid withdrawal request",
      availableBalance,
      commissionSources,
    }
  } catch (error) {
    console.error("[v0] Error in fallback validation:", error)
    return {
      isValid: false,
      errorMessage: "Failed to validate withdrawal request",
      availableBalance: 0,
      commissionSources: [],
    }
  }
}*/

export async function createWithdrawalRequest(
  agentId: string,
  amount: number,
  momoNumber: string,
): Promise<string | null> {
  try {
    console.log("[v0] Creating withdrawal request:", { agentId, amount, momoNumber })

    if (!agentId?.trim()) {
      throw new WholesaleError("Agent ID is required")
    }
    if (!amount || amount <= 0) {
      throw new WholesaleError("Valid withdrawal amount is required")
    }
    if (!momoNumber?.trim()) {
      throw new WholesaleError("Mobile money number is required")
    }

    const { data, error } = await supabase
      .from("withdrawals")
      .insert({
        agent_id: agentId,
        amount: amount,
        momo_number: momoNumber,
        status: "requested",
        requested_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (error) {
      console.error("[v0] Error creating withdrawal request:", error)
      throw new WholesaleError(`Failed to create withdrawal request: ${error.message}`, error)
    }

    if (!data?.id) {
      throw new WholesaleError("No withdrawal ID returned from database")
    }

    console.log("[v0] Withdrawal request created successfully:", data.id)
    return data.id
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("[v0] Unexpected error creating withdrawal request:", error)
    return null
  }
}

export async function getWithdrawalWithCommissionSources(withdrawalId: string): Promise<any> {
  try {
    console.log("Getting withdrawal with commission sources:", withdrawalId)

    if (!withdrawalId?.trim()) {
      throw new WholesaleError("Withdrawal ID is required")
    }

    // Get withdrawal details
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from("withdrawals")
      .select(`
        *,
        agents:agent_id (
          id,
          name,
          email,
          phone,
          momo_number
        )
      `)
      .eq("id", withdrawalId)
      .single()

    if (withdrawalError) {
      console.error("Error fetching withdrawal:", withdrawalError)
      throw new WholesaleError(`Failed to fetch withdrawal: ${withdrawalError.message}`, withdrawalError)
    }

    if (!withdrawal) {
      throw new WholesaleError("Withdrawal not found")
    }

    // Get commission sources linked to this withdrawal
    const [referrals, dataOrders, wholesaleOrders] = await Promise.all([
      supabase
        .from("referrals")
        .select(`
          id,
          created_at,
          services (commission_amount, name)
        `)
        .eq("withdrawal_id", withdrawalId),
      supabase
        .from("data_orders")
        .select(`
          id,
          created_at,
          commission_amount,
          data_bundles (name, price)
        `)
        .eq("withdrawal_id", withdrawalId),
      supabase
        .from("wholesale_orders")
        .select(`
          id,
          created_at,
          commission_amount,
          wholesale_products (name, price)
        `)
        .eq("withdrawal_id", withdrawalId),
    ])

    // Combine commission sources
    const commissionSources = [
      ...(referrals.data || []).map((r) => ({
        id: r.id,
        type: "referral",
        created_at: r.created_at,
        commission_amount: r.services?.commission_amount || 0,
        source_name: r.services?.name || "Unknown Service",
      })),
      ...(dataOrders.data || []).map((d) => ({
        id: d.id,
        type: "data_order",
        created_at: d.created_at,
        commission_amount: d.commission_amount || 0,
        source_name: d.data_bundles?.name || "Data Bundle",
      })),
      ...(wholesaleOrders.data || []).map((w) => ({
        id: w.id,
        type: "wholesale_order",
        created_at: w.created_at,
        commission_amount: w.commission_amount || 0,
        source_name: w.wholesale_products?.name || "Wholesale Product",
      })),
    ]

    return {
      ...withdrawal,
      commission_sources: commissionSources,
      total_commission_amount: commissionSources.reduce(
        (sum, source) => sum + (Number(source.commission_amount) || 0),
        0,
      ),
    }
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("Error in getWithdrawalWithCommissionSources:", error)
    throw new WholesaleError(
      `Failed to get withdrawal with commission sources: ${error instanceof Error ? error.message : "Unknown error"}`,
      error,
    )
  }
}

export async function processWithdrawalPayout(
  withdrawalId: string,
  adminId: string,
  payoutReference?: string,
): Promise<boolean> {
  try {
    console.log("Processing withdrawal payout:", { withdrawalId, adminId, payoutReference })

    if (!withdrawalId?.trim()) {
      throw new WholesaleError("Withdrawal ID is required")
    }
    if (!adminId?.trim()) {
      throw new WholesaleError("Admin ID is required")
    }

    // Get withdrawal details
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single()

    if (withdrawalError) {
      console.error("Error fetching withdrawal for payout:", withdrawalError)
      throw new WholesaleError(`Failed to fetch withdrawal: ${withdrawalError.message}`, withdrawalError)
    }

    if (!withdrawal) {
      throw new WholesaleError("Withdrawal not found")
    }

    if (withdrawal.status !== "requested" && withdrawal.status !== "processing") {
      throw new WholesaleError(`Cannot process withdrawal with status: ${withdrawal.status}`)
    }

    // Update withdrawal status to paid
    const { error: updateError } = await supabase
      .from("withdrawals")
      .update({
        status: "paid",
        payout_reference: payoutReference || `PAYOUT-${Date.now()}`,
        paid_at: new Date().toISOString(),
        processed_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", withdrawalId)

    if (updateError) {
      console.error("Error updating withdrawal status:", updateError)
      throw new WholesaleError(`Failed to update withdrawal status: ${updateError.message}`, updateError)
    }

    // Mark commission sources as paid
    await Promise.all([
      supabase
        .from("referrals")
        .update({
          commission_paid: true,
          withdrawn_at: new Date().toISOString(),
        })
        .eq("withdrawal_id", withdrawalId),
      supabase
        .from("data_orders")
        .update({
          commission_paid: true,
          withdrawn_at: new Date().toISOString(),
        })
        .eq("withdrawal_id", withdrawalId),
      supabase
        .from("wholesale_orders")
        .update({
          commission_paid: true,
          withdrawn_at: new Date().toISOString(),
        })
        .eq("withdrawal_id", withdrawalId),
    ])

    console.log("Withdrawal payout processed successfully:", withdrawalId)
    return true
  } catch (error) {
    if (error instanceof WholesaleError) {
      throw error
    }
    console.error("Error in processWithdrawalPayout:", error)
    throw new WholesaleError(
      `Failed to process withdrawal payout: ${error instanceof Error ? error.message : "Unknown error"}`,
      error,
    )
  }
}
