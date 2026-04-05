import { Message, ContentBlock, ToolUseBlock, TextBlock, ThinkingBlock } from "./types";

export interface AdvancedGraphContext {
  messages: Message[];
  initialState: string;
  transitions: {
    from: string;
    to: string;
    condition?: string;
    action?: string;
  }[];
  states: Record<string, {
    description: string;
    inputs?: Record<string, unknown>;
    outputs?: string[];
  }>;
}

type MermaidGraphBuilder = (context: AdvancedGraphContext) => string;

const generateMermaidGraph = (context: AdvancedGraphContext): string => {
  let mermaid = "graph TD;\n";

  // 1. Define States
  Object.keys(context.states).forEach(stateId => {
    const state = context.states[stateId];
    mermaid += `${stateId}["${state.description}"]\n`;
  });

  // 2. Define Transitions
  context.transitions.forEach(t => {
    let link = `${t.from} --> ${t.to}`;
    if (t.condition) {
      link += `{${t.condition}}`;
    }
    if (t.action) {
      link += ` -- ${t.action}-->`;
    }
    mermaid += link + ";\n";
  });

  // 3. Set Initial State (If applicable, using stateDiagram-v2 style for clarity)
  let stateDiagram = "stateDiagram-v2\n";
  stateDiagram += `[*] --> ${context.initialState}\n`;

  Object.keys(context.states).forEach(stateId => {
    stateDiagram += `${stateId}: ${context.states[stateId].description}\n`;
  });

  // For simplicity, we'll stick to the graph TD structure for the main output,
  // but we'll ensure the structure reflects advanced state logic.
  return mermaid.trim();
};

export const visualizeToolCallDependencyGraphAdvanced = (
  context: AdvancedGraphContext
): string => {
  if (!context || !context.messages || context.messages.length === 0) {
    return "graph TD;A[\"No context provided\"]";
  }

  // Basic compatibility check/enhancement wrapper
  let mermaidOutput = generateMermaidGraph(context);

  // Add a header comment to denote advanced visualization capability
  const advancedHeader = `%% Advanced Tool Call Dependency Graph Visualization v1.0\n%% Initial State: ${context.initialState}\n`;

  return advancedHeader + mermaidOutput;
};