import {
    UserMessage,
    AssistantMessage,
    ToolResultMessage,
    ContentBlock,
    TextBlock,
    ToolUseBlock,
    ThinkingBlock,
} from "./types";

export type SchemaDiff = {
    path: string;
    field: string;
    oldValue: any;
    newValue: any;
    changeType: "typeChange" | "requiredChange" | "structureChange" | "valueChange";
};

export interface DiffReport {
    diffs: SchemaDiff[];
    summary: {
        totalFields: number;
        totalDifferences: number;
    };
}

interface SchemaField {
    type: string;
    description?: string;
    required?: boolean;
    properties?: Record<string, SchemaField>;
    items?: {
        type: string;
        properties?: Record<string, SchemaField>;
    };
}

export class SchemaDiffer {
    private diffs: SchemaDiff[] = [];

    private addDiff(path: string, field: string, changeType: SchemaDiff["changeType"], oldValue: any, newValue: any): void {
        this.diffs.push({
            path: path,
            field: field,
            oldValue: oldValue,
            newValue: newValue,
            changeType: changeType,
        });
    }

    private compareSchemas(
        oldSchema: SchemaField,
        newSchema: SchemaField,
        currentPath: string
    ): void {
        // 1. Compare required status
        const oldRequired = oldSchema.required ?? false;
        const newRequired = newSchema.required ?? false;
        if (oldRequired !== newRequired) {
            this.addDiff(currentPath, "required", "requiredChange", oldRequired, newRequired);
        }

        // 2. Compare properties (Object structure)
        const oldProps = oldSchema.properties || {};
        const newProps = newSchema.properties || {};

        const oldKeys = Object.keys(oldProps);
        const newKeys = Object.keys(newProps);

        // Check for removed/modified fields
        for (const key of oldKeys) {
            const oldProp = oldProps[key];
            const newProp = newProps[key];
            const nextPath = `${currentPath}.${key}`;

            if (!newProp) {
                this.addDiff(nextPath, key, "structureChange", oldProp, undefined);
                continue;
            }

            // Recurse for existing fields
            this.compareSchemas(oldProp, newProp, nextPath);
        }

        // Check for added fields
        for (const key of newKeys) {
            if (!oldProps[key]) {
                const newProp = newProps[key];
                const nextPath = `${currentPath}.${key}`;
                this.addDiff(nextPath, key, "structureChange", undefined, newProp);
            }
        }

        // 3. Compare type (Simple check, more complex type checking omitted for brevity)
        if (oldSchema.type !== newSchema.type) {
            this.addDiff(currentPath, "type", "typeChange", oldSchema.type, newSchema.type);
        }

        // 4. Handle array items structure (if applicable)
        if (oldSchema.items && newSchema.items) {
            const oldItems = oldSchema.items;
            const newItems = newSchema.items;

            if (oldItems.type !== newItems.type) {
                this.addDiff(currentPath, "items.type", "typeChange", oldItems.type, newItems.type);
            }

            if (oldItems.properties && newItems.properties) {
                this.compareSchemas(oldItems, newItems, `${currentPath}.items`);
            }
        }
    }

    public diff(oldSchema: SchemaField, newSchema: SchemaField): DiffReport {
        this.diffs = [];
        this.compareSchemas(oldSchema, newSchema, "root");

        return {
            diffs: this.diffs,
            summary: {
                totalFields: 0, // Simplified summary for this implementation
                totalDifferences: this.diffs.length,
            },
        };
    }
}