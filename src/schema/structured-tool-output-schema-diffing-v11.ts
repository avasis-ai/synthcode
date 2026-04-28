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

export type SchemaDiffReport = {
  Added: { [key: string]: { description: string; type: any } };
  Removed: { [key: string]: { description: string; type: any } };
  ChangedType: { [key: string]: { oldType: any; newType: any; description: string } };
  SemanticChange: { [key: string]: { oldDescription: string; newDescription: string } };
  // Add other potential changes like required status changes if needed
};

export type Schema = Record<string, {
  description: string;
  type: any;
  required?: boolean;
  properties?: Record<string, {
    description: string;
    type: any;
    required?: boolean;
    properties?: Record<string, {
      description: string;
      type: any;
      required?: boolean;
      properties?: Record<string, {
        description: string;
        type: any;
        required?: boolean;
      }};
    }>;
  }>;

interface DiffContext {
  report: SchemaDiffReport;
}

type SchemaDiffingFunction = (
  context: DiffContext;
  oldSchema: any;
  newSchema: any
) => void;

const compareProperties = (
  context: DiffContext;
  oldProps: Record<string, any>;
  newProps: Record<string, any>;
  path: string
): void => {
  const oldKeys = Object.keys(oldProps);
  const newKeys = Object.keys(newProps);

  // Check for Added and Changed/Same
  for (const key of newKeys) {
    const newProp = newProps[key];
    const oldProp = oldProps[key];

    if (!oldProp) {
      context.report.Added[key] = {
        description: newProp.description || "",
        type: newProp.type,
      };
      continue;
    }

    // Check for Type Change
    if (oldProp.type !== newProp.type) {
      context.report.ChangedType[key] = {
        oldType: oldProp.type,
        newType: newProp.type,
        description: `Type changed from ${oldProp.type} to ${newProp.type}`,
      };
    }

    // Check for Semantic Change
    if (oldProp.description !== newProp.description) {
      context.report.SemanticChange[key] = {
        oldDescription: oldProp.description || "",
        newDescription: newProp.description || "",
      };
    }

    // Recurse into nested properties
    if (oldProp.properties && newProp.properties) {
      compareProperties(
        context,
        oldProp.properties,
        newProp.properties,
        `${path}.${key}`
      );
    }
  }

  // Check for Removed
  for (const key of oldKeys) {
    if (!newProps[key]) {
      const oldProp = oldProps[key];
      context.report.Removed[key] = {
        description: oldProp.description || "",
        type: oldProp.type,
      };
    }
  }
};

const compareSchemas = (
  oldSchema: Schema,
  newSchema: Schema
): SchemaDiffReport => {
  const context: DiffContext = {
    report: {
      Added: {} as Record<string, { description: string; type: any }>,
      Removed: {} as Record<string, { description: string; type: any }>,
      ChangedType: {} as Record<string, { oldType: any; newType: any; description: string }>,
      SemanticChange: {} as Record<string, { oldDescription: string; newDescription: string }>,
    },
  };

  // Assuming the top level schema properties are the main fields to compare
  compareProperties(context, oldSchema, newSchema, "root");

  return context.report;
};

export const diffStructuredToolOutputSchema = (
  oldSchema: Schema,
  newSchema: Schema
): SchemaDiffReport => {
  return compareSchemas(oldSchema, newSchema);
};