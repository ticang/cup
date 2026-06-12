import { describe, expect, it } from "vitest";
import {
  calculateImpliedProbabilities
} from "../odds/implied-probability";
import {
  expectedGoals,
  generatePrediction,
  poissonProbability
} from "./engine";

describe("prediction engine", () => {
  it("calculates Poisson probabilities for exact goal counts", () => {
    expect(poissonProbability(1.4, 0)).toBeCloseTo(0.2466, 4);
    expect(poissonProbability(1.4, 2)).toBeCloseTo(0.2417, 4);
  });

  it("normalizes generated score probabilities", () => {
    const prediction = generatePrediction({
      fixtureId: "fixture-1",
      homeTeam: { name: "Home", rating: 1700 },
      awayTeam: { name: "Away", rating: 1650 },
      neutralVenue: true
    });

    const totalOutcomeProbability =
      prediction.homeWinProb + prediction.drawProb + prediction.awayWinProb;

    expect(totalOutcomeProbability).toBeCloseTo(1, 8);
    expect(prediction.scoreProbabilities[0].probability).toBeGreaterThan(0);
    expect(prediction.explanation).toContain("仅用于赛前概率分析");
  });

  it("keeps expected goals inside conservative bounds", () => {
    expect(expectedGoals(2400, 900, false).homeXg).toBeLessThanOrEqual(3.4);
    expect(expectedGoals(900, 2400, true).homeXg).toBeGreaterThanOrEqual(0.35);
  });
});

describe("odds implied probability", () => {
  it("removes overround from three-way odds", () => {
    const result = calculateImpliedProbabilities({
      homeOdds: 2.5,
      drawOdds: 3.2,
      awayOdds: 2.9
    });

    expect(result.home + result.draw + result.away).toBeCloseTo(1, 8);
    expect(result.overround).toBeGreaterThan(0);
  });
});
