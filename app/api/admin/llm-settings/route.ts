import { NextResponse, type NextRequest } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { normalizeLlmProvider } from "@/lib/llm/settings";

export async function POST(request: NextRequest) {
  if (!getAdminSessionFromRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const provider = normalizeLlmProvider(String(formData.get("provider") ?? ""));
  const baseUrl = String(formData.get("baseUrl") ?? "").trim();
  const modelId = String(formData.get("modelId") ?? "").trim();
  const appKey = String(formData.get("appKey") ?? "").trim();
  const clearAppKey = formData.get("clearAppKey") === "on";
  const enabled = formData.get("enabled") === "on";

  if (provider !== "template" && (!baseUrl || !modelId)) {
    return NextResponse.json(
      { error: "除模板解释外，模型地址和模型 ID 必填" },
      { status: 400 }
    );
  }

  const existing = await prisma.llmSettings.findUnique({
    where: { id: "default" }
  });

  await prisma.llmSettings.upsert({
    where: { id: "default" },
    update: {
      provider,
      baseUrl: baseUrl || defaultBaseUrl(provider),
      modelId: modelId || "template",
      appKey: clearAppKey ? null : appKey || existing?.appKey || null,
      enabled
    },
    create: {
      id: "default",
      provider,
      baseUrl: baseUrl || defaultBaseUrl(provider),
      modelId: modelId || "template",
      appKey: clearAppKey ? null : appKey || null,
      enabled
    }
  });

  return NextResponse.redirect(new URL("/admin/llm-settings?saved=1", request.url), {
    status: 303
  });
}

function defaultBaseUrl(provider: string): string {
  if (provider === "ollama") {
    return "http://localhost:11434";
  }

  if (provider === "template") {
    return "template";
  }

  return "https://api.openai.com/v1";
}
