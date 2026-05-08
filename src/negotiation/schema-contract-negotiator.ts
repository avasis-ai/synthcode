import {
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
} from "./types";

type Schema = Record<string, {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    description?: string;
    default?: unknown;
}>;

interface NegotiationContext {
    stepName: string;
    availableTools: string[];
    // Add any other context needed for resolution
}

export class SchemaContractNegotiator {
    private sourceSchema: Schema;
    private targetSchema: Schema;
    private context: NegotiationContext;

    constructor(sourceSchema: Schema, targetSchema: Schema, context: NegotiationContext) {
        this.sourceSchema = sourceSchema;
        this.targetSchema = targetSchema;
        this.context = context;
    }

    private resolveConflict(
        key: string,
        sourceType: Schema[string]['type'],
        targetType: Schema[string]['type'],
        sourceRequired: boolean,
        targetRequired: boolean
    ): {
        type: Schema[string]['type'];
        required: boolean;
        description: string;
    } {
        let resolvedType: Schema[string]['type'];
        let resolvedRequired: boolean;
        let description = `Reconciled contract for ${key}.`;

        // 1. Handle Type Mismatch
        if (sourceType !== targetType) {
            // Prefer the most restrictive type or the type required by the context
            if (sourceType === 'string' && targetType === 'number') {
                resolvedType = 'string'; // Assume string conversion is safest
            } else if (sourceType === 'number' && targetType === 'string') {
                resolvedType = 'string';
            } else {
                resolvedType = sourceType; // Fallback
            }
            description += ` Type conflict resolved from ${sourceType} to ${resolvedType}.`;
        } else {
            resolvedType = sourceType;
        }

        // 2. Handle Required Status
        resolvedRequired = sourceRequired || targetRequired;

        // 3. Final check (e.g., if context dictates non-optional)
        if (this.context.stepName.includes("critical") && !resolvedRequired) {
            resolvedRequired = true;
            description += " Context mandated required field.";
        }

        return {
            type: resolvedType,
            required: resolvedRequired,
            description: description
        };
    }

    /**
     * Negotiates the final contract schema by merging and resolving conflicts
     * between the source and target schemas.
     * @returns The validated, agreed-upon contract schema.
     */
    public negotiate(): Schema {
        const contractSchema: Schema = {};
        const allKeys = new Set<string>([
            ...Object.keys(this.sourceSchema),
            ...Object.keys(this.targetSchema)
        ]);

        for (const key of allKeys) {
            const sourceDef = this.sourceSchema[key];
            const targetDef = this.targetSchema[key];

            if (!sourceDef && !targetDef) continue;

            let resolvedSchema: {
                type: Schema[string]['type'];
                required: boolean;
                description: string;
            };

            if (sourceDef && targetDef) {
                // Conflict Resolution required
                resolvedSchema = this.resolveConflict(
                    key,
                    sourceDef.type,
                    targetDef.type,
                    sourceDef.required,
                    targetDef.required
                );
            } else if (sourceDef) {
                // Only Source exists
                resolvedSchema = {
                    type: sourceDef.type,
                    required: sourceDef.required,
                    description: sourceDef.description || `Field from source.`
                };
            } else {
                // Only Target exists
                resolvedSchema = {
                    type: targetDef.type,
                    required: targetDef.required,
                    description: targetDef.description || `Field from target.`
                };
            }

            contractSchema[key] = {
                type: resolvedSchema.type,
                required: resolvedSchema.required,
                description: resolvedSchema.description
            };
        }

        return contractSchema;
    }
}