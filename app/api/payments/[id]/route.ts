import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAuthError, requireFeature } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  const clinicId = auth.clinicId!;
  const featureCheck = await requireFeature(clinicId, "payments");
  if (featureCheck) return featureCheck;
  const { id } = await params;

  const payment = await prisma.payment.findFirst({
    where: { id, clinicId },
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
