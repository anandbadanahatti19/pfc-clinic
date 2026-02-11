import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { Prisma, ItemCategory } from "@/lib/generated/prisma/client";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("pfc-token")?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const lowStock = searchParams.get("lowStock") === "true";

  const where: Prisma.InventoryItemWhereInput = { isActive: true };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { supplier: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category && Object.values(ItemCategory).includes(category as ItemCategory)) {
    where.category = category as ItemCategory;
  }

  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: { name: "asc" },
  });

  if (lowStock) {
    const filtered = items.filter((i) => i.quantity <= i.minQuantity);
    return NextResponse.json({ items: filtered });
  }

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("pfc-token")?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, category, unit, quantity, minQuantity, cost, supplier, notes } = body;

    if (!name || !category || !unit || quantity == null || minQuantity == null) {
      return NextResponse.json(
        { error: "Name, category, unit, quantity, and minQuantity are required" },
        { status: 400 }
      );
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        category,
        unit,
        quantity: parseInt(quantity, 10),
        minQuantity: parseInt(minQuantity, 10),
        cost: cost ? new Prisma.Decimal(cost) : null,
        supplier: supplier || null,
        notes: notes || null,
        addedById: user.userId,
      },
    });

    // Record initial stock transaction if quantity > 0
    if (parseInt(quantity, 10) > 0) {
      await prisma.inventoryTransaction.create({
        data: {
          itemId: item.id,
          type: "STOCK_IN",
          quantity: parseInt(quantity, 10),
          reason: "Initial stock",
          performedById: user.userId,
        },
      });
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    );
  }
}
