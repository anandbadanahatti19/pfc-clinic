import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin, isAuthError } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (isAuthError(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
          { city: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const clinics = await prisma.clinic.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      abbreviation: true,
      city: true,
      isActive: true,
      plan: true,
      createdAt: true,
      _count: {
        select: {
          users: true,
          patients: true,
        },
      },
    },
  });

  return NextResponse.json({ clinics });
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const {
      name,
      slug,
      abbreviation,
      adminName,
      adminEmail,
      adminPassword,
      phone,
      city,
      doctors,
      timeSlots,
      enabledFeatures,
    } = body;

    if (!name || !slug || !abbreviation || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    const existing = await prisma.clinic.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Slug already in use" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(adminPassword);

    const result = await prisma.$transaction(async (tx) => {
      const clinic = await tx.clinic.create({
        data: {
          name,
          slug,
          abbreviation,
          phone: phone || null,
          city: city || null,
          doctors: doctors || [],
          timeSlots: timeSlots || [
            "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
            "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
          ],
          enabledFeatures: enabledFeatures || {
            patients: true,
            appointments: true,
            payments: true,
            followups: true,
            inventory: true,
            reports: true,
          },
        },
      });

      const admin = await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail.toLowerCase(),
          password: hashedPassword,
          role: "ADMIN",
          clinicId: clinic.id,
        },
      });

      return { clinic, admin };
    });

    return NextResponse.json({ clinic: result.clinic, admin: { id: result.admin.id, name: result.admin.name, email: result.admin.email } }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create clinic" },
      { status: 500 }
    );
  }
}
