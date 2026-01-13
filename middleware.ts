import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/",
    "/(zh)/:path*",
    // Exclude API routes, Next.js internals, static files, and other special paths
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
