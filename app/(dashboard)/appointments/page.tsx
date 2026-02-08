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
import { Plus, Check, X as XIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Appointment = {
  id: string;
  date: string;
  time: string;
  type: string;
  doctor: string;
  status: string;
  patient: {
    id: string;
    name: string;
    phone: string;
  };
};

const statusVariant = (status: string) => {
  switch (status) {
    case "COMPLETED": return "default" as const;
    case "CANCELLED": return "destructive" as const;
    case "NO_SHOW": return "outline" as const;
    default: return "secondary" as const;
  }
};

export default function AppointmentsPage() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [statusFilter, setStatusFilter] = useState("all");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/appointments?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments);
      }
    } finally {
      setLoading(false);
    }
  }, [date, statusFilter]);

  useEffect(() => {
    setLoading(true);
    fetchAppointments();
  }, [fetchAppointments]);

  const updateStatus = async (id: string, status: string, patientName: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`${patientName} marked ${status.toLowerCase()}`);
        fetchAppointments();
      } else {
        toast.error("Failed to update appointment");
      }
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <Button asChild>
          <Link href="/appointments/new">
            <Plus className="mr-1 h-4 w-4" /> New Appointment
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Date:</span>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant="outline" className="ml-auto">
              {appointments.length} appointment{appointments.length !== 1 ? "s" : ""}
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
                  <TableHead>Time</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((apt) => (
                  <TableRow key={apt.id}>
                    <TableCell className="font-mono">{apt.time}</TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/patients/${apt.patient.id}`} className="hover:underline">
                        {apt.patient.name}
                      </Link>
                    </TableCell>
                    <TableCell>{apt.type}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {apt.doctor}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(apt.status)}>
                        {apt.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {apt.status === "SCHEDULED" && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              title="Mark complete"
                              onClick={() => updateStatus(apt.id, "COMPLETED", apt.patient.name)}
                            >
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              title="Cancel"
                              onClick={() => updateStatus(apt.id, "CANCELLED", apt.patient.name)}
                            >
                              <XIcon className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {appointments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No appointments for this date
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
