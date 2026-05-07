import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type AgentId = string;

export enum FailureMode {
  Retry = "RETRY",
  FallbackToAgentB = "FALLBACK_TO_AGENT_B",
  EscalateToHuman = "ESCALATE_TO_HUMAN",
  FinalFailure = "FINAL_FAILURE",
}

export interface ContractStep {
  description: string;
  requiredInputContext: Record<string, unknown>;
  primaryCall: (context: Record<string, unknown>) => Promise<{ success: boolean; output: Message; contextUpdate: Record<string, unknown> }>;
  failureHandlers: {
    mode: FailureMode;
    handler: (context: Record<string, unknown>, attempt: number) => Promise<{ success: boolean; output: Message; contextUpdate: Record<string, unknown> }>;
    maxAttempts: number;
  }[];
}

export interface CommunicationContract {
  name: string;
  steps: ContractStep[];
}

export class ContractValidator {
  static validate(message: Message, contract: CommunicationContract): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    if (!contract.name) {
      errors.push("Contract must have a name.");
      isValid = false;
    }

    // Basic structural validation (can be expanded)
    if (contract.steps.length === 0) {
      errors.push("Contract must define at least one step.");
      isValid = false;
    }

    // Simulate checking message structure against expected contract flow
    if (typeof message !== 'object' || message === null) {
      errors.push("Message payload cannot be null or undefined.");
      isValid = false;
    }

    return { isValid, errors };
  }
}

interface NegotiationResult {
  success: boolean;
  finalMessage: Message;
  finalContext: Record<string, unknown>;
}

export class ContractNegotiator {
  private contract: CommunicationContract;

  constructor(contract: CommunicationContract) {
    this.contract = contract;
  }

  async negotiate(initialContext: Record<string, unknown>, initialMessage: Message): Promise<NegotiationResult> {
    let currentContext = { ...initialContext };
    let currentMessage = initialMessage;

    for (const step of this.contract.steps) {
      let stepSuccess = false;
      let attempt = 0;

      while (attempt < 1) { // Primary attempt + fallbacks
        try {
          // 1. Attempt Primary Call
          let result = await step.primaryCall(currentContext);
          
          if (result.success) {
            currentMessage = result.output;
            currentContext = { ...currentContext, ...result.contextUpdate };
            stepSuccess = true;
            break;
          }
        } catch (e) {
          // Primary call failed, proceed to handlers
        }

        // 2. Handle Failures (Fallbacks)
        if (!stepSuccess) {
          for (const handler of step.failureHandlers) {
            if (attempt >= handler.maxAttempts) {
              console.warn(`Max attempts reached for ${handler.mode}. Failing step.`);
              break;
            }
            
            try {
              let result = await handler.handler(currentContext, attempt + 1);
              if (result.success) {
                currentMessage = result.output;
                currentContext = { ...currentContext, ...result.contextUpdate };
                stepSuccess = true;
                break;
              }
            } catch (e) {
              // Handler failed, try next handler
            }
          }
        }
        
        attempt++;
      }

      if (!stepSuccess) {
        return { success: false, finalMessage: currentMessage, finalContext: currentContext };
      }
    }

    return { success: true, finalMessage: currentMessage, finalContext: currentContext };
  }
}