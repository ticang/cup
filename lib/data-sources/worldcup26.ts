import { prisma } from "@/lib/db/client";

const SOURCE_URL = "https://worldcup26.ir/get/games";
const COMPETITION_SLUG = "world-cup-2026-live";
const SEASON_NAME = "2026";
const TEAM_NAME_ZH: Record<string, string> = {
  Algeria: "阿尔及利亚",
  Argentina: "阿根廷",
  Australia: "澳大利亚",
  Austria: "奥地利",
  Belgium: "比利时",
  "Bosnia and Herzegovina": "波黑",
  Brazil: "巴西",
  Canada: "加拿大",
  "Cape Verde": "佛得角",
  Colombia: "哥伦比亚",
  Croatia: "克罗地亚",
  "Curaçao": "库拉索",
  "Czech Republic": "捷克",
  "Democratic Republic of the Congo": "刚果民主共和国",
  Ecuador: "厄瓜多尔",
  Egypt: "埃及",
  England: "英格兰",
  France: "法国",
  Germany: "德国",
  Ghana: "加纳",
  Haiti: "海地",
  Iran: "伊朗",
  Iraq: "伊拉克",
  "Ivory Coast": "科特迪瓦",
  Japan: "日本",
  Jordan: "约旦",
  Mexico: "墨西哥",
  Morocco: "摩洛哥",
  Netherlands: "荷兰",
  "New Zealand": "新西兰",
  Norway: "挪威",
  Panama: "巴拿马",
  Paraguay: "巴拉圭",
  Portugal: "葡萄牙",
  Qatar: "卡塔尔",
  "Saudi Arabia": "沙特阿拉伯",
  Scotland: "苏格兰",
  Senegal: "塞内加尔",
  "South Africa": "南非",
  "South Korea": "韩国",
  Spain: "西班牙",
  Sweden: "瑞典",
  Switzerland: "瑞士",
  Tunisia: "突尼斯",
  Turkey: "土耳其",
  Uruguay: "乌拉圭",
  Uzbekistan: "乌兹别克斯坦"
};
const TEAM_RATINGS: Record<string, number> = {
  Argentina: 1860,
  France: 1845,
  Spain: 1815,
  England: 1805,
  Brazil: 1800,
  Portugal: 1785,
  Netherlands: 1765,
  Belgium: 1745,
  Germany: 1740,
  Uruguay: 1725,
  Colombia: 1715,
  Croatia: 1710,
  Morocco: 1700,
  Switzerland: 1685,
  Austria: 1680,
  Japan: 1675,
  Mexico: 1665,
  "United States": 1660,
  Senegal: 1655,
  "South Korea": 1650,
  Ecuador: 1645,
  Iran: 1635,
  Australia: 1625,
  Turkey: 1620,
  Scotland: 1615,
  Norway: 1610,
  Paraguay: 1605,
  Egypt: 1600,
  Qatar: 1585,
  Canada: 1580,
  Tunisia: 1575,
  Sweden: 1570,
  "Saudi Arabia": 1565,
  Algeria: 1560,
  Panama: 1550,
  Ghana: 1545,
  "South Africa": 1540,
  Jordan: 1530,
  Uzbekistan: 1525,
  Iraq: 1520,
  "Ivory Coast": 1515,
  Haiti: 1505,
  "Cape Verde": 1500,
  "Bosnia and Herzegovina": 1495,
  "Czech Republic": 1490,
  "Democratic Republic of the Congo": 1485,
  "New Zealand": 1480,
  "Curaçao": 1465
};

type WorldCup26Game = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  group: string;
  matchday: string;
  local_date: string;
  stadium_id: string;
  finished: string;
  time_elapsed: string;
  type: string;
  home_team_name_en?: string;
  away_team_name_en?: string;
  home_team_label?: string;
  away_team_label?: string;
};

type WorldCup26Response = {
  games: WorldCup26Game[];
};

export type WorldCupSyncResult = {
  source: string;
  fetchedGames: number;
  syncedFixtures: number;
  syncedResults: number;
};

