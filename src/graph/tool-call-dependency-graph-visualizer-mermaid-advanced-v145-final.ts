import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface GraphNode {
  id: string;
  message: Message;
  type: "user" | "assistant" | "tool";
  contentBlocks: ContentBlock[];
}

interface DependencyGraph {
  nodes: GraphNode[];
  dependencies: { from: string; to: string; condition?: string }[];
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV145Final {
  private readonly FEATURE_FLAG = "advanced-v145-final";

  generateMermaidGraph(graph: DependencyGraph): string {
    let mermaid = `graph TD\n`;
    let subgraphDeclarations: string[] = [];
    let nodeDefinitions: Map<string, string> = new Map();

    // 1. Define all nodes
    graph.nodes.forEach(node => {
      const nodeId = node.id;
      let content = "";
      if (node.type === "user") {
        content = `User Input: "${node.message.content}"`;
      } else if (node.type === "assistant") {
        const textContent = node.contentBlocks.filter(b => b.type === "text").map(b => `Text: "${b.text}"`).join("; ");
        const toolUses = node.contentBlocks.filter(b => b.type === "tool_use").map(b => `Tool Call: ${b.name}(${JSON.stringify(b.input)})`).join("; ");
        content = `Assistant Response: ${textContent}${toolUses ? " | " + toolUses : ""}`;
      } else if (node.type === "tool") {
        const toolMsg = node.message as ToolResultMessage;
        const errorStatus = toolMsg.is_error ? " (ERROR)" : "";
        content = `Tool Result (${toolMsg.tool_use_id}): ${toolMsg.content}${errorStatus}`;
      }

      nodeDefinitions.set(nodeId, `id${nodeId}["${content}"]`);
    });

    // 2. Define dependencies (edges)
    graph.dependencies.forEach(dep => {
      let edge = `${dep.from} --> ${dep.to}`;
      if (dep.condition) {
        edge = `${dep.from} -- "${dep.condition}" --> ${dep.to}`;
      }
      mermaid += `\n${edge}`;
    });

    // 3. Advanced Rendering Pass: Flow Control and Final States
    if (this.FEATURE_FLAG === "advanced-v145-final") {
      subgraphDeclarations = this.processFlowControl(graph);
      mermaid += "\n%% --- Advanced Flow Control Subgraphs ---\n";
      mermaid += subgraphDeclarations.join("\n");
    }

    // 4. Final Assembly
    mermaid = `%% Mermaid Graph Definition for Tool Call Dependency Graph\n`;
    mermaid += `%% Version: ${this.FEATURE_FLAG}\n`;
    mermaid += `%% Nodes Defined:\n${Array.from(nodeDefinitions.values()).join("\n")}\n`;
    mermaid += `\n%% Dependencies Defined:\n${mermaid.substring(mermaid.indexOf("graph TD"))}\n`;

    return mermaid;
  }

  private processFlowControl(graph: DependencyGraph): string[] {
    let subgraphs: string[] = [];

    // Simulate complex flow detection (e.g., checking for conditional branching or explicit loops)
    // In a real implementation, this would require analyzing the sequence and dependency structure for patterns.

    // Example: Detecting a potential conditional branch (e.g., Tool Result leading to two distinct paths)
    const conditionalEdges = graph.dependencies.filter(dep => dep.condition && dep.condition.toLowerCase().includes("if"));
    if (conditionalEdges.length > 0) {
      let subgraph = "subgraph Conditional Logic\n";
      subgraph += "    direction LR\n";
      const sourceNodeId = conditionalEdges[0].from;
      const targetNodeId = conditionalEdges[0].to;

      subgraph += `    ${sourceNodeId} -- "Decision Point" --> DecisionNode[Decision]\n`;
      subgraph += `    DecisionNode -- "True" --> ${targetNodeId} (Success Path)\n`;
      subgraph += `    DecisionNode -- "False" --> ErrorNode[Error Path]\n`;
      subgraphs.push(subgraph);
    }

    // Example: Detecting a loop structure (e.g., Tool Call -> Tool Result -> Tool Call)
    const loopPattern = graph.dependencies.filter(dep => 
      dep.from.includes("tool") && dep.to.includes("tool") && dep.condition?.toLowerCase().includes("loop")
    );
    if (loopPattern.length > 0) {
      let subgraph = "subgraph Loop Execution\n";
      subgraph += "    direction TB\n";
      subgraph += `    LoopStart --> ToolCallA[Tool Call A]\n`;
      subgraph += `    ToolCallA --> ToolResultB[Tool Result B]\n`;
      subgraph += `    ToolResultB -- "Loop Condition Met" --> ToolCallA\n`;
      subgraphs.push(subgraph);
    }

    return subgraphs;
  }
}