import "@/app/globals.css";
import "@/app/theme-romantic-cyberpunk.css";

import { getMessages, getTranslations } from "next-intl/server";

import { AppContextProvider } from "@/contexts/app";
import localFont from "next/font/local";
import { Metadata } from "next";
import { NextAuthSessionProvider } from "@/auth/session";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "@/providers/theme";
import { cn } from "@/lib/utils";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import Script from "next/script";

// Configure local font
// You need to place the font file in /app/fonts/ABCFavorit-Variable.ttf
const fontSans = localFont({
  src: "../fonts/ABCFavorit-Variable.ttf", // Adjust filename if needed
  variable: "--font-sans",
  display: "swap",
});

// Reuse the same font for headings to match the reference style
const fontHeading = localFont({
  src: "../fonts/ABCFavorit-Variable.ttf", // Adjust filename if needed
  variable: "--font-heading",
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations();

  const title = t("metadata.title") || "LoveX - AI Companion & Character Chat";
  const description = t("metadata.description") || "Create your perfect AI companion. Chat with AI characters, generate images, and explore endless possibilities.";
  const siteUrl = "https://lovexai.studio";

  return {
    title: {
      template: `%s | LoveX`,
      default: title,
    },
    description: description,
    keywords: t("metadata.keywords") || "",

    // Canonical URL
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: "/",
      languages: {
        "en": "/en",
        "zh": "/zh",
      },
    },

    // Open Graph
    openGraph: {
      title: title,
      description: description,
      url: siteUrl,
      siteName: "LoveX",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "LoveX - AI Companion & Character Chat",
        },
      ],
      locale: locale === "zh" ? "zh_CN" : "en_US",
      type: "website",
    },

    // Twitter Card
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: ["/og-image.png"],
    },

    // Additional SEO
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": "LoveX",
        "url": "https://lovexai.studio",
        "logo": "https://lovexai.studio/logo.png",
        "description": "AI-driven character chat platform creating immersive interactive experiences",
        "sameAs": []
      },
      {
        "@type": "WebSite",
        "url": "https://lovexai.studio",
        "name": "LoveX",
        "description": "Create your perfect AI companion. Chat with AI characters, generate images, and explore endless possibilities.",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://lovexai.studio/discover?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED === "true" &&
         process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID && (
          <Script
            src="https://accounts.google.com/gsi/client"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased overflow-x-hidden",
          fontSans.variable,
          fontHeading.variable
        )}
        suppressHydrationWarning
      >
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <NextIntlClientProvider messages={messages}>
          <NextAuthSessionProvider>
            <ConvexClientProvider>
              <AppContextProvider>
                <ThemeProvider attribute="class" disableTransitionOnChange>
                  {children}
                </ThemeProvider>
              </AppContextProvider>
            </ConvexClientProvider>
          </NextAuthSessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
