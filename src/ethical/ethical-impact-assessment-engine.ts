export type Message = { role: "user"; content: string } | { role: "assistant"; content: any[] } | { role: "tool"; tool_use_id: string; content: string; is_error?: boolean };
export interface UserMessage { role: "user"; content: string; }
export interface AssistantMessage { role: "assistant"; content: any[]; }
export interface ToolResultMessage { role: "tool"; tool_use_id: string; content: string; is_error?: boolean; }
export type ContentBlock = { type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> } | { type: "thinking"; thinking: string };
export type LoopEvent = { type: "text"; text: string } | { type: "thinking"; thinking: string } | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };

export interface EthicalConflict {
    constraintName: string;
    severity: "low" | "medium" | "high";
    description: string;
    suggestedMitigation: string;
}

export interface AssessmentResult {
    isEthicallySound: boolean;
    conflicts: EthicalConflict[];
    summary: string;
}

export interface EthicalConstraint {
    name: string;
    /**
     * Assesses the given context and proposed action (content/tool use) against ethical guidelines.
     * @param context The history of messages/events leading up to the action.
     * @param proposedAction The action being assessed (e.g., tool call, generated text).
     * @returns An array of detected ethical conflicts.
     */
    assess(context: Message[], proposedAction: { content: string; toolUse?: { name: string; input: Record<string, unknown> } }): EthicalConflict[];
}

class BiasConstraint implements EthicalConstraint {
    name = "BiasConstraint";

    assess(context: Message[], proposedAction: { content: string; toolUse?: { name: string; input: Record<string, unknown> } }): EthicalConflict[] {
        const conflicts: EthicalConflict[] = [];
        const actionContent = proposedAction.content.toLowerCase();

        if (actionContent.includes("all people") && !actionContent.includes("diverse")) {
            conflicts.push({
                constraintName: this.name,
                severity: "medium",
                description: "The language used is overly generalized and fails to acknowledge diverse groups.",
                suggestedMitigation: "Specify diverse groups or use inclusive language (e.g., 'all people' -> 'people of all backgrounds')."
            });
        }
        return conflicts;
    }
}

class FairnessConstraint implements EthicalConstraint {
    name = "FairnessConstraint";

    assess(context: Message[], proposedAction: { content: string; toolUse?: { name: string; input: Record<string, unknown> } }): EthicalConflict[] {
        const conflicts: EthicalConflict[] = [];
        const actionContent = proposedAction.content.toLowerCase();

        if (actionContent.includes("only for") && context.length > 1) {
            conflicts.push({
                constraintName: this.name,
                severity: "high",
                description: "The proposed action appears to restrict benefits or information to a specific group, violating fairness principles.",
                suggestedMitigation: "Rephrase the action to ensure equitable access or consideration for all relevant parties."
            });
        }
        return conflicts;
    }
}

class SafetyConstraint implements EthicalConstraint {
    name = "SafetyConstraint";

    assess(context: Message[], proposedAction: { content: string; toolUse?: { name: string; input: Record<string, unknown> } }): EthicalConflict[] {
        const conflicts: EthicalConflict[] = [];
        const actionContent = proposedAction.content.toLowerCase();

        if (actionContent.includes("how to build") && (actionContent.includes("weapon") || actionContent.includes("harm"))) {
            conflicts.push({
                constraintName: this.name,
                severity: "high",
                description: "The content suggests instructions for dangerous or harmful activities.",
                suggestedMitigation: "Refuse to provide instructions for dangerous activities. Redirect the user to safety resources."
            });
        }
        return conflicts;
    }
}

export class EthicalImpactAssessmentEngine {
    private constraints: EthicalConstraint[];

    constructor(constraints: EthicalConstraint[] = [
        new BiasConstraint(),
        new FairnessConstraint(),
        new SafetyConstraint()
    ]) {
        this.constraints = constraints;
    }

    /**
     * Runs the full ethical assessment pipeline.
     * @param context The history of messages/events.
     * @param proposedAction The action (text or tool use) to be assessed.
     * @returns A structured report detailing ethical conflicts.
     */
    runAssessment(context: Message[], proposedAction: { content: string; toolUse?: { name: string; input: Record<string, unknown> } }): AssessmentResult {
        let allConflicts: EthicalConflict[] = [];

        for (const constraint of this.constraints) {
            const conflicts = constraint.assess(context, proposedAction);
            allConflicts.push(...conflicts);
        }

        const hasConflicts = allConflicts.length > 0;
        let summary = "Assessment passed. The proposed action appears ethically sound.";

        if (hasConflicts) {
            summary = `Assessment failed. Detected ${allConflicts.length} potential ethical conflicts. Review the detailed report for mitigation steps.`;
        }

        return {
            isEthicallySound: !hasConflicts,
            conflicts: allConflicts,
            summary: summary
        };
    }
}

export { EthicalImpactAssessmentEngine };