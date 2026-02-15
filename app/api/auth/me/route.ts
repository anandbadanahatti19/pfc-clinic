import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Fetch clinic config if user belongs to a clinic
  let clinic = null;
  if (payload.clinicId) {
    clinic = await prisma.clinic.findUnique({
      where: { id: payload.clinicId },
      select: {
        id: true,
        name: true,
        slug: true,
        abbreviation: true,
        tagline: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        logoUrl: true,
        doctors: true,
        timeSlots: true,
        enabledFeatures: true,
      },
    });
  }

  return NextResponse.json({
    user: {
      id: payload.userId,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      clinicId: payload.clinicId,
      clinicSlug: payload.clinicSlug,
    },
    clinic,
  });
}
