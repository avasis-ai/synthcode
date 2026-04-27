import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export type GuardrailResult = {
    isValid: boolean;
    reason?: string;
};

export interface Guardrail<TInput, TContext> {
    validate: (inputs: TInput, context: TContext) => GuardrailResult;
}

export class GuardrailManager<TInput, TContext> {
    private guardrails: { guardrail: Guardrail<TInput, TContext>; name: string }[] = [];

    addGuardrail(guardrail: Guardrail<TInput, TContext>, name: string): void {
        this.guardrails.push({ guardrail, name });
    }

    async executePreGuardrails(inputs: TInput, context: TContext): Promise<boolean> {
        for (const { guardrail, name } of this.guardrails) {
            const result = guardrail.validate(inputs, context);
            if (!result.isValid) {
                console.warn(`Guardrail "${name}" failed pre-execution validation: ${result.reason}`);
                return false;
            }
        }
        return true;
    }

    async executePostGuardrails(inputs: TInput, context: TContext, result: any): Promise<boolean> {
        for (const { guardrail, name } of this.guardrails) {
            // For post-guardrails, we might need to adapt the signature or assume the guardrail can handle the result type.
            // For simplicity here, we'll pass the result as the context extension for post-validation.
            const resultValidation = guardrail.validate(inputs, context as any); // Type assertion for simplicity in this scope
            if (!resultValidation.isValid) {
                console.warn(`Guardrail "${name}" failed post-execution validation: ${resultValidation.reason}`);
                return false;
            }
        }
        return true;
    }
}

export class ToolExecutionGuard<TInput, TContext> {
    private manager: GuardrailManager<TInput, TContext>;

    constructor() {
        this.manager = new GuardrailManager<TInput, TContext>();
    }

    addGuardrail(guardrail: Guardrail<TInput, TContext>, name: string): void {
        this.manager.addGuardrail(guardrail, name);
    }

    public async executeTool(
        toolName: string,
        inputs: TInput,
        context: TContext,
        toolExecutor: (toolName: string, inputs: TInput, context: TContext) => Promise<any>
    ): Promise<any> {
        const preValidated = await this.manager.executePreGuardrails(inputs, context);

        if (!preValidated) {
            throw new Error("Tool execution blocked by pre-execution guardrail.");
        }

        let executionResult: any;
        try {
            executionResult = await toolExecutor(toolName, inputs, context);
        } catch (error) {
            throw error;
        }

        const postValidated = await this.manager.executePostGuardrails(inputs, context, executionResult);

        if (!postValidated) {
            throw new Error("Tool execution blocked by post-execution guardrail.");
        }

        return executionResult;
    }
}