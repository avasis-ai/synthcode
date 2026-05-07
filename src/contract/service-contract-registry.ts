import {
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
    Message
} from "./types";

type Schema = Record<string, any>;

export class ServiceContract {
    private serviceId: string;
    private version: string;
    private inputSchema: Schema;
    private outputSchema: Schema;
    private compatibilityRules: string[];

    constructor(
        serviceId: string,
        version: string,
        inputSchema: Schema,
        outputSchema: Schema,
        compatibilityRules: string[] = []
    ) {
        this.serviceId = serviceId;
        this.version = version;
        this.inputSchema = inputSchema;
        this.outputSchema = outputSchema;
        this.compatibilityRules = compatibilityRules;
    }

    getServiceId(): string {
        return this.serviceId;
    }

    getVersion(): string {
        return this.version;
    }

    getInputSchema(): Schema {
        return this.inputSchema;
    }

    getOutputSchema(): Schema {
        return this.outputSchema;
    }

    getCompatibilityRules(): string[] {
        return this.compatibilityRules;
    }
}

export class ServiceContractRegistry {
    private static instance: ServiceContractRegistry;
    private contracts: Map<string, Map<string, ServiceContract>>;

    private constructor() {
        this.contracts = new Map();
    }

    public static getInstance(): ServiceContractRegistry {
        if (!ServiceContractRegistry.instance) {
            ServiceContractRegistry.instance = new ServiceContractRegistry();
        }
        return ServiceContractRegistry.instance;
    }

    public registerContract(contract: ServiceContract): void {
        const serviceId = contract.getServiceId();
        const version = contract.getVersion();

        if (!this.contracts.has(serviceId)) {
            this.contracts.set(serviceId, new Map());
        }

        const serviceContracts = this.contracts.get(serviceId)!;
        serviceContracts.set(version, contract);
    }

    public getContract(serviceId: string, version: string): ServiceContract | undefined {
        const serviceContracts = this.contracts.get(serviceId);
        if (serviceContracts) {
            return serviceContracts.get(version);
        }
        return undefined;
    }

    private validateSchema(schema: Schema, payload: unknown): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (typeof payload !== 'object' || payload === null) {
            return { isValid: false, errors: ["Payload must be a non-null object."] };
        }

        for (const key in schema) {
            if (Object.prototype.hasOwnProperty.call(schema, key)) {
                const expectedType = schema[key];
                const actualValue = (payload as Record<string, unknown>)[key];

                if (actualValue === undefined) {
                    errors.push(`Missing required field: ${key}`);
                    continue;
                }

                if (typeof expectedType === 'string') {
                    const type = expectedType;
                    const actualType = typeof actualValue;

                    if (type === 'string' && actualType !== 'string') {
                        errors.push(`Field ${key} expected type 'string', got '${actualType}'.`);
                    } else if (type === 'number' && actualType !== 'number') {
                        errors.push(`Field ${key} expected type 'number', got '${actualType}'.`);
                    } else if (type === 'boolean' && actualType !== 'boolean') {
                        errors.push(`Field ${key} expected type 'boolean', got '${actualType}'.`);
                    } else if (type === 'object' && (actualType !== 'object' || actualValue === null)) {
                        errors.push(`Field ${key} expected type 'object', got '${actualType}'.`);
                    }
                } else if (typeof expectedType === 'object' && expectedType !== null) {
                    const nestedSchema = expectedType as Schema;
                    const nestedPayload = actualValue as Record<string, unknown>;

                    const nestedValidation = this.validateSchema(nestedSchema, nestedPayload);
                    if (!nestedValidation.isValid) {
                        errors.push(`Validation failed for nested object ${key}: ${nestedValidation.errors.join(', ')}`);
                    }
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    public validatePayload(
        serviceId: string,
        version: string,
        payload: unknown
    ): {
        isCompatible: boolean;
        report: {
            input: { isValid: boolean; errors: string[] };
            output: { isValid: boolean; errors: string[] };
            compatibility: { isValid: boolean; message: string[] };
        };
    } {
        const contract = this.getContract(serviceId, version);

        if (!contract) {
            return {
                isCompatible: false,
                report: {
                    input: { isValid: false, errors: [`Contract not found for ${serviceId}@${version}`] },
                    output: { isValid: false, errors: [] },
                    compatibility: { isValid: false, message: [`Contract not found for ${serviceId}@${version}`] }
                }
            };
        }

        const inputValidation = this.validateSchema(contract.getInputSchema(), payload);
        const outputValidation = this.validateSchema(contract.getOutputSchema(), payload);

        const compatibilityMessages: string[] = [];
        let isCompatible = true;

        if (!inputValidation.isValid) {
            compatibilityMessages.push(`Input schema validation failed: ${inputValidation.errors.join('; ')}`);
            isCompatible = false;
        }

        if (!outputValidation.isValid) {
            compatibilityMessages.push(`Output schema validation failed: ${outputValidation.errors.join('; ')}`);
            isCompatible = false;
        }

        const report = {
            input: inputValidation,
            output: outputValidation,
            compatibility: {
                isValid: isCompatible,
                message: isCompatible ? [`Contract ${serviceId}@${version} is compatible.`] : compatibilityMessages
            }
        };

        return {
            isCompatible: isCompatible,
            report: report
        };
    }
}