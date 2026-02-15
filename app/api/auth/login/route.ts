import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Resolve clinic from subdomain header (set by middleware)
    const clinicSlug = request.headers.get("x-clinic-slug");

    // Super-admin login (no clinic slug — root domain)
    if (!clinicSlug) {
      const user = await prisma.user.findFirst({
        where: { email, clinicId: null, role: "SUPER_ADMIN" },
      });

      if (!user || !user.isActive) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      const valid = await verifyPassword(password, user.password);
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      const token = await signToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clinicId: null,
        clinicSlug: null,
      });

      const response = NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          clinicId: null,
          clinicSlug: null,
        },
      });

      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 8 * 60 * 60,
        path: "/",
      });

      return response;
    }

    // Clinic user login — resolve clinic by slug
    const clinic = await prisma.clinic.findUnique({
      where: { slug: clinicSlug },
    });

    if (!clinic || !clinic.isActive) {
      return NextResponse.json(
        { error: "Clinic not found or inactive" },
        { status: 404 }
      );
    }

    // Find user scoped to this clinic
    const user = await prisma.user.findFirst({
      where: { email, clinicId: clinic.id },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      clinicId: clinic.id,
      clinicSlug: clinic.slug,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: clinic.id,
        clinicSlug: clinic.slug,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
