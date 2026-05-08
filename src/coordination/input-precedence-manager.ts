import { Message } from "./types";

export type PrecedenceCondition = {
    sourceId: string;
    requiredType: string;
    mustBePresent: boolean;
};

export interface PrecedenceRule {
    id: string;
    description: string;
    // Defines the inputs required for this rule to pass
    requiredInputs: PrecedenceCondition[];
    // Defines the order or combination logic (e.g., ["A", "B"] means A must arrive before B)
    requiredOrder?: string[];
}

export class InputPrecedenceManager {
    private rules: Map<string, PrecedenceRule> = new Map();
    private receivedInputs: Map<string, Message> = new Map();
    private ruleStatus: Map<string, boolean> = new Map();

    constructor() {}

    registerRule(rule: PrecedenceRule): void {
        if (this.rules.has(rule.id)) {
            throw new Error(`Rule ID ${rule.id} already registered.`);
        }
        this.rules.set(rule.id, rule);
        this.ruleStatus.set(rule.id, false);
    }

    processInput(input: Message): void {
        // Use a unique identifier for the input source/event
        const sourceId = this.getUniqueSourceId(input);
        if (!sourceId) {
            return;
        }

        this.receivedInputs.set(sourceId, input);
        this.checkAllRules();
    }

    private getUniqueSourceId(input: Message): string | null {
        if (input.role === "tool") {
            return `tool:${input.tool_use_id}`;
        }
        if (input.role === "user") {
            return `user:${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        }
        // Fallback for general messages
        return `general:${Date.now()}`;
    }

    private checkRule(rule: PrecedenceRule): boolean {
        const inputs = this.receivedInputs;

        // 1. Check for required inputs presence
        for (const condition of rule.requiredInputs) {
            const key = this.getConditionKey(condition);
            if (!inputs.has(key)) {
                return false;
            }
        }

        // 2. Check for required order (if specified)
        if (rule.requiredOrder && rule.requiredOrder.length > 0) {
            const orderedInputs = rule.requiredOrder.map(id => this.getConditionKey({
                sourceId: id,
                requiredType: "any",
                mustBePresent: true
            }));

            for (let i = 0; i < orderedInputs.length; i++) {
                const requiredKey = orderedInputs[i];
                if (!inputs.has(requiredKey)) {
                    return false;
                }
                // Simple check: ensure the input exists in the map
            }
        }

        return true;
    }

    private getConditionKey(condition: PrecedenceCondition): string {
        // Simplistic key generation based on condition structure
        return `${condition.sourceId}:${condition.requiredType}`;
    }

    private checkAllRules(): void {
        let changed = false;
        for (const [ruleId, rule] of this.rules.entries()) {
            const passed = this.checkRule(rule);
            const wasPassed = this.ruleStatus.get(ruleId) || false;

            if (passed && !wasPassed) {
                this.ruleStatus.set(ruleId, true);
                changed = true;
            } else if (!passed && wasPassed) {
                // Optionally reset status if inputs are removed, but for this manager, we assume inputs are cumulative.
                this.ruleStatus.set(ruleId, false);
                changed = true;
            }
        }
    }

    /**
     * Checks if all required precedence rules are met.
     * @returns {boolean} True if all registered rules are satisfied.
     */
    checkPrecedence(): boolean {
        let allPassed = true;
        for (const [ruleId, rule] of this.rules.entries()) {
            if (!this.checkRule(rule)) {
                allPassed = false;
                break;
            }
        }
        return allPassed;
    }

    /**
     * Checks if a specific rule has passed.
     * @param ruleId The ID of the rule to check.
     * @returns {boolean} True if the rule is satisfied.
     */
    isRulePassed(ruleId: string): boolean {
        const rule = this.rules.get(ruleId);
        if (!rule) {
            return false;
        }
        return this.checkRule(rule);
    }
}