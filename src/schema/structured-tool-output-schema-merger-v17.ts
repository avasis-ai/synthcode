import { z, ZodTypeAny, z.ZodError } from "zod";

type SchemaMap = Record<string, z.ZodTypeAny>;

interface ConflictResolver {
  resolve(
    key: string,
    types: z.ZodTypeAny[]
  ): z.ZodTypeAny;
}

interface MergerBuilder {
  withConflictResolver(resolver: ConflictResolver): MergerBuilder;
  build(): SchemaMerger;
}

class SchemaMerger {
  private readonly conflictResolver: ConflictResolver;

  constructor(conflictResolver: ConflictResolver) {
    this.conflictResolver = conflictResolver;
  }

  public merge(schemas: z.ZodTypeAny[]): z.ZodTypeAny {
    if (schemas.length === 0) {
      return z.object({});
    }

    const mergedSchema = this.recursiveMerge(schemas);
    return z.object(mergedSchema);
  }

  private recursiveMerge(schemas: z.ZodTypeAny[]): Record<string, z.ZodTypeAny> {
    const fields: Map<string, z.ZodTypeAny[]> = new Map();

    for (const schema of schemas) {
      if (typeof schema.shape === 'function') {
        const shape = schema.shape();
        for (const [key, value] of Object.entries(shape)) {
          if (typeof value === 'object' && value !== null && 'zodType' in value) {
            const zodType = value.zodType as z.ZodTypeAny;
            if (!fields.has(key)) {
              fields.set(key, [zodType]);
            } else {
              const existingTypes = fields.get(key)!;
              existingTypes.push(zodType);
              fields.set(key, existingTypes);
            }
          }
        }
      }
    }

    const mergedFields: Record<string, z.ZodTypeAny> = {};
    for (const [key, types] of fields.entries()) {
      mergedFields[key] = this.resolveFieldConflict(key, types);
    }
    return mergedFields;
  }

  private resolveFieldConflict(key: string, types: z.ZodTypeAny[]): z.ZodTypeAny {
    if (types.length === 1) {
      return types[0];
    }

    return this.conflictResolver.resolve(key, types);
  }
}

class SchemaMergerBuilder implements MergerBuilder {
  private conflictResolver: ConflictResolver;

  constructor() {
    this.conflictResolver = this.defaultConflictResolver;
  }

  public withConflictResolver(resolver: ConflictResolver): MergerBuilder {
    this.conflictResolver = resolver;
    return this;
  }

  public build(): SchemaMerger {
    return new SchemaMerger(this.conflictResolver);
  }

  private defaultConflictResolver(key: string, types: z.ZodTypeAny[]): z.ZodTypeAny {
    const stringTypes: z.ZodTypeAny[] = [];
    const numberTypes: z.ZodTypeAny[] = [];
    const objectTypes: z.ZodTypeAny[] = [];

    for (const type of types) {
      if (type.zodType === z.string()) {
        stringTypes.push(type);
      } else if (type.zodType === z.number()) {
        numberTypes.push(type);
      } else if (type.zodType === z.object()) {
        objectTypes.push(type);
      }
    }

    if (stringTypes.length > 0 && numberTypes.length > 0) {
      return z.union([z.string(), z.number()]);
    }
    if (stringTypes.length > 0) {
      return z.string();
    }
    if (numberTypes.length > 0) {
      return z.number();
    }
    if (objectTypes.length > 0) {
      // For simplicity, merge nested objects by taking the union of their shapes if possible,
      // but here we default to the first one or union if they are simple enough.
      const firstObject = objectTypes[0];
      return z.object(this.mergeObjectShapes(objectTypes));
    }

    // Fallback: Union of all types
    return z.union(types);
  }

  private mergeObjectShapes(objectTypes: z.ZodTypeAny[]): Record<string, z.ZodTypeAny> {
    const mergedShapes: Map<string, z.ZodTypeAny[]> = new Map();

    for (const type of objectTypes) {
      if (typeof type.shape === 'function') {
        const shape = type.shape();
        for (const [key, value] of Object.entries(shape)) {
          if (typeof value === 'object' && value !== null && 'zodType' in value) {
            const zodType = value.zodType as z.ZodTypeAny;
            if (!mergedShapes.has(key)) {
              mergedShapes.set(key, [zodType]);
            } else {
              const existingTypes = mergedShapes.get(key)!;
              existingTypes.push(zodType);
              mergedShapes.set(key, existingTypes);
            }
          }
        }
      }
    }

    const finalShapes: Record<string, z.ZodTypeAny> = {};
    for (const [key, types] of mergedShapes.entries()) {
      finalShapes[key] = this.defaultConflictResolver(key, types);
    }
    return finalShapes;
  }
}

export const createSchemaMerger = (): MergerBuilder => {
  return new SchemaMergerBuilder();
};