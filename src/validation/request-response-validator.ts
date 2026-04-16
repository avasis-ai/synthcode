import { z, ZodSchema, ZodError } from "zod";

export class RequestResponseValidator {
    private schema: ZodSchema<any>;

    constructor(schema: ZodSchema<any>) {
        this.schema = schema;
    }

    validate<T>(value: any): { isValid: boolean; errors: string[]; data: T | null } {
        try {
            const parsed = this.schema.safeParse(value);
            if (parsed.success) {
                return { isValid: true, errors: [], data: parsed.data as T };
            } else {
                const errorMessages = parsed.error.errors.map(e => 
                    `${e.path.join('.')}: ${e._message}`
                );
                return { isValid: false, errors: errorMessages, data: null };
            }
        } catch (e) {
            return { isValid: false, errors: ["Validation failed due to internal error: " + (e as Error).message], data: null };
        }
    }
}