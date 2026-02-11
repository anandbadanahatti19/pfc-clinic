import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { Prisma } from "@/lib/generated/prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get("pfc-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      addedBy: { select: { id: true, name: true } },
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          performedBy: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ item });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get("pfc-token")?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, category, unit, minQuantity, cost, supplier, notes, isActive } = body;

    const data: Prisma.InventoryItemUpdateInput = {};
    if (name !== undefined) data.name = name;
    if (category !== undefined) data.category = category;
    if (unit !== undefined) data.unit = unit;
    if (minQuantity !== undefined) data.minQuantity = parseInt(minQuantity, 10);
    if (cost !== undefined) data.cost = cost ? new Prisma.Decimal(cost) : null;
    if (supplier !== undefined) data.supplier = supplier || null;
    if (notes !== undefined) data.notes = notes || null;
    if (isActive !== undefined) data.isActive = isActive;

    const item = await prisma.inventoryItem.update({
      where: { id },
      data,
    });

    return NextResponse.json({ item });
  } catch {
    return NextResponse.json(
      { error: "Failed to update inventory item" },
      { status: 500 }
    );
  }
}
