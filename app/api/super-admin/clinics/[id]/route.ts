import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin, isAuthError } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin(request);
  if (isAuthError(auth)) return auth;

  const { id } = await params;

  const clinic = await prisma.clinic.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          patients: true,
          appointments: true,
          payments: true,
          followUps: true,
          inventoryItems: true,
        },
      },
    },
  });

  if (!clinic) {
    return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
  }

  return NextResponse.json({ clinic });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin(request);
  if (isAuthError(auth)) return auth;

  const { id } = await params;

  const existing = await prisma.clinic.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const {
      name,
      abbreviation,
      tagline,
      phone,
      email,
      address,
      city,
      doctors,
      timeSlots,
      enabledFeatures,
      isActive,
      plan,
    } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (abbreviation !== undefined) data.abbreviation = abbreviation;
    if (tagline !== undefined) data.tagline = tagline || null;
    if (phone !== undefined) data.phone = phone || null;
    if (email !== undefined) data.email = email || null;
    if (address !== undefined) data.address = address || null;
    if (city !== undefined) data.city = city || null;
    if (doctors !== undefined) data.doctors = doctors;
    if (timeSlots !== undefined) data.timeSlots = timeSlots;
    if (enabledFeatures !== undefined) data.enabledFeatures = enabledFeatures;
    if (isActive !== undefined) data.isActive = isActive;
    if (plan !== undefined) data.plan = plan;

    const clinic = await prisma.clinic.update({
      where: { id },
      data,
    });

    return NextResponse.json({ clinic });
  } catch {
    return NextResponse.json(
      { error: "Failed to update clinic" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin(request);
  if (isAuthError(auth)) return auth;

  const { id } = await params;

  const existing = await prisma.clinic.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
  }

  // Soft-delete: deactivate instead of hard delete
  const clinic = await prisma.clinic.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ clinic, message: "Clinic deactivated" });
}
