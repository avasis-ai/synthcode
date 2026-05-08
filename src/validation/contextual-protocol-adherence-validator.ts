interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

interface ProtocolDefinition {
    requiredFields: {
        [key: string]: {
            type: 'string' | 'number' | 'boolean' | 'object';
            required: boolean;
            formatCheck?: (value: unknown) => boolean;
            description?: string;
        };
    };
    schemaCheck?: (payload: any) => boolean;
}

export class ProtocolAdherenceValidator {
    constructor() {}

    private validateField(
        payload: any,
        fieldName: string,
        definition: ProtocolDefinition['requiredFields'][typeof fieldName]
    ): string | null {
        const value = payload[fieldName];

        if (definition.required && value === undefined || value === null) {
            return `${fieldName} is required but missing.`;
        }

        if (value === undefined || value === null) {
            return null;
        }

        // Type check
        switch (definition.type) {
            case 'string':
                if (typeof value !== 'string') return `${fieldName} must be a string.`;
                break;
            case 'number':
                if (typeof value !== 'number' || isNaN(value)) return `${fieldName} must be a number.`;
                break;
            case 'boolean':
                if (typeof value !== 'boolean') return `${fieldName} must be a boolean.`;
                break;
            case 'object':
                if (typeof value !== 'object' || value === null || Array.isArray(value)) return `${fieldName} must be a non-array object.`;
                break;
        }

        // Format check
        if (definition.formatCheck && !definition.formatCheck(value)) {
            return `${fieldName} failed format validation.`;
        }

        return null;
    }

    validateProtocol(payload: any, definition: ProtocolDefinition): ValidationResult {
        const errors: string[] = [];

        // 1. Validate required fields
        for (const fieldName in definition.requiredFields) {
            const definitionEntry = definition.requiredFields[fieldName];
            const error = this.validateField(payload, fieldName, definitionEntry);
            if (error) {
                errors.push(error);
            }
        }

        // 2. Validate overall schema structure
        if (definition.schemaCheck) {
            if (!definition.schemaCheck(payload)) {
                errors.push("Payload failed overall structural schema validation.");
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
        };
    }
}