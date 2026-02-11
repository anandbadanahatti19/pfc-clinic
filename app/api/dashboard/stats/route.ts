import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("pfc-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );
  const todayEnd = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  );

  const [
    todayAppointments,
    totalPatients,
    todayPayments,
    pendingFollowUps,
    inventoryItems,
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: { date: todayStart },
      orderBy: { time: "asc" },
      select: {
        id: true,
        time: true,
        type: true,
        status: true,
        patient: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.patient.count(),
    prisma.payment.findMany({
      where: {
        date: { gte: todayStart, lte: todayEnd },
      },
      select: {
        amount: true,
        method: true,
      },
    }),
    prisma.followUp.findMany({
      where: { status: "PENDING" },
      orderBy: { scheduledDate: "asc" },
      take: 10,
      select: {
        id: true,
        scheduledDate: true,
        reason: true,
        patient: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.inventoryItem.findMany({
      where: { isActive: true },
      select: { quantity: true, minQuantity: true },
    }),
  ]);

  const lowStockCount = inventoryItems.filter(
    (i) => i.quantity <= i.minQuantity
  ).length;

  const todayCash = todayPayments
    .filter((p) => p.method === "CASH")
    .reduce((s, p) => s + Number(p.amount), 0);
  const todayOnline = todayPayments
    .filter((p) => p.method === "ONLINE")
    .reduce((s, p) => s + Number(p.amount), 0);

  return NextResponse.json({
    todayAppointments,
    todayAppointmentCount: todayAppointments.length,
    totalPatients,
    todayCollection: todayCash + todayOnline,
    todayCash,
    todayOnline,
    pendingFollowUps,
    pendingFollowUpCount: pendingFollowUps.length,
    lowStockCount,
  });
}
