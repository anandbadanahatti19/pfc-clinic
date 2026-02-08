import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { Prisma } from "@/lib/generated/prisma/client";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("pfc-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const method = searchParams.get("method");

  const where: Record<string, unknown> = {};

  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from + "T00:00:00.000Z");
    if (to) dateFilter.lte = new Date(to + "T23:59:59.999Z");
    where.date = dateFilter;
  }
  if (method && method !== "all") {
    where.method = method.toUpperCase();
  }

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { date: "desc" },
    select: {
      id: true,
      amount: true,
      method: true,
      status: true,
      receipt: true,
      description: true,
      date: true,
      patient: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Compute total
  const total = payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  return NextResponse.json({ payments, total });
}

async function generateReceipt(): Promise<string> {
  const today = new Date();
  const dateStr =
    today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, "0") +
    today.getDate().toString().padStart(2, "0");
  const prefix = `PFC-${dateStr}-`;

  // Find the latest receipt for today
  const latest = await prisma.payment.findFirst({
    where: { receipt: { startsWith: prefix } },
    orderBy: { receipt: "desc" },
    select: { receipt: true },
  });

  let seq = 1;
  if (latest) {
    const lastNum = parseInt(latest.receipt.split("-")[2], 10);
    if (!isNaN(lastNum)) seq = lastNum + 1;
  }

  return `${prefix}${seq.toString().padStart(3, "0")}`;
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("pfc-token")?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { patientId, amount, method, description, date } = body;

    if (!patientId || !amount || !method) {
      return NextResponse.json(
        { error: "Patient, amount and method are required" },
        { status: 400 }
      );
    }

    const receipt = await generateReceipt();

    const payment = await prisma.payment.create({
      data: {
        patientId,
        amount: new Prisma.Decimal(amount),
        method: method.toUpperCase(),
        receipt,
        description: description || null,
        date: date ? new Date(date + "T00:00:00.000Z") : new Date(),
        receivedById: user.userId,
      },
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}
