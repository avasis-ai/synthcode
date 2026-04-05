import { Message, ToolUseBlock } from "./types";

export interface GraphNode {
  id: string;
  name: string;
  dependencies: string[];
}

export interface AnalysisReport {
  hasCycle: boolean;
  cycleCount: number;
  maxDepth: number;
  isDeadEnd: boolean;
  riskScore: number;
  issues: string[];
}

export class ToolCallDependencyGraphAnalyzer {
  private graph: Map<string, GraphNode>;

  constructor() {}

  public setGraph(graph: GraphNode[]): void {
    this.graph = new Map<string, GraphNode>();
    graph.forEach(node => this.graph.set(node.id, node));
  }

  private detectCycles(nodeId: string, visited: Set<string>, recursionStack: Set<string>, path: string[]): { hasCycle: boolean; cycleCount: number; } {
    if (recursionStack.has(nodeId)) {
      return { hasCycle: true, cycleCount: 1 };
    }
    if (visited.has(nodeId)) {
      return { hasCycle: false, cycleCount: 0 };
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    let cycleCount = 0;
    for (const neighborId of this.graph.get(nodeId)?.dependencies || []) {
      const result = this.detectCycles(neighborId, visited, recursionStack, path);
      cycleCount += result.cycleCount;
      if (result.hasCycle) {
        return { hasCycle: true, cycleCount: 1 + result.cycleCount };
      }
    }

    recursionStack.delete(nodeId);
    path.pop();
    return { hasCycle: false, cycleCount: cycleCount };
  }

  private findMaxDepthAndDeadEnds(nodeId: string, visited: Set<string>, currentDepth: number, maxDepth: number, isDeadEnd: boolean): { maxDepth: number; isDeadEnd: boolean } {
    if (visited.has(nodeId)) {
      return { maxDepth: currentDepth, isDeadEnd: false };
    }

    visited.add(nodeId);
    let currentMaxDepth = currentDepth;
    let currentIsDeadEnd = true;

    const node = this.graph.get(nodeId);
    if (node) {
      for (const neighborId of node.dependencies) {
        const result = this.findMaxDepthAndDeadEnds(neighborId, visited, currentDepth + 1, maxDepth, false);
        currentMaxDepth = Math.max(currentMaxDepth, result.maxDepth);
        if (!result.isDeadEnd) {
          currentIsDeadEnd = false;
        }
      }
    }

    return { maxDepth: currentMaxDepth, isDeadEnd: currentIsDeadEnd };
  }

  public analyze(startNodeId: string, maxDepthLimit: number = 10): AnalysisReport {
    if (!this.graph.has(startNodeId)) {
      return {
        hasCycle: false,
        cycleCount: 0,
        maxDepth: 0,
        isDeadEnd: true,
        riskScore: 100,
        issues: [`Start node ${startNodeId} not found in the graph.`]
      };
    }

    const visited = new Set<string>();
    let totalCycleCount = 0;
    let hasCycle = false;

    // 1. Cycle Detection (DFS)
    const cycleResult = this.detectCycles(startNodeId, new Set<string>(), new Set<string>(), []);
    hasCycle = cycleResult.hasCycle;
    totalCycleCount = cycleResult.cycleCount;

    // 2. Depth and Dead End Detection (DFS)
    const depthResult = this.findMaxDepthAndDeadEnds(startNodeId, new Set<string>(), 0, 0, false);
    const maxDepth = depthResult.maxDepth;
    const isDeadEnd = depthResult.isDeadEnd && !this.graph.get(startNodeId)?.dependencies?.length;

    // 3. Risk Scoring and Issue Compilation
    let riskScore = 0;
    const issues: string[] = [];

    if (hasCycle) {
      riskScore += 50;
      issues.push(`Circular dependency detected involving ${totalCycleCount} potential cycles.`);
    }

    if (maxDepth > maxDepthLimit) {
      riskScore += 30;
      issues.push(`Dependency chain depth (${maxDepth}) exceeds the configured limit of ${maxDepthLimit}.`);
    }

    if (isDeadEnd && this.graph.get(startNodeId)?.dependencies?.length > 0) {
      riskScore += 20;
      issues.push(`Potential dead end detected after initial traversal.`);
    }

    // Base score: Higher score means higher risk (closer to 100)
    riskScore = Math.min(100, 100 - (10 * (1 - (hasCycle ? 0.5 : 0) - (maxDepth > maxDepthLimit ? 0.2 : 0) - (isDeadEnd ? 0.1 : 0))));

    return {
      hasCycle: hasCycle,
      cycleCount: totalCycleCount,
      maxDepth: maxDepth,
      isDeadEnd: isDeadEnd,
      riskScore: Math.round(riskScore),
      issues: issues.length > 0 ? issues : ["Analysis complete. No critical issues found."]
    };
  }
}