import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./message-types";

export type SchemaDiffReport = {
  addedFields: { [key: string]: { description: string; type: any } };
  deletedFields: { [key: string]: { description: string; type: any } };
  modifiedFields: {
    [key: string]: {
      oldType: any;
      newType: any;
      description: string;
      diff: {
        type: "typeChange" | "structureChange" | "requiredChange";
        details: string;
      };
    };
  };
};

export type Schema = {
  type: "object";
  properties: {
    [key: string]: {
      type: "string" | "number" | "boolean" | "array" | "object";
      description: string;
      required?: boolean;
      items?: Schema;
      properties?: {
        [key: string]: {
          type: "string" | "number" | "boolean" | "array" | "object";
          description: string;
          required?: boolean;
          items?: Schema;
          properties?: {
            [key: string]: {
              type: "string" | "number" | "boolean" | "array" | "object";
              description: string;
              required?: boolean;
              items?: Schema;
            };
          };
        };
      };
    };
  };
};

export class SchemaDiffingUtility {
  private readonly initialReport: SchemaDiffReport = {
    addedFields: {},
    deletedFields: {},
    modifiedFields: {},
  };

  private getPrimitiveType(schema: Schema): "string" | "number" | "boolean" | "array" | "object" {
    return schema.type || "unknown";
  }

  private compareProperties(
    propsA: { [key: string]: any },
    propsB: { [key: string]: any },
    path: string,
    report: SchemaDiffReport
  ): void {
    const keysA = Object.keys(propsA);
    const keysB = Object.keys(propsB);

    const allKeys = new Set([...keysA, ...keysB]);

    for (const key of allKeys) {
      const currentPath = `${path}.${key}`;
      const propA = propsA[key];
      const propB = propsB[key];

      if (!propA && propB) {
        report.addedFields[key] = {
          description: propB.description || "No description provided",
          type: propB.type,
        };
      } else if (propA && !propB) {
        report.deletedFields[key] = {
          description: propA.description || "No description provided",
          type: propA.type,
        };
      } else if (propA && propB) {
        const typeA = this.getPrimitiveType(propA);
        const typeB = this.getPrimitiveType(propB);

        if (typeA !== typeB) {
          report.modifiedFields[key] = {
            oldType: typeA,
            newType: typeB,
            description: propB.description || "Type changed",
            diff: {
              type: "typeChange",
              details: `Type changed from ${typeA} to ${typeB}`,
            },
          };
        } else if (typeA === "object") {
          const propsAObj = propA.properties;
          const propsBObj = propB.properties;

          if (propsAObj && propsBObj) {
            this.compareProperties(
              propsAObj,
              propsBObj,
              currentPath,
              report
            );
          }
        } else if (typeA === "array") {
          const itemsA = propA.items;
          const itemsB = propB.items;

          if (itemsA && itemsB) {
            // Simplified array item comparison: only check type change
            const typeChange = itemsA.type !== itemsB.type;
            if (typeChange) {
              report.modifiedFields[key] = {
                oldType: itemsA.type,
                newType: itemsB.type,
                description: propB.description || "Array item type changed",
                diff: {
                  type: "typeChange",
                  details: `Array item type changed from ${itemsA.type} to ${itemsB.type}`,
                },
              };
            }
          }
        }
      }
    }
  }

  public calculateDiff(schemaA: Schema, schemaB: Schema): SchemaDiffReport {
    const report: SchemaDiffReport = {
      addedFields: {},
      deletedFields: {},
      modifiedFields: {},
    };

    if (schemaA.type !== "object" || schemaB.type !== "object") {
      throw new Error("Both schemas must be top-level objects for comparison.");
    }

    this.compareProperties(
      schemaA.properties,
      schemaB.properties,
      "root",
      report
    );

    return report;
  }
}

export { SchemaDiffingUtility };