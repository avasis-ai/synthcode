export type CausalLinkType = "tool_result" | "state_transition" | "user_input";

export interface CausalLink {
  prerequisiteId: string;
  requiredType: CausalLinkType;
  description: string;
}

export interface CausalViolation {
  link: CausalLink;
  message: string;
}

export class CausalLinkManager {
  private requiredLinks: CausalLink[];

  constructor(requiredLinks: CausalLink[]) {
    this.requiredLinks = requiredLinks;
  }

  /**
   * Validates if a proposed action is causally sound based on the provided history.
   * @param history The sequence of previous events/messages.
   * @param proposedAction The action being proposed (e.g., tool call, state change).
   * @returns An array of CausalViolation if prerequisites are missing, or an empty array if valid.
   */
  public validate(history: Message[], proposedAction: { type: string; details: any }): CausalViolation[] {
    const violations: CausalViolation[] = [];

    for (const link of this.requiredLinks) {
      const isMet = this.checkPrerequisite(history, link);
      if (!isMet) {
        violations.push({
          link: link,
          message: `Causal prerequisite missing: Cannot perform action '${proposedAction.type}' because the required link '${link.description}' (ID: ${link.prerequisiteId}) of type ${link.requiredType} was not found in the history.`
        });
      }
    }

    return violations;
  }

  /**
   * Checks if a specific causal link prerequisite has been met by the history.
   * @param history The message history.
   * @param link The required link definition.
   * @returns boolean
   */
  private checkPrerequisite(history: Message[], link: CausalLink): boolean {
    let foundMatch = false;

    for (const message of history) {
      if (link.requiredType === "tool_result" && message.role === "tool" && message as ToolResultMessage).tool_use_id === link.prerequisiteId) {
        foundMatch = true;
        break;
      }
      // Add checks for other types if necessary (e.g., state_transition)
    }

    return foundMatch;
  }
}