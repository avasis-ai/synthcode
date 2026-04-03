export interface CostRecord {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  inputCost: number;
  outputCost: number;
  timestamp: number;
  turn: number;
  toolName?: string;
}

export interface ModelPricing {
  inputCostPer1k: number;
  outputCostPer1k: number;
}

export const DEFAULT_PRICING: Record<string, ModelPricing> = {
  "claude-sonnet-4-20250514": { inputCostPer1k: 0.003, outputCostPer1k: 0.015 },
  "claude-3-5-sonnet-20241022": { inputCostPer1k: 0.003, outputCostPer1k: 0.015 },
  "claude-3-5-haiku-20241022": { inputCostPer1k: 0.0008, outputCostPer1k: 0.004 },
  "claude-opus-4-20250514": { inputCostPer1k: 0.015, outputCostPer1k: 0.075 },
  "gpt-4o": { inputCostPer1k: 0.0025, outputCostPer1k: 0.01 },
  "gpt-4o-mini": { inputCostPer1k: 0.00015, outputCostPer1k: 0.0006 },
  "gpt-4-turbo": { inputCostPer1k: 0.01, outputCostPer1k: 0.03 },
};

export class CostTracker {
  private records: CostRecord[] = [];
  private pricing: Record<string, ModelPricing>;

  constructor(customPricing?: Record<string, ModelPricing>) {
    this.pricing = { ...DEFAULT_PRICING, ...customPricing };
  }

  record(
    model: string,
    usage: { inputTokens: number; outputTokens: number; cacheReadTokens?: number; cacheWriteTokens?: number },
    turn: number,
    toolName?: string,
  ): void {
    const pricing = this.pricing[model] ?? { inputCostPer1k: 0.001, outputCostPer1k: 0.003 };
    this.records.push({
      model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cacheReadTokens: usage.cacheReadTokens ?? 0,
      cacheWriteTokens: usage.cacheWriteTokens ?? 0,
      inputCost: (usage.inputTokens / 1000) * pricing.inputCostPer1k,
      outputCost: (usage.outputTokens / 1000) * pricing.outputCostPer1k,
      timestamp: Date.now(),
      turn,
      toolName,
    });
  }

  getTotal(): {
    cost: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
  } {
    let cost = 0;
    let input = 0;
    let output = 0;
    let cacheRead = 0;
    let cacheWrite = 0;
    for (const r of this.records) {
      cost += r.inputCost + r.outputCost;
      input += r.inputTokens;
      output += r.outputTokens;
      cacheRead += r.cacheReadTokens;
      cacheWrite += r.cacheWriteTokens;
    }
    return { cost, inputTokens: input, outputTokens: output, cacheReadTokens: cacheRead, cacheWriteTokens: cacheWrite };
  }

  getByModel(): Record<string, { cost: number; calls: number }> {
    const byModel: Record<string, { cost: number; calls: number }> = {};
    for (const r of this.records) {
      if (!byModel[r.model]) byModel[r.model] = { cost: 0, calls: 0 };
      byModel[r.model].cost += r.inputCost + r.outputCost;
      byModel[r.model].calls++;
    }
    return byModel;
  }

  getByTool(): Record<string, { cost: number; calls: number }> {
    const byTool: Record<string, { cost: number; calls: number }> = {};
    for (const r of this.records) {
      const key = r.toolName ?? "llm";
      if (!byTool[key]) byTool[key] = { cost: 0, calls: 0 };
      byTool[key].cost += r.inputCost + r.outputCost;
      byTool[key].calls++;
    }
    return byTool;
  }

  getRecords(): CostRecord[] {
    return [...this.records];
  }

  reset(): void {
    this.records = [];
  }

  setPricing(model: string, pricing: ModelPricing): void {
    this.pricing[model] = pricing;
  }
}
