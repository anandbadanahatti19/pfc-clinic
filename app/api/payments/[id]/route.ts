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

  const payment = await prisma.payment.findUnique({
    where: { id },
    select: {
      id: true,
      amount: true,
      method: true,
      status: true,
      receipt: true,
      description: true,
      date: true,
      createdAt: true,
      patient: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      receivedBy: {
        select: {
          name: true,
        },
      },
      appointment: {
        select: {
          type: true,
          doctor: true,
        },
      },
    },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  return NextResponse.json({ payment });
}
