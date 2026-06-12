import { describe, expect, it, vi } from "vitest";
import { fetchWorldCup2026Games, translateTeamOrLabel } from "./worldcup26";

describe("worldcup26 data source", () => {
  it("fetches games from the public API", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        games: [
          {
            id: "1",
            home_team_id: "1",
            away_team_id: "2",
            home_score: "2",
            away_score: "0",
            group: "A",
            matchday: "1",
            local_date: "06/11/2026 13:00",
            stadium_id: "1",
            finished: "TRUE",
            time_elapsed: "finished",
            type: "group",
            home_team_name_en: "Mexico",
            away_team_name_en: "South Africa"
          }
        ]
      })
    })) as unknown as typeof fetch;

    const games = await fetchWorldCup2026Games(fetchImpl);

    expect(games).toHaveLength(1);
    expect(games[0].home_team_name_en).toBe("Mexico");
  });

  it("translates team names and knockout labels to Chinese", () => {
    expect(translateTeamOrLabel("Mexico")).toBe("墨西哥");
    expect(translateTeamOrLabel("South Africa")).toBe("南非");
    expect(translateTeamOrLabel("Winner Group A")).toBe("A 组第一");
    expect(translateTeamOrLabel("Runner-up Group B")).toBe("B 组第二");
    expect(translateTeamOrLabel("Winner Match 73")).toBe("第 73 场胜者");
  });
});
