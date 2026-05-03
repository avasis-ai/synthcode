import { Message, ContentBlock, ToolUseBlock } from "./types";

interface Context {
  history: Message[];
  userIntent: string | null;
  currentState: Record<string, any> | null;
  historySummary: string;
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

type ToolCall = {
  toolName: string;
  input: Record<string, unknown>;
};

export class ContextualToolCallValidator {
  private context: Context;

  constructor(context: Context) {
    this.context = context;
  }

  private analyzeContext(): {
    intent: string | null;
    state: Record<string, any> | null;
    summary: string;
  } {
    return {
      intent: this.context.userIntent,
      state: this.context.currentState,
      summary: this.context.historySummary,
    };
  }

  private checkContextAlignment(toolDefinition: ToolDefinition, toolCall: ToolCall): string[] {
    const contextAnalysis = this.analyzeContext();
    const errors: string[] = [];

    if (!contextAnalysis.intent) {
      errors.push("Missing user intent context. Cannot validate tool relevance.");
    }

    if (toolDefinition.description.toLowerCase().includes("requires state")) {
      if (!contextAnalysis.state) {
        errors.push("Tool requires current state, but context state is missing.");
      }
    }

    if (toolDefinition.description.toLowerCase().includes("based on history")) {
      if (!contextAnalysis.summary || contextAnalysis.summary.length < 10) {
        errors.push("Tool relies on recent history, but context summary is insufficient.");
      }
    }

    return errors;
  }

  public validate(toolDefinition: ToolDefinition, toolCall: ToolCall): { isValid: boolean; errors: string[] } {
    const contextErrors = this.checkContextAlignment(toolDefinition, toolCall);

    // Basic structural validation (can be expanded)
    if (toolCall.toolName !== toolDefinition.name) {
      return { isValid: false, errors: [`Tool name mismatch. Expected ${toolDefinition.name}, got ${toolCall.toolName}.`] };
    }

    // Contextual validation
    if (contextErrors.length > 0) {
      return { isValid: false, errors: contextErrors };
    }

    // Input validation against definition (simplified check)
    const requiredInputs = Object.keys(toolDefinition.parameters).filter(key => !toolDefinition.parameters[key].required);
    for (const key of requiredInputs) {
      if (!(key in toolCall.input) || toolCall.input[key] === undefined || toolCall.input[key] === null) {
        return { isValid: false, errors: [`Missing required input '${key}' for tool ${toolDefinition.name}.`] };
      }
    }

    return { isValid: true, errors: [] };
  }
}