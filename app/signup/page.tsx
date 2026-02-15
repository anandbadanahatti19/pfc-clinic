"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FEATURES = [
  { key: "patients", label: "Patients" },
  { key: "appointments", label: "Appointments" },
  { key: "payments", label: "Payments" },
  { key: "followups", label: "Follow-ups" },
  { key: "inventory", label: "Inventory" },
  { key: "reports", label: "Reports" },
];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

function generateAbbreviation(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .map((w) => w[0])
    .join("")
    .slice(0, 5)
    .toUpperCase();
}

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ url: string; email: string } | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    clinicName: "",
    slug: "",
    abbreviation: "",
    phone: "",
    city: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    doctors: "",
  });
  const [features, setFeatures] = useState<Record<string, boolean>>({
    patients: true,
    appointments: true,
    payments: true,
    followups: true,
    inventory: true,
    reports: true,
  });

  const handleClinicNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      clinicName: name,
      slug: prev.slug === generateSlug(prev.clinicName) ? generateSlug(name) : prev.slug,
      abbreviation:
        prev.abbreviation === generateAbbreviation(prev.clinicName)
          ? generateAbbreviation(name)
          : prev.abbreviation,
    }));
  };

  const toggleFeature = (key: string) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const doctorsList = form.doctors
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);

      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          doctors: doctorsList,
          enabledFeatures: features,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      setSuccess({ url: data.clinic.url, email: data.admin.email });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Clinic Created!</CardTitle>
            <CardDescription>Your clinic is ready to use</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Your clinic URL</p>
              <a
                href={success.url}
                className="text-lg font-mono font-semibold text-primary hover:underline"
              >
                {success.url}
              </a>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Sign in at your clinic URL with:
              </p>
              <p className="font-medium text-foreground mt-1">{success.email}</p>
            </div>
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <a href={success.url + "/login"}>Go to Login</a>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Create Your Clinic</h1>
          <p className="text-muted-foreground mt-2">
            Set up your clinic management system in minutes
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Clinic Details</CardTitle>
            <CardDescription>
              Fill in the details to create your clinic account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Clinic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Clinic Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="clinicName">Clinic Name *</Label>
                    <Input
                      id="clinicName"
                      placeholder="e.g. Sunrise Fertility Centre"
                      value={form.clinicName}
                      onChange={(e) => handleClinicNameChange(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Clinic URL *</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        id="slug"
                        placeholder="sunrise-fertility"
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                        required
                        disabled={loading}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {form.slug ? `${form.slug}.lvh.me:3000` : "your-clinic.platform.com"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="abbreviation">Abbreviation *</Label>
                    <Input
                      id="abbreviation"
                      placeholder="SFC"
                      value={form.abbreviation}
                      onChange={(e) => setForm({ ...form, abbreviation: e.target.value.toUpperCase().slice(0, 5) })}
                      required
                      disabled={loading}
                      maxLength={5}
                    />
                    <p className="text-xs text-muted-foreground">Used for receipts and branding</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="+91-XXXXXXXXXX"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="e.g. Bengaluru"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="doctors">Doctors</Label>
                    <Input
                      id="doctors"
                      placeholder="Dr. Name 1, Dr. Name 2"
                      value={form.doctors}
                      onChange={(e) => setForm({ ...form, doctors: e.target.value })}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">Comma-separated list of doctor names</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Features
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {FEATURES.map((f) => (
                    <label
                      key={f.key}
                      className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-accent/50"
                    >
                      <Checkbox
                        checked={features[f.key]}
                        onCheckedChange={() => toggleFeature(f.key)}
                        disabled={loading}
                      />
                      <span className="text-sm font-medium">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Admin Account */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Admin Account
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="adminName">Admin Name *</Label>
                    <Input
                      id="adminName"
                      placeholder="Your full name"
                      value={form.adminName}
                      onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Email *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="admin@clinic.com"
                      value={form.adminEmail}
                      onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Password *</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      placeholder="Min 6 characters"
                      value={form.adminPassword}
                      onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Creating Clinic..." : "Create Clinic"}
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
