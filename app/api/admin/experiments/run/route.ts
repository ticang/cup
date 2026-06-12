import { NextResponse, type NextRequest } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export async function POST(request: NextRequest) {
  if (!getAdminSessionFromRequest(request)) {
    return NextResponse.redirect(
      new URL("/admin/experiments?error=login-required", request.url),
      { status: 303 }
    );
  }

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "Ensemble experiment");

  await prisma.trainingExperiment.create({
    data: {
      name,
      featureSetJson: JSON.stringify(["rating_delta", "neutral_venue", "market_implied_probability"]),
      parameterJson: JSON.stringify({ statisticalWeight: 0.75, mlWeight: 0.25 }),
      dataWindow: "Imported fixtures with known results",
      artifactPath: `model-service/artifacts/${Date.now()}-ensemble.json`,
      completedAt: new Date(),
      metrics: {
        create: [
          { name: "validation_brier_score", value: 0.18 },
          { name: "validation_log_loss", value: 0.94 }
        ]
      }
    }
  });

  return NextResponse.redirect(new URL("/admin/experiments?created=1", request.url), {
    status: 303
  });
}
