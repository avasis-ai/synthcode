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

export interface ToolCallHistoryItem {
  timestamp: number;
  message: Message;
  contextId: string;
}

export class ContextualToolCallHistoryVisualizer {
  private history: ToolCallHistoryItem[];

  constructor(history: ToolCallHistoryItem[]) {
    this.history = history;
  }

  public getHistory(): ToolCallHistoryItem[] {
    return this.history;
  }

  private renderToolCallNode(item: ToolCallHistoryItem): string {
    const message = item.message;
    let content = "";

    if ("tool" in message) {
      const toolResult = message as ToolResultMessage;
      const status = toolResult.is_error ? "ERROR" : "SUCCESS";
      content = `
        <div class="tool-result-node">
          <h4>Tool Result (${status})</h4>
          <p>Tool Use ID: ${toolResult.tool_use_id}</p>
          <p>Content: ${toolResult.content}</p>
          <small>Context ID: ${item.contextId}</small>
        </div>
      `;
    } else if ("assistant" in message) {
      const assistantMessage = message as AssistantMessage;
      let blocksHtml = assistantMessage.content.map(block => {
        if ("text" in block) {
          return `<p>${(block as TextBlock).text}</p>`;
        } else if ("tool_use" in block) {
          const toolUse = block as ToolUseBlock;
          return `
            <div class="tool-use-block">
              <strong>Tool Call: ${toolUse.name}</strong>
              <p>Input: ${JSON.stringify(toolUse.input)}</p>
              <small>ID: ${toolUse.id}</small>
            </div>
          `;
        } else if ("thinking" in block) {
          return `<div class="thinking-block">Thinking: ${block.thinking}</div>`;
        }
        return "";
      }).join("");
      content = `
        <div class="assistant-message-node">
          <p><strong>Assistant Response:</strong></p>
          ${blocksHtml}
          <small>Context ID: ${item.contextId}</small>
        </div>
      `;
    } else if ("user" in message) {
      const userMessage = message as UserMessage;
      content = `
        <div class="user-message-node">
          <p><strong>User Input:</strong> ${userMessage.content}</p>
          <small>Context ID: ${item.contextId}</small>
        </div>
      `;
    }

    return `
      <div class="history-item" data-context-id="${item.contextId}">
        <div class="timestamp">${new Date(item.timestamp).toLocaleTimeString()}</div>
        <div class="node-content">${content}</div>
      </div>
    `;
  }

  public render(): string {
    if (!this.history || this.history.length === 0) {
      return "<p>No tool call history available to visualize.</p>";
    }

    const nodesHtml = this.history.map(this.renderToolCallNode).join("");

    return `
      <div class="contextual-history-visualizer">
        <h2>Contextual Tool Call History</h2>
        <div class="history-timeline">
          ${nodesHtml}
        </div>
        <style>
          .contextual-history-visualizer { padding: 20px; border: 1px solid #ccc; border-radius: 8px; }
          .history-timeline { display: flex; flex-direction: column; gap: 20px; }
          .history-item { border-left: 3px solid #007bff; padding-left: 15px; margin-bottom: 15px; background-color: #f9f9f9; border-radius: 4px; }
          .timestamp { font-size: 0.8em; color: #666; margin-bottom: 5px; }
          .node-content h4 { margin-top: 0; color: #333; }
          .tool-result-node { border: 1px dashed #aaa; padding: 10px; background-color: #eef; border-radius: 4px; }
          .user-message-node { background-color: #e6f7ff; padding: 10px; border-radius: 4px; }
          .assistant-message-node { background-color: #fff0e6; padding: 10px; border-radius: 4px; }
          .tool-use-block { border-left: 2px solid #ff9800; padding-left: 10px; margin: 10px 0; }
          .thinking-block { background-color: #eee; padding: 8px; border-radius: 4px; margin: 10px 0; }
        </style>
      </div>
    `;
  }
}