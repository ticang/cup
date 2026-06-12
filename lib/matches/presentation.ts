export type Outcome = "home" | "draw" | "away";

export type PredictionSummary = {
  predictedHome: number;
  predictedAway: number;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  confidence: number;
};

export type ResultSummary = {
  homeGoals: number;
  awayGoals: number;
} | null;

export function formatFixtureStatus(status: string): string {
  const normalized = status.toLowerCase();
  const labels: Record<string, string> = {
    scheduled: "未开始",
    notstarted: "未开始",
    "not-started": "未开始",
    live: "进行中",
    halftime: "中场",
    finished: "已结束",
    postponed: "延期",
    cancelled: "取消"
  };

  return labels[normalized] ?? status;
}

export function formatPredictionScore(
  prediction: PredictionSummary | null | undefined
): string {
  if (!prediction) {
    return "待预测";
  }

  return `${prediction.predictedHome}-${prediction.predictedAway}`;
}

export function formatActualScore(result: ResultSummary): string {
  if (!result) {
    return "未出结果";
  }

  return `${result.homeGoals}-${result.awayGoals}`;
}

export function predictedOutcome(prediction: PredictionSummary): Outcome {
  return scoreOutcome(prediction.predictedHome, prediction.predictedAway);
}

export function mostLikelyOutcome(prediction: PredictionSummary): Outcome {
  if (
    prediction.homeWinProb >= prediction.drawProb &&
    prediction.homeWinProb >= prediction.awayWinProb
  ) {
    return "home";
  }

  if (prediction.awayWinProb >= prediction.homeWinProb && prediction.awayWinProb >= prediction.drawProb) {
    return "away";
  }

  return "draw";
}

export function actualOutcome(result: NonNullable<ResultSummary>): Outcome {
  return scoreOutcome(result.homeGoals, result.awayGoals);
}

export function formatOutcome(outcome: Outcome, homeTeam: string, awayTeam: string): string {
  if (outcome === "home") {
    return `${homeTeam}胜`;
  }

  if (outcome === "away") {
    return `${awayTeam}胜`;
  }

  return "平局";
}

export function formatPredictionAccuracy(
  prediction: PredictionSummary | null | undefined,
  result: ResultSummary
): string {
  if (!prediction) {
    return "暂无预测";
  }

  if (!result) {
    return "等待赛果";
  }

  const scoreHit =
    prediction.predictedHome === result.homeGoals &&
    prediction.predictedAway === result.awayGoals;

  if (scoreHit) {
    return "比分命中";
  }

  return "未命中";
}

export function buildPredictionAnalysis(
  prediction: PredictionSummary,
  homeTeam: string,
  awayTeam: string
): string[] {
  const likelyOutcome = mostLikelyOutcome(prediction);
  const confidenceText =
    prediction.confidence >= 0.5
      ? "模型倾向较集中"
      : prediction.confidence >= 0.4
        ? "模型有一定倾向"
        : "模型分歧较大";

  return [
    `最可能赛果是${formatOutcome(likelyOutcome, homeTeam, awayTeam)}，置信度为 ${(prediction.confidence * 100).toFixed(1)}%。`,
    `${confidenceText}，仍需结合阵容、伤停、临场状态和数据质量复核。`,
    `胜平负概率分别为：${homeTeam}胜 ${(prediction.homeWinProb * 100).toFixed(1)}%，平局 ${(prediction.drawProb * 100).toFixed(1)}%，${awayTeam}胜 ${(prediction.awayWinProb * 100).toFixed(1)}%。`
  ];
}

function scoreOutcome(homeGoals: number, awayGoals: number): Outcome {
  if (homeGoals > awayGoals) {
    return "home";
  }

  if (awayGoals > homeGoals) {
    return "away";
  }

  return "draw";
}
