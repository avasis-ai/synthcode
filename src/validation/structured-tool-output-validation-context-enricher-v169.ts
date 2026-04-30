import { ContextEnricher, Context, Message, ToolResultMessage } from "./base-context-enricher";

export class StructuredToolOutputValidationContextEnricherV169 extends ContextEnricher {
    constructor(private expectedNextStep: { stepName: string; requiredInputs: Record<string, any> }) {
        super();
    }

    enrich(context: Context, toolOutput: ToolResultMessage): Context {
        const enrichedContext: Partial<Context> = {
            ...context,
            metadata: {
                ...context.metadata,
                expected_next_step_context: {
                    step_name: this.expectedNextStep.stepName,
                    required_inputs: this.expectedNextStep.requiredInputs,
                    description: `Validation context enriched based on expected next step: ${this.expectedNextStep.stepName}.`,
                }
            }
        };

        return {
            ...context,
            metadata: enrichedContext.metadata ? { ...context.metadata, ...enrichedContext.metadata } : context.metadata,
        };
    }
}