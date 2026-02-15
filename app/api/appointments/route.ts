import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAuthError, requireFeature } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  const clinicId = auth.clinicId!;
  const featureCheck = await requireFeature(clinicId, "appointments");
  if (featureCheck) return featureCheck;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { clinicId };

  if (date) {
    where.date = new Date(date + "T00:00:00.000Z");
  }
  if (status && status !== "all") {
    where.status = status.toUpperCase();
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { time: "asc" },
    select: {
      id: true,
      date: true,
      time: true,
      type: true,
      doctor: true,
      status: true,
      notes: true,
      patient: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  return NextResponse.json({ appointments });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  const clinicId = auth.clinicId!;
  const featureCheck = await requireFeature(clinicId, "appointments");
  if (featureCheck) return featureCheck;
  try {
    const body = await request.json();
    const { patientId, date, time, type, doctor, notes } = body;

    if (!patientId || !date || !time || !type || !doctor) {
      return NextResponse.json(
        { error: "Patient, date, time, type and doctor are required" },
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

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        date: new Date(date + "T00:00:00.000Z"),
        time,
        type,
        doctor,
        notes: notes || null,
        createdById: auth.userId,
        clinicId,
      },
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}
