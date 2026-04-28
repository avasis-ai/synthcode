import { z } from "zod";

export type SchemaDiff = {
  added: { [key: string]: any };
  removed: { [key: string]: any };
  modified: { [key: string]: { old: any; new: any; detail: string } };
};

interface SchemaNode {
  type: "object";
  properties: {
    [key: string]: z.ZodTypeAny;
  };
  required?: string[];
}

export function diffSchemas(
  schemaA: SchemaNode,
  schemaB: SchemaNode
): SchemaDiff {
  const diff: SchemaDiff = {
    added: {},
    removed: {},
    modified: {},
  };

  const propsA = schemaA.properties || {};
  const propsB = schemaB.properties || {};

  const allKeys = new Set<string>([
    ...Object.keys(propsA),
    ...Object.keys(propsB),
  ]);

  for (const key of allKeys) {
    const propA = propsA[key];
    const propB = propsB[key];

    if (!propA && propB) {
      diff.added[key] = propB;
    } else if (propA && !propB) {
      diff.removed[key] = propA;
    } else if (propA && propB) {
      const typeA = propA.constructor.name;
      const typeB = propB.constructor.name;

      if (typeA !== typeB) {
        diff.modified[key] = {
          old: propA,
          new: propB,
          detail: `Type changed from ${typeA} to ${typeB}.`,
        };
        continue;
      }

      if (propA.zodType === propB.zodType) {
        // Simple type check, assuming complex structure comparison is needed for objects
        if (propA.zodType.isObject() && propB.zodType.isObject()) {
          const objSchemaA = propA.zodType.partial().extend({
            properties: propA.zodType.shape,
            required: propA.zodType.shape.required ? propA.zodType.shape.required : undefined,
          }) as unknown as SchemaNode;

          const objSchemaB = propB.zodType.partial().extend({
            properties: propB.zodType.shape,
            required: propB.zodType.shape.required ? propB.zodType.shape.required : undefined,
          }) as unknown as SchemaNode;

          const subDiff = diffSchemas(objSchemaA, objSchemaB);
          if (Object.keys(subDiff.added).length > 0 ||
            Object.keys(subDiff.removed).length > 0 ||
            Object.keys(subDiff.modified).length > 0) {
            diff.modified[key] = {
              old: propA,
              new: propB,
              detail: `Object structure modified. Details: ${JSON.stringify(subDiff)}`,
            };
          }
        }
      }
    }
  }

  return diff;
}