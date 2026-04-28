import {
  SchemaDefinition,
  ConflictResolutionStrategy,
  SchemaField,
  SchemaType,
} from "./types";

export class SchemaMerger {
  private readonly schemas: SchemaDefinition[];
  private readonly strategy: ConflictResolutionStrategy;

  constructor(schemas: SchemaDefinition[], strategy: ConflictResolutionStrategy) {
    if (!schemas || schemas.length === 0) {
      throw new Error("SchemaMerger requires at least one schema definition.");
    }
    this.schemas = schemas;
    this.strategy = strategy;
  }

  public mergeSchemas(): { mergedSchema: SchemaDefinition; conflicts: string[] } {
    const mergedSchema = this.mergeRootSchema(this.schemas);
    const conflicts = this.validateFinalSchema(mergedSchema);
    return { mergedSchema, conflicts };
  }

  private mergeRootSchema(schemas: SchemaDefinition[]): SchemaDefinition {
    const mergedProperties: Record<string, SchemaField> = {};

    for (const schema of schemas) {
      if (!schema.properties) continue;

      for (const [key, field] of Object.entries(schema.properties)) {
        const existingField = mergedProperties[key];
        const newField = field as SchemaField;

        if (!existingField) {
          mergedProperties[key] = newField;
        } else {
          mergedProperties[key] = this.resolveFieldConflict(existingField, newField);
        }
      }
    }

    return {
      type: "object",
      properties: mergedProperties,
      required: this.resolveRequiredFields(schemas),
    };
  }

  private resolveRequiredFields(schemas: SchemaDefinition[]): string[] {
    const requiredSet = new Set<string>();
    for (const schema of schemas) {
      if (schema.required) {
        schema.required.forEach(field => requiredSet.add(field));
      }
    }
    return Array.from(requiredSet);
  }

  private resolveFieldConflict(existing: SchemaField, incoming: SchemaField): SchemaField {
    let resolvedField: SchemaField = { ...existing, description: existing.description || incoming.description };

    // 1. Merge Properties (Recursive)
    if (existing.properties && incoming.properties) {
      const mergedProps = this.mergeProperties(existing.properties, incoming.properties);
      resolvedField.properties = mergedProps;
    }

    // 2. Resolve Type Conflicts
    const resolvedType = this.resolveTypeConflict(existing.type, incoming.type);
    if (resolvedType !== null) {
      resolvedField.type = resolvedType;
    }

    // 3. Merge Constraints (e.g., minLength, pattern) - Simplified for this scope
    // In a real implementation, this would merge all possible constraints.

    // 4. Handle Optionality (Union of optionality)
    // If either is optional, the result is optional (unless strategy dictates otherwise)
    if (existing.description && incoming.description) {
      resolvedField.description = `${existing.description}. ${incoming.description}`;
    }

    return resolvedField;
  }

  private mergeProperties(existing: Record<string, SchemaField>, incoming: Record<string, SchemaField>): Record<string, SchemaField> {
    const merged: Record<string, SchemaField> = { ...existing };

    for (const [key, incomingField] of Object.entries(incoming)) {
      const existingField = existing[key];
      if (existingField) {
        merged[key] = this.resolveFieldConflict(existingField, incomingField);
      } else {
        merged[key] = incomingField;
      }
    }
    return merged;
  }

  private resolveTypeConflict(type1: SchemaType, type2: SchemaType): SchemaType | null {
    if (type1 === type2) {
      return type1;
    }

    if (this.strategy === ConflictResolutionStrategy.STRICT) {
      return null; // Conflict detected, cannot merge types
    }

    if (this.strategy === ConflictResolutionStrategy.PROMOTE_TO_STRING) {
      return "string"; // Default promotion strategy
    }

    // More complex logic would go here (e.g., number + string -> string)
    return null;
  }

  private validateFinalSchema(schema: SchemaDefinition): string[] {
    const conflicts: string[] = [];

    if (schema.properties) {
      for (const [key, field] of Object.entries(schema.properties)) {
        const fieldSchema = field as SchemaField;

        // Check for internal inconsistencies (e.g., type mismatch in definition)
        if (fieldSchema.type === "object" && !fieldSchema.properties) {
          conflicts.push(`Field '${key}': Object type defined but missing 'properties'.`);
        }
      }
    }

    // Check required fields against existing properties
    if (schema.required) {
      for (const requiredField of schema.required) {
        if (!schema.properties || !(requiredField in schema.properties)) {
          conflicts.push(`Required field '${requiredField}' is listed but not defined in properties.`);
        }
      }
    }

    return conflicts;
  }
}