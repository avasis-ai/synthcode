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

export interface ToolCallMetadata {
  call_id: string;
  tool_name: string;
  resource_usage_ms: number;
  execution_time_s: number;
}

export interface ToolCallHistoryPayload {
  messages: Message[];
  tool_calls: ToolCallMetadata[];
}

export class ContextualToolCallHistoryVisualizerV160 {
  private payload: ToolCallHistoryPayload;

  constructor(payload: ToolCallHistoryPayload) {
    this.payload = payload;
  }

  private renderToolCallMetadata(metadata: ToolCallMetadata): string {
    return `
      <div class="tool-call-metadata card">
        <h4>Tool Call Details</h4>
        <p><strong>ID:</strong> ${metadata.call_id}</p>
        <p><strong>Tool:</strong> ${metadata.tool_name}</p>
        <p><strong>Resource Usage:</strong> ${metadata.resource_usage_ms.toFixed(2)} ms</p>
        <p><strong>Execution Time:</strong> ${metadata.execution_time_s.toFixed(3)} s</p>
      </div>
    `;
  }

  private renderToolUseBlock(block: ToolUseBlock): string {
    return `
      <div class="tool-use-block card">
        <h5>Tool Use Detected</h5>
        <p><strong>ID:</strong> ${block.id}</p>
        <p><strong>Tool Name:</strong> ${block.name}</p>
        <p><strong>Input:</strong> <pre>${JSON.stringify(block.input, null, 2)}</pre></p>
      </div>
    `;
  }

  private renderMessageContent(message: Message): string {
    if ("user" === message.role) {
      return `<div class="message user-message"><strong>User:</strong> ${message.content.map(block => {
        if (block.type === "text") return `<p>${block.text}</p>`;
        if (block.type === "tool_use") return this.renderToolUseBlock(block as ToolUseBlock);
        if (block.type === "thinking") return `<div class="thinking-block">${block.thinking}</div>`;
        return "";
      }).join('')}</div>`;
    }

    if ("assistant" === message.role) {
      return `<div class="message assistant-message"><strong>Assistant:</strong> ${message.content.map(block => {
        if (block.type === "text") return `<p>${block.text}</p>`;
        if (block.type === "tool_use") return this.renderToolUseBlock(block as ToolUseBlock);
        if (block.type === "thinking") return `<div class="thinking-block">${block.thinking}</div>`;
        return "";
      }).join('')}</div>`;
    }

    if ("tool" === message.role) {
      return `<div class="message tool-result-message">
        <strong>Tool Result (${message.tool_use_id}):</strong>
        <p>${message.content}</p>
        ${message.is_error ? '<p style="color: red;">[ERROR]</p>' : ''}
      </div>`;
    }
    return "";
  }

  private renderHistorySection(messages: Message[]): string {
    let html = '<div class="message-history-container">';
    messages.forEach((message, index) => {
      html += `<div class="history-entry" data-index="${index}">`;
      html += this.renderMessageContent(message);
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  private renderToolCallHistory(toolCalls: ToolCallMetadata[]): string {
    if (toolCalls.length === 0) {
      return '<div class="tool-call-history-empty">No explicit tool call metadata recorded.</div>';
    }

    let html = '<div class="tool-call-history-container">';
    toolCalls.forEach((metadata, index) => {
      html += `<div class="tool-call-history-item card">`;
      html += this.renderToolCallMetadata(metadata);
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  public renderVisualization(): string {
    const messageHtml = this.renderHistorySection(this.payload.messages);
    const toolCallHtml = this.renderToolCallHistory(this.payload.tool_calls);

    return `
      <div class="contextual-visualizer-v160">
        <h2>Contextual Tool Call History Visualization</h2>
        
        <section class="history-section">
          <h3>Conversation Flow</h3>
          ${messageHtml}
        </section>

        <section class="tool-call-section">
          <h3>Detailed Tool Execution Log</h3>
          ${toolCallHtml}
        </section>
      </div>
    `;
  }
}