import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — no auth needed
  if (pathname === "/login" || pathname.startsWith("/api/auth/")) {
    // If logged in and hitting /login, redirect to dashboard
    if (pathname === "/login") {
      const token = request.cookies.get("pfc-token")?.value;
      if (token) {
        try {
          await jwtVerify(token, getJwtSecret());
          return NextResponse.redirect(new URL("/dashboard", request.url));
        } catch {
          // Token invalid, let them see login page
        }
      }
    }
    return NextResponse.next();
  }

  // Protected routes — check JWT
  const token = request.cookies.get("pfc-token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, getJwtSecret());
    return NextResponse.next();
  } catch {
    // Token expired or invalid
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("pfc-token", "", { maxAge: 0, path: "/" });
    return response;
  }
}

export const config = {
  matcher: [
    // Protect all routes except static files and api/auth
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
