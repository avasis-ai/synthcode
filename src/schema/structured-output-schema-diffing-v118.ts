import {
    Message,
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
    LoopEvent
} from "./types";

interface SchemaDiffResult {
    addedFields: Record<string, any>;
    removedFields: Record<string, any>;
    modifiedFields: Record<string, {
        old: any;
        new: any;
        diff: string;
    }>;
}

interface SchemaDefinition {
    type: "object";
    properties: Record<string, SchemaDefinition>;
    required?: string[];
}

export class StructuredOutputSchemaDiffingService {
    private diffResult: SchemaDiffResult = {
        addedFields: {},
        removedFields: {},
        modifiedFields: {}
    };

    public diff(oldSchema: SchemaDefinition, newSchema: SchemaDefinition): SchemaDiffResult {
        this.diffResult = {
            addedFields: {},
            removedFields: {},
            modifiedFields: {}
        };

        this.compareObjectProperties(oldSchema.properties || {}, newSchema.properties || {});

        return this.diffResult;
    }

    private compareObjectProperties(oldProps: Record<string, SchemaDefinition>, newProps: Record<string, SchemaDefinition>): void {
        const allKeys = new Set<string>([...Object.keys(oldProps), ...Object.keys(newProps)]);

        for (const key of allKeys) {
            const oldProp = oldProps[key];
            const newProp = newProps[key];

            if (!oldProp && newProp) {
                this.recordAddedField(key, newProp);
            } else if (oldProp && !newProp) {
                this.recordRemovedField(key, oldProp);
            } else if (oldProp && newProp) {
                this.compareSchemaProperties(key, oldProp, newProp);
            }
        }
    }

    private compareSchemaProperties(fieldName: string, oldSchema: SchemaDefinition, newSchema: SchemaDefinition): void {
        const oldRequired = oldSchema.required && oldSchema.required.includes(fieldName);
        const newRequired = newSchema.required && newSchema.required.includes(fieldName);

        let isRequiredModified = oldRequired !== newRequired;

        const oldProps = oldSchema.properties || {};
        const newProps = newSchema.properties || {};

        const propKeys = new Set<string>([...Object.keys(oldProps), ...Object.keys(newProps)]);

        for (const propKey of propKeys) {
            const oldProp = oldProps[propKey];
            const newProp = newProps[propKey];

            if (!oldProp && newProp) {
                this.recordAddedField(propKey, newProp);
            } else if (oldProp && !newProp) {
                this.recordRemovedField(propKey, oldProp);
            } else if (oldProp && newProp) {
                this.compareSchemaProperties(propKey, oldProp, newProp);
            }
        }

        const diff: string = this.generateFieldDiff(fieldName, oldSchema, newSchema, isRequiredModified);

        if (diff) {
            this.recordModifiedField(fieldName, oldSchema, newSchema, diff);
        }
    }

    private recordAddedField(fieldName: string, schema: SchemaDefinition): void {
        this.diffResult.addedFields[fieldName] = schema;
    }

    private recordRemovedField(fieldName: string, schema: SchemaDefinition): void {
        this.diffResult.removedFields[fieldName] = schema;
    }

    private recordModifiedField(fieldName: string, oldSchema: SchemaDefinition, newSchema: SchemaDefinition, diff: string): void {
        this.diffResult.modifiedFields[fieldName] = {
            old: oldSchema,
            new: newSchema,
            diff: diff
        };
    }

    private generateFieldDiff(fieldName: string, oldSchema: SchemaDefinition, newSchema: SchemaDefinition, requiredModified: boolean): string {
        let diffParts: string[] = [];

        if (requiredModified) {
            diffParts.push(`Required status changed: ${oldSchema.required?.includes(fieldName) ? 'true' : 'false'} -> ${newSchema.required?.includes(fieldName) ? 'true' : 'false'}`);
        }

        if (oldSchema.description !== newSchema.description) {
            diffParts.push(`Description changed: "${oldSchema.description || ''}" -> "${newSchema.description || ''}"`);
        }

        if (oldSchema.type !== newSchema.type) {
            diffParts.push(`Type changed: ${oldSchema.type} -> ${newSchema.type}`);
        }

        if (oldSchema.properties && newSchema.properties) {
            const oldProps = oldSchema.properties;
            const newProps = newSchema.properties;
            const propKeys = new Set<string>([...Object.keys(oldProps), ...Object.keys(newProps)]);

            let propDiffs: string[] = [];
            for (const propKey of propKeys) {
                const oldProp = oldProps[propKey];
                const newProp = newProps[propKey];

                if (!oldProp && newProp) {
                    propDiffs.push(`[Added Field] ${propKey}: ${JSON.stringify(newProp)}`);
                } else if (oldProp && !newProp) {
                    propDiffs.push(`[Removed Field] ${propKey}: ${JSON.stringify(oldProp)}`);
                } else if (oldProp && newProp) {
                    // Recursive check for nested object properties
                    const nestedDiff = this.generateFieldDiff(propKey, oldProp, newProp, false);
                    if (nestedDiff) {
                        propDiffs.push(`[Modified Field] ${propKey}: ${nestedDiff}`);
                    }
                }
            }
            if (propDiffs.length > 0) {
                diffParts.push(`Properties changed:\n- ${propDiffs.join('\n- ')}`);
            }
        }

        return diffParts.join('\n\n') || null;
    }
}