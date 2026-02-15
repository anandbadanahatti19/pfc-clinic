import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-lg space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <span className="text-2xl font-bold text-primary">CMS</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          Clinic Management System
        </h1>
        <p className="text-muted-foreground">
          A multi-tenant platform for fertility clinics. Manage patients,
          appointments, payments, follow-ups, inventory, and reports — all in
          one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/super-admin/login">Admin Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
