import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type StepType = "START" | "PLANNING" | "EXECUTION" | "FINALIZING" | "ERROR";

export interface Guardrail {
  name: string;
  isActive: boolean;
  severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface ResourceMetrics {
  cpuUsagePercent: number;
  memoryUsageBytes: number;
  apiCallCount: number;
}

export interface AgentProcessState {
  currentStep: StepType;
  activeGuardrails: Guardrail[];
  resourceUsageSnapshot: ResourceMetrics;
}

export interface ValidationContext {
  messages: Message[];
  processState: AgentProcessState;
}

export class StructuredToolCallValidatorContextEnricherV166 {
  enrich(
    existingContext: { messages: Message[] },
    processState: AgentProcessState
  ): ValidationContext {
    return {
      messages: existingContext.messages,
      processState: processState,
    };
  }
}