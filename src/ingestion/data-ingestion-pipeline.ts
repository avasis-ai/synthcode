import { type Message } from "./types";

type SchemaDefinition = Record<string, { type: string; required: boolean }>;

interface IngestionContext {
  rawInput: unknown;
  targetSchema: SchemaDefinition;
  intermediateData: Record<string, unknown>;
  errors: string[];
}

interface TransformationResult {
  success: boolean;
  data: Record<string, unknown>;
  errors: string[];
}

type TransformerStep = (context: IngestionContext) => Promise<TransformationResult>;

export class DataIngestionPipeline {
  private steps: TransformerStep[] = [];

  constructor(private initialContext: IngestionContext) {}

  registerStep(step: TransformerStep): this {
    this.steps.push(step);
    return this;
  }

  async execute(): Promise<{ result: Record<string, unknown>; errors: string[] }> {
    let context = {
      ...this.initialContext,
      intermediateData: {},
      errors: [],
    };

    for (const step of this.steps) {
      const result = await step(context);

      if (!result.success) {
        context.errors.push(...result.errors);
      }

      // Merge successful data into the context
      Object.assign(context.intermediateData, result.data);
    }

    return {
      result: context.intermediateData,
      errors: context.errors,
    };
  }
}

export class PipelineBuilder {
  private context: IngestionContext;
  private pipeline: DataIngestionPipeline;

  constructor(rawInput: unknown, targetSchema: SchemaDefinition) {
    this.context = {
      rawInput,
      targetSchema,
      intermediateData: {},
      errors: [],
    };
    this.pipeline = new DataIngestionPipeline(this.context);
  }

  withStep(step: TransformerStep): this {
    this.pipeline.registerStep(step);
    return this;
  }

  async build(): Promise<{ result: Record<string, unknown>; errors: string[] }> {
    return this.pipeline.execute();
  }
}

const jsonParserStep: TransformerStep = async (context) => {
  try {
    const data = typeof context.rawInput === 'string' ? JSON.parse(context.rawInput) : context.rawInput;
    return { success: true, data: data, errors: [] };
  } catch (e) {
    return { success: false, data: {}, errors: [`JSON Parsing Error: ${(e as Error).message}`] };
  }
};

const dataCleanerStep: TransformerStep = async (context) => {
  const cleanedData: Record<string, unknown> = {};
  const errors: string[] = [];

  for (const key in context.targetSchema) {
    const schema = context.targetSchema[key];
    const value = (context.intermediateData as Record<string, unknown>)[key];

    if (schema.required && (value === undefined || value === null || value === '')) {
      errors.push(`Validation Error: Field '${key}' is required but missing.`);
      continue;
    }

    if (value !== undefined && value !== null) {
      // Simple cleaning/type coercion placeholder
      if (schema.type === 'number' && typeof value === 'string') {
        cleanedData[key] = parseFloat(value);
      } else {
        cleanedData[key] = value;
      }
    }
  }

  return { success: errors.length === 0, data: cleanedData, errors };
};

export { DataIngestionPipeline, PipelineBuilder, jsonParserStep, dataCleanerStep };