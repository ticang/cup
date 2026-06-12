import Papa from "papaparse";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

export type ImportEntity = "competitions" | "teams" | "fixtures" | "odds";

export type ImportResult = {
  entity: ImportEntity;
  totalRows: number;
  successRows: number;
  errors: Array<{ row: number; message: string }>;
};

const competitionSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  region: z.string().optional().default(""),
  description: z.string().optional().default("")
});

const teamSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  country: z.string().optional().default(""),
  rating: z.coerce.number().positive().default(1500)
});

const fixtureSchema = z.object({
  id: z.string().min(1),
  competitionSlug: z.string().min(1),
  seasonName: z.string().min(1),
  homeTeamSlug: z.string().min(1),
  awayTeamSlug: z.string().min(1),
  kickoffAt: z.coerce.date(),
  neutralVenue: z
    .string()
    .optional()
    .default("false")
    .transform((value) => value.toLowerCase() === "true"),
  venue: z.string().optional().default("")
});

const oddsSchema = z.object({
  fixtureId: z.string().min(1),
  providerSlug: z.string().min(1),
  providerName: z.string().min(1),
  capturedAt: z.coerce.date(),
  homeOdds: z.coerce.number().gt(1),
  drawOdds: z.coerce.number().gt(1),
  awayOdds: z.coerce.number().gt(1)
});

export async function importCsv(entity: ImportEntity, csvText: string): Promise<ImportResult> {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim()
  });

  const rows = parsed.data;
  const result: ImportResult = {
    entity,
    totalRows: rows.length,
    successRows: 0,
    errors: []
  };

  for (const [index, row] of rows.entries()) {
    try {
      await importRow(entity, row);
      result.successRows += 1;
    } catch (error) {
      result.errors.push({
        row: index + 2,
        message: error instanceof Error ? error.message : "Unknown import error"
      });
    }
  }

  await prisma.importJob.create({
    data: {
      entity,
      status: result.errors.length > 0 ? "completed_with_errors" : "completed",
      totalRows: result.totalRows,
      successRows: result.successRows,
      errorRows: result.errors.length,
      errorJson: JSON.stringify(result.errors)
    }
  });

  return result;
}

async function importRow(entity: ImportEntity, row: Record<string, string>) {
  if (entity === "competitions") {
    const input = competitionSchema.parse(row);
    await prisma.competition.upsert({
      where: { slug: input.slug },
      update: input,
      create: input
    });
    return;
  }

  if (entity === "teams") {
    const input = teamSchema.parse(row);
    await prisma.team.upsert({
      where: { slug: input.slug },
      update: input,
      create: input
    });
    return;
  }

  if (entity === "fixtures") {
    const input = fixtureSchema.parse(row);
    const competition = await prisma.competition.findUniqueOrThrow({
      where: { slug: input.competitionSlug }
    });
    const season = await prisma.season.upsert({
      where: {
        competitionId_name: {
          competitionId: competition.id,
          name: input.seasonName
        }
      },
      update: {},
      create: {
        competitionId: competition.id,
        name: input.seasonName
      }
    });
    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findUniqueOrThrow({ where: { slug: input.homeTeamSlug } }),
      prisma.team.findUniqueOrThrow({ where: { slug: input.awayTeamSlug } })
    ]);

    await prisma.fixture.upsert({
      where: { id: input.id },
      update: {
        seasonId: season.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        kickoffAt: input.kickoffAt,
        neutralVenue: input.neutralVenue,
        venue: input.venue
      },
      create: {
        id: input.id,
        seasonId: season.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        kickoffAt: input.kickoffAt,
        neutralVenue: input.neutralVenue,
        venue: input.venue
      }
    });
    return;
  }

  const input = oddsSchema.parse(row);
  const provider = await prisma.oddsProvider.upsert({
    where: { slug: input.providerSlug },
    update: { name: input.providerName },
    create: { slug: input.providerSlug, name: input.providerName }
  });
  await prisma.oddsSnapshot.create({
    data: {
      fixtureId: input.fixtureId,
      providerId: provider.id,
      capturedAt: input.capturedAt,
      homeOdds: input.homeOdds,
      drawOdds: input.drawOdds,
      awayOdds: input.awayOdds
    }
  });
}
