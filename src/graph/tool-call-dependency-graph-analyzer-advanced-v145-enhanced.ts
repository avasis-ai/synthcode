import { Message, ContentBlock, ToolUseBlock, ThinkingBlock, TextBlock } from "./types";

export type AnalysisReport = {
  flaws: Flaw[];
  isFlawless: boolean;
};

export type Flaw = {
  type: string;
  description: string;
  severity: "ERROR" | "WARNING" | "INFO";
  location: {
    messageIndex: number;
    blockType: string;
    details: string;
  };
};

export interface StateTransitionRule {
  name: string;
  check(graph: ToolCallDependencyGraph, history: Message[]): Flaw[] | null;
}

export class ToolCallDependencyGraph {
  private messages: Message[];

  constructor(messages: Message[]) {
    this.messages = messages;
  }

  public getMessages(): Message[] {
    return this.messages;
  }
}

export class AdvancedDependencyGraphAnalyzer {
  private rules: StateTransitionRule[];

  constructor() {
    this.rules = [
      this.createUnhandledStateTransitionRule(),
      this.createRedundantToolCallRule(),
    ];
  }

  private createUnhandledStateTransitionRule(): StateTransitionRule {
    return {
      name: "UnhandledStateTransitionRule",
      check(graph: ToolCallDependencyGraph, history: Message[]): Flaw[] | null {
        const flaws: Flaw[] = [];
        // Simplified logic: Check if an assistant message follows a tool result without explicit acknowledgment.
        for (let i = 1; i < history.length; i++) {
          const current = history[i] as AssistantMessage;
          const previous = history[i - 1] as ToolResultMessage;

          if (current.role === "assistant" && previous.role === "tool") {
            // In a real scenario, we'd check if the assistant's content directly references the tool result.
            // For this simulation, we flag it as a potential gap.
            flaws.push({
              type: "StateTransitionGap",
              description: "Assistant response immediately follows a tool result without explicit context acknowledgment.",
              severity: "WARNING",
              location: {
                messageIndex: i,
                blockType: "assistant",
                details: `Transition from ToolResult (ID: ${previous.tool_use_id}) to Assistant message.`
              }
            });
          }
        }
        return flaws.length > 0 ? flaws : null;
      }
    };
  }

  private createRedundantToolCallRule(): StateTransitionRule {
    return {
      name: "RedundantToolCallRule",
      check(graph: ToolCallDependencyGraph, history: Message[]): Flaw[] | null {
        const flaws: Flaw[] = [];
        // Simplified logic: Check for multiple tool calls for the same logical purpose in sequence.
        const toolUseIds = new Set<string>();

        for (let i = 0; i < history.length; i++) {
          const message = history[i];
          if (message.role === "assistant") {
            const assistantMessage = message as AssistantMessage;
            for (const block of assistantMessage.content) {
              if (block.type === "tool_use") {
                const toolUseBlock = block as ToolUseBlock;
                if (toolUseIds.has(toolUseBlock.id)) {
                  flaws.push({
                    type: "RedundantToolCall",
                    description: `Tool call with ID ${toolUseBlock.id} appears to be called multiple times in sequence.`,
                    severity: "WARNING",
                    location: {
                      messageIndex: i,
                      blockType: "tool_use",
                      details: `Duplicate tool call detected for ID: ${toolUseBlock.id}`
                    }
                  });
                } else {
                  toolUseIds.add(toolUseBlock.id);
                }
              }
            }
          }
        }
        return flaws.length > 0 ? flaws : null;
      }
  }

  public analyze(graph: ToolCallDependencyGraph): AnalysisReport {
    const history = graph.getMessages();
    const allFlaws: Flaw[] = [];

    for (const rule of this.rules) {
      const flaws = rule.check(graph, history);
      if (flaws) {
        allFlaws.push(...flaws);
      }
    }

    return {
      flaws: allFlaws,
      isFlawless: allFlaws.length === 0,
    };
  }
}