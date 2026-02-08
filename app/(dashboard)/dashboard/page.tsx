"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Users,
  CreditCard,
  ClipboardList,
  Plus,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type DashboardStats = {
  todayAppointments: {
    id: string;
    time: string;
    type: string;
    status: string;
    patient: { id: string; name: string };
  }[];
  todayAppointmentCount: number;
  totalPatients: number;
  todayCollection: number;
  pendingFollowUps: {
    id: string;
    scheduledDate: string;
    reason: string;
    patient: { id: string; name: string };
  }[];
  pendingFollowUpCount: number;
};

const statusVariant = (status: string) => {
  switch (status) {
    case "COMPLETED": return "default" as const;
    case "CANCELLED": return "destructive" as const;
    default: return "secondary" as const;
  }
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const statCards = [
    {
      label: "Today's Appointments",
      value: stats?.todayAppointmentCount ?? "-",
      icon: CalendarDays,
      href: "/appointments",
    },
    {
      label: "Total Patients",
      value: stats?.totalPatients ?? "-",
      icon: Users,
      href: "/patients",
    },
    {
      label: "Today's Collection",
      value: stats ? `₹${stats.todayCollection.toLocaleString("en-IN")}` : "-",
      icon: CreditCard,
      href: "/payments",
    },
    {
      label: "Pending Follow-ups",
      value: stats?.pendingFollowUpCount ?? "-",
      icon: ClipboardList,
      href: "/follow-ups",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome, {user?.name?.split(" ")[0] ?? "Doctor"}
        </h1>
        <p className="text-muted-foreground">{dateStr}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href="/appointments/new">
            <Plus className="mr-1 h-4 w-4" /> New Appointment
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/patients/new">
            <Plus className="mr-1 h-4 w-4" /> Register Patient
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/payments/new">
            <Plus className="mr-1 h-4 w-4" /> Record Payment
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className="h-8 w-8 text-primary/40" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Today&apos;s Appointments</CardTitle>
                <CardDescription>
                  {today.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/appointments">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.todayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-muted-foreground w-12">
                        {apt.time}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{apt.patient.name}</p>
                        <p className="text-xs text-muted-foreground">{apt.type}</p>
                      </div>
                    </div>
                    <Badge variant={statusVariant(apt.status)}>
                      {apt.status}
                    </Badge>
                  </div>
                ))}
                {stats?.todayAppointments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No appointments today
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Pending Follow-ups</CardTitle>
                <CardDescription>Upcoming reminders</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/follow-ups">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.pendingFollowUps.map((fu) => (
                  <div
                    key={fu.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{fu.patient.name}</p>
                      <p className="text-xs text-muted-foreground">{fu.reason}</p>
                    </div>
                    <Badge variant="outline">
                      {new Date(fu.scheduledDate).toLocaleDateString("en-IN")}
                    </Badge>
                  </div>
                ))}
                {stats?.pendingFollowUps.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pending follow-ups
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
