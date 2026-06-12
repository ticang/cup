import { syncWorldCup2026Games } from "@/lib/data-sources/worldcup26";
import { prisma } from "@/lib/db/client";

async function main() {
  const result = await syncWorldCup2026Games();
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
