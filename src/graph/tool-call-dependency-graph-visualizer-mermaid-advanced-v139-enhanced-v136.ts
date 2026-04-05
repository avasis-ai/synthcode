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

export interface FlowControlNode {
  id: string;
  type: "conditional" | "loop_exit" | "manual_step";
  description: string;
  condition?: string;
  next_nodes?: string[];
}

export interface GraphContext {
  messages: Message[];
  dependencies: Record<string, {
    from: string;
    to: string;
    metadata?: {
      flow_control?: FlowControlNode;
      condition?: string;
    };
  }>;
  flow_controls: FlowControlNode[];
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV139EnhancedV136 {
  private context: GraphContext;

  constructor(context: GraphContext) {
    this.context = context;
  }

  private generateMermaidGraph(graphDefinition: string): string {
    return `graph TD\n${graphDefinition}`;
  }

  private generateSequenceDiagram(diagramDefinition: string): string {
    return `sequenceDiagram\n${diagramDefinition}`;
  }

  private processMessageToNodes(messages: Message[]): string {
    let nodes = "";
    let links = "";

    messages.forEach((msg, index) => {
      const nodeId = `Msg${index}`;
      nodes += `${nodeId}["Role: ${msg.role}"]\n`;

      if (msg.role === "assistant") {
        const content = (msg as AssistantMessage).content;
        content.forEach((block, blockIndex) => {
          const blockId = `${nodeId}_B${blockIndex}`;
          if (block.type === "text") {
            nodes += `${blockId}["Text: ${block.text.substring(0, 20)}..."]\n`;
          } else if (block.type === "tool_use") {
            const toolUse = block as ToolUseBlock;
            nodes += `${blockId}["Tool Call: ${toolUse.name}(${JSON.stringify(toolUse.input)})"]\n`;
          } else if (block.type === "thinking") {
            const thinking = block as ThinkingBlock;
            nodes += `${blockId}["Thinking: ${thinking.thinking.substring(0, 20)}..."]\n`;
          }
        });
      }
    });

    return { nodes, links };
  }

  private processFlowControls(controls: FlowControlNode[]): string {
    let mermaidSyntax = "";

    controls.forEach((control, index) => {
      if (control.type === "conditional") {
        mermaidSyntax += `subgraph Conditional_${index}\n`;
        mermaidSyntax += `    A[Decision Point]\n`;
        mermaidSyntax += `    B{Condition: ${control.condition || 'N/A'}} -->|True| C[Path True]\n`;
        mermaidSyntax += `    B -->|False| D[Path False]\n`;
        mermaidSyntax += `end\n`;
      } else if (control.type === "loop_exit") {
        mermaidSyntax += `note right of LoopExit_${index} : Loop Exit Point\n`;
        mermaidSyntax += `LoopExit_${index}[Exit]\n`;
      } else if (control.type === "manual_step") {
        mermaidSyntax += `manualStep_${index}[Manual Step: ${control.description}]\n`;
      }
    });
    return mermaidSyntax;
  }

  public visualizeGraph(): { mermaidCode: string, diagramType: "graph" | "sequence" } {
    let graphDefinition = "";
    let sequenceDefinition = "";

    // 1. Build Graph Structure (Nodes and Links)
    const { nodes: messageNodes, links: messageLinks } = this.processMessageToNodes(this.context.messages);
    graphDefinition += messageNodes + "\n";
    graphDefinition += messageLinks + "\n";

    // 2. Incorporate Flow Controls into Graph Structure
    const flowControlMermaid = this.processFlowControls(this.context.flow_controls);
    graphDefinition += "\n" + flowControlMermaid;

    // 3. Build Sequence Diagram (Focusing on interaction flow)
    let sequenceSteps = "";
    let stepCounter = 1;

    this.context.messages.forEach((msg, msgIndex) => {
      const nodeId = `Msg${msgIndex}`;
      if (msg.role === "assistant") {
        const content = (msg as AssistantMessage).content;
        content.forEach((block, blockIndex) => {
          const blockId = `${nodeId}_B${blockIndex}`;
          if (block.type === "tool_use") {
            sequenceSteps += `participant Agent\n`;
            sequenceSteps += `Agent -> ToolService: Call ${block.name}(${JSON.stringify(block.input)})\n`;
            sequenceSteps += `activate ToolService\n`;
            sequenceSteps += `ToolService --> Agent: Result\n`;
            sequenceSteps += `deactivate ToolService\n`;
          }
        });
      }
    });

    // 4. Final Assembly
    const mermaidCode = this.generateMermaidGraph(graphDefinition);
    const sequenceCode = this.generateSequenceDiagram(sequenceSteps);

    // Prioritize Graph for comprehensive view, but provide both
    return {
      mermaidCode: mermaidCode,
      diagramType: "graph",
    };
  }
}