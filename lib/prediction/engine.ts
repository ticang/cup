export type TeamStrengthInput = {
  name: string;
  rating: number;
};

export type PredictionInput = {
  fixtureId: string;
  homeTeam: TeamStrengthInput;
  awayTeam: TeamStrengthInput;
  neutralVenue: boolean;
};

export type ScoreProbability = {
  homeGoals: number;
  awayGoals: number;
  probability: number;
};

export type GeneratedPrediction = {
  fixtureId: string;
  predictedHome: number;
  predictedAway: number;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  over25Prob: number;
  confidence: number;
  explanation: string;
  inputSnapshot: Record<string, unknown>;
  scoreProbabilities: ScoreProbability[];
};

const MAX_GOALS = 6;

function factorial(value: number): number {
  if (value <= 1) {
    return 1;
  }

  let result = 1;
  for (let index = 2; index <= value; index += 1) {
    result *= index;
  }
  return result;
}

export function poissonProbability(lambda: number, goals: number): number {
  if (!Number.isFinite(lambda) || lambda <= 0) {
    throw new Error("lambda must be positive");
  }
  if (!Number.isInteger(goals) || goals < 0) {
    throw new Error("goals must be a non-negative integer");
  }

  return (Math.exp(-lambda) * lambda ** goals) / factorial(goals);
}

export function expectedGoals(
  homeRating: number,
  awayRating: number,
  neutralVenue: boolean
): { homeXg: number; awayXg: number } {
  const ratingDelta = homeRating - awayRating + (neutralVenue ? 0 : 55);
  const homeXg = clamp(1.35 + ratingDelta / 520, 0.35, 3.4);
  const awayXg = clamp(1.18 - ratingDelta / 620, 0.3, 3.1);

  return { homeXg, awayXg };
}

export function generatePrediction(input: PredictionInput): GeneratedPrediction {
  const { homeXg, awayXg } = expectedGoals(
    input.homeTeam.rating,
    input.awayTeam.rating,
    input.neutralVenue
  );

  const rawScores: ScoreProbability[] = [];
  for (let homeGoals = 0; homeGoals <= MAX_GOALS; homeGoals += 1) {
    for (let awayGoals = 0; awayGoals <= MAX_GOALS; awayGoals += 1) {
      rawScores.push({
        homeGoals,
        awayGoals,
        probability:
          poissonProbability(homeXg, homeGoals) *
          poissonProbability(awayXg, awayGoals)
      });
    }
  }

  const total = rawScores.reduce((sum, score) => sum + score.probability, 0);
  const scoreProbabilities = rawScores
    .map((score) => ({ ...score, probability: score.probability / total }))
    .sort((left, right) => right.probability - left.probability);

  const homeWinProb = sumScores(scoreProbabilities, (score) => score.homeGoals > score.awayGoals);
  const drawProb = sumScores(scoreProbabilities, (score) => score.homeGoals === score.awayGoals);
  const awayWinProb = sumScores(scoreProbabilities, (score) => score.homeGoals < score.awayGoals);
  const over25Prob = sumScores(scoreProbabilities, (score) => score.homeGoals + score.awayGoals > 2.5);
  const topScore = pickPredictedScore(scoreProbabilities, {
    homeWinProb,
    drawProb,
    awayWinProb
  });
  const confidence = Math.max(homeWinProb, drawProb, awayWinProb);

  return {
    fixtureId: input.fixtureId,
    predictedHome: topScore.homeGoals,
    predictedAway: topScore.awayGoals,
    homeWinProb,
    drawProb,
    awayWinProb,
    over25Prob,
    confidence,
    explanation: buildTemplateExplanation(input, homeXg, awayXg, topScore, confidence),
    inputSnapshot: {
      homeTeam: input.homeTeam,
      awayTeam: input.awayTeam,
      neutralVenue: input.neutralVenue,
      homeXg,
      awayXg,
      model: "elo-poisson-baseline"
    },
    scoreProbabilities: scoreProbabilities.slice(0, 20)
  };
}

function sumScores(
  scores: ScoreProbability[],
  predicate: (score: ScoreProbability) => boolean
): number {
  return scores.reduce((sum, score) => sum + (predicate(score) ? score.probability : 0), 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function pickPredictedScore(
  scores: ScoreProbability[],
  outcomes: { homeWinProb: number; drawProb: number; awayWinProb: number }
): ScoreProbability {
  const likelyOutcome =
    outcomes.homeWinProb >= outcomes.drawProb &&
    outcomes.homeWinProb >= outcomes.awayWinProb
      ? "home"
      : outcomes.awayWinProb >= outcomes.homeWinProb &&
          outcomes.awayWinProb >= outcomes.drawProb
        ? "away"
        : "draw";

  const filtered = scores.filter((score) => {
    if (likelyOutcome === "home") {
      return score.homeGoals > score.awayGoals;
    }

    if (likelyOutcome === "away") {
      return score.awayGoals > score.homeGoals;
    }

    return score.homeGoals === score.awayGoals;
  });

  return filtered[0] ?? scores[0];
}

function buildTemplateExplanation(
  input: PredictionInput,
  homeXg: number,
  awayXg: number,
  topScore: ScoreProbability,
  confidence: number
): string {
  const edge =
    homeXg > awayXg + 0.15
      ? `${input.homeTeam.name} 的进攻期望略高`
      : awayXg > homeXg + 0.15
        ? `${input.awayTeam.name} 的进攻期望略高`
        : "双方进球期望接近";

  return `${edge}。模型最可能比分为 ${topScore.homeGoals}-${topScore.awayGoals}，最高赛果置信度为 ${formatPercent(confidence)}。该结论基于评分差和泊松比分分布，仅用于赛前概率分析。`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
