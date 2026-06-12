import { NextResponse, type NextRequest } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { ensureDefaultModelVersion, runPredictionForFixture } from "@/lib/prediction/run";

export async function POST(request: NextRequest) {
  if (!getAdminSessionFromRequest(request)) {
    return NextResponse.redirect(new URL("/admin?error=login-required", request.url), {
      status: 303
    });
  }

  await ensureDefaultModelVersion();

  const fixtures = await prisma.fixture.findMany({
    where: {
      status: {
        in: ["scheduled", "notstarted", "not-started"]
      }
    },
    include: { homeTeam: true, awayTeam: true }
  });

  for (const fixture of fixtures) {
    await runPredictionForFixture(fixture.id, { useConfiguredLlm: false });
  }

  return NextResponse.redirect(
    new URL(`/admin?predicted=${fixtures.length}`, request.url),
    { status: 303 }
  );
}
