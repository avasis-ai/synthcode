export type Message = {
    role: "user" | "assistant" | "tool";
    content: string | ContentBlock[] | undefined;
    tool_use_id?: string;
    is_error?: boolean;
};

export interface UserMessage {
    role: "user";
    content: string;
}

export interface AssistantMessage {
    role: "assistant";
    content: ContentBlock[];
}

export interface ToolResultMessage {
    role: "tool";
    tool_use_id: string;
    content: string;
    is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

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

export type Context = Message[];

export type PolicyOutcome = "PASS" | "FAIL" | "ENRICH";

export interface PolicyResult {
    outcome: PolicyOutcome;
    context: Context;
    message: string;
}

export interface PolicyRule {
    execute(context: Context): PolicyResult;
}

export class ContextualPolicyGate {
    private rules: PolicyRule[];

    constructor(rules: PolicyRule[] = []) {
        this.rules = rules;
    }

    addRule(rule: PolicyRule): this {
        this.rules.push(rule);
        return this;
    }

    /**
     * Executes the chain of policy rules against the provided context.
     * The context is mutable during the execution process.
     * @param initialContext The context payload to validate.
     * @returns The final PolicyResult containing the outcome and potentially modified context.
     */
    execute(initialContext: Context): PolicyResult {
        let currentContext: Context = [...initialContext];

        for (const rule of this.rules) {
            const result = rule.execute(currentContext);

            if (result.outcome === "FAIL") {
                return result;
            }

            if (result.outcome === "ENRICH") {
                currentContext = result.context;
            }
            // If PASS, currentContext remains the same (or the result's context if it was modified in place)
        }

        // If all rules pass, return the final enriched context
        return {
            outcome: "PASS",
            context: currentContext,
            message: "Context passed all policy checks."
        };
    }
}

export { ContextualPolicyGate, PolicyRule, PolicyResult };