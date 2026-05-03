import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ToolCallRequest {
  tool_name: string;
  input: Record<string, unknown>;
}

export interface ToolCallDependencyResolver {
  resolveDependencies(
    requestedCalls: ToolCallRequest[],
    toolDefinitions: Record<string, ToolDefinition>
  ): {
    executionOrder: string[];
    dependencies: Map<string, string[]>;
  };
}

class ToolCallDependencyResolverImpl implements ToolCallDependencyResolver {
  resolveDependencies(
    requestedCalls: ToolCallRequest[],
    toolDefinitions: Record<string, ToolDefinition>
  ): {
    executionOrder: string[];
    dependencies: Map<string, string[]>;
  } {
    const callMap = new Map<string, ToolCallRequest>();
    const toolNameMap = new Map<string, ToolDefinition>();

    requestedCalls.forEach((call, index) => {
      const callId = `${call.tool_name}_${index}`;
      callMap.set(callId, call);
    });

    requestedCalls.forEach((call, index) => {
      const callId = `${call.tool_name}_${index}`;
      const definition = toolDefinitions[call.tool_name];
      if (definition) {
        toolNameMap.set(call.tool_name, definition);
      }
    });

    const dependencies = new Map<string, string[]>();
    const graph = new Map<string, Set<string>>();

    requestedCalls.forEach((call, index) => {
      const callId = `${call.tool_name}_${index}`;
      graph.set(callId, new Set<string>());
    });

    for (let i = 0; i < requestedCalls.length; i++) {
      for (let j = 0; j < requestedCalls.length; j++) {
        if (i === j) continue;

        const callerCall = requestedCalls[i];
        const calleeCall = requestedCalls[j];

        const callerId = `${callerCall.tool_name}_${i}`;
        const calleeId = `${calleeCall.tool_name}_${j}`;

        const callerDef = toolDefinitions[callerCall.tool_name];
        const calleeDef = toolDefinitions[calleeCall.tool_name];

        if (!callerDef || !calleeDef) continue;

        const requiredParams = Object.keys(calleeDef.parameters).filter(
          (key) => !calleeDef.parameters[key].hasOwnProperty("type") ||
            (calleeDef.parameters[key] as any).type === "string"
        );

        for (const paramName of requiredParams) {
          const paramSchema = (calleeDef.parameters as any)[paramName];
          if (!paramSchema || !paramSchema.properties) continue;

          const requiredType = paramSchema.properties[paramName];

          if (requiredType && requiredType.properties) {
            const requiredProps = Object.keys(requiredType.properties);
            for (const propName of requiredProps) {
              const propSchema = requiredType.properties[propName];
              if (propSchema && propSchema.properties) {
                const propKeys = Object.keys(propSchema.properties);
                for (const propKey of propKeys) {
                  const propSchemaInner = propSchema.properties[propKey];

                  // Simplified dependency check: if the required input for callee
                  // matches a potential output field from caller.
                  // In a real scenario, we'd need the output schema of the tool call.
                  // Here, we simulate: if the callee needs 'X' and the caller *might*
                  // produce 'X', we establish a dependency.
                  if (propKey === paramName && callerDef.name === "dummy_output_tool") {
                    // This is a placeholder for actual output schema introspection.
                    // Assuming the caller produces a field matching the callee's need.
                    graph.get(calleeId)!.add(callerId);
                  }
                }
              }
            }
          }
        }
      }
    }

    // Simple topological sort approximation (assuming no cycles for this scope)
    const executionOrder: string[] = [];
    const visited = new Set<string>();
    const sorted = new Set<string>();

    const dfs = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      sorted.add(nodeId);

      const predecessors = Array.from(graph.get(nodeId) || []).map(
        (predId) => predId
      );

      for (const predId of predecessors) {
        if (!sorted.has(predId)) {
          dfs(predId);
        }
      }
    };

    // To get a valid order, we need to process nodes that have no incoming edges first,
    // or use Kahn's algorithm. For simplicity, we'll just collect all nodes
    // and rely on the graph structure to guide the order if possible.

    // A basic approach: find nodes with no incoming dependencies first.
    const incomingEdges = new Map<string, Set<string>>();
    for (const [nodeId, neighbors] of graph.entries()) {
      for (const neighborId of neighbors) {
        if (!incomingEdges.has(neighborId)) {
          incomingEdges.set(neighborId, new Set<string[]>());
        }
        incomingEdges.get(neighborId)!.add(nodeId);
      }
    }

    const inDegree = new Map<string, number>();
    for (const nodeId of graph.keys()) {
      inDegree.set(nodeId, 0);
    }
    for (const [nodeId, neighbors] of graph.entries()) {
      for (const neighborId of neighbors) {
        if (inDegree.has(neighborId)) {
          inDegree.set(neighborId, (inDegree.get(neighborId) || 0) + 1);
        }
      }
    }

    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    const finalOrder: string[] = [];
    const currentInDegree = new Map(inDegree);

    while (queue.length > 0) {
      const uId = queue.shift()!;
      finalOrder.push(uId);

      const neighbors = Array.from(graph.get(uId) || []);
      for (const vId of neighbors) {
        if (currentInDegree.has(vId)) {
          const newDegree = (currentInDegree.get(vId)! - 1);
          currentInDegree.set(vId, newDegree);
          if (newDegree === 0) {
            queue.push(vId);
          }
        }
      }
    }

    const finalDependencies = new Map<string, string[]>();
    for (const [nodeId, neighbors] of graph.entries()) {
      const dependenciesForNode: string[] = [];
      for (const neighborId of neighbors) {
        dependenciesForNode.push(neighborId);
      }
      finalDependencies.set(nodeId, dependenciesForNode);
    }

    return {
      executionOrder: finalOrder.length === requestedCalls.length ? finalOrder : [],
      dependencies: finalDependencies,
    };
  }
}

export const createToolCallDependencyResolver = (): ToolCallDependencyResolver => {
  return new ToolCallDependencyResolverImpl();
};