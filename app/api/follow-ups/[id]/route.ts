import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAuthError, requireFeature } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  const clinicId = auth.clinicId!;
  const featureCheck = await requireFeature(clinicId, "followups");
  if (featureCheck) return featureCheck;
  const { id } = await params;

  // Verify ownership
  const existing = await prisma.followUp.findFirst({
    where: { id, clinicId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const followUp = await prisma.followUp.update({
      where: { id },
      data: {
        status: status.toUpperCase(),
        ...(notes !== undefined && { notes: notes || null }),
      },
    });

    return NextResponse.json({ followUp });
  } catch {
    return NextResponse.json(
      { error: "Failed to update follow-up" },
      { status: 500 }
    );
  }
}
