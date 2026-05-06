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

export interface ToolCallRecord {
  tool_use_id: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  timestamp: number;
  resource_usage?: {
    cpu_ms: number;
    memory_kb: number;
  };
  result_content: string;
  is_error?: boolean;
}

export interface ContextualToolCallHistoryVisualizerProps {
  history: ToolCallRecord[];
}

export class ContextualToolCallHistoryVisualizer {
  render(props: ContextualToolCallHistoryVisualizerProps): string {
    if (!props.history || props.history.length === 0) {
      return "";
    }

    const renderRecord = (record: ToolCallRecord): string => {
      let html = `<div class="tool-call-record">`;
      html += `<h4>Tool Call: ${record.tool_name} (${record.tool_use_id})</h4>`;
      html += `<p class="timestamp">Time: ${new Date(record.timestamp).toLocaleTimeString()}</p>`;

      html += `<div class="tool-call-details">`;
      html += `<strong>Input:</strong> <pre>${JSON.stringify(record.tool_input, null, 2)}</pre>`;
      html += `</div>`;

      if (record.resource_usage) {
        html += `<div class="resource-usage">`;
        html += `<strong>Resource Usage:</strong> CPU: ${record.resource_usage.cpu_ms}ms, Memory: ${record.resource_usage.memory_kb}KB`;
        html += `</div>`;
      }

      html += `<div class="tool-result-details ${record.is_error ? 'error' : ''}">`;
      html += `<strong>Output:</strong> <pre>${record.result_content}</pre>`;
      if (record.is_error) {
        html += `<p class="error-tag">Error Detected</p>`;
      }
      html += `</div>`;

      html += `</div>`;
      return html;
    };

    const renderedRecords = props.history.map(renderRecord).join("");

    return `
      <div class="contextual-tool-call-history-visualizer">
        <h2>Contextual Tool Call History</h2>
        <p>Visualizing ${props.history.length} enriched tool interaction records.</p>
        <div class="history-container">
          ${renderedRecords}
        </div>
      </div>
    `;
  }
}