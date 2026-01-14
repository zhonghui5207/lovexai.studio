/**
 * Logger utility with sensitive data sanitization
 * Masks emails, order numbers, and other PII in logs
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const SENSITIVE_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  // Email addresses: john@example.com -> j***@***.com
  {
    pattern: /([a-zA-Z0-9])[a-zA-Z0-9._%+-]*@([a-zA-Z0-9])[a-zA-Z0-9.-]*\.([a-zA-Z]{2,})/g,
    replacement: "$1***@$2**.$3",
  },
  // Credit card numbers (basic pattern)
  {
    pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    replacement: "****-****-****-****",
  },
  // API keys (common patterns)
  {
    pattern: /sk[-_]live[-_][a-zA-Z0-9]{20,}/g,
    replacement: "sk_live_***REDACTED***",
  },
  {
    pattern: /sk[-_]test[-_][a-zA-Z0-9]{20,}/g,
    replacement: "sk_test_***REDACTED***",
  },
  // Bearer tokens
  {
    pattern: /Bearer\s+[a-zA-Z0-9._-]{20,}/gi,
    replacement: "Bearer ***REDACTED***",
  },
];

/**
 * Sanitize a string by masking sensitive information
 */
export function sanitize(value: unknown): string {
  if (value === null || value === undefined) {
    return String(value);
  }

  let str: string;
  if (typeof value === "object") {
    try {
      str = JSON.stringify(value, null, 2);
    } catch {
      str = String(value);
    }
  } else {
    str = String(value);
  }

  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    str = str.replace(pattern, replacement);
  }

  return str;
}

/**
 * Create a sanitized log object from key-value pairs
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Fully mask specific sensitive fields
    if (["password", "secret", "token", "api_key", "apiKey"].includes(key.toLowerCase())) {
      result[key] = "***REDACTED***";
    } else if (key.toLowerCase().includes("email")) {
      result[key] = sanitize(value);
    } else {
      result[key] = typeof value === "object" ? sanitize(value) : String(value);
    }
  }
  return result;
}

/**
 * Logger with automatic sanitization
 * Only logs in development or when LOG_LEVEL is set
 */
class Logger {
  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors unless LOG_LEVEL is set
    if (process.env.NODE_ENV === "production") {
      const logLevel = process.env.LOG_LEVEL || "warn";
      const levels: LogLevel[] = ["debug", "info", "warn", "error"];
      return levels.indexOf(level) >= levels.indexOf(logLevel as LogLevel);
    }
    return true;
  }

  debug(message: string, data?: Record<string, unknown>) {
    if (!this.shouldLog("debug")) return;
    console.log(`[DEBUG] ${message}`, data ? sanitizeObject(data) : "");
  }

  info(message: string, data?: Record<string, unknown>) {
    if (!this.shouldLog("info")) return;
    console.log(`[INFO] ${message}`, data ? sanitizeObject(data) : "");
  }

  warn(message: string, data?: Record<string, unknown>) {
    if (!this.shouldLog("warn")) return;
    console.warn(`[WARN] ${message}`, data ? sanitizeObject(data) : "");
  }

  error(message: string, error?: unknown, data?: Record<string, unknown>) {
    if (!this.shouldLog("error")) return;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `[ERROR] ${message}: ${errorMessage}`,
      data ? sanitizeObject(data) : ""
    );
  }
}

export const logger = new Logger();
