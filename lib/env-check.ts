/**
 * Environment variable validation
 * Run at server startup to catch configuration errors early
 */

interface EnvVarConfig {
  name: string;
  required: boolean;
  description: string;
}

const ENV_VARS: EnvVarConfig[] = [
  // Core infrastructure
  {
    name: "NEXT_PUBLIC_CONVEX_URL",
    required: true,
    description: "Convex database URL",
  },

  // Authentication
  {
    name: "NEXTAUTH_URL",
    required: true,
    description: "NextAuth.js callback URL",
  },
  {
    name: "NEXTAUTH_SECRET",
    required: true,
    description: "NextAuth.js JWT secret",
  },

  // AI Provider
  {
    name: "OPENAI_API_KEY",
    required: true,
    description: "OpenAI/Tu-zi API key for AI chat",
  },
  {
    name: "OPENAI_BASE_URL",
    required: false,
    description: "OpenAI API base URL (optional for custom providers)",
  },

  // Stripe Payment
  {
    name: "STRIPE_PRIVATE_KEY",
    required: true,
    description: "Stripe secret key",
  },
  {
    name: "STRIPE_WEBHOOK_SECRET",
    required: true,
    description: "Stripe webhook signing secret",
  },
  {
    name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    required: true,
    description: "Stripe publishable key",
  },

  // Email (Resend)
  {
    name: "RESEND_API_KEY",
    required: true,
    description: "Resend API key for sending emails",
  },

  // Image storage (Cloudflare R2)
  {
    name: "R2_ACCOUNT_ID",
    required: false,
    description: "Cloudflare R2 account ID",
  },
  {
    name: "R2_ACCESS_KEY_ID",
    required: false,
    description: "Cloudflare R2 access key",
  },
  {
    name: "R2_SECRET_ACCESS_KEY",
    required: false,
    description: "Cloudflare R2 secret key",
  },
  {
    name: "R2_BUCKET_NAME",
    required: false,
    description: "Cloudflare R2 bucket name",
  },

  // Alternative payment providers (optional)
  {
    name: "PAYBLIS_SECRET_KEY",
    required: false,
    description: "Payblis webhook secret",
  },
  {
    name: "NOWPAYMENTS_IPN_SECRET",
    required: false,
    description: "NOWPayments IPN secret",
  },
  {
    name: "ZHIFUFM_MERCHANT_KEY",
    required: false,
    description: "ZhiFuFm merchant key",
  },
];

export function validateEnvVars(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name];

    if (envVar.required && !value) {
      errors.push(`Missing required env var: ${envVar.name} (${envVar.description})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function checkEnvVarsOnStartup(): void {
  // Only run in production or when explicitly requested
  if (process.env.NODE_ENV !== "production" && process.env.CHECK_ENV !== "true") {
    return;
  }

  console.log("🔍 Validating environment variables...");

  const result = validateEnvVars();

  if (!result.valid) {
    console.error("❌ Environment validation failed:");
    for (const error of result.errors) {
      console.error(`   - ${error}`);
    }

    // In production, throw an error to prevent startup
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Server startup failed: ${result.errors.length} missing environment variable(s). ` +
        "Please check your environment configuration."
      );
    }
  } else {
    console.log("✅ All required environment variables are set");
  }
}
