import { z } from "zod";

export type SchemaDiff = {
  diff: {
    added: { [key: string]: any };
    removed: { [key: string]: any };
    changed: {
      [key: string]: {
        old: any;
        new: any;
        description: string;
      };
    };
  };
};

type ComparisonStrategy = "strict" | "lenient";

interface SchemaDiffOptions {
  strategy: ComparisonStrategy;
}

export function diffSchemas<T extends z.ZodTypeAny>(
  schemaA: T,
  schemaB: T,
  options: SchemaDiffOptions = { strategy: "strict" }
): SchemaDiff {
  const diff: {
    added: { [key: string]: any };
    removed: { [key: string]: any };
    changed: {
      [key: string]: {
        old: any;
        new: any;
        description: string;
      };
    };
  } = {
    added: {},
    removed: {},
    changed: {},
  };

  const getKeys = (schema: T): string[] => {
    if (schema.shape) {
      return Object.keys(schema.shape).filter(key => key !== "_def");
    }
    return [];
  };

  const keysA = getKeys(schemaA);
  const keysB = getKeys(schemaB);

  const allKeys = new Set([...keysA, ...keysB]);

  for (const key of allKeys) {
    const hasA = keysA.includes(key);
    const hasB = keysB.includes(key);

    if (!hasA && hasB) {
      diff.added[key] = { schema: schemaB.shape[key], type: "field" };
    } else if (hasA && !hasB) {
      diff.removed[key] = { schema: schemaA.shape[key], type: "field" };
    } else if (hasA && hasB) {
      const schemaAField = schemaA.shape[key];
      const schemaBField = schemaB.shape[key];

      if (schemaAField && schemaBField) {
        const fieldDiff = compareSchemaFields(
          key,
          schemaAField,
          schemaBField,
          options.strategy
        );
        if (fieldDiff) {
          diff.changed[key] = fieldDiff;
        }
      }
    }
  }

  return { diff };
}

function compareSchemaFields(
  key: string,
  schemaA: z.ZodTypeAny,
  schemaB: z.ZodTypeAny,
  strategy: ComparisonStrategy
): {
  old: any;
  new: any;
  description: string;
} | null {
  const oldType = schemaA.constructor.name;
  const newType = schemaB.constructor.name;

  let description = "";
  let changed = false;

  if (oldType !== newType) {
    description = `Type changed from ${oldType} to ${newType}.`;
    changed = true;
  } else {
    // Deeper comparison for complex types (e.g., object, array)
    if (schemaA.shape && schemaB.shape) {
      const subDiff = diffSchemas(schemaA, schemaB, { strategy });
      if (Object.keys(subDiff.diff.changed).length > 0) {
        description = "Nested object structure changed.";
        changed = true;
      }
    } else if (schemaA.zodType === z.string() && schemaB.zodType === z.string()) {
      // Simple string comparison might be needed if constraints were added/removed
      // For simplicity, we rely on the type name change for now.
    }
  }

  if (changed) {
    return {
      old: schemaA,
      new: schemaB,
      description: description,
    };
  }

  return null;
}