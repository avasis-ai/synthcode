enum MergeStrategy {
  LATEST = "latest",
  MOST_SPECIFIC = "most_specific",
  USER_DEFINED = "user_defined",
}

export interface SchemaField {
  type: string;
  description?: string;
  required?: boolean;
  enum?: string[];
  properties?: Record<string, SchemaField>;
}

export interface ToolOutputSchema {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, SchemaField>;
    required: string[];
  };
}

export class StructuredToolOutputSchemaMerger {
  private readonly strategy: MergeStrategy;

  constructor(strategy: MergeStrategy) {
    this.strategy = strategy;
  }

  merge(schemas: ToolOutputSchema[]): ToolOutputSchema {
    if (schemas.length === 0) {
      throw new Error("Cannot merge an empty array of schemas.");
    }

    const mergedSchema: ToolOutputSchema = {
      name: schemas[0].name,
      description: "Merged tool output schema.",
      parameters: {
        type: "object",
        properties: this.mergeProperties(schemas),
        required: this.determineRequiredFields(schemas),
      },
    };

    return mergedSchema;
  }

  private mergeProperties(schemas: ToolOutputSchema[]): Record<string, SchemaField> {
    const propertyMap = new Map<string, SchemaField>();

    for (const schema of schemas) {
      const properties = schema.parameters.properties;
      for (const [key, field] of Object.entries(properties)) {
        if (!propertyMap.has(key)) {
          propertyMap.set(key, field);
        } else {
          const existingField = propertyMap.get(key)!;
          const mergedField = this.resolveConflict(existingField, field);
          propertyMap.set(key, mergedField);
        }
      }
    }

    return Object.fromEntries(propertyMap);
  }

  private resolveConflict(existing: SchemaField, incoming: SchemaField): SchemaField {
    switch (this.strategy) {
      case MergeStrategy.LATEST:
        return incoming;
      case MergeStrategy.MOST_SPECIFIC:
        return this.resolveMostSpecific(existing, incoming);
      case MergeStrategy.USER_DEFINED:
        // In a real system, this would involve user input or a more complex heuristic.
        // For this implementation, we default to keeping the existing one if conflict resolution is needed.
        return existing;
    }
  }

  private resolveMostSpecific(existing: SchemaField, incoming: SchemaField): SchemaField {
    // Simple heuristic: prefer the field with more defined properties or enum values.
    const specificityScore = (field: SchemaField): number => {
      let score = 0;
      if (field.properties) {
        score += Object.keys(field.properties).length * 2;
      }
      if (field.enum && field.enum.length > 0) {
        score += field.enum.length;
      }
      return score;
    };

    if (specificityScore(incoming) > specificityScore(existing)) {
      return incoming;
    }
    return existing;
  }

  private determineRequiredFields(schemas: ToolOutputSchema[]): string[] {
    const requiredSet = new Set<string>();
    for (const schema of schemas) {
      if (schema.parameters.required) {
        schema.parameters.required.forEach(field => requiredSet.add(field));
      }
    }
    return Array.from(requiredSet);
  }
}