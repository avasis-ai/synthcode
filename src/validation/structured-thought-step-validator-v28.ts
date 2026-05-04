import { ValidationContext, Validator } from "./validator-interface";
import { Message, ContentBlock, ThinkingBlock } from "../types";

interface StructuredThoughtStep {
  step_id: string;
  thought: string;
  reasoning?: {
    references_step_id: string;
    justification: string;
  };
  action?: {
    type: "tool_call";
    tool_name: string;
    input: Record<string, unknown>;
  };
}

export class StructuredThoughtStepValidatorV28 implements Validator {
  constructor(private context: ValidationContext) {}

  validate(proposedStep: StructuredThoughtStep): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!proposedStep.step_id) {
      errors.push("Missing mandatory field: step_id.");
    }

    if (!proposedStep.thought || typeof proposedStep.thought !== 'string') {
      errors.push("Missing or invalid mandatory field: thought.");
    }

    if (proposedStep.reasoning) {
      if (!proposedStep.reasoning.references_step_id) {
        errors.push("Reasoning block requires 'references_step_id'.");
      } else {
        if (!this.context.history.some(
            (msg) => {
                const contentBlocks = msg.role === 'assistant' ? (msg as any).content : [];
                return contentBlocks.some((block) => {
                    if (block.type === 'thinking' && (block as ThinkingBlock).thinking.includes(proposedStep.reasoning.references_step_id)) {
                        return true;
                    }
                    return false;
                });
            }
        )) {
          errors.push(`Reasoning references unknown or non-existent step ID: ${proposedStep.reasoning.references_step_id}.`);
        }
      }

      if (!proposedStep.reasoning.justification || typeof proposedStep.reasoning.justification !== 'string') {
        errors.push("Reasoning block requires a non-empty 'justification' string.");
      }
    }

    if (proposedStep.action) {
      if (!['tool_call'].includes(proposedStep.action.type)) {
        errors.push(`Invalid action type specified: ${proposedStep.action.type}.`);
      }
      if (!proposedStep.action.tool_name || typeof proposedStep.action.tool_name !== 'string') {
        errors.push("Action block requires a tool_name.");
      }
      if (typeof proposedStep.action.input === 'undefined') {
        errors.push("Action block requires 'input' object.");
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}