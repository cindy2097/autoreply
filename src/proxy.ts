import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // First, handle i18n routing
  const response = intlMiddleware(request);

  // Extract locale from pathname
  const { pathname } = request.nextUrl;
  const lang = pathname.split("/")[1];
  const isValidLocale = routing.locales.includes(lang as "en" | "zh" | "ar");
  const locale = isValidLocale ? lang : routing.defaultLocale;

  // Public paths that don't require auth
  const publicPaths = [`/${locale}/login`, `/${locale}/register`, `/${locale}`];
  const isPublicPath = publicPaths.includes(pathname) || pathname === `/${locale}`;

  // Check auth for protected paths
  if (!isPublicPath) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            for (const { name, value } of cookiesToSet) {
              request.cookies.set(name, value);
            }
          },
        },
      },
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
