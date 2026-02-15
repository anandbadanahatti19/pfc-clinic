"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/**
 * Hook that checks if a feature is enabled for the current clinic.
 * Redirects to /dashboard if the feature is disabled.
 * Returns true if the feature is allowed (or still loading).
 */
export function useFeatureGuard(featureKey: string): boolean {
  const { clinic, loading } = useAuth();
  const router = useRouter();

  const enabled = loading || !clinic || clinic.enabledFeatures[featureKey] !== false;

  useEffect(() => {
    if (!loading && clinic && clinic.enabledFeatures[featureKey] === false) {
      router.replace("/dashboard");
    }
  }, [loading, clinic, featureKey, router]);

  return enabled;
}
