import { ToolCall } from "./types";

interface ToolMetadata {
  cost: number;
  resourceUsage: number;
  failureRate: number;
}

interface PlanContext {
  baseCost: number;
  availableResources: number;
}

export interface SimulationReport {
  totalCost: number;
  totalResourceUsage: number;
  overallFailureProbability: number;
  isFeasible: boolean;
}

export class PlanCostAndRiskSimulator {
  private toolMetadataMap: Map<string, ToolMetadata>;

  constructor(toolMetadataMap: Map<string, ToolMetadata>) {
    this.toolMetadataMap = toolMetadataMap;
  }

  private getMetadata(toolName: string): ToolMetadata | undefined {
    return this.toolMetadataMap.get(toolName);
  }

  private simulateStep(toolCall: ToolCall): { metadata: ToolMetadata; success: boolean } {
    const metadata = this.getMetadata(toolCall.name);
    if (!metadata) {
      return { metadata: { cost: 0, resourceUsage: 0, failureRate: 1.0 }, success: false };
    }
    return { metadata, success: true };
  }

  public simulatePlan(
    toolCalls: ToolCall[],
    context: PlanContext
  ): SimulationReport {
    let totalCost = context.baseCost;
    let totalResourceUsage = 0;
    let cumulativeFailureProbability = 1.0;
    let isFeasible = true;

    for (const toolCall of toolCalls) {
      const { metadata, success } = this.simulateStep(toolCall);

      if (!success) {
        totalCost += 0;
        totalResourceUsage += 0;
        cumulativeFailureProbability *= 1.0; // Max failure
        isFeasible = false;
        continue;
      }

      totalCost += metadata.cost;
      totalResourceUsage += metadata.resourceUsage;
      cumulativeFailureProbability *= (1.0 - metadata.failureRate);
    }

    const report: SimulationReport = {
      totalCost: totalCost,
      totalResourceUsage: totalResourceUsage,
      overallFailureProbability: 1.0 - cumulativeFailureProbability,
      isFeasible: totalResourceUsage <= context.availableResources,
    };

    return report;
  }

  public scorePlan(
    report: SimulationReport,
    weightCost: number,
    weightRisk: number
  ): number {
    if (!report.isFeasible) {
      return Infinity;
    }

    const costScore = report.totalCost * weightCost;
    const riskScore = report.overallFailureProbability * weightRisk;

    return costScore + riskScore;
  }
}