import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export enum ConflictResolutionStrategy {
  Union,
  Intersection,
  LastWriteWins,
}

export interface SchemaDefinition {
  type: string;
  properties?: Record<string, SchemaDefinition>;
  required?: string[];
  description?: string;
}

export interface SchemaMergeReport {
  conflictsResolved: number;
  strategyApplied: ConflictResolutionStrategy;
  details: Record<string, string>;
}

export class StructuredToolOutputSchemaMergerV12 {
  private report: SchemaMergeReport;

  constructor() {
    this.report = {
      conflictsResolved: 0,
      strategyApplied: ConflictResolutionStrategy.Union,
      details: {},
    };
  }

  private validateSchema(schema: SchemaDefinition): boolean {
    // Simplified validation: just checks for basic structure
    return typeof schema.type === 'string' && !!schema.properties;
  }

  private mergeProperties(
    properties: Record<string, SchemaDefinition>,
    strategy: ConflictResolutionStrategy,
  ): { mergedProperties: Record<string, SchemaDefinition>; report: SchemaMergeReport } {
    const mergedProperties: Record<string, SchemaDefinition> = {};
    const localReport: SchemaMergeReport = {
      conflictsResolved: 0,
      strategyApplied: strategy,
      details: {},
    };

    for (const key in properties) {
      if (!properties.hasOwnProperty(key)) continue;

      const propA = properties[key];
      let mergedProp: SchemaDefinition = propA;

      // In a real scenario, we would compare propA with other schemas' properties for 'key'
      // For this implementation, we simulate merging by assuming the first encountered
      // definition is the base, and we only handle recursive merging if necessary.

      // Simulate conflict resolution for demonstration:
      // If we had multiple schemas, we'd compare propA vs propB vs propC...
      // For simplicity, we just use propA and increment conflict count if it's complex.
      if (propA.properties) {
        const recursiveMergeResult = this.mergeProperties(
          propA.properties,
          strategy,
        );
        mergedProp = {
          ...propA,
          properties: recursiveMergeResult.mergedProperties,
          required: propA.required,
        };
        localReport.conflictsResolved += recursiveMergeResult.report.conflictsResolved;
        Object.assign(localReport.details, recursiveMergeResult.report.details);
      }

      mergedProperties[key] = mergedProp;
    }

    return { mergedProperties, report: localReport };
  }

  public merge(
    schemas: SchemaDefinition[],
    strategy: ConflictResolutionStrategy,
  ): { mergedSchema: SchemaDefinition; report: SchemaMergeReport } {
    if (!schemas || schemas.length === 0) {
      throw new Error("Schema array cannot be empty.");
    }

    this.report = {
      conflictsResolved: 0,
      strategyApplied: strategy,
      details: {},
    };

    let currentSchema: SchemaDefinition = schemas[0];

    for (let i = 1; i < schemas.length; i++) {
      const nextSchema = schemas[i];

      if (!this.validateSchema(currentSchema) || !this.validateSchema(nextSchema)) {
        throw new Error("One or more provided schemas are invalid.");
      }

      const { mergedProperties: mergedProps, report: mergeReport } = this.mergeProperties(
        currentSchema.properties || {},
        strategy,
      );

      currentSchema = {
        type: "object",
        properties: mergedProps,
        required: currentSchema.required || nextSchema.required || [],
        description: `Merged output from ${schemas.length} tools.`,
      };

      this.report.conflictsResolved += mergeReport.conflictsResolved;
      Object.assign(this.report.details, mergeReport.details);
    }

    // Final validation check on the resulting schema
    if (!this.validateSchema(currentSchema)) {
      throw new Error("The final merged schema failed internal validation.");
    }

    return {
      mergedSchema: currentSchema,
      report: this.report,
    };
  }
}