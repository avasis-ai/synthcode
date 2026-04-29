import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface ToolSchema {
  name: string;
  version: string;
  description: string;
  inputSchema: Record<string, any>;
  requiredFields: string[];
}

export interface SchemaRegistry {
  getToolSchemas(toolName: string): Promise<ToolSchema[]>;
  getLatestSchemaVersion(toolName: string): Promise<string | null>;
}

export interface ResolutionContext {
  currentMessage: Message;
  targetToolName: string;
}

export type ResolutionError = {
  field: string;
  message: string;
  suggestion?: any;
};

export class StructuredToolInputSchemaResolver {
  private registry: SchemaRegistry;

  constructor(registry: SchemaRegistry) {
    this.registry = registry;
  }

  private async fetchAndMergeSchemas(
    context: ResolutionContext,
    initialSchema: Record<string, any>
  ): Promise<{ resolvedSchema: Record<string, any>; errors: ResolutionError[] }> {
    const { targetToolName } = context;
    const schemas = await this.registry.getToolSchemas(targetToolName);

    if (schemas.length === 0) {
      return { resolvedSchema: initialSchema, errors: [{ field: "toolName", message: `No schemas found for tool: ${targetToolName}` }] };
    }

    const latestSchema = schemas.reduce((latest, current) => {
      if (!latest || current.version > latest.version) {
        return current;
      }
      return latest;
    }, schemas[0]);

    let resolvedSchema = { ...initialSchema };
    let errors: ResolutionError[] = [];

    // 1. Merge logic: Prefer latest version's structure but validate against all required fields
    const mergedSchema: Record<string, any> = {
      ...latestSchema.inputSchema,
      ...initialSchema,
    };

    // 2. Validation/Enrichment logic
    const requiredFields = new Set(latestSchema.requiredFields);

    for (const key in mergedSchema) {
      const value = mergedSchema[key];
      if (typeof value === 'object' && value !== null) {
        // Simple deep check for required fields presence
        if (requiredFields.has(key) && (value === undefined || value === null)) {
          errors.push({ field: key, message: `Required field missing or null based on latest schema.` });
        }
      } else if (requiredFields.has(key) && (value === undefined || value === null)) {
        errors.push({ field: key, message: `Required field missing or null based on latest schema.` });
      }
    }

    // In a real implementation, we would recursively validate types here.
    // For this scope, we return the merged structure and collected errors.

    return { resolvedSchema: mergedSchema, errors: errors };
  }

  public async resolve(context: ResolutionContext, initialSchema: Record<string, unknown>): Promise<{ resolvedSchema: Record<string, any>; errors: ResolutionError[] }> {
    if (!context.targetToolName) {
      return { resolvedSchema: initialSchema, errors: [{ field: "context", message: "Target tool name is missing." }] };
    }

    return this.fetchAndMergeSchemas(context, initialSchema);
  }
}