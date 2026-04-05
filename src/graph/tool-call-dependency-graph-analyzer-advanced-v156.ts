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

interface ToolCallNode {
  message: Message;
  tool_use_id: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  context_state_changes: Map<string, any>;
}

interface DependencyReport {
  implicit_flows: {
    source_node_id: string;
    target_node_id: string;
    variable_name: string;
    description: string;
  }[];
  potential_issues: {
    node_id: string;
    issue_type: "data_loss" | "race_condition" | "uninitialized_read";
    details: string;
  }[];
}

export class ToolCallDependencyGraphAnalyzerAdvancedV156 {
  private graphNodes: ToolCallNode[];
  private graphEdges: { from: string; to: string }[];

  constructor(nodes: ToolCallNode[], edges: { from: string; to: string }[]) {
    this.graphNodes = nodes;
    this.graphEdges = edges;
  }

  private analyzeContextFlow(sourceNode: ToolCallNode, targetNode: ToolCallNode): {
    implicit_flows: {
      source_node_id: string;
      target_node_id: string;
      variable_name: string;
      description: string;
    }[];
    potential_issues: {
      node_id: string;
      issue_type: "data_loss" | "race_condition" | "uninitialized_read";
      details: string;
    }[];
  } {
    const implicit_flows: {
      source_node_id: string;
      target_node_id: string;
      variable_name: string;
      description: string;
    }[] = [];
    const potential_issues: {
      node_id: string;
      issue_type: "data_loss" | "race_condition" | "uninitialized_read";
      details: string;
    }[] = [];

    const sourceContext = sourceNode.context_state_changes;
    const targetContext = targetNode.context_state_changes;

    // 1. Identify variables written in source but potentially read in target (implicit flow)
    const sourceWrittenVars = Array.from(sourceContext.keys());
    const targetReadVars = new Set<string>();

    // Simple heuristic: Assume any variable present in the target's inputs/outputs
    // that wasn't explicitly passed as a direct input from the source is a potential implicit read.
    // For this advanced version, we check if the target *uses* a variable name that was *set* by the source.
    const targetUses = (node: ToolCallNode) => {
      const uses: Set<string> = new Set<string>();
      // Check inputs
      Object.keys(node.inputs).forEach(key => uses.add(key));
      // Check outputs (if the tool result structure implies variable usage)
      if (node.outputs) {
        Object.keys(node.outputs).forEach(key => uses.add(key));
      }
      return uses;
    };

    const targetUsedVars = targetUses(targetNode);

    for (const varName of sourceWrittenVars) {
      if (targetUsedVars.has(varName) && !Object.keys(sourceNode.inputs).some(key => key === varName)) {
        implicit_flows.push({
          source_node_id: sourceNode.message.role === "tool" ? "tool_result" : "tool_call",
          target_node_id: targetNode.message.role === "tool" ? "tool_result" : "tool_call",
          variable_name: varName,
          description: `Variable '${varName}' set by source context and implicitly read by target, suggesting state dependency.`
        });
      }
    }

    // 2. Detect potential data loss or race conditions (Simplified for sequential analysis)
    // Data Loss: Variable written in source but never read or used in target.
    // Race Condition: Variable written in source, and then overwritten/modified in target without clear dependency tracking.
    if (sourceContext.size > 0 && targetContext.size > 0) {
      const sourceKeys = new Set(sourceContext.keys());
      const targetKeys = new Set(targetContext.keys());

      // Check for variables written in source that are completely ignored/overwritten without consequence
      const potentiallyLostVars = Array.from(sourceKeys).filter(key => !targetKeys.has(key) && !targetUsedVars.has(key));
      if (potentiallyLostVars.length > 0) {
        potential_issues.push({
          node_id: targetNode.message.role === "tool" ? "tool_result" : "tool_call",
          issue_type: "data_loss",
          details: `Variables ${potentiallyLostVars.join(', ')} set by source context might be lost or unused in the subsequent step.`
        });
      }

      // Check for direct overwrites (potential race/unintended mutation)
      const overwrittenVars = Array.from(sourceKeys).filter(key => targetKeys.has(key) && sourceContext.get(key) !== targetContext.get(key));
      if (overwrittenVars.length > 0) {
        potential_issues.push({
          node_id: targetNode.message.role === "tool" ? "tool_result" : "tool_call",
          issue_type: "race_condition",
          details: `Variable(s) ${overwrittenVars.join(', ')} were modified between steps. Verify if this mutation is intended.`
        });
      }
    }

    return { implicit_flows, potential_issues };
  }

  public analyzeDependencies(): DependencyReport {
    const implicit_flows: {
      source_node_id: string;
      target_node_id: string;
      variable_name: string;
      description: string;
    }[] = [];
    const potential_issues: {
      node_id: string;
      issue_type: "data_loss" | "race_condition" | "uninitialized_read";
      details: string;
    }[] = [];

    // Iterate over sequential edges to analyze context flow
    for (const edge of this.graphEdges) {
      const sourceNode = this.graphNodes.find(n => n.message.role === "tool_call" && n.message.content.toString().includes(edge.from)) || this.graphNodes[0];
      const targetNode = this.graphNodes.find(n => n.message.role === "tool_result" && n.message.content.toString().includes(edge.to)) || this.graphNodes[1];

      if (!sourceNode || !targetNode) continue;

      const analysis = this.analyzeContextFlow(sourceNode, targetNode);
      implicit_flows.push(...analysis.implicit_flows);
      potential_issues.push(...analysis.potential_issues);
    }

    return {
      implicit_flows,
      potential_issues,
    };
  }
}