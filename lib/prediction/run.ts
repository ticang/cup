import { prisma } from "@/lib/db/client";
import { explainPrediction } from "@/lib/prediction/explanation";
import { generatePrediction } from "@/lib/prediction/engine";

export async function ensureDefaultModelVersion() {
  return prisma.modelVersion.upsert({
    where: { slug: "ensemble-v1" },
    update: {},
    create: {
      slug: "ensemble-v1",
      name: "集成模型 V1",
      description: "评分差 + 泊松比分分布的首版集成基线。",
      configJson: JSON.stringify({ statisticalWeight: 0.8, mlWeight: 0.2 })
    }
  });
}

export async function runPredictionForFixture(
  fixtureId: string,
  options: { useConfiguredLlm?: boolean } = {}
) {
  const [modelVersion, llmSettings, fixture] = await Promise.all([
    ensureDefaultModelVersion(),
    prisma.llmSettings.findUnique({ where: { id: "default" } }),
    prisma.fixture.findUnique({
      where: { id: fixtureId },
      include: { homeTeam: true, awayTeam: true }
    })
  ]);

  if (!fixture) {
    throw new Error("Fixture not found");
  }

  const predictionInput = {
    fixtureId: fixture.id,
    homeTeam: { name: fixture.homeTeam.name, rating: fixture.homeTeam.rating },
    awayTeam: { name: fixture.awayTeam.name, rating: fixture.awayTeam.rating },
    neutralVenue: fixture.neutralVenue
  };
  const prediction = generatePrediction(predictionInput);
  const explanation =
    options.useConfiguredLlm === false
      ? { text: prediction.explanation }
      : await explainPrediction(
          predictionInput,
          prediction,
          llmSettings
            ? {
                provider: llmSettings.provider as "openai-compatible" | "ollama" | "template",
                baseUrl: llmSettings.baseUrl,
                appKey: llmSettings.appKey,
                modelId: llmSettings.modelId,
                enabled: llmSettings.enabled
              }
            : null
        );

  await prisma.prediction.deleteMany({
    where: {
      fixtureId: fixture.id,
      modelVersionId: modelVersion.id
    }
  });

  return prisma.prediction.create({
    data: {
      fixtureId: fixture.id,
      modelVersionId: modelVersion.id,
      predictedHome: prediction.predictedHome,
      predictedAway: prediction.predictedAway,
      homeWinProb: prediction.homeWinProb,
      drawProb: prediction.drawProb,
      awayWinProb: prediction.awayWinProb,
      over25Prob: prediction.over25Prob,
      confidence: prediction.confidence,
      explanation: localizeExplanation(explanation.text),
      inputSnapshot: JSON.stringify(prediction.inputSnapshot),
      scoreProbabilities: {
        create: prediction.scoreProbabilities.map((score) => ({
          homeGoals: score.homeGoals,
          awayGoals: score.awayGoals,
          probability: score.probability
        }))
      }
    }
  });
}

function localizeExplanation(text: string): string {
  return text.replace(/\s+vs\s+/gi, " 对 ");
}
