export type Message = {
    role: "user" | "assistant" | "tool";
    content: string | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> } | { type: "text"; text: string };
    tool_use_id?: string;
    is_error?: boolean;
};

export interface AgentContext {
    history: Message[];
    user_metadata: Record<string, unknown>;
    runtime_metrics: Record<string, number>;
    current_task_type: "technical" | "creative" | "general";
}

export type PromptTemplate = string;

export interface PromptRule {
    /**
     * Determines if this rule matches the current context.
     * @param context The agent's current operational context.
     */
    matches(context: AgentContext): boolean;
    /**
     * The prompt template to use if the rule matches.
     */
    template: PromptTemplate;
}

export class PromptRouter {
    private rules: PromptRule[];
    private fallbackPrompt: PromptTemplate;

    constructor(rules: PromptRule[], fallbackPrompt: PromptTemplate) {
        this.rules = rules;
        this.fallbackPrompt = fallbackPrompt;
    }

    /**
     * Routes the context through the defined rules to find the optimal prompt template.
     * Rules are checked in order, ensuring the most specific (earlier) rule takes precedence.
     * @param context The agent's current operational context.
     * @returns The selected prompt template.
     */
    route(context: AgentContext): PromptTemplate {
        for (const rule of this.rules) {
            if (rule.matches(context)) {
                return rule.template;
            }
        }
        return this.fallbackPrompt;
    }
}