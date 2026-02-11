import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const items = [
  { name: "Progesterone Injection 50mg", category: "MEDICINE" as const, unit: "vials", quantity: 45, minQuantity: 10, cost: 320, supplier: "Sun Pharma" },
  { name: "Folic Acid 5mg Tablets", category: "MEDICINE" as const, unit: "strips", quantity: 120, minQuantity: 30, cost: 25, supplier: "Cipla" },
  { name: "Estradiol Valerate 2mg", category: "MEDICINE" as const, unit: "strips", quantity: 60, minQuantity: 15, cost: 180, supplier: "Zydus Healthcare" },
  { name: "HCG Injection 5000 IU", category: "MEDICINE" as const, unit: "vials", quantity: 8, minQuantity: 10, cost: 450, supplier: "Intas Pharmaceuticals" },
  { name: "Letrozole 2.5mg Tablets", category: "MEDICINE" as const, unit: "strips", quantity: 50, minQuantity: 20, cost: 95, supplier: "Sun Pharma" },
  { name: "Clomiphene Citrate 50mg", category: "MEDICINE" as const, unit: "strips", quantity: 35, minQuantity: 15, cost: 65, supplier: "Cipla" },
  { name: "Cabergoline 0.5mg Tablets", category: "MEDICINE" as const, unit: "strips", quantity: 12, minQuantity: 5, cost: 280, supplier: "Sun Pharma" },
  { name: "Dydrogesterone 10mg", category: "MEDICINE" as const, unit: "strips", quantity: 80, minQuantity: 25, cost: 210, supplier: "Abbott" },
  { name: "Metformin 500mg Tablets", category: "MEDICINE" as const, unit: "strips", quantity: 100, minQuantity: 30, cost: 18, supplier: "USV Pvt Ltd" },
  { name: "Cetrotide 0.25mg Injection", category: "MEDICINE" as const, unit: "vials", quantity: 3, minQuantity: 5, cost: 2800, supplier: "Merck" },
  { name: "Disposable Syringes 5ml", category: "CONSUMABLE" as const, unit: "boxes", quantity: 25, minQuantity: 10, cost: 180, supplier: "Hindustan Syringes" },
  { name: "Surgical Gloves (Medium)", category: "CONSUMABLE" as const, unit: "boxes", quantity: 15, minQuantity: 8, cost: 350, supplier: "Ansell Healthcare" },
  { name: "Sterile Cotton Rolls", category: "CONSUMABLE" as const, unit: "packs", quantity: 30, minQuantity: 10, cost: 85, supplier: "Reliance Medical" },
  { name: "Ultrasound Gel 250ml", category: "CONSUMABLE" as const, unit: "bottles", quantity: 10, minQuantity: 5, cost: 120, supplier: "Anagel" },
  { name: "Specimen Containers", category: "CONSUMABLE" as const, unit: "pcs", quantity: 200, minQuantity: 50, cost: 8, supplier: "Polylab" },
  { name: "IV Cannula 20G", category: "CONSUMABLE" as const, unit: "boxes", quantity: 18, minQuantity: 5, cost: 450, supplier: "BD Medical" },
  { name: "Face Masks (3-ply)", category: "CONSUMABLE" as const, unit: "boxes", quantity: 0, minQuantity: 10, cost: 150, supplier: "Venus Safety" },
  { name: "Tissue Paper Rolls", category: "CONSUMABLE" as const, unit: "packs", quantity: 20, minQuantity: 8, cost: 45, supplier: "Local Supplier" },
  { name: "Hand Sanitizer 500ml", category: "CLEANING" as const, unit: "bottles", quantity: 12, minQuantity: 5, cost: 160, supplier: "Godrej Consumer" },
  { name: "Floor Cleaner (Disinfectant)", category: "CLEANING" as const, unit: "bottles", quantity: 6, minQuantity: 3, cost: 220, supplier: "Reckitt Benckiser" },
  { name: "Surface Disinfectant Spray", category: "CLEANING" as const, unit: "cans", quantity: 4, minQuantity: 4, cost: 350, supplier: "3M India" },
  { name: "Liquid Hand Wash 1L", category: "CLEANING" as const, unit: "bottles", quantity: 8, minQuantity: 4, cost: 180, supplier: "Dettol" },
  { name: "Biohazard Disposal Bags", category: "CLEANING" as const, unit: "packs", quantity: 15, minQuantity: 5, cost: 90, supplier: "Polylab" },
  { name: "Digital Thermometer", category: "EQUIPMENT" as const, unit: "pcs", quantity: 5, minQuantity: 2, cost: 250, supplier: "Omron Healthcare" },
  { name: "BP Monitor Cuffs", category: "EQUIPMENT" as const, unit: "pcs", quantity: 3, minQuantity: 2, cost: 600, supplier: "Omron Healthcare" },
  { name: "Examination Table Paper Roll", category: "EQUIPMENT" as const, unit: "rolls", quantity: 10, minQuantity: 4, cost: 180, supplier: "Medline Industries" },
];

export async function POST(request: NextRequest) {
  const token = request.cookies.get("pfc-token")?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  try {
    // Check if inventory already has items
    const existing = await prisma.inventoryItem.count();
    if (existing > 0) {
      return NextResponse.json(
        { error: `Inventory already has ${existing} items. Delete them first if you want to re-seed.` },
        { status: 400 }
      );
    }

    const created = [];
    for (const item of items) {
      const record = await prisma.inventoryItem.create({
        data: {
          name: item.name,
          category: item.category,
          unit: item.unit,
          quantity: item.quantity,
          minQuantity: item.minQuantity,
          cost: item.cost,
          supplier: item.supplier,
          addedById: user.userId,
        },
      });

      if (item.quantity > 0) {
        await prisma.inventoryTransaction.create({
          data: {
            itemId: record.id,
            type: "STOCK_IN",
            quantity: item.quantity,
            reason: "Initial stock",
            performedById: user.userId,
          },
        });
      }

      created.push(record.name);
    }

    return NextResponse.json({ message: `Seeded ${created.length} inventory items`, items: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to seed inventory" }, { status: 500 });
  }
}
