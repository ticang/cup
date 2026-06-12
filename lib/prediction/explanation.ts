import { sanitizeExplanation } from "@/lib/safety/betting-copy";
import type { LlmRuntimeSettings } from "@/lib/llm/settings";
import type { GeneratedPrediction, PredictionInput } from "./engine";

export type ExplanationProvider = "openai-compatible" | "ollama" | "template";

export async function explainPrediction(
  input: PredictionInput,
  prediction: GeneratedPrediction,
  settings?: LlmRuntimeSettings | null
): Promise<{ provider: ExplanationProvider; text: string }> {
  const prompt = buildPrompt(input, prediction);

  if (settings && !settings.enabled) {
    return { provider: "template", text: sanitizeExplanation(prediction.explanation) };
  }

  if (settings?.provider === "template") {
    return { provider: "template", text: sanitizeExplanation(prediction.explanation) };
  }

  if (settings?.provider === "openai-compatible" && settings.appKey) {
    const text = await requestOpenAICompatible(prompt, {
      baseUrl: settings.baseUrl,
      appKey: settings.appKey,
      modelId: settings.modelId
    });
    if (text) {
      return { provider: "openai-compatible", text: sanitizeExplanation(text) };
    }
  }

  if (settings?.provider === "ollama") {
    const text = await requestOllama(prompt, {
      baseUrl: settings.baseUrl,
      modelId: settings.modelId
    });
    if (text) {
      return { provider: "ollama", text: sanitizeExplanation(text) };
    }
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (!settings && openAiKey) {
    const text = await requestOpenAICompatible(prompt, {
      baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
      appKey: openAiKey,
      modelId: process.env.OPENAI_MODEL ?? "gpt-4.1-mini"
    });
    if (text) {
      return { provider: "openai-compatible", text: sanitizeExplanation(text) };
    }
  }

  if (!settings && process.env.OLLAMA_BASE_URL && process.env.OLLAMA_MODEL) {
    const text = await requestOllama(prompt, {
      baseUrl: process.env.OLLAMA_BASE_URL,
      modelId: process.env.OLLAMA_MODEL
    });
    if (text) {
      return { provider: "ollama", text: sanitizeExplanation(text) };
    }
  }

  return { provider: "template", text: sanitizeExplanation(prediction.explanation) };
}

function buildPrompt(input: PredictionInput, prediction: GeneratedPrediction): string {
  return [
    "请用中文解释这场足球比赛的模型预测。",
    "只能解释概率和数据质量，不要给出投注指令、仓位、资金分配或保证盈利表达。",
    `比赛：${input.homeTeam.name} vs ${input.awayTeam.name}`,
    `最可能比分：${prediction.predictedHome}-${prediction.predictedAway}`,
    `胜平负概率：主胜 ${prediction.homeWinProb.toFixed(3)}，平局 ${prediction.drawProb.toFixed(3)}，客胜 ${prediction.awayWinProb.toFixed(3)}`,
    `大于 2.5 球概率：${prediction.over25Prob.toFixed(3)}`
  ].join("\n");
}

async function requestOpenAICompatible(
  prompt: string,
  config: { baseUrl: string; appKey: string; modelId: string }
): Promise<string | null> {
  try {
    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.appKey}`
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

async function requestOllama(
  prompt: string,
  config: { baseUrl: string; modelId: string }
): Promise<string | null> {
  try {
    const response = await fetch(
      `${config.baseUrl.replace(/\/$/, "")}/api/generate`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: config.modelId,
          prompt,
          stream: false
        })
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { response?: string };
    return data.response ?? null;
  } catch {
    return null;
  }
}
