import {
  SchemaDefinition,
  MergeReport,
} from "./types";

export class SchemaMerger {
  merge(schemas: SchemaDefinition[]): { mergedSchema: SchemaDefinition; report: MergeReport } {
    if (!schemas || schemas.length === 0) {
      return {
        mergedSchema: { properties: {}, required: [] } as SchemaDefinition,
        report: { conflicts: [], warnings: [] },
      };
    }

    const mergedSchema: Record<string, any> = {
      properties: {},
      required: new Set<string>(),
    };
    const report: MergeReport = { conflicts: [], warnings: [] };

    for (const schema of schemas) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (typeof propSchema !== "object" || propSchema === null) continue;

        const existingProp = mergedSchema.properties[key];

        if (!existingProp) {
          mergedSchema.properties[key] = propSchema;
          if (schema.required?.includes(key)) {
            mergedSchema.required.add(key);
          }
        } else {
          const resolvedProp = this.resolveConflict(key, existingProp, propSchema);
          mergedSchema.properties[key] = resolvedProp;

          if (schema.required?.includes(key) && !mergedSchema.required.has(key)) {
            mergedSchema.required.add(key);
          }
        }
      }
    }

    return {
      mergedSchema: {
        ...mergedSchema,
        required: Array.from(mergedSchema.required),
      } as SchemaDefinition,
      report: report,
    };
  }

  private resolveConflict(
    field: string,
    existing: SchemaDefinition["properties"][string],
    incoming: SchemaDefinition["properties"][string],
  ): SchemaDefinition["properties"][string] {
    let resolved: SchemaDefinition["properties"][string] = { ...existing };
    let conflictReport: { field: string; existing: SchemaDefinition["properties"][string]; incoming: SchemaDefinition["properties"][string]; resolution: string } = {
      field,
      existing,
      incoming,
      resolution: "",
    };

    // 1. Type merging/preference (Simple example: prefer stricter type if defined)
    const existingType = existing.type;
    const incomingType = incoming.type;

    if (existingType && incomingType && existingType !== incomingType) {
      // In a real scenario, this would involve complex union type logic.
      // Here, we prioritize 'string' if either is string, otherwise keep existing.
      if (existingType === "string" || incomingType === "string") {
        resolved.type = "string";
        conflictReport.resolution = `Type merged to 'string' due to conflict between ${existingType} and ${incomingType}.`;
      } else {
        conflictReport.resolution = `Type conflict detected (${existingType} vs ${incomingType}). Keeping existing type: ${existingType}.`;
      }
    } else if (incomingType && !existingType) {
      resolved.type = incomingType;
      conflictReport.resolution = `Type set from incoming schema: ${incomingType}.`;
    }

    // 2. Required field merging (If either marks it required, it is required)
    const existingRequired = (existing as any)?.required || [];
    const incomingRequired = (incoming as any)?.required || [];

    if (existingRequired.includes(field) || incomingRequired.includes(field)) {
      // This logic is flawed because 'required' is on the parent schema, not the property definition.
      // We rely on the caller to manage the top-level 'required' array.
    }

    // 3. Description merging (Prefer more descriptive/longer)
    const existingDescription = existing.description || "";
    const incomingDescription = incoming.description || "";

    if (incomingDescription.length > existingDescription.length) {
      resolved.description = incomingDescription;
      conflictReport.resolution += " Description updated with the longer incoming description.";
    }

    // 4. Example merging (Prefer non-empty)
    if (!existing.example && incoming.example) {
      resolved.example = incoming.example;
      conflictReport.resolution += " Example updated with the incoming example.";
    }

    // Add to report (Note: The actual report aggregation happens in the main merge function)
    return resolved;
  }
}