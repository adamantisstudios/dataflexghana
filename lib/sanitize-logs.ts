/**
 * New utility for sanitizing sensitive information from logs
 * Prevents exposure of file paths, API keys, URLs, and other sensitive data
 */

const SENSITIVE_PATTERNS = {
  filePath: /\/[a-zA-Z0-9_\-./]+\.(ts|tsx|js|jsx|json|env)/g,
  apiKey: /([a-zA-Z_][a-zA-Z0-9_]*[_-]?key|token|secret|password)\s*[:=]\s*[^\s,}]+/gi,
  url: /(https?:\/\/[^\s,}]+)/g,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  supabaseUrl: /https:\/\/[a-z0-9]+\.supabase\.co/g,
  serviceRoleKey: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
}

/**
 * Sanitize a single value by removing sensitive patterns
 */
export function sanitizeValue(value: any): any {
  if (typeof value !== "string") {
    return value
  }

  let sanitized = value

  // Remove file paths
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.filePath, "[FILE_PATH]")

  // Remove API keys and tokens
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.apiKey, "[REDACTED_KEY]")

  // Remove URLs
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.url, "[URL_REDACTED]")

  // Remove emails
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.email, "[EMAIL_REDACTED]")

  // Remove Supabase URLs
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.supabaseUrl, "[SUPABASE_URL]")

  // Remove service role keys
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.serviceRoleKey, "[SERVICE_ROLE_KEY]")

  return sanitized
}

/**
 * Sanitize an object recursively
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === "string") {
    return sanitizeValue(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item))
  }

  if (typeof obj === "object") {
    const sanitized: any = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject(obj[key])
      }
    }
    return sanitized
  }

  return obj
}

/**
 * Safe console.log wrapper that sanitizes output in production
 */
export function safeConsoleLog(...args: any[]) {
  if (process.env.NODE_ENV === "production") {
    // In production, sanitize all arguments
    const sanitizedArgs = args.map((arg) => sanitizeObject(arg))
    console.log(...sanitizedArgs)
  } else {
    // In development, log normally
    console.log(...args)
  }
}

/**
 * Safe console.error wrapper that sanitizes output in production
 */
export function safeConsoleError(...args: any[]) {
  if (process.env.NODE_ENV === "production") {
    // In production, sanitize all arguments
    const sanitizedArgs = args.map((arg) => sanitizeObject(arg))
    console.error(...sanitizedArgs)
  } else {
    // In development, log normally
    console.error(...args)
  }
}

/**
 * Safe console.warn wrapper that sanitizes output in production
 */
export function safeConsoleWarn(...args: any[]) {
  if (process.env.NODE_ENV === "production") {
    // In production, sanitize all arguments
    const sanitizedArgs = args.map((arg) => sanitizeObject(arg))
    console.warn(...sanitizedArgs)
  } else {
    // In development, log normally
    console.warn(...args)
  }
}
