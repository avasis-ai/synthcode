export type ServiceName = string;
export type Version = string;

export interface ContractSchema {
    requiredInputs: Record<string, { type: string; description: string }>;
    expectedOutputs: Record<string, { type: string; description: string }>;
    compatibilityRules: {
        nextStepInputMapping: Record<string, { sourceField: string; targetField: string }>;
        requiredOutputKeys: string[];
    };
}

export interface ServiceCallDefinition {
    serviceName: ServiceName;
    version: Version;
    contract: ContractSchema;
    inputParameters: Record<string, unknown>;
}

export interface ServiceChainDefinition {
    steps: ServiceCallDefinition[];
}

export interface ContractViolation {
    stepIndex: number;
    stepName: string;
    violationType: "VersionMismatch" | "SchemaDrift" | "CapabilityDeprecation" | "CompatibilityError";
    message: string;
    details: Record<string, unknown>;
}

export interface ComplianceReport {
    isValid: boolean;
    violations: ContractViolation[];
    summary: string;
}

export class ServiceChainContractValidator {

    constructor() {}

    private validateStepContract(step: ServiceCallDefinition, index: number): ContractViolation[] {
        const violations: ContractViolation[] = [];

        // 1. Version Check (Mock implementation)
        // In a real system, this would check against a registry.
        if (step.version.includes("v0")) {
            violations.push({
                stepIndex: index,
                stepName: step.serviceName,
                violationType: "VersionMismatch",
                message: `Service ${step.serviceName} requires a stable version (v1+). Found v0.`,
                details: { required: "v1.x", found: step.version }
            });
        }

        // 2. Schema Drift Check (Mock implementation)
        // Check if required inputs are provided.
        for (const [key, definition] of Object.entries(step.contract.requiredInputs)) {
            if (!(key in step.inputParameters)) {
                violations.push({
                    stepIndex: index,
                    stepName: step.serviceName,
                    violationType: "SchemaDrift",
                    message: `Missing required input parameter: ${key}.`,
                    details: { expectedType: definition.type }
                });
            }
        }

        return violations;
    }

    private validateStepCompatibility(
        currentStep: ServiceCallDefinition,
        nextStep: ServiceCallDefinition,
        index: number
    ): ContractViolation[] {
        const violations: ContractViolation[] = [];

        // 3. Output -> Input Compatibility Check
        const contract = currentStep.contract;
        const nextContract = nextStep.contract;

        // Check if the current step's output can satisfy the next step's input requirements
        for (const [nextInputKey, nextInputDef] of Object.entries(nextContract.requiredInputs)) {
            const mapping = contract.compatibilityRules.nextStepInputMapping[nextInputKey];

            if (!mapping) {
                violations.push({
                    stepIndex: index,
                    stepName: currentStep.serviceName,
                    violationType: "CompatibilityError",
                    message: `Output of ${currentStep.serviceName} cannot satisfy required input '${nextInputKey}' for ${nextStep.serviceName}. No mapping found.`,
                    details: { requiredField: nextInputKey }
                });
                continue;
            }

            // Mock check: Assume the source field must exist in the output structure
            // (In reality, we'd check the actual output data structure)
            const sourceField = mapping.sourceField;
            if (!sourceField) {
                 violations.push({
                    stepIndex: index,
                    stepName: currentStep.serviceName,
                    violationType: "CompatibilityError",
                    message: `Mapping for ${nextInputKey} is invalid. Source field missing.`,
                    details: { targetField: nextInputKey }
                });
            }
        }

        return violations;
    }

    public validateChain(chain: ServiceChainDefinition): ComplianceReport {
        const violations: ContractViolation[] = [];
        const steps = chain.steps;

        for (let i = 0; i < steps.length; i++) {
            const currentStep = steps[i];

            // Validate current step's internal contract
            const stepViolations = this.validateStepContract(currentStep, i);
            violations.push(...stepViolations);

            // Validate compatibility with the next step (if it exists)
            if (i < steps.length - 1) {
                const nextStep = steps[i + 1];
                const compatibilityViolations = this.validateStepCompatibility(
                    currentStep,
                    nextStep,
                    i
                );
                violations.push(...compatibilityViolations);
            }
        }

        const isValid = violations.length === 0;
        const summary = isValid
            ? "Service chain passed all contract, version, and compatibility checks."
            : `Service chain failed validation. Found ${violations.length} violations.`;

        return {
            isValid: isValid,
            violations: violations,
            summary: summary
        };
    }
}

export { ServiceChainContractValidator };