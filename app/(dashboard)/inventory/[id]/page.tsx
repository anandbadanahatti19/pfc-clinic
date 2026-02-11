"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Minus, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "MEDICINE", label: "Medicine" },
  { value: "CONSUMABLE", label: "Consumable" },
  { value: "CLEANING", label: "Cleaning" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "OTHER", label: "Other" },
];

type Transaction = {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  createdAt: string;
  performedBy: { id: string; name: string } | null;
};

type InventoryItemDetail = {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  cost: string | null;
  supplier: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  addedBy: { id: string; name: string } | null;
  transactions: Transaction[];
};

function getStatusBadge(quantity: number, minQuantity: number) {
  if (quantity === 0) {
    return <Badge variant="destructive">OUT OF STOCK</Badge>;
  }
  if (quantity <= minQuantity) {
    return (
      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
        LOW STOCK
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-600 hover:bg-green-700 text-white">
      IN STOCK
    </Badge>
  );
}

function getTransactionBadge(type: string) {
  switch (type) {
    case "STOCK_IN":
      return <Badge className="bg-green-600 text-white">Stock In</Badge>;
    case "USED":
      return <Badge variant="destructive">Used</Badge>;
    case "ADJUSTED":
      return <Badge variant="secondary">Adjusted</Badge>;
    case "RETURNED":
      return <Badge className="bg-blue-600 text-white">Returned</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

export default function InventoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [item, setItem] = useState<InventoryItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [useStockOpen, setUseStockOpen] = useState(false);
  const [txSaving, setTxSaving] = useState(false);
  const [txForm, setTxForm] = useState({ quantity: "", reason: "" });
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    unit: "",
    minQuantity: "",
    cost: "",
    supplier: "",
    notes: "",
  });

  const fetchItem = useCallback(() => {
    fetch(`/api/inventory/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.item) {
          setItem(data.item);
          setEditForm({
            name: data.item.name,
            category: data.item.category,
            unit: data.item.unit,
            minQuantity: String(data.item.minQuantity),
            cost: data.item.cost ?? "",
            supplier: data.item.supplier ?? "",
            notes: data.item.notes ?? "",
          });
        }
      })
      .catch(() => toast.error("Failed to load item"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Item updated");
      setEditOpen(false);
      fetchItem();
    } catch {
      toast.error("Failed to update item");
    } finally {
      setSaving(false);
    }
  }

  async function handleTransaction(type: "STOCK_IN" | "USED") {
    setTxSaving(true);
    try {
      const res = await fetch(`/api/inventory/${id}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          quantity: parseInt(txForm.quantity, 10),
          reason: txForm.reason,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Transaction failed");
      }
      toast.success(type === "STOCK_IN" ? "Stock added" : "Stock removed");
      setAddStockOpen(false);
      setUseStockOpen(false);
      setTxForm({ quantity: "", reason: "" });
      fetchItem();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Transaction failed"
      );
    } finally {
      setTxSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Item not found</p>
        <Button asChild variant="link" className="mt-2">
          <Link href="/inventory">Back to Inventory</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{item.name}</h1>
            {getStatusBadge(item.quantity, item.minQuantity)}
          </div>
          <p className="text-muted-foreground">
            {CATEGORIES.find((c) => c.value === item.category)?.label} ·{" "}
            {item.unit}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Current Stock</p>
            <p className="text-2xl font-bold">
              {item.quantity}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {item.unit}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Min Quantity</p>
            <p className="text-2xl font-bold">{item.minQuantity}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Cost/Unit</p>
            <p className="text-2xl font-bold">
              {item.cost ? `₹${Number(item.cost).toLocaleString("en-IN")}` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Supplier</p>
            <p className="text-lg font-medium truncate">
              {item.supplier || "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Dialog open={addStockOpen} onOpenChange={setAddStockOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> Add Stock
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Stock — {item.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  value={txForm.quantity}
                  onChange={(e) =>
                    setTxForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                  placeholder={`Number of ${item.unit}`}
                />
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Input
                  value={txForm.reason}
                  onChange={(e) =>
                    setTxForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  placeholder="e.g. Purchased from supplier"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAddStockOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  disabled={!txForm.quantity || txSaving}
                  onClick={() => handleTransaction("STOCK_IN")}
                >
                  {txSaving && (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  )}
                  Add Stock
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={useStockOpen} onOpenChange={setUseStockOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Minus className="mr-1 h-4 w-4" /> Use / Remove
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Use / Remove — {item.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  max={item.quantity}
                  value={txForm.quantity}
                  onChange={(e) =>
                    setTxForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                  placeholder={`Max: ${item.quantity} ${item.unit}`}
                />
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Input
                  value={txForm.reason}
                  onChange={(e) =>
                    setTxForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  placeholder="e.g. Used for patient treatment"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setUseStockOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={!txForm.quantity || txSaving}
                  onClick={() => handleTransaction("USED")}
                >
                  {txSaving && (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  )}
                  Use / Remove
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Edit Details</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={editForm.category}
                    onValueChange={(v) =>
                      setEditForm((f) => ({ ...f, category: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    value={editForm.unit}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, unit: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Qty</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editForm.minQuantity}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        minQuantity: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cost/Unit</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.cost}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, cost: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Input
                  value={editForm.supplier}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, supplier: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {item.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {item.notes}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="hidden sm:table-cell">Reason</TableHead>
                <TableHead className="hidden sm:table-cell">By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-sm">
                    {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    <span className="text-muted-foreground ml-1 text-xs">
                      {new Date(tx.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </TableCell>
                  <TableCell>{getTransactionBadge(tx.type)}</TableCell>
                  <TableCell className="text-right font-mono">
                    <span
                      className={
                        tx.quantity > 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {tx.reason || "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                    {tx.performedBy?.name || "—"}
                  </TableCell>
                </TableRow>
              ))}
              {item.transactions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No transactions yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
