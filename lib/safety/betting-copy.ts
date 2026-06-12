const blockedPhrases = [
  "下注",
  "投注",
  "仓位",
  "本金",
  "稳赢",
  "稳赚",
  "必胜",
  "kelly",
  "凯利"
];

export function containsBettingInstruction(text: string): boolean {
  const normalized = text.toLowerCase();
  return blockedPhrases.some((phrase) => normalized.includes(phrase));
}

export function sanitizeExplanation(text: string): string {
  if (!containsBettingInstruction(text)) {
    return text;
  }

  return "模型解释已被安全策略替换：本平台仅提供概率分析，不提供投注指令、仓位或资金分配建议。";
}
