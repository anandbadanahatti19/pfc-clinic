import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("pfc-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
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
  const token = request.cookies.get("pfc-token")?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { patientId, scheduledDate, reason, notes } = body;

    if (!patientId || !scheduledDate || !reason) {
      return NextResponse.json(
        { error: "Patient, scheduled date and reason are required" },
        { status: 400 }
      );
    }

    const followUp = await prisma.followUp.create({
      data: {
        patientId,
        scheduledDate: new Date(scheduledDate + "T00:00:00.000Z"),
        reason,
        notes: notes || null,
        createdById: user.userId,
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
