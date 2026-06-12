import { describe, expect, it } from "vitest";
import {
  containsBettingInstruction,
  sanitizeExplanation
} from "./betting-copy";

describe("betting copy safety", () => {
  it("allows analytical probability language", () => {
    expect(
      containsBettingInstruction("模型认为主胜概率较高，但仍存在明显不确定性。")
    ).toBe(false);
  });

  it("replaces betting instruction language", () => {
    expect(sanitizeExplanation("建议下注主胜并加大仓位。")).toContain(
      "不提供投注指令"
    );
  });
});
