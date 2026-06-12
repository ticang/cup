import { PrismaClient } from "@prisma/client";
import { ensureDefaultModelVersion, runPredictionForFixture } from "@/lib/prediction/run";

const prisma = new PrismaClient();

async function main() {
  await ensureDefaultModelVersion();
  const fixtures = await prisma.fixture.findMany({
    select: { id: true }
  });

  for (const fixture of fixtures) {
    await runPredictionForFixture(fixture.id, { useConfiguredLlm: false });
  }

  console.log(JSON.stringify({ predictedFixtures: fixtures.length }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
