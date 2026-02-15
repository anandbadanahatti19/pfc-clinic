import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME, type TokenPayload } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Authenticate the request and return the token payload.
 * Returns a 401 NextResponse if the user is not authenticated.
 */
export async function requireAuth(
  request: NextRequest
): Promise<TokenPayload | NextResponse> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return payload;
}

/**
 * Check if a clinic has a specific feature enabled.
 * Returns a 403 NextResponse if the feature is disabled, or null if allowed.
 */
export async function requireFeature(
  clinicId: string,
  featureKey: string
): Promise<NextResponse | null> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { enabledFeatures: true },
  });

  if (!clinic) {
    return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
  }

  const features = clinic.enabledFeatures as Record<string, boolean>;
  if (!features[featureKey]) {
    return NextResponse.json(
      { error: `Feature "${featureKey}" is not enabled for this clinic` },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Authenticate the request and ensure the user is a SUPER_ADMIN.
 * Returns a 401/403 NextResponse on failure, or the payload on success.
 */
export async function requireSuperAdmin(
  request: NextRequest
): Promise<TokenPayload | NextResponse> {
  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;

  if (result.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return result;
}

/** Type guard to check if requireAuth returned an error response */
export function isAuthError(
  result: TokenPayload | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
