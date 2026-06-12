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
  const experimentId = String(formData.get("experimentId") ?? "");
  const experiment = await prisma.trainingExperiment.findUnique({
    where: { id: experimentId }
  });

  if (!experiment) {
    return NextResponse.redirect(
      new URL("/admin/experiments?error=experiment-not-found", request.url),
      { status: 303 }
    );
  }

  const modelVersion = await prisma.modelVersion.create({
    data: {
      slug: `experiment-${experiment.id}`,
      name: `${experiment.name} promoted`,
      description: "Promoted from training experiment workbench.",
      configJson: JSON.stringify({
        featureSet: JSON.parse(experiment.featureSetJson),
        parameters: JSON.parse(experiment.parameterJson),
        artifactPath: experiment.artifactPath
      })
    }
  });

  await prisma.trainingExperiment.update({
    where: { id: experiment.id },
    data: { promotedModelVersionId: modelVersion.id }
  });

  return NextResponse.redirect(new URL("/admin/experiments?promoted=1", request.url), {
    status: 303
  });
}
