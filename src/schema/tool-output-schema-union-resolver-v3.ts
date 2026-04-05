import {
  Schema,
  SchemaMergeStrategy,
  SchemaResolver,
  ToolOutputSchema,
  Message,
} from "./schema-resolver-types";

export interface DependencyMap {
  [key: string]: {
    sourceToolId: string;
    outputSchema: Schema;
  };
}

export interface ToolOutputSchemaUnionResolverV3Options {
  dependencyMap: DependencyMap;
}

export class ToolOutputSchemaUnionResolverV3 implements SchemaResolver {
  private options: ToolOutputSchemaUnionResolverV3Options;

  constructor(options: ToolOutputSchemaUnionResolverV3Options) {
    this.options = options;
  }

  public resolve(
    context: {
      messages: Message[];
      toolCalls: {
        id: string;
        name: string;
        input: Record<string, unknown>;
      }[];
    },
    currentSchema: Schema,
  ): Schema {
    const { dependencyMap } = this.options;

    if (!dependencyMap || Object.keys(dependencyMap).length === 0) {
      return currentSchema;
    }

    const mergedSchema = this.mergeWithDependencies(currentSchema, context.toolCalls, dependencyMap);

    return mergedSchema;
  }

  private mergeWithDependencies(
    initialSchema: Schema,
    toolCalls: {
      id: string;
      name: string;
      input: Record<string, unknown>;
    }[],
    dependencyMap: DependencyMap,
  ): Schema {
    let finalSchema: Schema = initialSchema;

    for (const toolCall of toolCalls) {
      const toolId = toolCall.id;
      const toolDependencies = dependencyMap[toolId];

      if (!toolDependencies) {
        continue;
      }

      let currentMergeSchema: Schema = finalSchema;

      for (const [key, dependency] of Object.entries(toolDependencies)) {
        const dependencySchema = dependency.outputSchema;

        // Simulate merging the dependency's output schema into the current accumulated schema
        // This is where semantic compatibility checks would occur in a real implementation.
        currentMergeSchema = this.mergeSchemas(currentMergeSchema, dependencySchema);
      }

      finalSchema = currentMergeSchema;
    }

    return finalSchema;
  }

  private mergeSchemas(schemaA: Schema, schemaB: Schema): Schema {
    // Simplified merge logic: In a real scenario, this would deeply merge
    // based on type compatibility, union resolution, and required fields.
    // For this implementation, we assume a union of properties is sufficient.
    const mergedProperties: Record<string, Schema> = {
      ...(schemaA.properties || {}),
      ...(schemaB.properties || {}),
    };

    return {
      type: "object",
      properties: mergedProperties,
      required: [
        ...(schemaA.required || []),
        ...(schemaB.required || []),
      ].filter((item: string) => item !== undefined),
    };
  }
}