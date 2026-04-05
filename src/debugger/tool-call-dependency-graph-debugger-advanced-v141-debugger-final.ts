import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface GraphNode {
  id: string;
  type: "tool_call" | "condition" | "output";
  metadata: Record<string, unknown>;
  dependencies: string[];
}

export interface GraphEdge {
  fromId: string;
  toId: string;
  condition?: string;
}

export interface DebuggerContext {
  graph: GraphNode[];
  edges: GraphEdge[];
  history: Message[];
  currentNodeId: string | null;
  stepIndex: number;
  isFinished: boolean;
  checkpointData: Record<string, any>;
}

export class DebuggerEngine {
  private context: DebuggerContext;

  constructor(initialContext: DebuggerContext) {
    this.context = {
      graph: initialContext.graph || [],
      edges: initialContext.edges || [],
      history: initialContext.history || [],
      currentNodeId: initialContext.currentNodeId || null,
      stepIndex: initialContext.stepIndex || 0,
      isFinished: initialContext.isFinished || false,
      checkpointData: initialContext.checkpointData || {},
    };
  }

  public stepForward(): { success: boolean; nextContext: DebuggerContext } {
    if (this.context.isFinished) {
      return { success: false, nextContext: this.context };
    }

    const nextStep = this.context.stepIndex + 1;
    let nextContext: DebuggerContext = { ...this.context };

    if (nextStep > this.context.graph.length) {
      nextContext.isFinished = true;
      nextContext.stepIndex = nextStep;
      return { success: false, nextContext };
    }

    const nextNode = this.context.graph[nextStep];
    nextContext.currentNodeId = nextNode.id;
    nextContext.stepIndex = nextStep;
    nextContext.checkpointData = { ...this.context.checkpointData, step: nextStep, node: nextNode };

    return { success: true, nextContext };
  }

  public stepBackward(): { success: boolean; nextContext: DebuggerContext } {
    if (this.context.stepIndex <= 0) {
      return { success: false, nextContext: this.context };
    }

    const prevStep = this.context.stepIndex - 1;
    let nextContext: DebuggerContext = { ...this.context };

    nextContext.currentNodeId = this.context.graph[prevStep]?.id || null;
    nextContext.stepIndex = prevStep;
    nextContext.checkpointData = { ...this.context.checkpointData, step: prevStep, node: this.context.graph[prevStep] };

    return { success: true, nextContext: nextContext };
  }

  public finalizeSnapshot(): { json: string; mermaid: string } {
    const snapshot = {
      graph: this.context.graph,
      edges: this.context.edges,
      history: this.context.history,
      finalState: {
        currentNodeId: this.context.currentNodeId,
        stepIndex: this.context.stepIndex,
        isFinished: this.context.isFinished,
        checkpointData: this.context.checkpointData,
      },
    };

    const jsonString = JSON.stringify(snapshot, null, 2);

    let mermaidGraph = "graph TD\n";
    mermaidGraph += "    subgraph Execution Flow\n";
    this.context.graph.forEach(node => {
      mermaidGraph += `    ${node.id}["${node.type.toUpperCase()}: ${node.id}"];\n`;
    });

    this.context.edges.forEach(edge => {
      let link = `${edge.fromId} --> ${edge.toId}`;
      if (edge.condition) {
        link += `{Condition: ${edge.condition}}`;
      }
      mermaidGraph += `    ${link};\n`;
    });

    mermaidGraph += "    end\n";

    return { json: jsonString, mermaid: mermaidGraph };
  }
}

export function createDebugger(initialContext: DebuggerContext): DebuggerEngine {
  return new DebuggerEngine(initialContext);
}