import { GraphContext, Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./graph-context-types";

export interface AdvancedGraphContext extends GraphContext {
  conditionalPaths?: {
    condition: string;
    truePath: string;
    falsePath: string;
  }[];
  loopIterations?: {
    loopId: string;
    iterations: number;
  }[];
}

class ToolCallDependencyGraphVisualizerMermaidAdvancedV154Enhanced {
  private context: AdvancedGraphContext;

  constructor(context: AdvancedGraphContext) {
    this.context = context;
  }

  private generateBasicGraph(messages: Message[]): string {
    let mermaid = "graph TD\n";
    let nodeIdCounter = 1;

    const getNode = (id: string, label: string): string => {
      return `${id}["${label}"]`;
    };

    messages.forEach((message, index) => {
      const nodeId = `M${index}`;
      let label = "";

      if (message.role === "user") {
        label = `User: ${message.content.substring(0, 30)}...`;
      } else if (message.role === "assistant") {
        let contentSummary = "";
        message.content.forEach((block, blockIndex) => {
          if (block.type === "text") {
            contentSummary += `[Text ${blockIndex}]: ${block.text.substring(0, 20)}...`;
          } else if (block.type === "tool_use") {
            contentSummary += `[Tool ${blockIndex}]: ${block.name}`;
          } else if (block.type === "thinking") {
            contentSummary += `[Thinking ${blockIndex}]: ${block.thinking.substring(0, 20)}...`;
          }
        });
        label = `Assistant: ${contentSummary.substring(0, 30)}...`;
      } else if (message.role === "tool") {
        label = `Tool Result (${message.tool_use_id}): ${message.content.substring(0, 30)}...`;
      }

      mermaid += `  ${getNode(nodeId, label)};\n`;
    });

    // Simple linear connections for basic flow
    for (let i = 0; i < messages.length - 1; i++) {
      mermaid += `  M${i} --> M${i + 1};\n`;
    }

    return mermaid;
  }

  private generateConditionalMermaid(context: AdvancedGraphContext): string {
    let mermaid = "";
    if (!context.conditionalPaths || context.conditionalPaths.length === 0) {
      return "";
    }

    mermaid += "\n%% Conditional Paths Visualization (If/Else)\n";
    context.conditionalPaths.forEach((path, index) => {
      const conditionNodeId = `C_Cond${index}`;
      mermaid += `  ${conditionNodeId}["Condition: ${path.condition}"]\n`;

      // Mermaid doesn't have native IF/ELSE syntax for flow control,
      // we simulate it using subgraphs or explicit branching nodes.
      // We'll use a structure that implies branching.
      mermaid += `  ${conditionNodeId} -->|True| T${index}_True[True Path];\n`;
      mermaid += `  ${conditionNodeId} -->|False| T${index}_False[False Path];\n`;
    });
    return mermaid;
  }

  private generateLoopMermaid(context: AdvancedGraphContext): string {
    let mermaid = "";
    if (!context.loopIterations || context.loopIterations.length === 0) {
      return "";
    }

    mermaid += "\n%% Loop Visualization\n";
    context.loopIterations.forEach((loop, index) => {
      const loopNodeId = `L_Loop${index}`;
      mermaid += `  ${loopNodeId}["Loop: ${loop.loopId} (${loop.iterations} times)"]\n`;
      // Simulate loop structure using a cycle or explicit connection back
      mermaid += `  L_Start --> ${loopNodeId} --> L_End;\n`;
    });
    return mermaid;
  }

  public visualize(): string {
    let mermaid = "";

    // 1. Basic Flow Graph
    mermaid += this.generateBasicGraph(this.context.messages);

    // 2. Advanced Features Integration
    mermaid += this.generateConditionalMermaid(this.context);
    mermaid += this.generateLoopMermaid(this.context);

    return mermaid;
  }
}

export { ToolCallDependencyGraphVisualizerMermaidAdvancedV154Enhanced };