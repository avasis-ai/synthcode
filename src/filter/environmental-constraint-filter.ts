import { Message } from "./types";

export interface EnvironmentalMetric {
  metricName: string;
  value: number;
  threshold: number;
  severity: "low" | "medium" | "high";
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  cost: number;
  requiredMetrics: {
    metricName: string;
    maxAllowedValue: number;
  }[];
}

export class EnvironmentalConstraintFilter {
  constructor() {}

  /**
   * Evaluates a single tool against the current environmental metrics.
   * A tool is considered available if all its required metrics are within acceptable bounds.
   * @param tool The tool definition to check.
   * @param metrics The current set of environmental metrics.
   * @returns boolean True if the tool is feasible, false otherwise.
   */
  isToolFeasible(tool: ToolDefinition, metrics: EnvironmentalMetric[]): boolean {
    for (const required of tool.requiredMetrics) {
      const metric = metrics.find(m => m.metricName === required.metricName);

      if (!metric) {
        // If a required metric is missing, we treat it as infeasible for safety.
        return false;
      }

      if (metric.value > required.maxAllowedValue) {
        return false;
      }
    }
    return true;
  }

  /**
   * Filters a list of available tools based on current environmental constraints.
   * @param availableTools The initial list of all possible tools.
   * @param metrics The current set of environmental metrics.
   * @returns A filtered list of tools that are currently feasible.
   */
  filterTools(availableTools: ToolDefinition[], metrics: EnvironmentalMetric[]): ToolDefinition[] {
    return availableTools.filter(tool => this.isToolFeasible(tool, metrics));
  }

  /**
   * Adjusts the perceived cost or complexity of tools based on environmental strain.
   * This function is for context enrichment, not strict pruning.
   * @param tool The tool definition.
   * @param metrics The current set of environmental metrics.
   * @returns A modified cost factor (higher means less desirable).
   */
  adjustToolCost(tool: ToolDefinition, metrics: EnvironmentalMetric[]): number {
    let adjustedCost = tool.cost;

    for (const required of tool.requiredMetrics) {
      const metric = metrics.find(m => m.metricName === required.metricName);

      if (metric) {
        const strainFactor = Math.max(0, (metric.value - required.maxAllowedValue) / required.maxAllowedValue);
        
        if (strainFactor > 0.1) {
          adjustedCost += strainFactor * 5;
        }
      }
    }
    return adjustedCost;
  }
}

export { EnvironmentalConstraintFilter };