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

  return {
    title: {
      template: `%s`,
      default: t("metadata.title") || "",
    },
    description: t("metadata.description") || "",
    keywords: t("metadata.keywords") || "",
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

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED === "true" && 
         process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID && (
          <script 
            src="https://accounts.google.com/gsi/client" 
            async 
            defer
          ></script>
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
