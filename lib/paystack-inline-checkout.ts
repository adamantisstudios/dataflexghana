declare global {
  interface Window {
    PaystackPop?: new () => {
      resumeTransaction: (
        accessCode: string,
        callback?: (response: { reference?: string; status?: string }) => void,
      ) => void
    }
  }
}

let paystackScriptPromise: Promise<void> | null = null

export function loadPaystackInlineJs(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (window.PaystackPop) return Promise.resolve()

  if (paystackScriptPromise) return paystackScriptPromise

  paystackScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src*="js.paystack.co/v1/inline.js"]')
    if (existing) {
      if (window.PaystackPop) {
        resolve()
        return
      }
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("Failed to load Paystack")), { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = "https://js.paystack.co/v1/inline.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Paystack checkout"))
    document.body.appendChild(script)
  })

  return paystackScriptPromise
}

export type PaystackCheckoutOptions = {
  accessCode?: string | null
  authorizationUrl: string
  onSuccess?: (reference: string) => void
  onClose?: () => void
}

/**
 * Open Paystack checkout in an on-page popup when possible (better on mobile).
 * Falls back to full redirect if inline.js is unavailable.
 */
export async function openPaystackCheckout(options: PaystackCheckoutOptions): Promise<void> {
  const { accessCode, authorizationUrl, onSuccess, onClose } = options

  if (accessCode?.trim()) {
    try {
      await loadPaystackInlineJs()
      const PaystackPop = window.PaystackPop
      if (PaystackPop) {
        const popup = new PaystackPop()
        popup.resumeTransaction(accessCode.trim(), (response) => {
          const reference = String(response?.reference ?? "").trim()
          if (reference) {
            onSuccess?.(reference)
          } else {
            onClose?.()
          }
        })
        return
      }
    } catch (error) {
      console.warn("[paystack-inline] popup failed, using redirect:", error)
    }
  }

  window.location.assign(authorizationUrl)
}
