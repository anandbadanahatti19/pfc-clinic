import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

const DEFAULT_TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
];

const ALL_FEATURES = {
  patients: true,
  appointments: true,
  payments: true,
  followups: true,
  inventory: true,
  reports: true,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clinicName,
      slug,
      abbreviation,
      adminName,
      adminEmail,
      adminPassword,
      enabledFeatures,
      doctors,
      phone,
      city,
    } = body;

    // Validate required fields
    if (!clinicName || !slug || !abbreviation || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug must contain only lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    if (slug.length < 3 || slug.length > 50) {
      return NextResponse.json(
        { error: "Slug must be between 3 and 50 characters" },
        { status: 400 }
      );
    }

    if (adminPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await prisma.clinic.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This clinic URL is already taken. Please choose a different one." },
        { status: 409 }
      );
    }

    // Create clinic and admin user in a transaction
    const hashedPassword = await hashPassword(adminPassword);

    const features = enabledFeatures
      ? { ...ALL_FEATURES, ...enabledFeatures }
      : ALL_FEATURES;

    const result = await prisma.$transaction(async (tx) => {
      const clinic = await tx.clinic.create({
        data: {
          name: clinicName,
          slug,
          abbreviation: abbreviation.toUpperCase(),
          phone: phone || null,
          city: city || null,
          doctors: doctors?.length ? doctors : [],
          timeSlots: DEFAULT_TIME_SLOTS,
          enabledFeatures: features,
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

    const rootDomain = process.env.ROOT_DOMAIN || "lvh.me:3000";
    const protocol = rootDomain.includes("localhost") || rootDomain.includes("lvh.me") ? "http" : "https";
    const clinicUrl = `${protocol}://${slug}.${rootDomain}`;

    return NextResponse.json(
      {
        message: "Clinic created successfully",
        clinic: {
          id: result.clinic.id,
          name: result.clinic.name,
          slug: result.clinic.slug,
          url: clinicUrl,
        },
        admin: {
          id: result.admin.id,
          name: result.admin.name,
          email: result.admin.email,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create clinic. Please try again." },
      { status: 500 }
    );
  }
}
