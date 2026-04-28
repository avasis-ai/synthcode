import { Schema, BaseSchemaMerger } from "./base-schema-merger";

export class StructuredToolOutputSchemaMergerV14 extends BaseSchemaMerger {
    mergeWithContextualResolution(schemas: Schema[], context: Record<string, unknown>): Schema {
        if (!schemas || schemas.length === 0) {
            throw new Error("Schema array cannot be empty.");
        }

        let mergedSchema: Schema = schemas[0];

        for (let i = 1; i < schemas.length; i++) {
            const currentSchema = schemas[i];
            mergedSchema = this.mergeSchemas(mergedSchema, currentSchema, context);
        }

        return mergedSchema;
    }

    private mergeSchemas(baseSchema: Schema, nextSchema: Schema, context: Record<string, unknown>): Schema {
        const merged: Record<string, any> = { ...baseSchema.properties };
        const allProperties = new Set<string>([
            ...Object.keys(baseSchema.properties),
            ...Object.keys(nextSchema.properties)
        ]);

        for (const propName of allProperties) {
            const baseProp = baseSchema.properties[propName];
            const nextProp = nextSchema.properties[propName];

            if (!baseProp && !nextProp) {
                continue;
            }

            if (!baseProp) {
                merged[propName] = nextProp;
                continue;
            }

            if (!nextProp) {
                merged[propName] = baseProp;
                continue;
            }

            // Conflict Resolution Logic
            if (baseProp.type !== nextProp.type) {
                if (this.isTypeCompatible(baseProp.type, nextProp.type, context)) {
                    merged[propName] = this.resolveTypeConflict(baseProp, nextProp, context);
                } else {
                    throw new Error(`Type conflict detected for property '${propName}': Cannot merge ${baseProp.type} and ${nextProp.type} with current context.`);
                }
            } else {
                // Types match, attempt deeper merge
                merged[propName] = this.deepMergeProperties(baseProp, nextProp);
            }
        }

        return {
            type: "object",
            properties: merged,
            required: this.resolveRequired(baseSchema.required || [], nextSchema.required || [])
        };
    }

    private isTypeCompatible(type1: string, type2: string, context: Record<string, unknown>): boolean {
        if (type1 === "string" && type2 === "string") return true;
        if (type1 === "number" && type2 === "number") return true;
        if (type1 === "object" && type2 === "object") return true;

        // Contextual check example: If context suggests a specific format, it might override type checking
        if (type1 === "string" && type2 === "string" && context["format"] === "uuid") {
            return true;
        }

        return false;
    }

    private resolveTypeConflict(baseProp: Schema, nextProp: Schema, context: Record<string, unknown>): Schema {
        if (baseProp.type === "string" && nextProp.type === "string") {
            // Assume the most restrictive definition or union if context allows
            return { type: "string", description: "Merged string type." };
        }
        // Fallback: Prefer the more complex/detailed schema definition
        return nextProp;
    }

    private deepMergeProperties(baseProp: Schema, nextProp: Schema): Schema {
        if (baseProp.type !== "object" || baseProp.properties === undefined) {
            return nextProp;
        }
        if (nextProp.type !== "object" || nextProp.properties === undefined) {
            return baseProp;
        }

        const mergedProperties: Record<string, Schema> = { ...baseProp.properties };
        const allProps = new Set<string>([...Object.keys(baseProp.properties), ...Object.keys(nextProp.properties)]);

        for (const propName of allProps) {
            const base = baseProp.properties[propName];
            const next = nextProp.properties[propName];

            if (base && next) {
                mergedProperties[propName] = this.deepMergeProperties(base, next);
            } else if (base) {
                mergedProperties[propName] = base;
            } else if (next) {
                mergedProperties[propName] = next;
            }
        }

        return {
            ...baseProp,
            properties: mergedProperties,
            required: [...(baseProp.required || []), ...(nextProp.required || [])]
        };
    }

    private resolveRequired(required1: string[], required2: string[]): string[] {
        const set = new Set([...required1, ...required2]);
        return Array.from(set);
    }
}