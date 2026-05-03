import {
  ToolResultMessage,
  Message,
} from "./types";

interface SchemaMetadata {
  version: number;
  timestamp: number;
  schema: Record<string, any>;
}

interface SchemaRegistry {
  getSchema(toolName: string, version: number): SchemaMetadata | undefined;
  registerSchema(toolName: string, schema: Record<string, any>): SchemaMetadata;
}

type SchemaDriftReport = {
  addedFields: string[];
  removedFields: string[];
  typeChanges: {
    field: string;
    expectedType: string;
    actualType: string;
  }[];
};

export class ToolOutputSchemaEvolutionMonitor {
  private registry: Map<string, Map<number, SchemaMetadata>>;

  constructor() {
    this.registry = new Map();
  }

  private getToolNameFromMessage(message: Message): string | undefined {
    if (message.role === "tool" && (message as ToolResultMessage).tool_use_id) {
      // Simplified: assuming tool name can be derived or passed contextually.
      // For this implementation, we'll use a placeholder derived from the message structure.
      return "generic_tool";
    }
    return undefined;
  }

  private getOrCreateToolRegistry(toolName: string): Map<number, SchemaMetadata> {
    if (!this.registry.has(toolName)) {
      this.registry.set(toolName, new Map());
    }
    return this.registry.get(toolName)!;
  }

  public registerSchema(toolName: string, schema: Record<string, any>): void {
    const toolRegistry = this.getOrCreateToolRegistry(toolName);
    const currentVersion = Math.max(
      ...Array.from(toolRegistry.values()).map(meta => meta.version),
      0
    ) + 1;

    const metadata: SchemaMetadata = {
      version: currentVersion,
      timestamp: Date.now(),
      schema: schema,
    };

    toolRegistry.set(currentVersion, metadata);
  }

  public monitorAndReport(
    message: Message,
    expectedSchema: Record<string, any>
  ): {
    driftReport: SchemaDriftReport;
    isCompatible: boolean;
  } {
    const toolName = this.getToolNameFromMessage(message);
    if (!toolName) {
      return {
        driftReport: {
          addedFields: [],
          removedFields: [],
          typeChanges: [],
        },
        isCompatible: true,
      };
    }

    const toolRegistry = this.getOrCreateToolRegistry(toolName);
    const latestMetadata = Array.from(toolRegistry.values()).pop();

    const report: SchemaDriftReport = {
      addedFields: [],
      removedFields: [],
      typeChanges: [],
    };

    if (!latestMetadata) {
      return {
        driftReport: {
          addedFields: [],
          removedFields: [],
          typeChanges: [],
        },
        isCompatible: true,
      };
    }

    const historicalSchema = latestMetadata.schema;
    const currentSchema = expectedSchema;

    // 1. Check for removed fields (present in historical, missing in current)
    for (const field in historicalSchema) {
      if (!(field in currentSchema)) {
        report.removedFields.push(field);
      }
    }

    // 2. Check for added fields (present in current, missing in historical)
    for (const field in currentSchema) {
      if (!(field in historicalSchema)) {
        report.addedFields.push(field);
      }
    }

    // 3. Check for type changes (simplified: comparing structure existence)
    const commonFields = new Set([
      ...Object.keys(historicalSchema),
      ...Object.keys(currentSchema),
    ]);

    for (const field of commonFields) {
      const historicalType = typeof historicalSchema[field];
      const currentType = typeof currentSchema[field];

      if (historicalType !== currentType) {
        report.typeChanges.push({
          field: field,
          expectedType: String(historicalType),
          actualType: String(currentType),
        });
      }
    }

    const isCompatible = report.addedFields.length === 0 &&
      report.removedFields.length === 0 &&
      report.typeChanges.length === 0;

    return {
      driftReport: report,
      isCompatible: isCompatible,
    };
  }
}