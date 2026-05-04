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

export type CausalityLink = {
  source_step_id: string;
  target_step_id: string;
  link_type: "derived_from" | "contradicts" | "supports";
};

export interface ThoughtStep {
  step_id: string;
  content: string;
  causality_links: CausalityLink[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class StructuredThoughtStepValidatorV20 {
  private readonly requiredLinkTypes: Set<"derived_from" | "contradicts" | "supports">;

  constructor(requiredLinkTypes: ("derived_from" | "contradicts" | "supports")[]) {
    this.requiredLinkTypes = new Set(requiredLinkTypes);
  }

  validate(step: ThoughtStep): ValidationResult {
    const errors: string[] = [];

    if (!step.step_id) {
      errors.push("ThoughtStep must have a step_id.");
    }

    if (!step.content || step.content.trim().length === 0) {
      errors.push("ThoughtStep content cannot be empty.");
    }

    if (!step.causality_links || step.causality_links.length === 0) {
      errors.push("ThoughtStep must define at least one causality link.");
    } else {
      for (const link of step.causality_links) {
        if (!link.source_step_id || !link.target_step_id || !link.link_type) {
          errors.push("Causality link is missing required fields (source_step_id, target_step_id, link_type).");
          continue;
        }

        if (!this.requiredLinkTypes.has(link.link_type)) {
          errors.push(`Invalid link_type '${link.link_type}' found. Must be one of: ${Array.from(this.requiredLinkTypes).join(', ')}.`);
        }

        if (link.source_step_id === link.target_step_id) {
          errors.push(`Causality link source_step_id (${link.source_step_id}) cannot be the same as target_step_id.`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }
}