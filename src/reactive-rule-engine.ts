export type Message = {
    role: "user" | "assistant" | "tool";
    content: any;
    [key: string]: any;
};

export interface State {
    context: Record<string, unknown>;
    history: Message[];
}

export type RuleCondition = (state: State, event: Message) => boolean;
export type RuleAction = (state: State) => Promise<{ type: "context_update" | "tool_call" | "warning"; payload: any }>;

export interface Rule {
    name: string;
    condition: RuleCondition;
    action: RuleAction;
}

export class ReactiveRuleEngine {
    private rules: Map<string, Rule> = new Map();
    private state: State;

    constructor(initialState: State) {
        this.state = initialState;
    }

    public registerRule(rule: Rule): void {
        if (this.rules.has(rule.name)) {
            throw new Error(`Rule name "${rule.name}" already registered.`);
        }
        this.rules.set(rule.name, rule);
    }

    public get currentState(): State {
        return this.state;
    }

    private async executeAction(action: RuleAction, currentState: State): Promise<void> {
        try {
            const result = await action(currentState);
            
            if (result.type === "context_update") {
                this.state.context = { ...this.state.context, ...result.payload };
            } else if (result.type === "tool_call") {
                console.log(`[Rule Engine] Triggering tool call: ${JSON.stringify(result.payload)}`);
                // In a real system, this would dispatch a tool use event.
            } else if (result.type === "warning") {
                console.warn(`[Rule Engine] Warning triggered: ${JSON.stringify(result.payload)}`);
            }
        } catch (error) {
            console.error(`Error executing rule action:`, error);
        }
    }

    public async processEvent(event: Message): Promise<void> {
        console.log(`\n--- Processing Event: ${event.role} ---`);
        
        let rulesTriggered = 0;
        
        for (const [name, rule] of this.rules.entries()) {
            if (rule.condition(this.state, event)) {
                rulesTriggered++;
                console.log(`[Rule Engine] Condition met for rule: ${name}`);
                await this.executeAction(rule.action, this.state);
            }
        }

        if (rulesTriggered === 0) {
            console.log("[Rule Engine] No rules triggered.");
        }
    }
}