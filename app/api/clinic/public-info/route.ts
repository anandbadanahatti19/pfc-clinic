import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const clinicSlug = request.headers.get("x-clinic-slug");

  if (!clinicSlug) {
    return NextResponse.json(
      { error: "Clinic not found" },
      { status: 404 }
    );
  }

  const clinic = await prisma.clinic.findUnique({
    where: { slug: clinicSlug },
    select: {
      name: true,
      abbreviation: true,
      logoUrl: true,
    },
  });

  if (!clinic) {
    return NextResponse.json(
      { error: "Clinic not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ clinic });
}
