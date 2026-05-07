import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type ServiceExecutionFunction = (context: Record<string, any>) => Promise<any>;

interface RetryPolicy {
  maxRetries: number;
  delayMs: number;
}

interface CircuitBreakerPolicy {
  failureThreshold: number;
  resetTimeoutMs: number;
}

interface RateLimitPolicy {
  limit: number;
  windowMs: number;
}

interface ServicePolicy {
  retry?: RetryPolicy;
  circuitBreaker?: CircuitBreakerPolicy;
  rateLimit?: RateLimitPolicy;
}

interface ServiceCallNode {
  id: string;
  execute: ServiceExecutionFunction;
  policies: ServicePolicy;
  dependencies: string[];
  fallback?: {
    serviceId: string;
    fallbackExecute: ServiceExecutionFunction;
  };
}

interface ServiceCallGraph {
  nodes: Record<string, ServiceCallNode>;
  startNodeId: string;
}

interface ExecutionContext {
  context: Record<string, any>;
  results: Record<string, any>;
}

export class ServiceCallGraphExecutor {
  private graph: ServiceCallGraph;

  constructor(graph: ServiceCallGraph) {
    this.graph = graph;
  }

  private async executeNodeWithPolicies(
    nodeId: string,
    node: ServiceCallNode,
    context: ExecutionContext
  ): Promise<any> {
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts <= (node.policies?.retry?.maxRetries ?? 0)) {
      try {
        const result = await node.execute(context.context);
        return result;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        attempts++;

        if (attempts > 1 && node.policies?.retry) {
          await new Promise(resolve => setTimeout(resolve, node.policies.retry.delayMs));
        }
      }
    }

    throw new Error(`Failed to execute node ${nodeId} after ${attempts} attempts. Last error: ${lastError?.message}`);
  }

  private async executeNode(
    nodeId: string,
    node: ServiceCallNode,
    context: ExecutionContext
  ): Promise<any> {
    let result: any;
    try {
      result = await this.executeNodeWithPolicies(nodeId, node, context);
    } catch (e) {
      console.error(`Node ${nodeId} failed:`, e);
      
      if (node.fallback) {
        console.warn(`Attempting fallback for ${nodeId} using ${node.fallback.serviceId}`);
        try {
          const fallbackResult = await node.fallback.fallbackExecute(context.context);
          return { fallback: fallbackResult };
        } catch (fallbackError) {
          throw new Error(`Fallback for ${nodeId} also failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
        }
      }
      throw e;
    }
    return result;
  }

  public async execute(initialContext: Record<string, any>): Promise<Record<string, any>> {
    let context: ExecutionContext = {
      context: initialContext,
      results: {}
    };

    const executionOrder: string[] = [];
    const visitedNodes = new Set<string>();
    const queue: string[] = [this.graph.startNodeId];

    while (queue.length > 0 && executionOrder.length < Object.keys(this.graph.nodes).length) {
      const nodeId = queue.shift()!;
      if (visitedNodes.has(nodeId)) continue;

      const node = this.graph.nodes[nodeId];
      
      // Check dependencies before adding to order
      const dependenciesMet = node.dependencies.every(depId => visitedNodes.has(depId));

      if (dependenciesMet && !visitedNodes.has(nodeId)) {
        executionOrder.push(nodeId);
        visitedNodes.add(nodeId);
        
        // Add subsequent nodes that depend on this one
        Object.values(this.graph.nodes).forEach(next => {
            if (next.dependencies.includes(nodeId) && !visitedNodes.has(next.id)) {
                queue.push(next.id);
            }
        });
      }
    }

    const finalResults: Record<string, any> = {};

    for (const nodeId of executionOrder) {
      const node = this.graph.nodes[nodeId];
      try {
        const result = await this.executeNode(nodeId, node, context);
        context.results[nodeId] = result;
        finalResults[nodeId] = result;
      } catch (e) {
        throw new Error(`Execution failed at node ${nodeId}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return context.results;
  }
}