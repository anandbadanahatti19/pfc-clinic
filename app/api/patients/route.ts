import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAuthError, requireFeature } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  const clinicId = auth.clinicId!;
  const featureCheck = await requireFeature(clinicId, "patients");
  if (featureCheck) return featureCheck;
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  const where: Record<string, unknown> = { clinicId };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  const patients = await prisma.patient.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      age: true,
      gender: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ patients });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  const clinicId = auth.clinicId!;
  const featureCheck = await requireFeature(clinicId, "patients");
  if (featureCheck) return featureCheck;
  try {
    const body = await request.json();
    const { name, phone, email, age, gender, medicalNotes } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.create({
      data: {
        name,
        phone,
        email: email || null,
        age: age ? parseInt(age, 10) : null,
        gender: gender || null,
        medicalNotes: medicalNotes || null,
        registeredById: auth.userId,
        clinicId,
      },
    });

    return NextResponse.json({ patient }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create patient" },
      { status: 500 }
    );
  }
}
