import { NextResponse, type NextRequest } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth/session";
import { syncWorldCup2026Games } from "@/lib/data-sources/worldcup26";

export async function POST(request: NextRequest) {
  if (!getAdminSessionFromRequest(request)) {
    return NextResponse.redirect(new URL("/admin?error=login-required", request.url), {
      status: 303
    });
  }

  const result = await syncWorldCup2026Games();
  return NextResponse.redirect(
    new URL(
      `/admin?synced=${result.syncedFixtures}&results=${result.syncedResults}`,
      request.url
    ),
    { status: 303 }
  );
}
