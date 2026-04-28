import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type SchemaNode = Record<string, any>;

interface DiffReport {
  added: { path: string; description: string; suggestion: string }[];
  removed: { path: string; description: string; suggestion: string }[];
  modified: { path: string; description: string; suggestion: string }[];
}

interface SchemaDiffingService {
  diffSchemas(
    oldSchema: SchemaNode,
    newSchema: SchemaNode,
  ): DiffReport;
}

export class StructuredOutputSchemaDiffingV103Advanced implements SchemaDiffingService {
  diffSchemas(
    oldSchema: SchemaNode,
    newSchema: SchemaNode,
  ): DiffReport {
    const report: DiffReport = {
      added: [],
      removed: [],
      modified: [],
    };

    const traverse = (
      currentPath: string,
      oldNode: any,
      newNode: any,
      report: DiffReport,
    ): void => {
      if (!oldNode && !newNode) {
        return;
      }

      const oldKeys = Object.keys(oldNode || {});
      const newKeys = Object.keys(newNode || {});

      const allKeys = new Set([...oldKeys, ...newKeys]);

      for (const key of allKeys) {
        const newKeyExists = newKeys.includes(key);
        const oldKeyExists = oldKeys.includes(key);
        const path = currentPath ? `${currentPath}.${key}` : key;

        if (!oldKeyExists && newKeyExists) {
          report.added.push({
            path: path,
            description: `Field '${key}' added to the schema.`,
            suggestion: `Update consumers to expect this new field. Consider providing a default value if it is optional.`,
          });
        } else if (oldKeyExists && !newKeyExists) {
          report.removed.push({
            path: path,
            description: `Field '${key}' removed from the schema.`,
            suggestion: `Review downstream services that rely on this field. Deprecate usage or provide a fallback mechanism.`,
          });
        } else if (oldKeyExists && newKeyExists) {
          const oldVal = oldNode[key];
          const newVal = newNode[key];

          if (typeof oldVal === 'object' && oldVal !== null && typeof newVal === 'object' && newVal !== null) {
            if (Array.isArray(oldVal) && Array.isArray(newVal)) {
              // Handle array comparison (assuming homogeneous arrays of objects for simplicity)
              if (oldVal.length !== newVal.length) {
                report.modified.push({
                  path: path,
                  description: `Array length changed from ${oldVal.length} to ${newVal.length}.`,
                  suggestion: `Ensure consumers handle variable array sizes.`,
                });
              }
              // Deep dive into array elements if they are objects
              if (oldVal.length > 0 && typeof oldVal[0] === 'object' && typeof newVal[0] === 'object') {
                traverse(path, oldVal[0], newVal[0], report);
              }
            } else if (typeof oldVal === 'object' && typeof newVal === 'object') {
              // Recurse for object properties
              traverse(path, oldVal, newVal, report);
            } else if (oldVal !== newVal) {
              // Primitive type change or simple value change
              report.modified.push({
                path: path,
                description: `Value or type changed. Old: ${JSON.stringify(oldVal)}, New: ${JSON.stringify(newVal)}.`,
                suggestion: `Verify if the type change (e.g., string to number) is compatible with existing consumers.`,
              });
            }
          } else if (oldVal !== newVal) {
            // Primitive type change
            report.modified.push({
              path: path,
              description: `Value or type changed. Old: ${JSON.stringify(oldVal)}, New: ${JSON.stringify(newVal)}.`,
              suggestion: `Verify if the type change is compatible with existing consumers.`,
            });
          }
        }
      }
    };

    traverse("", oldSchema, newSchema, report);

    return report;
  }
}