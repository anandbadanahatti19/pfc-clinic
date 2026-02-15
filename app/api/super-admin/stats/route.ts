import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin, isAuthError } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (isAuthError(auth)) return auth;

  const [totalClinics, activeClinics, totalUsers, totalPatients] =
    await Promise.all([
      prisma.clinic.count(),
      prisma.clinic.count({ where: { isActive: true } }),
      prisma.user.count({ where: { clinicId: { not: null } } }),
      prisma.patient.count(),
    ]);

  return NextResponse.json({
    totalClinics,
    activeClinics,
    inactiveClinics: totalClinics - activeClinics,
    totalUsers,
    totalPatients,
  });
}
