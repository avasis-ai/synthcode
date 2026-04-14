import type { ModelResponse, ContentBlock } from '../types.js';
import type { Provider, ChatRequest } from './provider.js';
import { estimateRequestCost } from './cost-table.js';

export type ModelTier = "fast" | "standard" | "powerful";

export interface TieredRouterConfig {
  fast: Provider;
  standard: Provider;
  powerful?: Provider;
}

export const DEFAULT_TOOL_TIER_MAP: Record<string, ModelTier> = {
  file_read: "fast",
  glob: "fast",
  grep: "fast",
  web_fetch: "fast",
  file_edit: "powerful",
  file_write: "powerful",
  fuzzy_edit: "powerful",
  bash: "standard",
};

export interface RouterStats {
  totalRequests: number;
  byTier: Record<ModelTier, { requests: number; inputTokens: number; outputTokens: number }>;
  estimatedCostSaved: number;
}

const TIER_ORDER: ModelTier[] = ["fast", "standard", "powerful"];

function tierRank(tier: ModelTier): number {
  return TIER_ORDER.indexOf(tier);
}

export class TieredRouter implements Provider {
  private tiers: Map<ModelTier, Provider>;
  private toolMap: Map<string, ModelTier>;
  private currentTier: ModelTier = "standard";
  private stats: RouterStats;

  constructor(config: TieredRouterConfig) {
    this.tiers = new Map<ModelTier, Provider>();
    this.tiers.set("fast", config.fast);
    this.tiers.set("standard", config.standard);
    if (config.powerful) {
      this.tiers.set("powerful", config.powerful);
    }

    this.toolMap = new Map<string, ModelTier>(Object.entries(DEFAULT_TOOL_TIER_MAP));

    this.stats = {
      totalRequests: 0,
      byTier: {
        fast: { requests: 0, inputTokens: 0, outputTokens: 0 },
        standard: { requests: 0, inputTokens: 0, outputTokens: 0 },
        powerful: { requests: 0, inputTokens: 0, outputTokens: 0 },
      },
      estimatedCostSaved: 0,
    };
  }

  get model(): string {
    return this.resolveTier(this.currentTier).model;
  }

  chat(request: ChatRequest): Promise<ModelResponse> {
    const tier = this.determineTier(request);
    const provider = this.resolveTier(tier);
    const assumedTier = this.resolveTier("powerful");
    this.estimateSavings(tier, assumedTier.model);

    return provider.chat(request).then((response) => {
      this.recordUsage(tier, response.usage.inputTokens, response.usage.outputTokens);
      return response;
    });
  }

  setTier(tier: ModelTier): void {
    this.currentTier = tier;
  }

  getTierForTool(toolName: string): ModelTier {
    return this.toolMap.get(toolName) ?? "standard";
  }

  routeByToolCalls(toolCalls: Array<{ name: string }>): ModelTier {
    let maxTier: ModelTier = "fast";
    for (const tc of toolCalls) {
      const tier = this.getTierForTool(tc.name);
      if (tierRank(tier) > tierRank(maxTier)) {
        maxTier = tier;
      }
    }
    return maxTier;
  }

  getStats(): RouterStats {
    return {
      totalRequests: this.stats.totalRequests,
      byTier: {
        fast: { ...this.stats.byTier.fast },
        standard: { ...this.stats.byTier.standard },
        powerful: { ...this.stats.byTier.powerful },
      },
      estimatedCostSaved: this.stats.estimatedCostSaved,
    };
  }

  private determineTier(request: ChatRequest): ModelTier {
    const messages = request.messages;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === "assistant") {
        const toolCalls = this.extractToolCalls(msg.content);
        if (toolCalls.length > 0) {
          return this.routeByToolCalls(toolCalls);
        }
        break;
      }
    }
    return this.currentTier;
  }

  private extractToolCalls(content: string | ContentBlock[]): Array<{ name: string }> {
    if (typeof content === "string") return [];
    const calls: Array<{ name: string }> = [];
    for (const block of content) {
      if (block.type === "tool_use") {
        calls.push({ name: block.name });
      }
    }
    return calls;
  }

  private resolveTier(tier: ModelTier): Provider {
    const provider = this.tiers.get(tier);
    if (provider) return provider;
    const rank = tierRank(tier);
    for (let i = rank - 1; i >= 0; i--) {
      const fallback = this.tiers.get(TIER_ORDER[i]);
      if (fallback) return fallback;
    }
    return this.tiers.get("fast")!;
  }

  private recordUsage(tier: ModelTier, inputTokens: number, outputTokens: number): void {
    this.stats.totalRequests++;
    this.stats.byTier[tier].requests++;
    this.stats.byTier[tier].inputTokens += inputTokens;
    this.stats.byTier[tier].outputTokens += outputTokens;
  }

  private estimateSavings(usedTier: ModelTier, baselineModel: string): void {
    const usedProvider = this.resolveTier(usedTier);
    const usedCost = estimateRequestCost(usedProvider.model, 1000, 500);
    const baselineCost = estimateRequestCost(baselineModel, 1000, 500);
    if (baselineCost > 0) {
      this.stats.estimatedCostSaved += baselineCost - usedCost;
    }
  }
}
