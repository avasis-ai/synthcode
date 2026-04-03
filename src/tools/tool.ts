import type { ZodSchema } from 'zod';
import type { ToolContext } from '../types.js';

/** JSON Schema representation of a tool for LLM function calling APIs. */
export interface APIToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

/** Core tool abstraction that every tool must implement. */
export interface Tool<P = unknown> {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: ZodSchema<P>;
  readonly isReadOnly: boolean;
  readonly isConcurrencySafe: boolean;

  execute(input: P, context: ToolContext): Promise<string>;
  toAPI(): APIToolDefinition;
  toString(input: P): string;
}

/** Configuration object for defining a tool. */
export interface ToolExecuteOptions<P = unknown> {
  name: string;
  description: string;
  inputSchema: ZodSchema<P>;
  isReadOnly?: boolean;
  isConcurrencySafe?: boolean;
  execute: (input: P, context: ToolContext) => Promise<string>;
}

function zodToJsonSchema(schema: unknown): Record<string, unknown> {
  const s = schema as { _def: Record<string, unknown> };
  const def = s._def;
  const typeName = def.typeName as string;
  const description = def.description as string | undefined;

  const base: Record<string, unknown> = {};
  if (description) base.description = description;

  switch (typeName) {
    case 'ZodString':
      return { ...base, type: 'string' };
    case 'ZodNumber':
      return { ...base, type: 'number' };
    case 'ZodBoolean':
      return { ...base, type: 'boolean' };
    case 'ZodNull':
      return { ...base, type: 'null' };
    case 'ZodArray': {
      const items = zodToJsonSchema(def.element);
      return { ...base, type: 'array', items };
    }
    case 'ZodObject': {
      const shapeFn = def.shape as () => Record<string, unknown>;
      const shape = shapeFn();
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [key, value] of Object.entries(shape)) {
        properties[key] = zodToJsonSchema(value);
        const propDef = (value as { _def: Record<string, unknown> })._def;
        if (
          propDef.typeName !== 'ZodOptional' &&
          propDef.typeName !== 'ZodNullish' &&
          propDef.typeName !== 'ZodDefault'
        ) {
          required.push(key);
        }
      }
      const result: Record<string, unknown> = { ...base, type: 'object', properties };
      if (required.length > 0) result.required = required;
      return result;
    }
    case 'ZodEnum':
      return { ...base, enum: def.values };
    case 'ZodLiteral':
      return { ...base, const: def.value };
    case 'ZodUnion': {
      const options = (def.options as unknown[]).map((o) => zodToJsonSchema(o));
      return { ...base, anyOf: options };
    }
    case 'ZodDiscriminatedUnion': {
      const options = (def.options as unknown[]).map((o) => zodToJsonSchema(o));
      return { ...base, anyOf: options };
    }
    case 'ZodOptional':
      return zodToJsonSchema(def.innerType);
    case 'ZodNullable': {
      const inner = zodToJsonSchema(def.innerType);
      inner.nullable = true;
      return inner;
    }
    case 'ZodNullish': {
      const inner = zodToJsonSchema(def.innerType);
      inner.nullable = true;
      return inner;
    }
    case 'ZodDefault':
      return zodToJsonSchema(def.innerType);
    case 'ZodRecord': {
      const valueSchema = zodToJsonSchema(def.valueType);
      return { ...base, type: 'object', additionalProperties: valueSchema };
    }
    case 'ZodTuple': {
      const items = (def.items as unknown[]).map((o) => zodToJsonSchema(o));
      return { ...base, type: 'array', items, minItems: items.length, maxItems: items.length };
    }
    case 'ZodEffects': {
      return zodToJsonSchema(def.innerType);
    }
    case 'ZodAny':
      return {};
    case 'ZodUnknown':
      return {};
    case 'ZodVoid':
      return { ...base, type: 'null' };
    case 'ZodNever':
      return { ...base, not: {} };
    default:
      return { ...base, type: 'string' };
  }
}

/** Define a tool from a configuration object. */
export function defineTool<P = unknown>(config: ToolExecuteOptions<P>): Tool<P> {
  const tool: Tool<P> = {
    name: config.name,
    description: config.description,
    inputSchema: config.inputSchema,
    isReadOnly: config.isReadOnly ?? false,
    isConcurrencySafe: config.isConcurrencySafe ?? false,
    execute: config.execute,
    toAPI(): APIToolDefinition {
      return {
        name: config.name,
        description: config.description,
        input_schema: zodToJsonSchema(config.inputSchema),
      };
    },
    toString(input: P): string {
      const entries = Object.entries(input as Record<string, unknown>)
        .map(([k, v]) => {
          if (typeof v === 'string') return `${k}: "${v}"`;
          if (v === undefined) return `${k}: undefined`;
          if (v === null) return `${k}: null`;
          return `${k}: ${String(v)}`;
        })
        .join(', ');
      return `${config.name}({ ${entries} })`;
    },
  };
  return tool;
}

/** Wrap a class-based tool into the standard Tool interface. */
export function defineToolFromClass(ctor: new () => Tool): Tool {
  const instance = new ctor();
  return {
    name: instance.name,
    description: instance.description,
    inputSchema: instance.inputSchema,
    isReadOnly: instance.isReadOnly,
    isConcurrencySafe: instance.isConcurrencySafe,
    execute: (input, context) => instance.execute(input, context),
    toAPI: () => instance.toAPI(),
    toString: (input) => instance.toString(input),
  };
}
