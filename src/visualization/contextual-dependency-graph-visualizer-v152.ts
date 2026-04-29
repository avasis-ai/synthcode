import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "../types";

export type ContextualLink = {
  sourceContextId: string;
  targetContextId: string;
  relationshipType: "influences" | "is_related_to" | "is_source_of";
  description: string;
};

export interface ContextualDependencyPayload {
  messages: Message[];
  contextualLinks: ContextualLink[];
}

export class ContextualDependencyGraphVisualizerV152 {
  private payload: ContextualDependencyPayload;

  constructor(payload: ContextualDependencyPayload) {
    this.payload = payload;
  }

  public visualize(): void {
    console.log("--- Contextual Dependency Graph Visualization V1.5.2 ---");

    if (!this.payload.messages || this.payload.messages.length === 0) {
      console.warn("No messages provided for visualization.");
      return;
    }

    console.log(`\n[1] Rendering Message Sequence (${this.payload.messages.length} steps)`);
    this.renderMessageSequence();

    console.log("\n[2] Rendering Contextual Dependencies");
    this.renderContextualLinks();

    console.log("\n--- Visualization Complete ---");
  }

  private renderMessageSequence(): void {
    this.payload.messages.forEach((message, index) => {
      console.log(`\n  Step ${index + 1}: Role=${message.role}`);
      if (message.role === "user") {
        console.log(`    User Input: "${(message as UserMessage).content.substring(0, 50)}..."`);
      } else if (message.role === "assistant") {
        console.log("    Assistant Output:");
        (message as AssistantMessage).content.forEach((block, blockIndex) => {
          if (block.type === "text") {
            console.log(`      - Text Block: "${block.text.substring(0, 50)}..."`);
          } else if (block.type === "tool_use") {
            const toolUse = block as ToolUseBlock;
            console.log(`      - Tool Use Block: ID=${toolUse.id}, Name=${toolUse.name}`);
          } else if (block.type === "thinking") {
            const thinking = block as ThinkingBlock;
            console.log(`      - Thinking Block: "${thinking.thinking.substring(0, 50)}..."`);
          }
        });
      } else if (message.role === "tool") {
        const toolResult = message as ToolResultMessage;
        console.log(`    Tool Result: ID=${toolResult.tool_use_id}, Error=${toolResult.is_error ? "Yes" : "No"}`);
      }
    });
  }

  private renderContextualLinks(): void {
    if (!this.payload.contextualLinks || this.payload.contextualLinks.length === 0) {
      console.log("  No contextual links found to render.");
      return;
    }

    console.log(`  Found ${this.payload.contextualLinks.length} contextual links.`);
    this.payload.contextualLinks.forEach((link, index) => {
      console.log(`    Link ${index + 1}:`);
      console.log(`      Relationship: ${link.relationshipType.toUpperCase()}`);
      console.log(`      Source Context: ${link.sourceContextId} -> Target Context: ${link.targetContextId}`);
      console.log(`      Description: ${link.description}`);
    });
  }
}