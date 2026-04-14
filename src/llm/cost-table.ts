export interface ModelCost {
  inputPer1M: number;
  outputPer1M: number;
}

export const MODEL_COSTS: Record<string, ModelCost> = {
  "gpt-4o": { inputPer1M: 2.50, outputPer1M: 10.00 },
  "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.60 },
  "claude-sonnet-4-20250514": { inputPer1M: 3.00, outputPer1M: 15.00 },
  "claude-haiku-3-5-20241022": { inputPer1M: 0.80, outputPer1M: 4.00 },
  "gemini-2.5-flash": { inputPer1M: 0.15, outputPer1M: 0.60 },
  "gemini-2.5-pro": { inputPer1M: 1.25, outputPer1M: 5.00 },
  "deepseek-coder-v2": { inputPer1M: 0.14, outputPer1M: 0.28 },
  "qwen2.5-coder:7b": { inputPer1M: 0, outputPer1M: 0 },
};

export function estimateRequestCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const cost = MODEL_COSTS[model];
  if (!cost) return 0;
  return (inputTokens / 1_000_000) * cost.inputPer1M + (outputTokens / 1_000_000) * cost.outputPer1M;
}
