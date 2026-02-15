import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "clinic-session";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

function getRootDomain(): string {
  return process.env.ROOT_DOMAIN || "localhost:3000";
}

/**
 * Parse the subdomain from the hostname.
 * Examples:
 *   "prashanti.lvh.me:3000" with rootDomain "lvh.me:3000" → "prashanti"
 *   "lvh.me:3000" with rootDomain "lvh.me:3000" → null (root domain)
 *   "localhost:3000" with rootDomain "localhost:3000" → null (root domain)
 *   "prashanti.clinicapp.com" with rootDomain "clinicapp.com" → "prashanti"
 */
function parseSubdomain(hostname: string, rootDomain: string): string | null {
  // Strip port from both for comparison if needed
  const hostLower = hostname.toLowerCase();
  const rootLower = rootDomain.toLowerCase();

  // Exact match = root domain
  if (hostLower === rootLower || hostLower === `www.${rootLower}`) {
    return null;
  }

  // Check if hostname ends with .rootDomain
  const suffix = `.${rootLower}`;
  if (hostLower.endsWith(suffix)) {
    const sub = hostLower.slice(0, hostLower.length - suffix.length);
    // Only return single-level subdomains (no dots)
    if (sub && !sub.includes(".")) {
      return sub;
    }
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;
  const rootDomain = getRootDomain();
  const subdomain = parseSubdomain(hostname, rootDomain);

  // ─── Root Domain ───
  // Only allow: /, /signup, /super-admin/*, /api/signup, /api/super-admin/*, /api/clinic/*
  if (!subdomain) {
    const rootAllowed = [
      "/",
      "/signup",
      "/super-admin",
      "/api/signup",
      "/api/super-admin",
      "/api/clinic",
      "/api/auth", // super-admin auth routes
    ];
    const isAllowed =
      pathname === "/" ||
      rootAllowed.some(
        (p) => p !== "/" && (pathname === p || pathname.startsWith(p + "/"))
      );

    if (!isAllowed) {
      // Static assets and Next.js internals should pass through
      if (
        pathname.startsWith("/_next/") ||
        pathname.startsWith("/favicon") ||
        pathname.endsWith(".svg") ||
        pathname.endsWith(".png") ||
        pathname.endsWith(".ico")
      ) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // ─── Clinic Subdomain ───
  // Inject the clinic slug as a header for API routes to read
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-clinic-slug", subdomain);

  // Public routes on clinic subdomain — no auth needed
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/clinic/")
  ) {
    // If logged in and hitting /login, redirect to dashboard
    if (pathname === "/login") {
      const token = request.cookies.get(COOKIE_NAME)?.value;
      if (token) {
        try {
          await jwtVerify(token, getJwtSecret());
          return NextResponse.redirect(new URL("/dashboard", request.url));
        } catch {
          // Token invalid, let them see login page
        }
      }
    }
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Protected routes — check JWT
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, getJwtSecret());
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch {
    // Token expired or invalid
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return response;
  }
}

export const config = {
  matcher: [
    // Protect all routes except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
