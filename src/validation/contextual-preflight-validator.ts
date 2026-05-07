import { Message } from "./types";

interface Context {
    history: Message[];
    state: Record<string, unknown>;
    // Add other context details as needed
}

interface ValidationResult {
    isSuccess: boolean;
    isWarning: boolean;
    message: string;
    details: Record<string, unknown>;
}

type PreflightCheck = (context: Context, proposal: any) => ValidationResult;

export class ContextualPreflightValidator {
    private checks: PreflightCheck[];

    constructor(checks: PreflightCheck[]) {
        this.checks = checks;
    }

    validate(context: Context, proposal: any): {
        isViable: boolean;
        results: ValidationResult[];
        criticalFailure: ValidationResult | null;
    } {
        const results: ValidationResult[] = [];
        let criticalFailure: ValidationResult | null = null;
        let isViable = true;

        for (const check of this.checks) {
            const result = check(context, proposal);
            results.push(result);

            if (!result.isSuccess) {
                if (result.message.toLowerCase().includes("critical")) {
                    criticalFailure = result;
                    isViable = false;
                    break;
                }
                if (!result.isWarning) {
                    isViable = false;
                }
            }
        }

        return {
            isViable,
            results,
            criticalFailure
        };
    }
}