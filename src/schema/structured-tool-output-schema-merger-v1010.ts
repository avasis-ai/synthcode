import {
  SchemaDefinition,
  MergeStrategy,
  MergeReport,
} from "./types";

export class SchemaMerger {
  private schemas: SchemaDefinition[];
  private strategy: MergeStrategy;

  constructor(schemas: SchemaDefinition[], strategy: MergeStrategy) {
    this.schemas = schemas;
    this.strategy = strategy;
  }

  public merge(): {
    mergedSchema: SchemaDefinition;
    report: MergeReport;
  } {
    const mergedFields: Record<string, {
      definition: SchemaDefinition['properties'][string];
      sources: Set<SchemaDefinition & { properties: Record<string, SchemaDefinition['properties'] }>;
    }> = {};
    const report: MergeReport = {
      conflicts: [],
      merges: [],
      warnings: [],
    };

    for (const schema of this.schemas) {
      const properties = schema.properties || {};
      for (const [fieldName, definition] of Object.entries(properties)) {
        if (!mergedFields[fieldName]) {
          mergedFields[fieldName] = {
            definition: definition,
            sources: new Set([schema]),
          };
        } else {
          const existing = mergedFields[fieldName];
          const newSources = new Set([...existing.sources, schema]);
          
          // Update sources and handle potential type/definition conflicts
          const conflict = this.resolveConflict(
            fieldName,
            existing.definition,
            definition,
            existing.sources,
            schema
          );

          if (conflict) {
            report.conflicts.push(conflict);
          }

          // Apply the merge strategy to update the definition
          const mergedDefinition = this.applyStrategy(
            fieldName,
            existing.definition,
            definition,
            existing.sources,
            schema
          );

          mergedFields[fieldName] = {
            definition: mergedDefinition,
            sources: newSources,
          };
        }
      }
    }

    const mergedProperties: Record<string, SchemaDefinition['properties'][string]> = {};
    for (const [fieldName, data] of Object.entries(mergedFields)) {
      mergedProperties[fieldName] = data.definition;
    }

    const mergedSchema: SchemaDefinition = {
      type: "object",
      properties: mergedProperties,
      required: this.collectRequiredFields(mergedFields),
    };

    return {
      mergedSchema,
      report,
    };
  }

  private resolveConflict(
    fieldName: string,
    existingDef: SchemaDefinition['properties'][string],
    newDef: SchemaDefinition['properties'][string],
    existingSources: Set<SchemaDefinition & { properties: Record<string, SchemaDefinition['properties'] }>
  ,
    newSource: SchemaDefinition & { properties: Record<string, SchemaDefinition['properties'] }>
  ): {
    field: string;
    message: string;
    severity: "error" | "warning";
  } | null {
    const conflict = this.checkTypeConflict(existingDef, newDef);
    if (conflict) {
      return {
        field: fieldName,
        message: `Type conflict detected for field "${fieldName}": ${conflict.message}`,
        severity: "error",
      };
    }
    return null;
  }

  private checkTypeConflict(
    existingDef: SchemaDefinition['properties'][string],
    newDef: SchemaDefinition['properties'][string]
  ): {
    message: string;
    severity: "error";
  } | null {
    const existingType = existingDef.type;
    const newType = newDef.type;

    if (existingType !== newType) {
      if (this.strategy === MergeStrategy.PREFER_MOST_SPECIFIC) {
        if (this.isMoreSpecific(existingDef, newDef)) {
          return { message: `Existing type (${existingType}) is more specific than new type (${newType}).`, severity: "error" };
        }
        if (this.isMoreSpecific(newDef, existingDef)) {
          return { message: `New type (${newType}) is more specific than existing type (${existingType}).`, severity: "error" };
        }
        return { message: `Type mismatch: Cannot automatically resolve between ${existingType} and ${newType}.`, severity: "error" };
      }
    }
    return null;
  }

  private applyStrategy(
    fieldName: string,
    existingDef: SchemaDefinition['properties'][string],
    newDef: SchemaDefinition['properties'][string],
    existingSources: Set<SchemaDefinition & { properties: Record<string, SchemaDefinition['properties'] }>
  ,
    newSource: SchemaDefinition & { properties: Record<string, SchemaDefinition['properties'] }>
  ): SchemaDefinition['properties'][string] {
    switch (this.strategy) {
      case MergeStrategy.PREFER_LATEST:
        return newDef;
      case MergeStrategy.PREFER_EARLIEST:
        return existingDef;
      case MergeStrategy.MERGE_DEFINITIONS:
        return this.mergeDefinitions(existingDef, newDef);
      case MergeStrategy.STRICT:
        // In strict mode, we rely on the conflict detection to fail, 
        // but for merging, we default to the existing definition if no conflict is flagged.
        return existingDef;
    }
  }

  private mergeDefinitions(
    existingDef: SchemaDefinition['properties'][string],
    newDef: SchemaDefinition['properties'][string]
  ): SchemaDefinition['properties'][string] {
    const merged: Partial<SchemaDefinition['properties'][string]> = { ...existingDef };
    
    // Simple merge: new properties override existing ones if they exist
    if (newDef.properties) {
      Object.assign(merged.properties || {}, newDef.properties);
    }

    // Type merging logic (simplified for this scope)
    if (existingDef.type !== newDef.type) {
      merged.type = "object"; // Default to object if types conflict
    }
    
    // In a real scenario, this would recursively merge all fields.
    return merged as SchemaDefinition['properties'][string];
  }

  private isMoreSpecific(
    def1: SchemaDefinition['properties'][string],
    def2: SchemaDefinition['properties'][string]
  ): boolean {
    const types = [def1.type, def2.type];
    if (types.includes("string") && types.includes("number")) return false;
    if (types.includes("integer") && types.includes("number")) return false;
    
    // Placeholder logic: Assume a field with 'enum' is more specific than one without.
    const hasEnum1 = (def1 as any).enum;
    const hasEnum2 = (def2 as any).enum;

    if (hasEnum1 && !hasEnum2) return true;
    if (!hasEnum1 && hasEnum2) return false;
    
    return false;
  }

  private collectRequiredFields(
    mergedFields: Record<string, {
      definition: SchemaDefinition['properties'][string];
      sources: Set<SchemaDefinition & { properties: Record<string, SchemaDefinition['properties'] }>
    }>
  ): string[] {
    const required: string[] = [];
    for (const [fieldName, data] of Object.entries(mergedFields)) {
      // A field is required if *any* source marked it as required.
      let isRequired = false;
      for (const source of data.sources) {
        if (source.required && (source.required as string[]).includes(fieldName)) {
          isRequired = true;
          break;
        }
      }
      if (isRequired) {
        required.push(fieldName);
      }
    }
    return required;
  }
}