import { Resolver, SchemaDefinition } from "./resolver-interface";

export enum SchemaMergeStrategy {
  STRICT = "STRICT",
  LENIENT = "LENIENT",
  MERGE_OPTIONAL = "MERGE_OPTIONAL",
}

export class ToolOutputSchemaUnionResolverV4 implements Resolver {
  private readonly mergeStrategy: SchemaMergeStrategy;

  constructor(mergeStrategy: SchemaMergeStrategy = SchemaMergeStrategy.MERGE_OPTIONAL) {
    this.mergeStrategy = mergeStrategy;
  }

  resolve(
    schemas: SchemaDefinition[],
    context: Record<string, unknown>
  ): SchemaDefinition {
    let mergedSchema: SchemaDefinition = {
      type: "object",
      properties: {},
      required: []
    };

    for (const schema of schemas) {
      this.mergeSchema(mergedSchema, schema);
    }

    return mergedSchema;
  }

  private mergeSchema(target: SchemaDefinition, source: SchemaDefinition): void {
    if (source.type === "object" && target.type === "object") {
      this.mergeObjectProperties(target, source);
    } else if (source.type === "array" && target.type === "array") {
      // Simple array merging: assume union of items or take the more complex one
      // For simplicity, we'll just keep the source's item definition if it's more complex
      if (typeof source.items === 'object' && source.items !== null) {
        target.items = source.items;
      }
    } else if (source.type === "union" && target.type === "union") {
      // Union merging: combine all possible types
      const combinedTypes: any[] = [...(target as any).enum || [], ...(source as any).enum || []];
      if (combinedTypes.length > 0) {
        target = { type: "union", enum: combinedTypes };
      }
    } else {
      // Simple overwrite or union if types conflict
      if (this.mergeStrategy === SchemaMergeStrategy.STRICT) {
        // In strict mode, if types conflict, we might throw or keep the first one.
        // Here, we'll prioritize the source if it's more defined.
        if (!target.type || !target.type.includes(source.type)) {
            Object.assign(target, source);
        }
      } else {
        // Lenient/Merge_Optional: Overwrite or merge properties
        Object.assign(target, source);
      }
    }
  }

  private mergeObjectProperties(target: SchemaDefinition, source: SchemaDefinition): void {
    const sourceProps = source.properties || {} as Record<string, SchemaDefinition>;
    const targetProps = target.properties || {} as Record<string, SchemaDefinition>;

    for (const key in sourceProps) {
      if (Object.prototype.hasOwnProperty.call(sourceProps, key)) {
        const sourceProp = sourceProps[key];
        const targetProp = targetProps[key];

        if (targetProp) {
          this.mergeSchema(targetProp, sourceProp);
        } else {
          target.properties![key] = sourceProp;
        }
      }
    }

    // Update required fields based on union of required fields
    const newRequired: string[] = [...(target.required || []), ...(source.required || [])];
    target.required = [...new Set(newRequired)];
  }
}