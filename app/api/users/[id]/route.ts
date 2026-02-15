import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAuthError } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  const clinicId = auth.clinicId;
  if (!clinicId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findFirst({
    where: { id, clinicId, role: { not: "SUPER_ADMIN" } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          registeredPatients: true,
          createdAppointments: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  if (auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clinicId = auth.clinicId;
  if (!clinicId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Cannot edit self
  if (id === auth.userId) {
    return NextResponse.json(
      { error: "Cannot modify your own account from this page" },
      { status: 400 }
    );
  }

  // Verify ownership
  const existing = await prisma.user.findFirst({
    where: { id, clinicId, role: { not: "SUPER_ADMIN" } },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { name, email, role, isActive } = body;

    // Validate role if provided
    if (role !== undefined) {
      const allowedRoles = ["RECEPTIONIST", "NURSE", "LAB_TECHNICIAN"];
      if (!allowedRoles.includes(role)) {
        return NextResponse.json(
          { error: "Invalid role. Allowed: RECEPTIONIST, NURSE, LAB_TECHNICIAN" },
          { status: 400 }
        );
      }
    }

    // Check email uniqueness if changing email
    if (email !== undefined) {
      const emailTaken = await prisma.user.findFirst({
        where: { email, clinicId, id: { not: id } },
        select: { id: true },
      });
      if (emailTaken) {
        return NextResponse.json(
          { error: "A user with this email already exists in this clinic" },
          { status: 409 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
