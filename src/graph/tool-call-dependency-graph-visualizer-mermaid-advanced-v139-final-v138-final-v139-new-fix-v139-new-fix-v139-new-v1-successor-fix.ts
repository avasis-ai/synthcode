import { Message, ContentBlock, ToolUseBlock, ThinkingBlock, TextBlock } from "./types";

export interface GraphContext {
  messages: Message[];
  initialState: string;
  finalState: string;
  toolCalls: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  }[];
  transitions: {
    from: string;
    to: string;
    condition?: string;
    loop?: boolean;
    label?: string;
  }[];
}

abstract class GraphVisualizer {
  abstract generateMermaidSyntax(context: GraphContext): string;
}

class MermaidAdvancedVisualizer extends GraphVisualizer {
  generateMermaidSyntax(context: GraphContext): string {
    let mermaid = "graph TD;\n";

    const nodes = new Set<string>();
    const edges: { from: string; to: string; condition?: string; label?: string }[] = [];

    // 1. Define Nodes (States)
    const defineNode = (id: string, label: string) => {
      if (!nodes.has(id)) {
        mermaid += `    ${id}["${label}"];\n`;
        nodes.add(id);
      }
    };

    // Initial and Final States
    defineNode("Start", "Start");
    defineNode("End", "End");

    // Tool Call Nodes
    context.toolCalls.forEach((tc, index) => {
      const nodeId = `Tool_${index}_${tc.name.replace(/[^a-zA-Z0-9]/g, '')}`;
      defineNode(nodeId, `${tc.name} (ID: ${tc.id})`);
    });

    // Message/Interaction Nodes (Simplified representation)
    context.messages.forEach((msg, index) => {
      let label = `Message ${index + 1}`;
      if (msg.role === "user") {
        label = `User Input`;
      } else if (msg.role === "assistant") {
        label = `Assistant Response`;
      } else if (msg.role === "tool") {
        label = `Tool Result`;
      }
      const nodeId = `Msg_${index}`;
      defineNode(nodeId, label);
    });

    // 2. Define Edges (Transitions)
    context.transitions.forEach((t, index) => {
      let edgeSyntax = `    ${t.from} --> ${t.to}`;
      let label = t.label || "";

      if (t.condition) {
        edgeSyntax = `    ${t.from} -- "${t.condition}" --> ${t.to}`;
      } else if (t.loop) {
        // Mermaid doesn't have native loop syntax for simple edges,
        // we represent it by a special label or structure if possible.
        edgeSyntax = `    ${t.from} -- "Loop" --> ${t.to}`;
      } else if (label) {
        edgeSyntax = `    ${t.from} -- "${label}" --> ${t.to}`;
      } else {
        edgeSyntax = `    ${t.from} --> ${t.to}`;
      }
      mermaid += edgeSyntax + ";\n";
    });

    // 3. Handle Complex Structures (Conceptual addition for robustness)
    // Mermaid uses subgraphs for grouping, which we simulate here.
    mermaid += "\n%% Conditional/Loop Structures (Conceptual)\n";
    context.transitions.filter(t => t.condition || t.loop).forEach((t, index) => {
        if (t.condition) {
            mermaid += `    subgraph Condition_${index} { ${t.from} -- "${t.condition}" --> ${t.to} };\n`;
        } else if (t.loop) {
            mermaid += `    subgraph Loop_${index} { ${t.from} -- "Loop" --> ${t.to} };\n`;
        }
    });


    return mermaid.trim();
  }
}

export const createGraphVisualizer = (): GraphVisualizer => {
  return new MermaidAdvancedVisualizer();
};