import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ExternalToolCall {
  toolName: string;
  input: Record<string, unknown>;
  description: string;
}

export interface StructuredThoughtStep {
  thought: string;
  toolCalls?: ToolUseBlock[];
  externalCalls?: ExternalToolCall[];
}

export type StructuredThoughtChain = StructuredThoughtStep[];

export interface ChainingContext {
  history: Message[];
  externalToolResults: Record<string, string>;
}

export class StructuredThoughtChainer {
  private context: ChainingContext;

  constructor(initialContext: ChainingContext) {
    this.context = initialContext;
  }

  private processExternalCalls(steps: StructuredThoughtChain): {
    updatedContext: ChainingContext;
    processedSteps: StructuredThoughtChain;
  } {
    let currentContext = { ...this.context, externalToolResults: { ...this.context.externalToolResults } };
    let processedSteps: StructuredThoughtChain = [];

    for (const step of steps) {
      let currentStep = { ...step };
      if (currentStep.externalCalls && currentStep.externalCalls.length > 0) {
        const results: Record<string, string> = {};
        for (const call of currentStep.externalCalls) {
          const result = this.executeExternalTool(call);
          results[call.toolName] = result;
        }
        currentContext = {
          ...currentContext,
          externalToolResults: { ...currentContext.externalToolResults, ...results },
        };
        currentStep.thought += "\n[External Tool Results Processed]: " + JSON.stringify(results);
      }
      processedSteps.push(currentStep);
    }

    return { updatedContext: currentContext, processedSteps };
  }

  private executeExternalTool(call: ExternalToolCall): string {
    // Mock external execution logic
    console.log(`Executing external tool: ${call.toolName} with input:`, call.input);
    if (call.toolName === "fetch_user_data") {
      return `Mock data fetched for user ${call.input.userId || 'unknown'}.`;
    }
    return `Successfully executed external tool ${call.toolName}.`;
  }

  public chain(steps: StructuredThoughtChain): {
    finalContext: ChainingContext;
    finalSteps: StructuredThoughtChain;
  } {
    const { updatedContext, processedSteps } = this.processExternalCalls(steps);
    return {
      finalContext: updatedContext,
      finalSteps: processedSteps,
    };
  }
}