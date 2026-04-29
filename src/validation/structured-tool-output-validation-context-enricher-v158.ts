import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface PlanContext {
  planId: string;
  step: number;
  description: string;
}

export interface ExpectedNextStep {
  stepName: string;
  expectedSchema: Record<string, any>;
}

export interface EnrichmentPayload {
  expectedNextStep: ExpectedNextStep;
  planContext: PlanContext;
}

export interface ValidationContext {
  messages: Message[];
  toolOutput: Record<string, any>;
  enrichment: {
    expectedNextStep: ExpectedNextStep;
    planContext: PlanContext;
  };
}

export class StructuredToolOutputValidationContextEnricher {
  enrich(
    context: {
      messages: Message[];
      toolOutput: Record<string, any>;
    },
    payload: EnrichmentPayload
  ): ValidationContext {
    return {
      messages: context.messages,
      toolOutput: context.toolOutput,
      enrichment: {
        expectedNextStep: payload.expectedNextStep,
        planContext: payload.planContext,
      },
    };
  }
}