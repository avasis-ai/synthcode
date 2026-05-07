export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type ProtocolStep = {
  stepName: string;
  expectedRole: "user" | "assistant" | "tool";
  requiredContentType: "text" | "tool_use" | "any";
  validationRule: (message: Message) => boolean;
};

export interface ProtocolContract {
  version: string;
  steps: ProtocolStep[];
}

export class ProtocolNegotiationEngine {
  private agreedContract: ProtocolContract | null = null;

  constructor() {}

  /**
   * Simulates the negotiation process among multiple agents to find the highest compatibility contract.
   * @param proposedContracts An array of protocols proposed by different agents.
   * @returns The agreed-upon ProtocolContract.
   * @throws Error if no compatible contract can be found.
   */
  public negotiate(proposedContracts: ProtocolContract[]): ProtocolContract {
    if (proposedContracts.length === 0) {
      throw new Error("No protocols were proposed for negotiation.");
    }

    let bestContract: ProtocolContract | null = null;
    let maxCompatibilityScore = -1;

    for (const contract of proposedContracts) {
      let currentScore = 0;
      let isFullyCompatible = true;

      // Simple compatibility check: assume a contract is compatible if all steps are valid
      // against a baseline set of rules (simulated here).
      for (const step of contract.steps) {
        // In a real system, this would involve checking against known capabilities/schemas.
        // Here, we just count steps as a proxy for complexity/completeness.
        currentScore += 1;
      }

      if (currentScore > maxCompatibilityScore) {
        maxCompatibilityScore = currentScore;
        bestContract = contract;
      }
    }

    if (!bestContract) {
      throw new Error("Failed to negotiate a compatible protocol.");
    }

    this.agreedContract = bestContract;
    return bestContract;
  }

  /**
   * Validates a message against the current agreed-upon ProtocolContract.
   * @param message The message to validate.
   * @returns True if the message conforms to the contract, false otherwise.
   * @throws Error if no contract has been negotiated.
   */
  public validateMessage(message: Message): boolean {
    if (!this.agreedContract) {
      throw new Error("Protocol contract must be negotiated before validation can occur.");
    }

    const lastStep = this.agreedContract.steps[this.agreedContract.steps.length - 1];

    if (!lastStep) {
      return true; // No steps defined, always valid.
    }

    // Check if the message role matches the expected role of the next step
    if (message.role !== lastStep.expectedRole) {
      return false;
    }

    // Check semantic validation rule
    return lastStep.validationRule(message);
  }

  /**
   * Executes a step only if the message is validated against the contract.
   * @param message The message to execute.
   * @returns The message if valid, otherwise throws an execution error.
   */
  public executeStep(message: Message): Message {
    if (!this.agreedContract) {
      throw new Error("Protocol contract must be negotiated before execution.");
    }

    if (!this.validateMessage(message)) {
      throw new Error("Protocol Violation: Message does not conform to the agreed-upon contract.");
    }

    // In a real engine, this would transition the state and advance the step counter.
    return message;
  }
}