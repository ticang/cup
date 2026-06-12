import { describe, expect, it } from "vitest";
import { maskAppKey, normalizeLlmProvider } from "./settings";

describe("LLM settings", () => {
  it("masks app keys before rendering", () => {
    expect(maskAppKey("sk-1234567890")).toBe("sk-1...7890");
    expect(maskAppKey(null)).toBe("未配置");
  });

  it("rejects unsupported providers", () => {
    expect(() => normalizeLlmProvider("unknown")).toThrow("Unsupported");
  });
});
