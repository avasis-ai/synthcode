import { type Message } from "./types";

export interface PlanStep {
    id: string;
    timestamp: Date;
    action: Record<string, unknown>;
}

export interface CausalityRule {
    requiredPredecessorId: string;
    timeWindow: string;
    expectedEffect: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export class TemporalCausalityValidator {

    private parseTimeWindow(window: string): { ms: number; } | null {
        const match = window.match(/(\d+)\s*(minute|hour|day)s?/i);
        if (!match) return null;

        const value = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();

        let ms: number;
        if (unit === "minute") {
            ms = value * 60 * 1000;
        } else if (unit === "hour") {
            ms = value * 60 * 60 * 1000;
        } else if (unit === "day") {
            ms = value * 24 * 60 * 60 * 1000;
        } else {
            return null;
        }
        return { ms };
    }

    private checkPredecessor(
        plan: PlanStep[],
        stepIndex: number,
        rule: CausalityRule
    ): boolean {
        const requiredId = rule.requiredPredecessorId;
        const timeWindowData = this.parseTimeWindow(rule.timeWindow);

        if (!timeWindowData) {
            return false;
        }

        const currentTime = plan[stepIndex].timestamp.getTime();
        const maxTimeDifference = timeWindowData.ms;

        for (let i = stepIndex - 1; i >= 0; i--) {
            const predecessor = plan[i];
            const predecessorTime = predecessor.timestamp.getTime();

            if (predecessor.id === requiredId) {
                const timeDifference = Math.abs(currentTime - predecessorTime);
                if (timeDifference <= maxTimeDifference) {
                    return true;
                }
            }
        }
        return false;
    }

    public validate(plan: PlanStep[], rules: CausalityRule[]): ValidationResult {
        const errors: string[] = [];
        let allValid = true;

        for (let i = 0; i < plan.length; i++) {
            const currentStep = plan[i];
            let stepHasFailedRule = false;

            for (const rule of rules) {
                if (rule.requiredPredecessorId === currentStep.id) {
                    continue;
                }

                // Check if the current step requires a predecessor defined by the rule
                // (This assumes the rule is meant to validate the *next* step, 
                // but for simplicity, we check if the current step *is* the target 
                // of a rule and if its prerequisites are met.)
                
                // Since the rules are defined generally, we check if the current step 
                // needs validation against any rule's requirements.
                
                // A robust validator would map rules to target steps. 
                // Here, we assume the rule applies if the current step's action 
                // somehow relates to the rule's expected effect.
                
                if (this.checkPredecessor(plan, i, rule)) {
                    // If the predecessor is found, we should check the effect.
                    // For this implementation, we only check existence/timing.
                } else {
                    // If the rule applies (e.g., based on expected effect match) 
                    // and the predecessor is missing or too far, record an error.
                    
                    // Simplified check: If the rule exists, and we are at a point 
                    // where the rule *should* apply, but the predecessor is missing.
                    
                    // Since we don't have a clear target mapping, we assume 
                    // if a rule exists, and we are past the required time, 
                    // and the predecessor is missing, it's an error.
                    
                    // To make this functional, we assume the rule applies to the step 
                    // immediately following the predecessor's expected effect.
                    
                    // We skip complex effect matching and focus purely on temporal causality failure.
                    
                    // If the rule requires a predecessor, and we are far enough along 
                    // that the predecessor should have occurred, but it hasn't, it's an error.
                    
                    // This is a placeholder check:
                    if (rule.requiredPredecessorId !== "" && !this.checkPredecessor(plan, i, rule)) {
                        const errorMsg = `Causality violation detected for rule targeting ${rule.requiredPredecessorId}. Required predecessor not found within ${rule.timeWindow}.`;
                        errors.push(errorMsg);
                        stepHasFailedRule = true;
                        allValid = false;
                    }
                }
            }
        }

        return {
            isValid: allValid,
            errors: errors
        };
    }
}