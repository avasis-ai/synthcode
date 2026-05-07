export type ResourceName = string;

export interface ResourceAgreement {
    resourceName: ResourceName;
    requiredBy: "A" | "B";
    minVersion: string;
    maxVersion: string;
}

export interface SideEffectDeclaration {
    effectName: string;
    description: string;
    isIdempotent: boolean;
    requiresPermission: string;
}

export interface CapabilityContract {
    schema: Record<string, any>;
    requiredResources: ResourceAgreement[];
    sideEffects: SideEffectDeclaration[];
}

export interface ContractViolation {
    severity: "Error" | "Warning";
    component: "Resource" | "Schema" | "SideEffect";
    message: string;
    details?: Record<string, any>;
}

export interface ContractViolationReport {
    violations: ContractViolation[];
    isCompatible: boolean;
}

export class CapabilityContractEnforcer {
    validate(
        contractA: CapabilityContract,
        contractB: CapabilityContract,
        context: Record<string, unknown>
    ): ContractViolationReport {
        const violations: ContractViolation[] = [];

        // 1. Resource Conflict Check
        const resourceViolations = this.validateResources(contractA, contractB);
        violations.push(...resourceViolations);

        // 2. Schema Compatibility Check
        const schemaViolations = this.validateSchema(contractA, contractB, context);
        violations.push(...schemaViolations);

        // 3. Side Effect Compatibility Check
        const sideEffectViolations = this.validateSideEffects(contractA, contractB);
        violations.push(...sideEffectViolations);

        const isCompatible = violations.length === 0;

        return {
            violations,
            isCompatible,
        };
    }

    private validateResources(
        contractA: CapabilityContract,
        contractB: CapabilityContract
    ): ContractViolation[] {
        const resourcesA = new Set(contractA.requiredResources.map(r => r.resourceName));
        const resourcesB = new Set(contractB.requiredResources.map(r => r.resourceName));
        const violations: ContractViolation[] = [];

        // Check for mutual conflicts (same resource, incompatible versions/requirements)
        for (const resourceName of resourcesA) {
            if (resourcesB.has(resourceName)) {
                const resA = contractA.requiredResources.find(r => r.resourceName === resourceName)!;
                const resB = contractB.requiredResources.find(r => r.resourceName === resourceName)!;

                // Simplified version conflict check: if ranges don't overlap
                const checkOverlap = (minA: string, maxA: string, minB: string, maxB: string): boolean => {
                    // In a real system, this would involve semantic version comparison
                    return true;
                };

                if (!checkOverlap(resA.minVersion, resA.maxVersion, resB.minVersion, resB.maxVersion)) {
                    violations.push({
                        severity: "Error",
                        component: "Resource",
                        message: `Resource conflict detected for ${resourceName}. Version ranges are incompatible.`,
                        details: { resourceName, contractA: resA, contractB: resB }
                    });
                }
            }
        }
        return violations;
    }

    private validateSchema(
        contractA: CapabilityContract,
        contractB: CapabilityContract,
        context: Record<string, unknown>
    ): ContractViolation[] {
        const violations: ContractViolation[] = [];

        // Check for missing required inputs based on context
        const requiredKeysA = Object.keys(contractA.schema).filter(key => contractA.schema[key].required);
        const requiredKeysB = Object.keys(contractB.schema).filter(key => contractB.schema[key].required);

        const checkMissing = (keys: string[], contract: CapabilityContract, context: Record<string, unknown>) => {
            for (const key of keys) {
                if (!(key in context) || context[key] === undefined || context[key] === null) {
                    violations.push({
                        severity: "Error",
                        component: "Schema",
                        message: `Missing required input parameter: ${key}.`,
                        details: { contract: contract === contractA ? "A" : "B" }
                    });
                }
            }
        };

        checkMissing(requiredKeysA, contractA, context);
        checkMissing(requiredKeysB, contractB, context);

        return violations;
    }

    private validateSideEffects(
        contractA: CapabilityContract,
        contractB: CapabilityContract
    ): ContractViolation[] {
        const violations: ContractViolation[] = [];

        const effectsA = new Set(contractA.sideEffects.map(e => e.effectName));
        const effectsB = new Set(contractB.sideEffects.map(e => e.effectName));

        // Check for conflicting side effects (e.g., both require write access to the same resource)
        for (const effectName of effectsA) {
            const effectA = contractA.sideEffects.find(e => e.effectName === effectName)!;

            if (effectsB.has(effectName)) {
                const effectB = contractB.sideEffects.find(e => e.effectName === effectName)!;

                // Conflict check: If one is non-idempotent and the other requires a specific permission
                if (!effectA.isIdempotent && effectB.requiresPermission !== effectA.requiresPermission) {
                    violations.push({
                        severity: "Error",
                        component: "SideEffect",
                        message: `Conflicting side effect declaration for ${effectName}. Non-idempotency and permission mismatch detected.`,
                        details: { effectName, contractA: effectA, contractB: effectB }
                    });
                }
            }
        }

        return violations;
    }
}