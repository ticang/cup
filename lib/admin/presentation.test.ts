import { describe, expect, it } from "vitest";
import {
  formatEntityLabel,
  formatMetricName,
  formatModelName,
  formatProviderName,
  formatStatusLabel,
  formatTeamName
} from "./presentation";

describe("admin presentation helpers", () => {
  it("translates stored admin values for display", () => {
    expect(formatEntityLabel("fixtures")).toBe("比赛");
    expect(formatStatusLabel("completed_with_errors")).toBe("完成但有错误");
    expect(formatModelName("Ensemble V1")).toBe("集成模型 V1");
    expect(formatMetricName("brier_score")).toBe("Brier 分数");
    expect(formatProviderName("Sample Market")).toBe("样例市场");
    expect(formatTeamName("Argentina")).toBe("阿根廷");
  });
});
