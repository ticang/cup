import { PrismaClient } from "@prisma/client";
import { generatePrediction } from "../lib/prediction/engine";

const prisma = new PrismaClient();

async function main() {
  const competition = await prisma.competition.upsert({
    where: { slug: "world-cup" },
    update: {},
    create: {
      slug: "world-cup",
      name: "FIFA World Cup",
      region: "Global",
      description: "世界杯作为通用赛事配置的样例数据。"
    }
  });

  const season = await prisma.season.upsert({
    where: {
      competitionId_name: {
        competitionId: competition.id,
        name: "2026"
      }
    },
    update: {},
    create: {
      competitionId: competition.id,
      name: "2026",
      startsOn: new Date("2026-06-11T00:00:00.000Z"),
      endsOn: new Date("2026-07-19T00:00:00.000Z")
    }
  });

  const teams = await Promise.all(
    [
      { slug: "argentina", name: "Argentina", country: "Argentina", rating: 1830 },
      { slug: "france", name: "France", country: "France", rating: 1815 },
      { slug: "brazil", name: "Brazil", country: "Brazil", rating: 1785 },
      { slug: "england", name: "England", country: "England", rating: 1760 }
    ].map((team) =>
      prisma.team.upsert({
        where: { slug: team.slug },
        update: team,
        create: team
      })
    )
  );

  const [argentina, france, brazil, england] = teams;

  const fixtures = await Promise.all([
    prisma.fixture.upsert({
      where: { id: "sample-argentina-france" },
      update: {},
      create: {
        id: "sample-argentina-france",
        seasonId: season.id,
        homeTeamId: argentina.id,
        awayTeamId: france.id,
        kickoffAt: new Date("2026-06-15T20:00:00.000Z"),
        neutralVenue: true,
        venue: "MetLife Stadium"
      }
    }),
    prisma.fixture.upsert({
      where: { id: "sample-brazil-england" },
      update: {},
      create: {
        id: "sample-brazil-england",
        seasonId: season.id,
        homeTeamId: brazil.id,
        awayTeamId: england.id,
        kickoffAt: new Date("2026-06-16T22:00:00.000Z"),
        neutralVenue: true,
        venue: "AT&T Stadium"
      }
    })
  ]);

  const provider = await prisma.oddsProvider.upsert({
    where: { slug: "sample-market" },
    update: {},
    create: { slug: "sample-market", name: "Sample Market" }
  });

  await Promise.all([
    prisma.oddsSnapshot.create({
      data: {
        fixtureId: fixtures[0].id,
        providerId: provider.id,
        capturedAt: new Date("2026-06-01T12:00:00.000Z"),
        homeOdds: 2.55,
        drawOdds: 3.1,
        awayOdds: 2.8
      }
    }),
    prisma.oddsSnapshot.create({
      data: {
        fixtureId: fixtures[1].id,
        providerId: provider.id,
        capturedAt: new Date("2026-06-01T12:00:00.000Z"),
        homeOdds: 2.3,
        drawOdds: 3.25,
        awayOdds: 3.05
      }
    })
  ]);

  const model = await prisma.modelVersion.upsert({
    where: { slug: "ensemble-v1" },
    update: {},
    create: {
      slug: "ensemble-v1",
      name: "Ensemble V1",
      description: "Elo + Poisson baseline with ML placeholder weighting.",
      configJson: JSON.stringify({ statisticalWeight: 0.8, mlWeight: 0.2 })
    }
  });

  for (const fixture of fixtures) {
    const fullFixture = await prisma.fixture.findUniqueOrThrow({
      where: { id: fixture.id },
      include: { homeTeam: true, awayTeam: true }
    });
    const prediction = generatePrediction({
      fixtureId: fullFixture.id,
      homeTeam: {
        name: fullFixture.homeTeam.name,
        rating: fullFixture.homeTeam.rating
      },
      awayTeam: {
        name: fullFixture.awayTeam.name,
        rating: fullFixture.awayTeam.rating
      },
      neutralVenue: fullFixture.neutralVenue
    });

    await prisma.prediction.deleteMany({
      where: { fixtureId: fixture.id, modelVersionId: model.id }
    });

    await prisma.prediction.create({
      data: {
        fixtureId: fixture.id,
        modelVersionId: model.id,
        predictedHome: prediction.predictedHome,
        predictedAway: prediction.predictedAway,
        homeWinProb: prediction.homeWinProb,
        drawProb: prediction.drawProb,
        awayWinProb: prediction.awayWinProb,
        over25Prob: prediction.over25Prob,
        confidence: prediction.confidence,
        explanation: prediction.explanation,
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

  const backtest = await prisma.backtestRun.create({
    data: {
      modelVersionId: model.id,
      name: "Sample historical sanity check",
      dataWindow: "Sample fixtures",
      completedAt: new Date(),
      metrics: {
        create: [
          { name: "brier_score", value: 0.184 },
          { name: "calibration_error", value: 0.061 },
          { name: "exact_score_accuracy", value: 0.11 }
        ]
      }
    }
  });

  await prisma.trainingExperiment.create({
    data: {
      name: "Sample ensemble experiment",
      featureSetJson: JSON.stringify(["rating_delta", "neutral_venue", "recent_form_placeholder"]),
      parameterJson: JSON.stringify({ statisticalWeight: 0.8, mlWeight: 0.2 }),
      dataWindow: "Sample fixtures",
      artifactPath: "model-service/artifacts/sample-ensemble-v1.json",
      completedAt: new Date(),
      promotedModelVersionId: model.id,
      metrics: {
        create: [
          { name: "validation_brier_score", value: 0.181 },
          { name: "validation_log_loss", value: 0.942 }
        ]
      }
    }
  });

  console.log(`Seeded ${fixtures.length} fixtures and backtest ${backtest.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
