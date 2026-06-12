export type LlmProvider = "openai-compatible" | "ollama" | "template";

export type LlmRuntimeSettings = {
  provider: LlmProvider;
  baseUrl: string;
  appKey: string | null;
  modelId: string;
  enabled: boolean;
};

export function normalizeLlmProvider(value: string): LlmProvider {
  if (
    value === "openai-compatible" ||
    value === "ollama" ||
    value === "template"
  ) {
    return value;
  }

  throw new Error("Unsupported LLM provider");
}

export function maskAppKey(appKey: string | null | undefined): string {
  if (!appKey) {
    return "未配置";
  }

  if (appKey.length <= 8) {
    return "已配置";
  }

  return `${appKey.slice(0, 4)}...${appKey.slice(-4)}`;
}
