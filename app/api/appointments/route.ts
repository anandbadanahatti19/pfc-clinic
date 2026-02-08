import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("pfc-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};

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
  const token = request.cookies.get("pfc-token")?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { patientId, date, time, type, doctor, notes } = body;

    if (!patientId || !date || !time || !type || !doctor) {
      return NextResponse.json(
        { error: "Patient, date, time, type and doctor are required" },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        date: new Date(date + "T00:00:00.000Z"),
        time,
        type,
        doctor,
        notes: notes || null,
        createdById: user.userId,
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
