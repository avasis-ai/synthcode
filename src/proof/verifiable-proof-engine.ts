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

type DeductionType =
  | "ToolCallEvidence"
  | "ContextualInference"
  | "RuleApplication"
  | "DirectObservation";

interface ProofStep {
  stepId: string;
  deductionType: DeductionType;
  justification: string;
  evidence: Record<string, unknown>;
  conclusion: string;
  precedingSteps: string[];
}

export interface ProofChain {
  steps: ProofStep[];
  initialInputs: Record<string, unknown>;
  finalConclusion: string;
}

export class VerifiableProofEngine {
  private history: Message[];

  constructor(history: Message[]) {
    this.history = history;
  }

  private extractEvidence(message: Message): Record<string, unknown> {
    if ("tool" in message) {
      const toolResult = message as ToolResultMessage;
      return {
        role: "tool",
        tool_use_id: toolResult.tool_use_id,
        content: toolResult.content,
        is_error: toolResult.is_error,
      };
    }
    if ("assistant" in message) {
      const assistantMessage = message as AssistantMessage;
      return {
        role: "assistant",
        content_blocks: assistantMessage.content,
      };
    }
    if ("user" in message) {
      const userMessage = message as UserMessage;
      return {
        role: "user",
        content: userMessage.content,
      };
    }
    return {};
  }

  private createStep(
    stepId: string,
    deductionType: DeductionType,
    justification: string,
    evidence: Record<string, unknown>,
    conclusion: string,
    precedingSteps: string[]
  ): ProofStep {
    return {
      stepId,
      deductionType,
      justification,
      evidence,
      conclusion,
      precedingSteps,
    };
  }

  public buildProofChain(): ProofChain {
    const steps: ProofStep[] = [];
    let currentStepId = 1;
    const initialInputs: Record<string, unknown> = {};
    let lastConclusion: string = "";

    for (let i = 0; i < this.history.length; i++) {
      const message = this.history[i];
      const stepId = `Step-${currentStepId++}`;
      const evidence = this.extractEvidence(message);
      let step: ProofStep;

      if ("user" in message) {
        step = this.createStep(
          stepId,
          "DirectObservation",
          "Initial user input observed.",
          evidence,
          (message as UserMessage).content,
          []
        );
      } else if ("tool" in message) {
        step = this.createStep(
          stepId,
          "ToolCallEvidence",
          "Evidence derived from external tool execution.",
          evidence,
          `Tool result processed: ${evidence.content}`,
          [stepId]
        );
      } else if ("assistant" in message) {
        // Simulate complex reasoning step
        const reasoning = `Agent synthesized conclusion based on previous steps.`;
        step = this.createStep(
          stepId,
          "ContextualInference",
          reasoning,
          evidence,
          `Final inference: ${message.content.map(b => b.text).join(" ")}`,
          [stepId - 1]
        );
      } else {
        continue;
      }

      steps.push(step);
      lastConclusion = step.conclusion;
    }

    const finalConclusion = lastConclusion || "No verifiable conclusion reached.";

    return {
      steps: steps,
      initialInputs: {
        user_prompt: this.history.find((m) => "user" in m)?.content || null,
      },
      finalConclusion,
    };
  }

  public serializeProofChain(proofChain: ProofChain): string {
    let output = `--- VERIFIABLE PROOF CHAIN ---\n`;
    output += `Initial Inputs: ${JSON.stringify(proofChain.initialInputs, null, 2)}\n\n`;

    proofChain.steps.forEach((step, index) => {
      output += `[${step.stepId}] Deduction Type: ${step.deductionType}\n`;
      output += `  Justification: ${step.justification}\n`;
      output += `  Conclusion: ${step.conclusion}\n`;
      output += `  Evidence Cited: ${JSON.stringify(step.evidence, null, 2)}\n`;
      output += `  Preceding Steps: ${step.precedingSteps.join(", ")}\n`;
      output += "--------------------------------\n";
    });

    output += `\nFINAL VERIFIED CONCLUSION: ${proofChain.finalConclusion}`;
    return output;
  }
}