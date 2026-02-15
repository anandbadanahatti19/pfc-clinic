"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

type ClinicDetail = {
  id: string;
  name: string;
  slug: string;
  abbreviation: string;
  tagline: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  doctors: string[];
  timeSlots: string[];
  enabledFeatures: Record<string, boolean>;
  isActive: boolean;
  plan: string;
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  }[];
  _count: {
    patients: number;
    appointments: number;
    payments: number;
    followUps: number;
    inventoryItems: number;
  };
};

const FEATURES = [
  { key: "patients", label: "Patients" },
  { key: "appointments", label: "Appointments" },
  { key: "payments", label: "Payments" },
  { key: "followups", label: "Follow-ups" },
  { key: "inventory", label: "Inventory" },
  { key: "reports", label: "Reports" },
];

export default function ClinicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [clinic, setClinic] = useState<ClinicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    abbreviation: "",
    tagline: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    doctors: "",
    timeSlots: "",
    isActive: true,
  });
  const [features, setFeatures] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`/api/super-admin/clinics/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.clinic) {
          const c = data.clinic;
          setClinic(c);
          setForm({
            name: c.name,
            abbreviation: c.abbreviation,
            tagline: c.tagline || "",
            phone: c.phone || "",
            email: c.email || "",
            address: c.address || "",
            city: c.city || "",
            doctors: (c.doctors || []).join(", "),
            timeSlots: (c.timeSlots || []).join(", "),
            isActive: c.isActive,
          });
          setFeatures(c.enabledFeatures || {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const doctors = form.doctors
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
      const timeSlots = form.timeSlots
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/super-admin/clinics/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          doctors,
          timeSlots,
          enabledFeatures: features,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save");
        return;
      }

      toast.success("Clinic updated successfully");
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm("Are you sure you want to deactivate this clinic?")) return;

    const res = await fetch(`/api/super-admin/clinics/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Clinic deactivated");
      router.push("/super-admin/clinics");
    } else {
      toast.error("Failed to deactivate");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Clinic not found</p>
        <Button asChild variant="link" className="mt-2">
          <Link href="/super-admin/clinics">Back to Clinics</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href="/super-admin/clinics">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{clinic.name}</h1>
          <p className="text-sm text-muted-foreground font-mono">{clinic.slug}</p>
        </div>
        <Badge variant={form.isActive ? "default" : "secondary"}>
          {form.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Patients", value: clinic._count.patients },
          { label: "Appointments", value: clinic._count.appointments },
          { label: "Payments", value: clinic._count.payments },
          { label: "Follow-ups", value: clinic._count.followUps },
          { label: "Inventory", value: clinic._count.inventoryItems },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Clinic Details */}
      <Card>
        <CardHeader>
          <CardTitle>Clinic Settings</CardTitle>
          <CardDescription>Update clinic information and features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Abbreviation</Label>
              <Input
                value={form.abbreviation}
                onChange={(e) => setForm({ ...form, abbreviation: e.target.value })}
                maxLength={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="Specialised in..."
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Doctors (comma-separated)</Label>
              <Input
                value={form.doctors}
                onChange={(e) => setForm({ ...form, doctors: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Time Slots (comma-separated)</Label>
              <Input
                value={form.timeSlots}
                onChange={(e) => setForm({ ...form, timeSlots: e.target.value })}
              />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Enabled Features</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {FEATURES.map((f) => (
                <label
                  key={f.key}
                  className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-accent/50"
                >
                  <Checkbox
                    checked={features[f.key] !== false}
                    onCheckedChange={(checked) =>
                      setFeatures({ ...features, [f.key]: !!checked })
                    }
                  />
                  <span className="text-sm font-medium">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Clinic Active</p>
              <p className="text-sm text-muted-foreground">
                Inactive clinics cannot be accessed by their users
              </p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            {clinic.isActive && (
              <Button variant="destructive" onClick={handleDeactivate}>
                Deactivate Clinic
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({clinic.users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {clinic.users.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{u.role}</Badge>
                  <Badge variant={u.isActive ? "default" : "secondary"}>
                    {u.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
