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
  path: string;
  diff: {
    type: "type";
    old: unknown;
    new: unknown;
  } | {
    type: "required";
    old: boolean;
    new: boolean;
  } | {
    type: "structure";
    old: Record<string, any>;
    new: Record<string, any>;
  } | {
    type: "missing";
    message: string;
  } | {
    type: "extra";
    message: string;
  };
};

export interface SchemaDiffingService {
  diffSchemas(
    oldSchema: Record<string, any>,
    newSchema: Record<string, any>
  ): SchemaDiffReport[];
}

export class StructuredToolOutputSchemaDiffingV126 implements SchemaDiffingService {
  diffSchemas(
    oldSchema: Record<string, any>,
    newSchema: Record<string, any>
  ): SchemaDiffReport[] {
    const diffs: SchemaDiffReport[] = [];
    this.compareObjectSchemas(
      oldSchema,
      newSchema,
      "",
      diffs
    );
    return diffs;
  }

  private compareObjectSchemas(
    oldSchema: Record<string, any>,
    newSchema: Record<string, any>,
    path: string,
    diffs: SchemaDiffReport[]
  ): void {
    const oldKeys = Object.keys(oldSchema);
    const newKeys = Object.keys(newSchema);
    const allKeys = new Set([...oldKeys, ...newKeys]);

    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const oldProp = oldSchema[key];
      const newProp = newSchema[key];

      if (oldProp === undefined && newProp === undefined) continue;

      if (oldProp === undefined) {
        diffs.push({
          path: currentPath,
          diff: {
            type: "extra",
            message: `Field '${key}' exists in the old schema but is missing in the new schema.`,
          },
        });
      } else if (newProp === undefined) {
        diffs.push({
          path: currentPath,
          diff: {
            type: "missing",
            message: `Field '${key}' exists in the new schema but was missing in the old schema.`,
          },
        });
      } else {
        if (typeof oldProp !== typeof newProp) {
          diffs.push({
            path: currentPath,
            diff: {
              type: "type",
              old: oldProp,
              new: newProp,
            },
          });
        } else if (typeof oldProp === 'object' && oldProp !== null && typeof newProp === 'object' && newProp !== null) {
          if (oldProp.$ref && newProp.$ref) {
            // Simple reference comparison (could be enhanced)
            if (oldProp.$ref !== newProp.$ref) {
              diffs.push({
                path: currentPath,
                diff: {
                  type: "type",
                  old: oldProp.$ref,
                  new: newProp.$ref,
                },
              });
            }
          } else if (oldProp.properties && newProp.properties) {
            this.compareObjectSchemas(
              oldProp.properties,
              newProp.properties,
              currentPath,
              diffs
            );
          } else if (oldProp.items && newProp.items) {
            // Array item comparison (simplified)
            if (typeof oldProp.items !== 'object' || typeof newProp.items !== 'object') {
                diffs.push({
                    path: currentPath,
                    diff: {
                        type: "type",
                        old: oldProp.items,
                        new: newProp.items,
                    }
                });
            } else {
                this.compareObjectSchemas(
                    oldProp.items,
                    newProp.items,
                    currentPath,
                    diffs
                );
            }
          } else if (oldProp.required !== undefined && newProp.required !== undefined) {
            const oldRequired = oldProp.required as string[];
            const newRequired = newProp.required as string[];

            const oldSet = new Set(oldRequired);
            const newSet = new Set(newRequired);

            const missingInNew = oldRequired.filter(
              (key) => !newSet.has(key)
            );
            const addedInNew = newRequired.filter(
              (key) => !oldSet.has(key)
            );

            if (missingInNew.length > 0 || addedInNew.length > 0) {
                diffs.push({
                    path: currentPath,
                    diff: {
                        type: "required",
                        old: oldRequired,
                        new: newRequired,
                    },
                });
            }
          }
        }
      }
    }
  }
}