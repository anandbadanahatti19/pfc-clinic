"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardList,
  CreditCard,
  BarChart3,
  Package,
  UserCog,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems: { href: string; label: string; icon: typeof LayoutDashboard; feature: string | null; adminOnly?: boolean }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, feature: null },
  { href: "/patients", label: "Patients", icon: Users, feature: "patients" },
  { href: "/appointments", label: "Appointments", icon: CalendarDays, feature: "appointments" },
  { href: "/payments", label: "Payments", icon: CreditCard, feature: "payments" },
  { href: "/follow-ups", label: "Follow-ups", icon: ClipboardList, feature: "followups" },
  { href: "/inventory", label: "Inventory", icon: Package, feature: "inventory" },
  { href: "/reports", label: "Reports", icon: BarChart3, feature: "reports" },
  { href: "/users", label: "Staff", icon: UserCog, feature: null, adminOnly: true },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { clinic, user } = useAuth();

  const abbreviation = clinic?.abbreviation || "CMS";
  const nameParts = clinic?.name?.split(" ") || ["Clinic", "Management"];
  const nameFirstLine = nameParts.slice(0, Math.ceil(nameParts.length / 2)).join(" ");
  const nameSecondLine = nameParts.slice(Math.ceil(nameParts.length / 2)).join(" ");

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">
                {abbreviation}
              </span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-sidebar-foreground">
                {nameFirstLine}
              </p>
              <p className="text-xs text-muted-foreground">{nameSecondLine}</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {navItems.filter((item) => {
            if (item.adminOnly && user?.role !== "ADMIN") return false;
            return !item.feature || clinic?.enabledFeatures[item.feature] !== false;
          }).map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
