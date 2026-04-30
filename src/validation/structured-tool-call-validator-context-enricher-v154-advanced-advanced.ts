import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface AdvancedToolCallContext {
  baseContext: Message[];
  intendedToolCall: ToolCall;
  executionPathAnalysis: {
    predictedNextStep: "tool_call" | "text_response" | "awaiting_user" | "unknown";
    potentialSideEffects: string[];
    requiredPermissions: string[];
  };
}

export class StructuredToolCallValidatorContextEnricherV154AdvancedAdvanced {
  enrich(
    context: Message[],
    toolCall: ToolCall
  ): AdvancedToolCallContext {
    const baseContext: Message[] = [...context];

    const analysis: {
      predictedNextStep: "tool_call" | "text_response" | "awaiting_user" | "unknown";
      potentialSideEffects: string[];
      requiredPermissions: string[];
    } = this.analyzeContextAndToolCall(context, toolCall);

    return {
      baseContext: baseContext,
      intendedToolCall: toolCall,
      executionPathAnalysis: analysis,
    };
  }

  private analyzeContextAndToolCall(
    context: Message[],
    toolCall: ToolCall
  ): {
    predictedNextStep: "tool_call" | "text_response" | "awaiting_user" | "unknown";
    potentialSideEffects: string[];
    requiredPermissions: string[];
  } {
    let predictedNextStep: "tool_call" | "text_response" | "awaiting_user" | "unknown" = "unknown";
    const potentialSideEffects: string[] = [];
    const requiredPermissions: string[] = [];

    if (context.length === 0) {
      predictedNextStep = "tool_call";
    } else {
      const lastMessage = context[context.length - 1];
      if (lastMessage.role === "tool") {
        predictedNextStep = "text_response";
      } else if (lastMessage.role === "user") {
        predictedNextStep = "tool_call";
      } else {
        predictedNextStep = "unknown";
      }
    }

    if (toolCall.name.includes("delete") || toolCall.name.includes("remove")) {
      potentialSideEffects.push("Data modification risk");
      requiredPermissions.push("write:data");
    }

    if (toolCall.name.includes("fetch") || toolCall.name.includes("read")) {
      potentialSideEffects.push("Data retrieval");
      requiredPermissions.push("read:data");
    }

    if (toolCall.input && typeof toolCall.input.userId === 'string') {
      potentialSideEffects.push(`User ID ${toolCall.input.userId} access`);
      requiredPermissions.push("user:read");
    }

    return {
      predictedNextStep: predictedNextStep,
      potentialSideEffects: potentialSideEffects,
      requiredPermissions: requiredPermissions,
    };
  }
}