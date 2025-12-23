import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import TwitterProvider from "next-auth/providers/twitter";
import { NextAuthConfig } from "next-auth";
import { Provider } from "next-auth/providers/index";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getClientIp } from "@/lib/ip";
import { getIsoTimestr } from "@/lib/time";

let providers: Provider[] = [];

// Google One Tap Auth
if (
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED === "true" &&
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID
) {
  providers.push(
    CredentialsProvider({
      id: "google-one-tap",
      name: "google-one-tap",

      credentials: {
        credential: { type: "text" },
      },

      async authorize(credentials, req) {
        const googleClientId = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID;
        if (!googleClientId) {
          console.log("invalid google auth config");
          return null;
        }

        const token = credentials!.credential;

        const response = await fetch(
          "https://oauth2.googleapis.com/tokeninfo?id_token=" + token
        );
        if (!response.ok) {
          console.log("Failed to verify token");
          return null;
        }

        const payload = await response.json();
        if (!payload) {
          console.log("invalid payload from token");
          return null;
        }

        const {
          email,
          sub,
          given_name,
          family_name,
          email_verified,
          picture: image,
        } = payload;
        if (!email) {
          console.log("invalid email in payload");
          return null;
        }

        const user = {
          id: sub,
          name: [given_name, family_name].join(" "),
          email,
          image,
          emailVerified: email_verified ? new Date() : null,
        };

        return user;
      },
    })
  );
}

// Google Auth
if (
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true" &&
  process.env.AUTH_GOOGLE_ID &&
  process.env.AUTH_GOOGLE_SECRET
) {
  providers.push(
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}



// Discord Auth
if (
  process.env.NEXT_PUBLIC_AUTH_DISCORD_ENABLED === "true" &&
  process.env.AUTH_DISCORD_ID &&
  process.env.AUTH_DISCORD_SECRET
) {
  providers.push(
    DiscordProvider({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

// Twitter/X Auth
if (
  process.env.NEXT_PUBLIC_AUTH_TWITTER_ENABLED === "true" &&
  process.env.AUTH_TWITTER_ID &&
  process.env.AUTH_TWITTER_SECRET
) {
  providers.push(
    TwitterProvider({
      clientId: process.env.AUTH_TWITTER_ID,
      clientSecret: process.env.AUTH_TWITTER_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

// Email OTP Provider
providers.push(
  CredentialsProvider({
    id: "email-otp",
    name: "Email OTP",
    credentials: {
      email: { label: "Email", type: "email" },
      userId: { label: "User ID", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.userId) {
        return null;
      }

      // Return user object - the actual verification was done in verify-otp API
      return {
        id: credentials.userId as string,
        email: credentials.email as string,
        name: (credentials.email as string).split("@")[0],
      };
    },
  })
);

export const providerMap = providers
  .map((provider) => {
    if (typeof provider === "function") {
      const providerData = provider();
      return { id: providerData.id, name: providerData.name };
    } else {
      return { id: provider.id, name: provider.name };
    }
  })
  .filter((provider) => provider.id !== "google-one-tap" && provider.id !== "email-otp");

export const authOptions: NextAuthConfig = {
  providers,
  // No custom sign-in page - use modal instead
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      
      const isAllowedToSignIn = true;
      if (isAllowedToSignIn) {
        return true;
      } else {
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async session({ session, token, user }) {
      if (token && token.user && token.user) {
        session.user = token.user;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      try {
        if (user && account) {
          console.log("OAuth login success, provider:", account.provider);
          
          // 如果没有邮箱，根据 provider 和用户 ID 生成临时邮箱
          let userEmail = user.email;
          if (!userEmail && user.id) {
            userEmail = `${account.provider}_${user.id}@${account.provider}.lovexai.studio`;
            console.log("Generated temporary email for user without email:", userEmail);
          }
          
          if (userEmail) {
            console.log("Creating/finding user for:", userEmail);
            try {
              const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
              const dbUser = await convex.mutation(api.users.syncUser, {
                email: userEmail,
                name: user.name || "",
                avatar_url: user.image || "",
                externalId: user.id || "",
                provider: account.provider,
              });

              if (dbUser) {
                console.log("User created/found successfully:", dbUser._id);
                (token as any).user = {
                  id: dbUser._id,
                  email: dbUser.email,
                  name: dbUser.name,
                  avatar_url: dbUser.avatar_url,
                  subscription_tier: dbUser.subscription_tier,
                  credits_balance: dbUser.credits_balance,
                  created_at: new Date(dbUser._creationTime).toISOString(),
                };
              }
            } catch (e) {
              console.error("save user failed:", e);
            }
          } else {
            console.warn("User from provider did not return an email or ID.");
          }
        }
        return token;
      } catch (e) {
        console.error("jwt callback error:", e);
        return token;
      }
    },
  },
};
