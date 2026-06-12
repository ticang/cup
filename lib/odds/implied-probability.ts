export type ThreeWayOdds = {
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
};

export type ImpliedProbability = {
  home: number;
  draw: number;
  away: number;
  overround: number;
};

export function calculateImpliedProbabilities(
  odds: ThreeWayOdds
): ImpliedProbability {
  for (const [label, value] of Object.entries(odds)) {
    if (!Number.isFinite(value) || value <= 1) {
      throw new Error(`${label} must be greater than 1`);
    }
  }

  const rawHome = 1 / odds.homeOdds;
  const rawDraw = 1 / odds.drawOdds;
  const rawAway = 1 / odds.awayOdds;
  const total = rawHome + rawDraw + rawAway;

  return {
    home: rawHome / total,
    draw: rawDraw / total,
    away: rawAway / total,
    overround: total - 1
  };
}
