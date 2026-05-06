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

export type CorrectionType = "constraint" | "state" | "context";

export interface CorrectionPayload {
    type: CorrectionType;
    value: unknown;
    priority: number;
    description: string;
}

export interface Constraint {
    key: string;
    value: unknown;
    priority: number;
    source: "core" | "external";
}

class ContextualConstraintPropagator {
    static propagate(payload: CorrectionPayload): Constraint {
        if (payload.type === "constraint") {
            return {
                key: `external_constraint:${payload.description}`,
                value: payload.value,
                priority: payload.priority,
                source: "external",
            };
        }
        if (payload.type === "state") {
            return {
                key: `external_state:${payload.description}`,
                value: payload.value,
                priority: payload.priority,
                source: "external",
            };
        }
        return {
            key: `external_context:${payload.description}`,
            value: payload.value,
            priority: payload.priority,
            source: "external",
        };
    }
}

export class ExternalCorrectionValidator {
    private readonly propagator: typeof ContextualConstraintPropagator;

    constructor() {
        this.propagator = ContextualConstraintPropagator;
    }

    /**
     * Validates and converts an external correction payload into a high-priority constraint.
     * @param payload The structured correction data.
     * @returns A temporary Constraint object.
     */
    validateAndPropagate(payload: CorrectionPayload): Constraint {
        if (payload.priority < 1) {
            throw new Error("Correction payload must have a priority of 1 or higher.");
        }
        return this.propagator.propagate(payload);
    }
}

export class CorrectionChainBuilder {
    private validator: ExternalCorrectionValidator;

    constructor(validator: ExternalCorrectionValidator) {
        this.validator = validator;
    }

    /**
     * Builds a validation step that processes external corrections.
     * This step is designed to run after core context validation but before execution.
     * @param payload The external correction payload.
     * @returns A function that simulates the validation step, returning the augmented context.
     */
    buildStep(payload: CorrectionPayload) {
        return async (currentContext: Record<string, unknown>): Promise<Record<string, unknown>> => {
            const constraint = this.validator.validateAndPropagate(payload);

            console.log(`[CorrectionValidator] Applying high-priority external constraint: ${constraint.key} (P:${constraint.priority})`);

            // Simulate merging the external constraint into the current context
            return {
                ...currentContext,
                [constraint.key]: constraint.value,
                last_external_correction: true,
            };
        };
    }
}

export {
    ExternalCorrectionValidator,
    CorrectionChainBuilder,
    CorrectionPayload,
    Constraint,
}