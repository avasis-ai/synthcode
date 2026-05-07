import { SemanticMismatchError } from "./semantic-mismatch-error";

export interface StepContext {
    stepName: string;
    requiredInputSchema: Record<string, unknown>;
    semanticExpectation: string;
}

export class SemanticHandshakeValidator {
    constructor() {}

    /**
     * Performs a semantic check to ensure the output payload from the preceding step
     * is conceptually compatible with the required input of the subsequent step.
     * @param previousOutput The structured data output from the step A.
     * @param nextStepContext The definition and semantic requirements of the next step B.
     * @returns true if the handshake is semantically valid.
     * @throws SemanticMismatchError if the meaning or intent is incompatible.
     */
    validate(previousOutput: Record<string, unknown>, nextStepContext: StepContext): boolean {
        if (!previousOutput || Object.keys(previousOutput).length === 0) {
            throw new SemanticMismatchError(
                `Cannot perform semantic handshake: Previous step output is empty.`
            );
        }

        const { stepName, requiredInputSchema, semanticExpectation } = nextStepContext;

        // 1. Basic structural check (ensuring keys exist)
        for (const key in requiredInputSchema) {
            if (!(key in previousOutput)) {
                throw new SemanticMismatchError(
                    `Semantic mismatch detected for step '${stepName}'. Missing required input key: '${key}'.`
                );
            }
        }

        // 2. Semantic comparison engine simulation (The core logic)
        // In a real implementation, this would involve calling an LLM or a knowledge graph service.
        // Here, we simulate the check by analyzing key content and structure.

        const payloadSummary = JSON.stringify(previousOutput);

        // Simple heuristic check: Does the output contain keywords related to the expected input?
        const requiredKeywords = semanticExpectation.toLowerCase().split(/\s+/).filter(Boolean);
        const outputLower = payloadSummary.toLowerCase();

        for (const keyword of requiredKeywords) {
            if (!outputLower.includes(keyword)) {
                throw new SemanticMismatchError(
                    `Semantic mismatch detected for step '${stepName}'. Output does not semantically contain expected concept: '${keyword}'. Expected context: "${semanticExpectation}".`
                );
            }
        }

        // 3. Deep structural compatibility check (e.g., ensuring a list of IDs is provided when a single ID is expected)
        // This is highly context-dependent, but we simulate a check for type consistency.
        if (requiredInputSchema.targetId && typeof previousOutput.targetId !== 'string') {
             throw new SemanticMismatchError(
                `Semantic mismatch detected for step '${stepName}'. Expected 'targetId' to be a string, but received ${typeof previousOutput.targetId}.`
            );
        }

        return true;
    }
}