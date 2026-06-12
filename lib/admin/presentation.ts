import { translateTeamOrLabel } from "@/lib/data-sources/worldcup26";

const entityLabels: Record<string, string> = {
  competitions: "赛事",
  teams: "球队",
  fixtures: "比赛",
  odds: "赔率",
  "worldcup26-live": "2026 世界杯实时同步"
};

const statusLabels: Record<string, string> = {
  active: "启用",
  completed: "已完成",
  completed_with_errors: "完成但有错误",
  pending: "等待中",
  failed: "失败"
};

const modelLabels: Record<string, string> = {
  "Ensemble V1": "集成模型 V1",
  "Sample ensemble experiment promoted": "样例集成实验晋级模型"
};

const metricLabels: Record<string, string> = {
  brier_score: "Brier 分数",
  calibration_error: "校准误差",
  exact_score_accuracy: "精确比分命中率",
  validation_brier_score: "验证 Brier 分数",
  validation_log_loss: "验证对数损失"
};

const dataWindowLabels: Record<string, string> = {
  "Sample historical sanity check": "样例历史回测检查",
  "Sample fixtures": "样例比赛",
  "Imported fixtures with known results": "已导入且有赛果的比赛"
};

const experimentLabels: Record<string, string> = {
  "Sample ensemble experiment": "样例集成实验",
  "Ensemble experiment": "集成模型实验"
};

const providerLabels: Record<string, string> = {
  "sample-market": "样例市场",
  "Sample Market": "样例市场",
  "openai-compatible": "OpenAI 兼容接口",
  ollama: "Ollama 本地模型",
  template: "模板解释"
};

export function formatEntityLabel(value: string): string {
  return entityLabels[value] ?? value;
}

export function formatStatusLabel(value: string): string {
  return statusLabels[value] ?? value;
}

export function formatModelName(value: string): string {
  return modelLabels[value] ?? value;
}

export function formatMetricName(value: string): string {
  return metricLabels[value] ?? value;
}

export function formatSegmentLabel(value: string | null): string {
  if (!value || value === "all") {
    return "全部";
  }

  return value;
}

export function formatDataWindow(value: string): string {
  return dataWindowLabels[value] ?? value;
}

export function formatExperimentName(value: string): string {
  return experimentLabels[value] ?? value;
}

export function formatProviderName(value: string): string {
  return providerLabels[value] ?? value;
}

export function formatTeamName(value: string): string {
  return translateTeamOrLabel(value);
}
