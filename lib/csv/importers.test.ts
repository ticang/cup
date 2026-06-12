import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/client", () => ({
  prisma: {
    importJob: {
      create: vi.fn()
    },
    team: {
      upsert: vi.fn()
    }
  }
}));

describe("CSV importers", () => {
  it("imports team rows and records an import job", async () => {
    const { prisma } = await import("@/lib/db/client");
    const { importCsv } = await import("./importers");

    const result = await importCsv(
      "teams",
      "slug,name,country,rating\nargentina,Argentina,Argentina,1830"
    );

    expect(result).toMatchObject({
      entity: "teams",
      totalRows: 1,
      successRows: 1,
      errors: []
    });
    expect(prisma.team.upsert).toHaveBeenCalledWith({
      where: { slug: "argentina" },
      update: {
        slug: "argentina",
        name: "Argentina",
        country: "Argentina",
        rating: 1830
      },
      create: {
        slug: "argentina",
        name: "Argentina",
        country: "Argentina",
        rating: 1830
      }
    });
    expect(prisma.importJob.create).toHaveBeenCalled();
  });
});
