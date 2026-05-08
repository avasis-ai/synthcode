import { randomInt } from "node:crypto";

export type Message = { role: "user" | "assistant" | "tool"; content: any };

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: any[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = any;

export interface CanaryRule {
  name: string;
  weight: number;
  strategy: (context: any, history: Message[]): Promise<{ result: any; metrics: Record<string, number> }>;
}

export type StrategyFunction = (context: any, history: Message[]) => Promise<{ result: any; metrics: Record<string, number> }>;

export interface CanaryResult {
  strategyName: string;
  result: any;
  metrics: Record<string, number>;
}

export class AgentBehaviorCanaryManager {
  private rules: CanaryRule[];

  constructor(rules: CanaryRule[]) {
    this.rules = rules;
  }

  private selectStrategy(history: Message[]): CanaryRule {
    const totalWeight = this.rules.reduce((sum, rule) => sum + rule.weight, 0);
    let randomWeight = Math.random() * totalWeight;

    for (const rule of this.rules) {
      if (randomWeight < rule.weight) {
        return rule;
      }
      randomWeight -= rule.weight;
    }
    // Fallback to the first rule if weights are somehow miscalculated
    return this.rules[0];
  }

  public async executeCanary(context: any, history: Message[]): Promise<CanaryResult> {
    const selectedRule = this.selectStrategy(history);
    
    const startTime = process.hrtime.bigint();

    try {
      const { result, metrics } = await selectedRule.strategy(context, history);
      
      const endTime = process.hrtime.bigint();
      const executionTimeNs = endTime - startTime;
      
      const finalMetrics: Record<string, number> = {
        ...metrics,
        execution_time_ms: Number(executionTimeNs) / 1_000_000,
      };

      return {
        strategyName: selectedRule.name,
        result: result,
        metrics: finalMetrics,
      };
    } catch (error) {
      console.error(`Canary execution failed for ${selectedRule.name}:`, error);
      return {
        strategyName: selectedRule.name,
        result: null,
        metrics: { error: 1, execution_time_ms: 0 },
      };
    }
  }
}