export async function fetchWorldCup2026Games(
  fetchImpl: typeof fetch = fetch
): Promise<WorldCup26Game[]> {
  const response = await fetchImpl(SOURCE_URL, {
    headers: { accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`WorldCup26 API returned ${response.status}`);
  }

  const payload = (await response.json()) as WorldCup26Response;
  if (!Array.isArray(payload.games)) {
    throw new Error("WorldCup26 API response does not include games");
  }

  return payload.games;
}

export async function syncWorldCup2026Games(): Promise<WorldCupSyncResult> {
  const games = await fetchWorldCup2026Games();
  const competition = await prisma.competition.upsert({
    where: { slug: COMPETITION_SLUG },
    update: {
      name: "2026 世界杯实时赛程",
      region: "全球",
      description: "从 worldcup26.ir 同步的实时赛程和赛果。"
    },
    create: {
      slug: COMPETITION_SLUG,
      name: "2026 世界杯实时赛程",
      region: "全球",
      description: "从 worldcup26.ir 同步的实时赛程和赛果。"
    }
  });

  const season = await prisma.season.upsert({
    where: {
      competitionId_name: {
        competitionId: competition.id,
        name: SEASON_NAME
      }
    },
    update: {},
    create: {
      competitionId: competition.id,
      name: SEASON_NAME
    }
  });

  let syncedResults = 0;

  for (const game of games) {
    const homeTeam = await upsertTeam(
      game.home_team_id,
      teamDisplayName(game, "home"),
      teamRating(game, "home")
    );
    const awayTeam = await upsertTeam(
      game.away_team_id,
      teamDisplayName(game, "away"),
      teamRating(game, "away")
    );

    const fixture = await prisma.fixture.upsert({
      where: { id: sourceFixtureId(game.id) },
      update: {
        seasonId: season.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        kickoffAt: parseWorldCupDate(game.local_date),
        neutralVenue: true,
        status: isFinished(game) ? "finished" : game.time_elapsed,
        venue: `球场 ${game.stadium_id}`
      },
      create: {
        id: sourceFixtureId(game.id),
        seasonId: season.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        kickoffAt: parseWorldCupDate(game.local_date),
        neutralVenue: true,
        status: isFinished(game) ? "finished" : game.time_elapsed,
        venue: `球场 ${game.stadium_id}`
      }
    });

    if (isFinished(game)) {
      await prisma.matchResult.upsert({
        where: { fixtureId: fixture.id },
        update: {
          homeGoals: parseScore(game.home_score),
          awayGoals: parseScore(game.away_score),
          recordedAt: new Date()
        },
        create: {
          fixtureId: fixture.id,
          homeGoals: parseScore(game.home_score),
          awayGoals: parseScore(game.away_score)
        }
      });
      syncedResults += 1;
    }
  }

  await prisma.importJob.create({
    data: {
      entity: "worldcup26-live",
      status: "completed",
      totalRows: games.length,
      successRows: games.length,
      errorRows: 0
    }
  });

  return {
    source: SOURCE_URL,
    fetchedGames: games.length,
    syncedFixtures: games.length,
    syncedResults
  };
}

function sourceFixtureId(sourceId: string): string {
  return `wc2026-${sourceId}`;
}

async function upsertTeam(sourceTeamId: string, name: string, rating: number) {
  const slug =
    sourceTeamId === "0"
      ? `wc2026-placeholder-${slugify(name)}`
      : `wc2026-team-${sourceTeamId}`;

  return prisma.team.upsert({
    where: { slug },
    update: { name, rating },
    create: {
      slug,
      name,
      rating
    }
  });
}

function teamDisplayName(game: WorldCup26Game, side: "home" | "away"): string {
  const englishName =
    side === "home"
      ? game.home_team_name_en ?? game.home_team_label ?? "TBD"
      : game.away_team_name_en ?? game.away_team_label ?? "TBD";

  return translateTeamOrLabel(englishName);
}

function teamRating(game: WorldCup26Game, side: "home" | "away"): number {
  const englishName =
    side === "home"
      ? game.home_team_name_en ?? game.home_team_label ?? "TBD"
      : game.away_team_name_en ?? game.away_team_label ?? "TBD";

  return TEAM_RATINGS[englishName] ?? 1500;
}

export function translateTeamOrLabel(value: string): string {
  if (TEAM_NAME_ZH[value]) {
    return TEAM_NAME_ZH[value];
  }

  const winnerGroup = value.match(/^Winner Group ([A-L])$/);
  if (winnerGroup) {
    return `${winnerGroup[1]} 组第一`;
  }

  const runnerUpGroup = value.match(/^Runner-up Group ([A-L])$/);
  if (runnerUpGroup) {
    return `${runnerUpGroup[1]} 组第二`;
  }

  const thirdGroup = value.match(/^3rd Group ([A-L/]+)$/);
  if (thirdGroup) {
    return `${thirdGroup[1].replaceAll("/", "/")} 组第三名之一`;
  }

  const winnerMatch = value.match(/^Winner Match (\d+)$/);
  if (winnerMatch) {
    return `第 ${winnerMatch[1]} 场胜者`;
  }

  const loserMatch = value.match(/^Loser Match (\d+)$/);
  if (loserMatch) {
    return `第 ${loserMatch[1]} 场负者`;
  }

  return value === "TBD" ? "待定" : value;
}

function parseWorldCupDate(value: string): Date {
  const [datePart, timePart] = value.split(" ");
  const [month, day, year] = datePart.split("/").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

function isFinished(game: WorldCup26Game): boolean {
  return game.finished.toUpperCase() === "TRUE" || game.time_elapsed === "finished";
}

function parseScore(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
