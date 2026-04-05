import { DependencyGraph, Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./dependency-graph-visualizer-base";

type MermaidGraphType = "graph TD";

interface MermaidNode {
  id: string;
  label: string;
  subgraph?: string;
}

interface MermaidEdge {
  from: string;
  to: string;
  label: string;
  type: "data" | "control" | "default";
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV4 {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  private buildMermaidNodes(nodes: Map<string, MermaidNode>): string {
    let nodeDeclarations = "";
    for (const [id, node] of nodes.entries()) {
      let nodeContent = `id${id}["${node.label}"]`;
      if (node.subgraph) {
        nodeContent = `subgraph ${node.subgraph} ${nodeContent} end`;
      }
      nodeDeclarations += `\n${nodeContent}`;
    }
    return nodeDeclarations;
  }

  private buildMermaidEdges(edges: MermaidEdge[]): string {
    let edgeDeclarations = "";
    for (const edge of edges) {
      let label = edge.label;
      let edgeSyntax = `${edge.from} -->`;

      if (edge.type === "data") {
        edgeSyntax += `{data: ${label}}`;
      } else if (edge.type === "control") {
        edgeSyntax += `{control: ${label}}`;
      } else {
        edgeSyntax += `("${label}")`;
      }
      edgeDeclarations += `\n${edgeSyntax} --> ${edge.to}`;
    }
    return edgeDeclarations;
  }

  private traverseAndAnnotate(messageHistory: Message[]): { nodes: Map<string, MermaidNode>; edges: MermaidEdge[] } {
    const nodes = new Map<string, MermaidNode>();
    const edges: MermaidEdge[] = [];
    let nodeIdCounter = 0;

    const getNode = (id: string, label: string, subgraph?: string): MermaidNode => ({
      id,
      label,
      subgraph,
    });

    const addNode = (id: string, label: string, subgraph?: string): MermaidNode => {
      const node = getNode(id, label, subgraph);
      nodes.set(id, node);
      return node;
    };

    const addEdge = (fromId: string, toId: string, label: string, type: "data" | "control" | "default"): MermaidEdge => ({
      from: fromId,
      to: toId,
      label: label,
      type: type,
    });

    // 1. Process initial user input
    if (messageHistory.length > 0 && messageHistory[0].role === "user") {
      const userMsg = messageHistory[0] as Message & { content: { type: "text", text: string } };
      const startId = `U${nodeIdCounter++}`;
      addNode(startId, `User Input: "${userMsg.content.text.substring(0, 30)}..."`);
    }

    let currentId: string | null = null;

    for (let i = 0; i < messageHistory.length; i++) {
      const message = messageHistory[i];
      let currentMessageId: string;

      if (message.role === "assistant") {
        const assistantMsg = message as Message & { content: ContentBlock[] };
        const assistantId = `A${nodeIdCounter++}`;
        currentMessageId = assistantId;
        addNode(assistantId, `Assistant Turn ${i+1}`);

        // Process content blocks for tool calls/thinking
        for (const block of assistantMsg.content) {
          if (block.type === "tool_use") {
            const toolUse = block as ToolUseBlock;
            const toolId = `T${nodeIdCounter++}`;
            addNode(toolId, `Call: ${toolUse.name} (Input: ${JSON.stringify(toolUse.input)})`);
            
            // Edge from Assistant to Tool Call
            if (currentId) {
              edges.push(addEdge(currentId, toolId, "Initiate Tool Call", "default"));
            }
            currentId = toolId;
          } else if (block.type === "thinking") {
            const thinkingBlock = block as ThinkingBlock;
            const thinkingId = `TH${nodeIdCounter++}`;
            addNode(thinkingId, `Thinking: ${thinkingBlock.thinking.substring(0, 30)}...`);
            
            // Edge from previous step to Thinking
            if (currentId) {
              edges.push(addEdge(currentId, thinkingId, "Reasoning", "default"));
            }
            currentId = thinkingId;
          }
        }
        
        // If the last action was a tool call, the next step depends on the result.
        // We simulate the dependency structure here.
        if (currentId && messageHistory[i+1] && messageHistory[i+1].role === "tool") {
             // The actual dependency logic will be handled by the tool result processing below.
        }

      } else if (message.role === "tool") {
        const toolResult = message as Message & { tool_use_id: string, content: string, is_error?: boolean };
        const resultId = `R${nodeIdCounter++}`;
        const resultLabel = toolResult.is_error ? `Error: ${toolResult.content.substring(0, 30)}...` : `Result: ${toolResult.content.substring(0, 30)}...`;
        
        addNode(resultId, resultLabel);
        
        // Edge from previous step (Tool Call) to Result
        if (currentId) {
            edges.push(addEdge(currentId, resultId, "Execute", "default"));
        }
        currentId = resultId;
      }
    }

    // 2. Simulate Conditional Branching (Advanced Feature)
    // This assumes a pattern: Tool Call -> Result -> (IF/ELSE) -> Next Step
    if (messageHistory.length >= 3 && messageHistory[1].role === "assistant" && messageHistory[2].role === "tool") {
        const toolUseBlock = (messageHistory[1] as Message & { content: ContentBlock[] })?.content.find(b => b.type === "tool_use") as ToolUseBlock;
        const toolResult = messageHistory[2] as Message & { tool_use_id: string, content: string, is_error?: boolean };
        
        if (toolUseBlock && toolResult) {
            const conditionalStartId = `C${nodeIdCounter++}`;
            addNode(conditionalStartId, `Decision Point based on ${toolUseBlock.name}`);
            
            // Simulate IF path (Success)
            const successId = `S${nodeIdCounter++}`;
            addNode(successId, "Success Path Taken");
            edges.push(addEdge(conditionalStartId, successId, "Success", "control"));

            // Simulate ELSE path (Failure/Error)
            const failureId = `F${nodeIdCounter++}`;
            addNode(failureId, "Failure Path Taken");
            edges.push(addEdge(conditionalStartId, failureId, "Failure", "control"));
            
            // Update currentId to the decision point for subsequent edges
            currentId = conditionalStartId;
        }
    }


    return { nodes: nodes, edges: edges };
  }

  public visualize(messageHistory: Message[]): string {
    const { nodes, edges } = this.traverseAndAnnotate(messageHistory);

    const nodeDeclarations = this.buildMermaidNodes(nodes);
    const edgeDeclarations = this.buildMermaidEdges(edges);

    const mermaidCode = `
${MermaidGraphType}
    ${nodeDeclarations}
    ${edgeDeclarations}
`;

    return mermaidCode.trim();
  }
}