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

export interface DependencyGraph {
  messages: Message[];
  dependencies: {
    sourceId: string;
    targetId: string;
    relationship: "calls" | "depends_on" | "follows";
  }[];
}

export abstract class MermaidVisualizer {
  abstract generateMermaidCode(graph: DependencyGraph): string;
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV26 extends MermaidVisualizer {
  generateMermaidCode(graph: DependencyGraph): string {
    const nodes = this.extractNodes(graph);
    const links = this.extractLinks(graph);

    let mermaidCode = "graph TD;\n";

    // 1. Define Nodes
    const nodeDeclarations: string[] = [];
    nodes.forEach((node, index) => {
      // Use a unique ID format for Mermaid nodes
      const nodeId = `N${index}`;
      let label = "";

      if (node.type === "message") {
        const msg = node as { type: "message"; content: Message };
        if (msg.content.role === "user") {
          label = `User Input: "${(msg.content as UserMessage).content.substring(0, 30)}..."`;
        } else if (msg.content.role === "assistant") {
          const assistantMsg = msg.content as AssistantMessage;
          const toolUses = (assistantMsg.content as ContentBlock[]).filter(
            (block) => (block as ToolUseBlock).type === "tool_use"
          );
          if (toolUses.length > 0) {
            label = `Assistant (Calls ${toolUses.length} Tools)`;
          } else {
            label = `Assistant Response`;
          }
        } else if (msg.content.role === "tool") {
          const toolResult = msg.content as ToolResultMessage;
          label = `Tool Result (${toolResult.tool_use_id.substring(0, 4)}...)`;
        }
      } else if (node.type === "dependency") {
        label = `${node.sourceId} -> ${node.targetId}`;
      }

      nodeDeclarations.push(`  ${node.id}["${label}"]`);
    });

    mermaidCode += nodeDeclarations.join("\n") + "\n";

    // 2. Define Links
    const linkDeclarations: string[] = [];
    links.forEach((link, index) => {
      const sourceNode = `N${index % nodes.length}`; // Simplified mapping for demonstration
      const targetNode = `N${(index + 1) % nodes.length}`;
      let relationshipArrow = "";

      switch (link.relationship) {
        case "calls":
          relationshipArrow = "-->|Calls|";
          break;
        case "depends_on":
          relationshipArrow = "-->|Depends On|";
          break;
        case "follows":
          relationshipArrow = "-->|Follows|";
          break;
      }
      linkDeclarations.push(`  ${sourceNode} ${relationshipArrow} ${targetNode}`);
    });

    mermaidCode += linkDeclarations.join("\n");

    return mermaidCode;
  }

  private extractNodes(graph: DependencyGraph): { id: string; type: "message" | "dependency"; content?: Message | { sourceId: string; targetId: string; relationship: "calls" | "depends_on" | "follows" }; }[] {
    const nodes: { id: string; type: "message" | "dependency"; content?: Message | { sourceId: string; targetId: string; relationship: "calls" | "depends_on" | "follows" }; }[] = [];

    // Message Nodes
    graph.messages.forEach((message, index) => {
      nodes.push({
        id: `Msg${index}`,
        type: "message",
        content: message,
      });
    });

    // Dependency Nodes (Representing the relationship itself for clarity)
    graph.dependencies.forEach((dep, index) => {
      nodes.push({
        id: `Dep${index}`,
        type: "dependency",
        content: { sourceId: dep.sourceId, targetId: dep.targetId, relationship: dep.relationship },
      });
    });

    return nodes;
  }

  private extractLinks(graph: DependencyGraph): { sourceId: string; targetId: string; relationship: "calls" | "depends_on" | "follows" }[] {
    // In a real scenario, we'd map sourceId/targetId to actual node IDs.
    // Here, we just return the provided dependencies as links.
    return graph.dependencies;
  }
}