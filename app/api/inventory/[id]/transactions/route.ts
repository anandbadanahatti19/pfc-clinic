import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(
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
    const { type, quantity, reason } = body;

    if (!type || quantity == null || quantity === 0) {
      return NextResponse.json(
        { error: "Type and a non-zero quantity are required" },
        { status: 400 }
      );
    }

    const validTypes = ["STOCK_IN", "USED", "ADJUSTED", "RETURNED"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid transaction type" },
        { status: 400 }
      );
    }

    // Determine the quantity change
    const qty = parseInt(quantity, 10);
    let delta: number;
    switch (type) {
      case "STOCK_IN":
      case "RETURNED":
        delta = Math.abs(qty);
        break;
      case "USED":
        delta = -Math.abs(qty);
        break;
      case "ADJUSTED":
        delta = qty; // can be positive or negative
        break;
      default:
        delta = qty;
    }

    // Atomically update quantity and create transaction
    const [item, transaction] = await prisma.$transaction(async (tx) => {
      const currentItem = await tx.inventoryItem.findUnique({
        where: { id },
        select: { quantity: true },
      });

      if (!currentItem) {
        throw new Error("Item not found");
      }

      const newQuantity = currentItem.quantity + delta;
      if (newQuantity < 0) {
        throw new Error("Insufficient stock");
      }

      const updatedItem = await tx.inventoryItem.update({
        where: { id },
        data: { quantity: newQuantity },
      });

      const newTransaction = await tx.inventoryTransaction.create({
        data: {
          itemId: id,
          type,
          quantity: delta,
          reason: reason || null,
          performedById: user.userId,
        },
        include: {
          performedBy: { select: { id: true, name: true } },
        },
      });

      return [updatedItem, newTransaction];
    });

    return NextResponse.json({ item, transaction }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to record transaction";
    const status = message === "Item not found" ? 404 : message === "Insufficient stock" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
