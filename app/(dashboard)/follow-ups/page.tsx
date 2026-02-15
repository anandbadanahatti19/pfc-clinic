"use client";
import { useFeatureGuard } from "@/lib/feature-guard";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

type PatientOption = {
  id: string;
  name: string;
  phone: string;
};

type FollowUp = {
  id: string;
  scheduledDate: string;
  reason: string;
  status: string;
  notes: string | null;
  patient: {
    id: string;
    name: string;
  };
};

const statusVariant = (status: string) => {
  switch (status) {
    case "COMPLETED": return "default" as const;
    case "CANCELLED": return "destructive" as const;
    case "SCHEDULED": return "secondary" as const;
    default: return "outline" as const;
  }
};

export default function FollowUpsPage() {
  useFeatureGuard("followups");
  const [statusFilter, setStatusFilter] = useState("all");
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [form, setForm] = useState({
    patientId: "",
    scheduledDate: "",
    reason: "",
    notes: "",
  });

  const fetchFollowUps = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/follow-ups?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFollowUps(data.followUps);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchFollowUps();
  }, [fetchFollowUps]);

  useEffect(() => {
    fetch("/api/patients")
      .then((res) => res.json())
      .then((data) => setPatients(data.patients || []))
      .catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/follow-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Follow-up created");
        setDialogOpen(false);
        setForm({ patientId: "", scheduledDate: "", reason: "", notes: "" });
        fetchFollowUps();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create follow-up");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const markComplete = async (id: string, patientName: string) => {
    try {
      const res = await fetch(`/api/follow-ups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (res.ok) {
        toast.success(`${patientName} marked as completed`);
        fetchFollowUps();
      } else {
        toast.error("Failed to update follow-up");
      }
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Follow-ups</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> Create Follow-up
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Follow-up</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <Label>Patient *</Label>
                <Select
                  value={form.patientId}
                  onValueChange={(v) => setForm({ ...form, patientId: v })}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {p.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fu-date">Scheduled Date *</Label>
                <Input
                  id="fu-date"
                  type="date"
                  required
                  value={form.scheduledDate}
                  onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fu-reason">Reason *</Label>
                <Input
                  id="fu-reason"
                  placeholder="Follow-up reason"
                  required
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fu-notes">Notes</Label>
                <Textarea
                  id="fu-notes"
                  placeholder="Additional notes..."
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  disabled={saving}
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create Follow-up"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="ml-auto">
              {followUps.length} follow-up{followUps.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {followUps.map((fu) => (
                  <TableRow key={fu.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/patients/${fu.patient.id}`}
                        className="hover:underline"
                      >
                        {fu.patient.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {new Date(fu.scheduledDate).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {fu.reason}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(fu.status)}>{fu.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {(fu.status === "PENDING" || fu.status === "SCHEDULED") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markComplete(fu.id, fu.patient.name)}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" /> Done
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {followUps.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No follow-ups found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
