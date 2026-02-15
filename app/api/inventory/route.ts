import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, isAuthError, requireFeature } from "@/lib/api-auth";
import { Prisma, ItemCategory } from "@/lib/generated/prisma/client";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  const clinicId = auth.clinicId!;
  const featureCheck = await requireFeature(clinicId, "inventory");
  if (featureCheck) return featureCheck;
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const lowStock = searchParams.get("lowStock") === "true";

  const where: Prisma.InventoryItemWhereInput = { clinicId, isActive: true };

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
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  const clinicId = auth.clinicId!;
  const featureCheck = await requireFeature(clinicId, "inventory");
  if (featureCheck) return featureCheck;
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
        addedById: auth.userId,
        clinicId,
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
          performedById: auth.userId,
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
