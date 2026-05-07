export interface Step {
    id: string;
    action: string;
    prerequisites: Record<string, string>;
    output: Record<string, unknown>;
}

export interface CausalRule {
    ruleId: string;
    // Defines a required state or output key that must exist before this step can run.
    requiresSourceState: string;
    // Defines an optional dependency that can be assumed if not found.
    optionalDependency: string;
    // Specifies if the dependency must be met by a preceding step's output.
    mustBeOutputOf: string;
}

export class CausalDependencyValidator {
    validate(sequence: Step[], rules: CausalRule[]): boolean {
        let achievedState: Record<string, unknown> = {};

        for (let i = 0; i < sequence.length; i++) {
            const step = sequence[i];
            
            if (!this.checkStepCausality(step, achievedState, rules)) {
                return false;
            }

            // Update achieved state with the step's output
            Object.assign(achievedState, step.output);
        }

        return true;
    }

    private checkStepCausality(step: Step, achievedState: Record<string, unknown>, rules: CausalRule[]): boolean {
        let stepValid = true;

        for (const rule of rules) {
            if (rule.ruleId !== step.id) {
                continue;
            }

            const requiredState = rule.requiresSourceState;
            const optionalDependency = rule.optionalDependency;

            // 1. Check mandatory prerequisite
            if (requiredState && !(requiredState in achievedState)) {
                // Check if the required state is available in the current step's prerequisites (if it's self-referential)
                if (step.prerequisites[requiredState] && achievedState[requiredState] === undefined) {
                    // This is a complex case, assuming the rule applies to the overall sequence flow.
                    // If the state is missing from the achieved state, the dependency fails.
                    return false;
                }
                
                // If the required state is genuinely missing from the achieved state, fail.
                if (requiredState in step.prerequisites && achievedState[requiredState] === undefined) {
                    return false;
                }
            }

            // 2. Check optional dependency (if mandatory check passed)
            if (optionalDependency && !(optionalDependency in achievedState)) {
                // Optional dependency missing, but this is allowed by the rule structure.
            }
        }

        return stepValid;
    }
}

export { CausalDependencyValidator };