import { Message, UserMessage, AssistantMessage, ToolResultMessage } from "./message-types";

export type SchemaDiffReport = {
  diffs: string[];
  isDifferent: boolean;
};

export interface SchemaDefinition {
  type: "object";
  properties: Record<string, SchemaDefinition>;
  required?: string[];
}

export class StructuredToolOutputSchemaDiffer {
  private readonly currentSchema: SchemaDefinition;
  private readonly expectedSchema: SchemaDefinition;

  constructor(currentSchema: SchemaDefinition, expectedSchema: SchemaDefinition) {
    this.currentSchema = currentSchema;
    this.expectedSchema = expectedSchema;
  }

  public diffSchemas(): SchemaDiffReport {
    const diffs: string[] = [];
    const report = this.compare(
      "Root",
      this.currentSchema,
      this.expectedSchema
    );
    diffs.push(report);

    return {
      diffs: diffs,
      isDifferent: diffs.some(d => d.includes("Difference detected")) || diffs.some(d => d.includes("Structural change")),
    };
  }

  private compare(
    path: string,
    current: SchemaDefinition,
    expected: SchemaDefinition
  ): string {
    let diffs: string[] = [];

    if (current.type !== expected.type) {
      diffs.push(`Type mismatch at ${path}: Changed from ${current.type} to ${expected.type}.`);
    }

    const currentProps = current.properties || {};
    const expectedProps = expected.properties || {};

    // Check for removed fields
    for (const key in currentProps) {
      if (!(key in expectedProps)) {
        diffs.push(`Structural change at ${path}.${key}: Field was removed.`);
      } else {
        // Check for property changes
        const currentProp = currentProps[key];
        const expectedProp = expectedProps[key];

        if (currentProp.type !== expectedProp.type) {
          diffs.push(`Field type change at ${path}.${key}: Changed from ${currentProp.type} to ${expectedProp.type}.`);
        }

        if (currentProp.properties && expectedProp.properties) {
          diffs.push(
            this.compare(
              `${path}.${key}`,
              currentProp,
              expectedProp
            )
          );
        }
      }
    }

    // Check for added fields
    for (const key in expectedProps) {
      if (!(key in currentProps)) {
        diffs.push(`Structural change at ${path}.${key}: Field was added.`);
      }
    }

    // Check for required field changes (simplified check)
    const currentRequired = current.required || [];
    const expectedRequired = expected.required || [];
    const missingRequired = expectedRequired.filter(req => !currentRequired.includes(req));
    const extraRequired = currentRequired.filter(req => !expectedRequired.includes(req));

    if (missingRequired.length > 0) {
      diffs.push(`Required field change at ${path}: Added required fields: ${missingRequired.join(', ')}.`);
    }
    if (extraRequired.length > 0) {
      diffs.push(`Required field change at ${path}: Removed required fields: ${extraRequired.join(', ')}.`);
    }

    return diffs.join(' | ');
  }
}