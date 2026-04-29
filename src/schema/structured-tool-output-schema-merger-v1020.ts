import { SchemaMerger } from "./schema-merger-base.js";

export type MergeStrategy =
  | "prefer-latest"
  | "prefer-union"
  | "prefer-intersection";

export interface SchemaMergerOptions {
  mergeStrategy: MergeStrategy;
}

export class StructuredToolOutputSchemaMergerV1020 implements SchemaMerger {
  private readonly options: SchemaMergerOptions;

  constructor(options: SchemaMergerOptions) {
    this.options = options;
  }

  merge(schemaA: Record<string, unknown>, schemaB: Record<string, unknown>): Record<string, unknown> {
    const mergedSchema: Record<string, unknown> = { ...schemaA };

    for (const key in schemaB) {
      if (!Object.prototype.hasOwnProperty.call(schemaB, key)) {
        continue;
      }

      const keyB = key;
      const valueB = (schemaB as Record<string, unknown>)[keyB];
      const valueA = (schemaA as Record<string, unknown>)[keyB];

      if (valueA === undefined) {
        mergedSchema[keyB] = valueB;
        continue;
      }

      if (typeof valueA === 'object' && valueA !== null && typeof valueB === 'object' && valueB !== null) {
        if (Array.isArray(valueA) && Array.isArray(valueB)) {
          if (this.options.mergeStrategy === "prefer-union") {
            mergedSchema[keyB] = [...new Set([...valueA, ...valueB])] as unknown;
          } else if (this.options.mergeStrategy === "prefer-intersection") {
            const setA = new Set(valueA);
            const setB = new Set(valueB);
            const intersection = [...setA].filter(item => setB.has(item));
            mergedSchema[keyB] = intersection as unknown;
          } else {
            mergedSchema[keyB] = valueB; // prefer-latest
          }
        } else if (typeof valueA === 'object' && typeof valueB === 'object') {
          if (this.options.mergeStrategy === "prefer-union") {
            const mergedObject: Record<string, unknown> = { ...valueA, ...valueB };
            mergedSchema[keyB] = mergedObject;
          } else if (this.options.mergeStrategy === "prefer-intersection") {
            const intersection: Record<string, unknown> = {};
            const keysA = Object.keys(valueA) as string[];
            const keysB = Object.keys(valueB) as string[];
            const commonKeys = keysA.filter(key => keysB.includes(key));

            for (const commonKey of commonKeys) {
              const valA = (valueA as Record<string, unknown>)[commonKey];
              const valB = (valueB as Record<string, unknown>)[commonKey];
              // Simple intersection for object properties: prefer the one that is more restrictive or just use A's if types match
              intersection[commonKey] = valA;
            }
            mergedSchema[keyB] = intersection;
          } else {
            mergedSchema[keyB] = valueB; // prefer-latest
          }
        } else {
          // Primitive type conflict resolution
          if (this.options.mergeStrategy === "prefer-latest") {
            mergedSchema[keyB] = valueB;
          } else if (this.options.mergeStrategy === "prefer-union") {
            // For primitives, union usually means string concatenation or error, defaulting to string concatenation for simplicity
            mergedSchema[keyB] = `${(valueA as any)} ${valueB}`;
          } else {
            // prefer-intersection for primitives is ambiguous, defaulting to A
            mergedSchema[keyB] = valueA;
          }
        }
      } else {
        // Type mismatch or simple overwrite (prefer-latest behavior)
        mergedSchema[keyB] = valueB;
      }
    }

    return mergedSchema;
  }
}