import { z, ZodError } from "zod";

type SchemaMergerError = {
  field: string;
  message: string;
};

export class SchemaMerger {
  private readonly targetSchema: z.ZodTypeAny;

  constructor(targetSchema: z.ZodTypeAny) {
    this.targetSchema = targetSchema;
  }

  private validateAndMergeValue(
    currentValue: unknown,
    newValue: unknown
  ): unknown {
    if (newValue === null || newValue === undefined) {
      return currentValue;
    }
    if (currentValue === null || currentValue === undefined) {
      return newValue;
    }
    // Simple type check for primitives, otherwise assume deep merge is needed
    const currentType = typeof currentValue;
    const newType = typeof newValue;

    if (currentType !== newType) {
      // Type mismatch, prioritize the new value if it's more complete,
      // but for simplicity here, we'll just take the new value if it's not null/undefined.
      return newValue;
    }

    if (currentType === "object" && !Array.isArray(currentValue) && !Array.isArray(newValue)) {
      return { ...currentValue, ...newValue } as unknown as unknown;
    }

    // For primitives or arrays, prioritize non-empty/non-null
    if (typeof currentValue === "string" && currentValue.trim() !== "" && typeof newValue === "string" && newValue.trim() !== "") {
      return `${currentValue} ${newValue}`.trim();
    }

    return newValue;
  }

  private mergeObject(
    current: Record<string, unknown>,
    next: Record<string, unknown>
  ): Record<string, unknown> {
    const merged: Record<string, unknown> = { ...current };
    for (const key in next) {
      if (Object.prototype.hasOwnProperty.call(next, key)) {
        const nextValue = next[key];
        const currentValue = current[key];

        if (typeof nextValue === "object" && nextValue !== null && !Array.isArray(nextValue) &&
          typeof currentValue === "object" && currentValue !== null && !Array.isArray(currentValue)) {
          (merged[key] as Record<string, unknown>) = this.mergeObject(
            (currentValue as Record<string, unknown>),
            (nextValue as Record<string, unknown>)
          );
        } else {
          merged[key] = this.validateAndMergeValue(currentValue, nextValue);
        }
      }
    }
    return merged;
  }

  public merge(outputs: unknown[], targetSchema: z.ZodTypeAny): { mergedObject: unknown; errors: SchemaMergerError[] } {
    if (!Array.isArray(outputs) || outputs.length === 0) {
      return { mergedObject: undefined, errors: [] };
    }

    let accumulatedObject: Record<string, unknown> = {};

    for (const output of outputs) {
      if (typeof output !== "object" || output === null) {
        continue;
      }

      if (Array.isArray(output)) {
        // Handle array merging if the schema expects an array of objects
        // This is a simplification; real merging for arrays is complex.
        // We'll treat the first element as the base for merging properties.
        if (output.length > 0 && typeof output[0] === 'object' && output[0] !== null) {
            const firstItem = output[0] as Record<string, unknown>;
            if (typeof accumulatedObject[Object.keys(accumulatedObject)[0]] === 'undefined') {
                // Initialize array structure if needed
                (accumulatedObject as any)[Object.keys(accumulatedObject)[0]] = [firstItem];
            } else {
                // Append/Merge logic for arrays would go here
            }
        }
        continue;
      }

      const outputObject = output as Record<string, unknown>;
      accumulatedObject = this.mergeObject(accumulatedObject, outputObject);
    }

    try {
      const validatedObject = this.targetSchema.parse(accumulatedObject);
      return { mergedObject: validatedObject, errors: [] };
    } catch (e) {
      const zodError = e as ZodError;
      const errors: SchemaMergerError[] = zodError.errors.map(err => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return { mergedObject: undefined, errors };
    }
  }
}