import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface JWT {
    user?: {
      id?: string;
      email?: string;
      name?: string;
      avatar_url?: string;
      subscription_tier?: string;
      credits_balance?: number;
      created_at?: string;
    };
  }

  interface Session {
    user: {
      id?: string;
      email?: string;
      name?: string;
      avatar_url?: string;
      subscription_tier?: string;
      credits_balance?: number;
      created_at?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    subscription_tier?: string;
    credits_balance?: number;
    created_at?: string;
  }
}
