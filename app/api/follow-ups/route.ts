import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAuthError, requireFeature } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  const clinicId = auth.clinicId!;
  const featureCheck = await requireFeature(clinicId, "followups");
  if (featureCheck) return featureCheck;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { clinicId };
  if (status && status !== "all") {
    where.status = status.toUpperCase();
  }

  const followUps = await prisma.followUp.findMany({
    where,
    orderBy: { scheduledDate: "asc" },
    select: {
      id: true,
      scheduledDate: true,
      reason: true,
      status: true,
      notes: true,
      patient: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json({ followUps });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  const clinicId = auth.clinicId!;
  const featureCheck = await requireFeature(clinicId, "followups");
  if (featureCheck) return featureCheck;
  try {
    const body = await request.json();
    const { patientId, scheduledDate, reason, notes } = body;

    if (!patientId || !scheduledDate || !reason) {
      return NextResponse.json(
        { error: "Patient, scheduled date and reason are required" },
        { status: 400 }
      );
    }

    // Cross-tenant validation: ensure patient belongs to this clinic
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId },
      select: { id: true },
    });
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const followUp = await prisma.followUp.create({
      data: {
        patientId,
        scheduledDate: new Date(scheduledDate + "T00:00:00.000Z"),
        reason,
        notes: notes || null,
        createdById: auth.userId,
        clinicId,
      },
    });

    return NextResponse.json({ followUp }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create follow-up" },
      { status: 500 }
    );
  }
}
