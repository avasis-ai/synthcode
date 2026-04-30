import { ContextSource, Context, Constraint, ConstraintViolation } from "./types";

export class ContextualConstraintResolverV4 {
    constructor() {}

    private checkTemporalConstraints(contextSources: ContextSource[], constraints: Constraint[]): { isValid: boolean; violations: ConstraintViolation[] } {
        const violations: ConstraintViolation[] = [];
        let isValid = true;

        for (const constraint of constraints) {
            if (constraint.temporal) {
                const { checkTemporal } = constraint.temporal;
                if (!checkTemporal(contextSources)) {
                    isValid = false;
                    violations.push({
                        constraintId: constraint.id,
                        message: `Temporal constraint failed for ${constraint.id}.`,
                        details: "Temporal validation failed."
                    });
                }
            }
        }
        return { isValid, violations };
    }

    private checkResourceConstraints(contextSources: ContextSource[], constraints: Constraint[]): { isValid: boolean; violations: ConstraintViolation[] } {
        const violations: ConstraintViolation[] = [];
        let isValid = true;

        for (const constraint of constraints) {
            if (constraint.resource) {
                const { checkResource } = constraint.resource;
                if (!checkResource(contextSources)) {
                    isValid = false;
                    violations.push({
                        constraintId: constraint.id,
                        message: `Resource constraint failed for ${constraint.id}.`,
                        details: "Resource validation failed."
                    });
                }
            }
        }
        return { isValid, violations };
    }

    private mergeContext(contextSources: ContextSource[]): Context {
        const mergedContext: Record<string, any> = {};
        for (const source of contextSources) {
            Object.assign(mergedContext, source.data);
        }
        return {
            history: contextSources.map(source => source.contextHistory),
            metadata: { ...contextSources.reduce((acc, source) => ({ ...acc, ...source.metadata }), {}) }
        };
    }

    public resolve(contextSources: ContextSource[], constraints: Constraint[]): { resolvedContext: Context; errors: ConstraintViolation[] } {
        const allViolations: ConstraintViolation[] = [];

        // Stage 1: Temporal Check
        const temporalResult = this.checkTemporalConstraints(contextSources, constraints);
        allViolations.push(...temporalResult.violations);

        // Stage 2: Resource Check
        const resourceResult = this.checkResourceConstraints(contextSources, constraints);
        allViolations.push(...resourceResult.violations);

        // Stage 3: Constraint Merging (Implicitly handled by validation passing)
        const resolvedContext: Context = this.mergeContext(contextSources);

        if (allViolations.length > 0) {
            return { resolvedContext, errors: allViolations };
        }

        return { resolvedContext, errors: [] };
    }
}