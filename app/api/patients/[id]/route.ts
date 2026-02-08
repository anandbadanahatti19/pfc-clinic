import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get("pfc-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
          time: true,
          type: true,
          doctor: true,
          status: true,
          notes: true,
        },
      },
      payments: {
        orderBy: { date: "desc" },
        select: {
          id: true,
          amount: true,
          method: true,
          status: true,
          receipt: true,
          description: true,
          date: true,
        },
      },
      followUps: {
        orderBy: { scheduledDate: "desc" },
        select: {
          id: true,
          scheduledDate: true,
          reason: true,
          status: true,
          notes: true,
        },
      },
    },
  });

  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  return NextResponse.json({ patient });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get("pfc-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, phone, email, age, gender, medicalNotes } = body;

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email: email || null }),
        ...(age !== undefined && { age: age ? parseInt(age, 10) : null }),
        ...(gender !== undefined && { gender: gender || null }),
        ...(medicalNotes !== undefined && { medicalNotes: medicalNotes || null }),
      },
    });

    return NextResponse.json({ patient });
  } catch {
    return NextResponse.json(
      { error: "Failed to update patient" },
      { status: 500 }
    );
  }
}
