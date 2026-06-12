import { describe, expect, it } from "vitest";
import {
  formatActualScore,
  formatFixtureStatus,
  formatPredictionAccuracy
} from "./presentation";

describe("match presentation helpers", () => {
  it("formats match status in Chinese", () => {
    expect(formatFixtureStatus("notstarted")).toBe("未开始");
    expect(formatFixtureStatus("finished")).toBe("已结束");
  });

  it("formats missing and known actual scores", () => {
    expect(formatActualScore(null)).toBe("未出结果");
    expect(formatActualScore({ homeGoals: 2, awayGoals: 0 })).toBe("2-0");
  });

  it("classifies only exact scores as accurate", () => {
    expect(
      formatPredictionAccuracy(
        {
          predictedHome: 2,
          predictedAway: 0,
          homeWinProb: 0.6,
          drawProb: 0.2,
          awayWinProb: 0.2,
          confidence: 0.6
        },
        { homeGoals: 2, awayGoals: 0 }
      )
    ).toBe("比分命中");

    expect(
      formatPredictionAccuracy(
        {
          predictedHome: 1,
          predictedAway: 0,
          homeWinProb: 0.6,
          drawProb: 0.2,
          awayWinProb: 0.2,
          confidence: 0.6
        },
        { homeGoals: 2, awayGoals: 0 }
      )
    ).toBe("未命中");

    expect(
      formatPredictionAccuracy(
        {
          predictedHome: 1,
          predictedAway: 1,
          homeWinProb: 0.6,
          drawProb: 0.2,
          awayWinProb: 0.2,
          confidence: 0.6
        },
        { homeGoals: 2, awayGoals: 0 }
      )
    ).toBe("未命中");
  });
});
