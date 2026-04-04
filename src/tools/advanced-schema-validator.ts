import { ZSchema, validate as ajvValidate } from "ajv";

export type ValidationResult = {
    isValid: boolean;
    errors: string[];
};

export class SchemaValidator {
    private schema: any;
    private ajv: ZSchema;

    constructor(schema: any) {
        this.schema = schema;
        this.ajv = new ZSchema();
        this.ajv.addSchema(schema);
    }

    validate(data: unknown): ValidationResult {
        const isValid = this.ajv.validate(data);
        
        if (isValid) {
            return { isValid: true, errors: [] };
        } else {
            const errors = this.ajv.errors.map(err => 
                `Path: ${err.instancePath || 'N/A'}, Message: ${err.message}`
            );
            return { isValid: false, errors: errors };
        }
    }
}