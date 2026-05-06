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
  message: Message;
  tool_calls?: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  }[];
  tool_results?: {
    tool_use_id: string;
    content: string;
    is_error?: boolean;
  }[];
}

export interface ContextualToolCallHistoryVisualizerProps {
  history: ToolCallHistoryItem[];
}

class ContextualToolCallHistoryVisualizer {
  render(props: ContextualToolCallHistoryVisualizerProps): React.ReactElement {
    const { history } = props;

    if (!history || history.length === 0) {
      return <div>No tool call history available to visualize.</div>;
    }

    return (
      <div className="contextual-tool-call-history-visualizer">
        <h2>Tool Call Context History</h2>
        {history.map((item, index) => (
          <div key={index} className="history-item">
            {this.renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  private renderItem(item: ToolCallHistoryItem, index: number): React.ReactElement {
    let content: React.ReactElement = null;

    if (item.message.role === "user") {
      content = <div className="user-message">User Input: {JSON.stringify(item.message)}</div>;
    } else if (item.message.role === "assistant") {
      content = <div className="assistant-message">Assistant Response: {JSON.stringify(item.message)}</div>;
    } else if (item.message.role === "tool") {
      content = <div className="tool-result-message">Tool Result: {JSON.stringify(item.message)}</div>;
    }

    let toolCallsVisualization: React.ReactElement = null;
    if (item.tool_calls && item.tool_calls.length > 0) {
      toolCallsVisualization = (
        <div className="tool-calls-section">
          <h3>Tool Calls Made:</h3>
          {item.tool_calls.map((tc, i) => (
            <div key={i} className="tool-call-card">
              <strong>{tc.name}</strong> called with input: {JSON.stringify(tc.input)}
            </div>
          ))}
        </div>
      );
    }

    let toolResultsVisualization: React.ReactElement = null;
    if (item.tool_results && item.tool_results.length > 0) {
      toolResultsVisualization = (
        <div className="tool-results-section">
          <h3>Tool Results Received:</h3>
          {item.tool_results.map((tr, i) => (
            <div key={i} className={`tool-result-card ${tr.is_error ? 'error' : ''}`}>
              <strong>Tool ID: {tr.tool_use_id}</strong>. Content: {tr.content} {tr.is_error && "(Error)"}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="history-entry">
        {content}
        {toolCallsVisualization}
        {toolResultsVisualization}
      </div>
    );
  }
}

export const ContextualToolCallHistoryVisualizer = (props: ContextualToolCallHistoryVisualizerProps): React.ReactElement => {
  const visualizer = new ContextualToolCallHistoryVisualizer();
  return visualizer.render(props);
};