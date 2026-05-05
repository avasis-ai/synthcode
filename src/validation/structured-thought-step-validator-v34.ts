import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface FlowRule {
  required_predecessor?: {
    type: "step_type";
    description: string;
  };
  consequence?: {
    type: "step_type";
    description: string;
  };
  exception_condition?: {
    type: "condition";
    description: string;
  };
}

export interface ValidationReport {
  isValid: boolean;
  violations: string[];
}

export class StructuredThoughtStepValidatorV34 {
  private flowRule: FlowRule;

  constructor(flowRule: FlowRule) {
    this.flowRule = flowRule;
  }

  private getStepType(message: Message): "user" | "assistant" | "tool" | "unknown" {
    if ("user" in message) return "user";
    if ("assistant" in message) return "assistant";
    if ("tool" in message) return "tool";
    return "unknown";
  }

  private analyzeStep(message: Message): { type: string; content: string } {
    let content: string = "";
    if (typeof message === 'object' && 'content' in message) {
      if (Array.isArray(message.content)) {
        const blocks = message.content as ContentBlock[];
        content = blocks.map(block => {
          if ('text' in block) return (block as TextBlock).text;
          if ('thinking' in block) return (block as ThinkingBlock).thinking;
          if ('tool_use' in block) return `Tool Use: ${block.name}`;
          return "";
        }).join(" ");
      } else if (typeof message.content === 'string') {
        content = message.content;
      }
    }

    let type: string = "unknown";
    if ("role" in message) {
      type = this.getStepType(message);
    }

    return { type: type, content: content };
  }

  private checkPredecessor(currentStep: Message, previousStep: Message): boolean {
    if (!this.flowRule.required_predecessor) {
      return true;
    }

    const requiredType = this.flowRule.required_predecessor.type;
    const actualType = this.getStepType(previousStep);

    if (requiredType === "step_type") {
      return actualType === requiredType;
    }
    return false;
  }

  private checkConsequence(currentStep: Message, previousStep: Message): boolean {
    if (!this.flowRule.consequence) {
      return true;
    }

    const requiredType = this.flowRule.consequence.type;
    const actualType = this.getStepType(currentStep);

    if (requiredType === "step_type") {
      return actualType === requiredType;
    }
    return true;
  }

  private checkException(currentStep: Message, previousStep: Message): boolean {
    if (!this.flowRule.exception_condition) {
      return true;
    }

    const condition = this.flowRule.exception_condition;
    const currentAnalysis = this.analyzeStep(currentStep);
    const previousAnalysis = this.analyzeStep(previousStep);

    if (condition.type === "condition") {
      // Simplified check: if the condition description mentions a specific content pattern
      if (condition.description.includes("C") && currentAnalysis.content.includes("Condition C Met")) {
        return true;
      }
    }
    return false;
  }

  public validateSequence(steps: Message[]): ValidationReport {
    const violations: string[] = [];

    for (let i = 1; i < steps.length; i++) {
      const currentStep = steps[i];
      const previousStep = steps[i - 1];

      let isValid = true;
      let violationMessages: string[] = [];

      // 1. Check Predecessor Requirement
      if (this.flowRule.required_predecessor) {
        if (!this.checkPredecessor(currentStep, previousStep)) {
          isValid = false;
          violationMessages.push(
            `Violation: Current step (${this.getStepType(currentStep)}) requires predecessor of type ${this.flowRule.required_predecessor.type}. Found ${this.getStepType(previousStep)}.`
          );
        }
      }

      // 2. Check Consequence Requirement
      if (this.flowRule.consequence) {
        if (!this.checkConsequence(currentStep, previousStep)) {
          isValid = false;
          violationMessages.push(
            `Violation: Current step (${this.getStepType(currentStep)}) must follow a step of type ${this.flowRule.consequence.type}.`
          );
        }
      }

      // 3. Check Exception Condition (If applicable)
      if (this.flowRule.exception_condition) {
        const exceptionMet = this.checkException(currentStep, previousStep);
        if (!exceptionMet) {
          // This logic is highly dependent on the specific rule structure,
          // here we just flag if the exception check fails to confirm a bypass.
          // For simplicity, we assume if the exception condition isn't met,
          // and the primary rules failed, it's a violation.
        }
      }

      if (!isValid || violationMessages.length > 0) {
        violations.push(`Step ${i} (${this.getStepType(currentStep)}): ${violationMessages.join(' | ')}`);
      }
    }

    return {
      isValid: violations.length === 0,
      violations: violations,
    };
  }
}