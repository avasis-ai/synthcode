import { randomInt } from 'node:crypto';

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

export interface DeploymentContext {
  requestId: string;
  userContext: Record<string, unknown>;
  weights: Record<string, number>;
}

export interface CanaryRule {
  weight: number;
  targetVersion: string;
  componentName: string;
}

export interface ComponentExecutionResult {
  success: boolean;
  latencyMs: number;
  output: any;
  metrics: Record<string, unknown>;
}

export class CanaryDeploymentManager {
  private rules: CanaryRule[] = [];
  private stableVersion: string;

  constructor(stableVersion: string) {
    this.stableVersion = stableVersion;
  }

  public addRule(rule: CanaryRule): void {
    this.rules.push(rule);
  }

  private calculateTotalWeight(): number {
    return this.rules.reduce((acc, rule) => acc + rule.weight, 0);
  }

  private selectVersion(context: DeploymentContext): { version: string; isCanary: boolean } {
    const totalWeight = this.calculateTotalWeight();
    if (totalWeight === 0) {
      return { version: this.stableVersion, isCanary: false };
    }

    const randomWeight = Math.random() * totalWeight;
    let cumulativeWeight = 0;

    for (const rule of this.rules) {
      cumulativeWeight += rule.weight;
      if (randomWeight < cumulativeWeight) {
        return { version: rule.targetVersion, isCanary: true };
      }
    }

    // Fallback to stable if rules fail or total weight is zero
    return { version: this.stableVersion, isCanary: false };
  }

  public route(context: DeploymentContext): { version: string; isCanary: boolean } {
    return this.selectVersion(context);
  }

  public async executeComponent(
    context: DeploymentContext,
    componentName: string,
    version: string,
    executionFn: (input: any) => Promise<any>
  ): Promise<ComponentExecutionResult> {
    const startTime = Date.now();
    let result: any;
    let success = false;
    let metrics: Record<string, unknown> = {};

    try {
      result = await executionFn(context);
      success = true;
    } catch (e) {
      success = false;
      metrics.error = e instanceof Error ? e.message : String(e);
    } finally {
      const latencyMs = Date.now() - startTime;
      metrics.latencyMs = latencyMs;
      return {
        success,
        latencyMs,
        output: result,
        metrics,
      };
    }
  }
}

export { CanaryDeploymentManager };