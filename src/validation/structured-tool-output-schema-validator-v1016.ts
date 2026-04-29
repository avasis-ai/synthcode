import { ValidatorBase } from "./validator-base";

export class StructuredToolOutputSchemaValidatorV1016 extends ValidatorBase {
    private schema: Record<string, any>;

    constructor(schema: Record<string, any>) {
        super();
        this.schema = schema;
    }

    async validate(data: Record<string, unknown>): Promise<{ isValid: boolean; errors: string[]; suggestions: string[] }> {
        const errors: string[] = [];
        const suggestions: string[] = [];

        if (!data || typeof data !== 'object') {
            return { isValid: false, errors: ["Input data must be a non-null object."], suggestions: [] };
        }

        const requiredFields = this.getRequiredFields(this.schema);
        const providedFields = Object.keys(data);

        // 1. Check for missing required fields
        for (const field of requiredFields) {
            if (!(field in data) || data[field] === null || data[field] === undefined) {
                errors.push(`Missing required field: "${field}".`);
            }
        }

        // 2. Check for unexpected fields (Schema Evolution: Added fields)
        for (const field of providedFields) {
            if (!field && !requiredFields.includes(field)) {
                // Simple check: if it's not explicitly defined as required, we treat it as potentially new/optional
                // For this version, we only warn about fields not in the schema definition keys.
                if (!this.schema[field] && !this.isOptional(field)) {
                    suggestions.push(`Unexpected field found: "${field}". Consider updating the schema or ignoring this field.`);
                }
            }
        }

        // 3. Deep validation against schema structure
        const validationResult = this.validateStructure(data, this.schema, "");
        errors.push(...validationResult.errors);

        // 4. Handle deprecations (Schema Evolution: Deprecated fields)
        const deprecatedFields = this.getDeprecatedFields(this.schema);
        for (const field of deprecatedFields) {
            if (field in data) {
                suggestions.push(`Field "${field}" is deprecated. Please use "${this.getReplacementField(field)}" instead.`);
            }
        }

        const isValid = errors.length === 0;

        return {
            isValid: isValid,
            errors: errors,
            suggestions: suggestions
        };
    }

    private getRequiredFields(schema: Record<string, any>): string[] {
        const required: string[] = [];
        const traverse = (obj: any, path: string) => {
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const prop = obj[key];
                    if (typeof prop === 'object' && prop !== null && 'properties' in prop) {
                        const subSchema = prop['properties'];
                        for (const subKey in subSchema) {
                            const subProp = subSchema[subKey];
                            if (subProp.required && typeof subProp.required === 'boolean' && subProp.required) {
                                required.push(`${path}.${subKey}`);
                            }
                        }
                        traverse(subSchema, path);
                    }
                }
            }
        };
        traverse(schema, "");
        return required;
    }

    private getDeprecatedFields(schema: Record<string, any>): string[] {
        const deprecated: string[] = [];
        const traverse = (obj: any, path: string) => {
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const prop = obj[key];
                    if (typeof prop === 'object' && prop !== null && 'properties' in prop) {
                        const subSchema = prop['properties'];
                        for (const subKey in subSchema) {
                            const subProp = subSchema[subKey];
                            if (subProp.deprecated) {
                                deprecated.push(`${path}.${subKey}`);
                            }
                        }
                        traverse(subSchema, path);
                    }
                }
            }
        };
        traverse(schema, "");
        return deprecated;
    }

    private getReplacementField(deprecatedField: string): string {
        // Simplified logic: assumes replacement is in the parent object or is the next sibling
        const parts = deprecatedField.split('.');
        if (parts.length >= 2) {
            const parentPath = parts.slice(0, -1).join('.');
            const parentSchema = this.schema; // In a real scenario, we'd need context to find the parent object
            // Placeholder: In a real system, we'd traverse to find the parent schema definition.
            return parts[parts.length - 1] + "_replacement";
        }
        return "unknown_replacement";
    }

    private isOptional(field: string): boolean {
        // Placeholder: In a real implementation, this would check the schema definition for 'required' status.
        return true;
    }

    private validateStructure(data: Record<string, unknown>, schema: Record<string, any>, path: string): { errors: string[]; suggestions: string[] } {
        const errors: string[] = [];
        const suggestions: string[] = [];

        if (!schema || typeof schema !== 'object') {
            return { errors: [], suggestions: [] };
        }

        for (const key in schema) {
            if (Object.prototype.hasOwnProperty.call(schema, key)) {
                const propSchema = schema[key];
                const currentPath = path ? `${path}.${key}` : key;

                if (propSchema.required && !(key in data) || data[key] === null) {
                    errors.push(`Required field "${currentPath}" is missing or null.`);
                    continue;
                }

                if (key in data && data[key] !== null) {
                    const value = data[key];

                    if (propSchema.type === 'object' && typeof value === 'object' && value !== null) {
                        const subValidation = this.validateStructure(value as Record<string, unknown>, propSchema, currentPath);
                        errors.push(...subValidation.errors);
                        suggestions.push(...subValidation.suggestions);
                    } else if (propSchema.type === 'string') {
                        if (typeof value !== 'string') {
                            errors.push(`Field "${currentPath}" expected type string, got ${typeof value}.`);
                        }
                    } else if (propSchema.type === 'number') {
                        if (typeof value !== 'number') {
                            errors.push(`Field "${currentPath}" expected type number, got ${typeof value}.`);
                        }
                    }
                }
            }
        }

        return { errors, suggestions };
    }
}