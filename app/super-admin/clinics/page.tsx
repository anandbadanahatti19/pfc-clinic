"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Loader2, ExternalLink } from "lucide-react";

type ClinicRow = {
  id: string;
  name: string;
  slug: string;
  abbreviation: string;
  city: string | null;
  isActive: boolean;
  plan: string;
  createdAt: string;
  _count: {
    users: number;
    patients: number;
  };
};

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchClinics = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const params = query ? `?search=${encodeURIComponent(query)}` : "";
      const res = await fetch(`/api/super-admin/clinics${params}`);
      const data = await res.json();
      setClinics(data.clinics || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClinics("");
  }, [fetchClinics]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchClinics(search), 300);
    return () => clearTimeout(timeout);
  }, [search, fetchClinics]);

  const rootDomain = "lvh.me:3000";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clinics</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Clinics ({clinics.length})</span>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clinics..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : clinics.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No clinics found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clinic</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Patients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clinics.map((clinic) => (
                  <TableRow key={clinic.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{clinic.name}</p>
                        <p className="text-xs text-muted-foreground">{clinic.abbreviation}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <a
                        href={`http://${clinic.slug}.${rootDomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {clinic.slug}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>{clinic.city || "—"}</TableCell>
                    <TableCell>{clinic._count.users}</TableCell>
                    <TableCell>{clinic._count.patients}</TableCell>
                    <TableCell>
                      <Badge variant={clinic.isActive ? "default" : "secondary"}>
                        {clinic.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/super-admin/clinics/${clinic.id}`}>
                          Edit
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
