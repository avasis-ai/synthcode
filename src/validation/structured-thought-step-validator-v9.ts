import { ValidatorBase } from "./validator-base";

export type Message = { role: "user"; content: string } | { role: "assistant"; content: any[] } | { role: "tool"; tool_use_id: string; content: string; is_error?: boolean };

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

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export class StructuredThoughtStepValidatorV9 extends ValidatorBase {
  constructor() {
    super();
  }

  validate(step: { blocks: ContentBlock[]; requiredEvidenceLinks: boolean }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    let isValid = true;

    if (!step.blocks || step.blocks.length === 0) {
      errors.push("Thought step must contain at least one content block.");
      return { isValid: false, errors };
    }

    // 1. Check for required intermediate evidence links if specified
    if (step.requiredEvidenceLinks) {
      let evidenceFound = false;
      for (const block of step.blocks) {
        if (block.type === "thinking") {
          // Simple heuristic: check if the thinking block mentions evidence keywords
          if (block.thinking.toLowerCase().includes("evidence:") || block.thinking.toLowerCase().includes("source:")) {
            evidenceFound = true;
          }
        }
      }
      if (!evidenceFound) {
        errors.push("Required intermediate evidence links were not found in the thinking blocks.");
        isValid = false;
      }
    }

    // 2. Check for structural completeness (e.g., must end with a thinking block if tool use occurred)
    const hasToolUse = step.blocks.some(block => block.type === "tool_use");
    const lastBlock = step.blocks[step.blocks.length - 1];

    if (hasToolUse && lastBlock.type !== "thinking") {
      errors.push("A thought step containing tool usage must conclude with a structured thinking block for final synthesis.");
      isValid = false;
    }

    // 3. General content validation (e.g., no empty text blocks)
    for (let i = 0; i < step.blocks.length; i++) {
      const block = step.blocks[i];
      if (block.type === "text" && block.text.trim().length === 0) {
        errors.push(`Block at index ${i} contains empty text content.`);
        isValid = false;
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Creates a validation chain that includes this structured thought step check.
   * @returns A function that accepts a validator chain context and returns the updated chain.
   */
  chain(): (chain: { validator: (step: { blocks: ContentBlock[]; requiredEvidenceLinks: boolean }) => { isValid: boolean; errors: string[] }; next: (context: any) => any }) => {
    return (chainContext) => {
      const validator = (step: { blocks: ContentBlock[]; requiredEvidenceLinks: boolean }) => this.validate(step);

      const newChainContext = {
        validator: validator,
        next: chainContext.next,
      };
      return { ...chainContext, next: () => newChainContext.next(chainContext.context) };
    };
  }
}