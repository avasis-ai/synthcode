import { SchemaResolver, SchemaContext } from "./schema-resolver-base";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_use"; id: string };

type ConflictResolutionStrategy = "prefer_non_null" | "merge_union" | "fail_fast";

export class ToolOutputSchemaUnionResolverV9 implements SchemaResolver {
  private readonly strategy: ConflictResolutionStrategy;

  constructor(strategy: ConflictResolutionStrategy = "prefer_non_null") {
    this.strategy = strategy;
  }

  resolve(
    unionSchemas: SchemaResolver[],
    context: SchemaContext
  ): Promise<any> {
    if (!unionSchemas || unionSchemas.length === 0) {
      return Promise.resolve(null);
    }

    if (unionSchemas.length === 1) {
      return Promise.resolve(unionSchemas[0].resolve(context));
    }

    return this.resolveUnion(unionSchemas, context);
  }

  private async resolveUnion(
    unionSchemas: SchemaResolver[],
    context: SchemaContext
  ): Promise<any> {
    let resolvedResults: any[] = [];

    for (const schema of unionSchemas) {
      try {
        const result = await schema.resolve(context);
        resolvedResults.push(result);
      } catch (error) {
        if (this.strategy === "fail_fast") {
          throw new Error(`Failed to resolve schema in union: ${error instanceof Error ? error.message : String(error)}`);
        }
        // For other strategies, we log and continue, allowing subsequent schemas to attempt resolution
        console.warn(`Warning: Failed to resolve one schema in union, continuing with fallback strategy. Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    switch (this.strategy) {
      case "fail_fast":
        // This case should ideally be caught in the loop, but for completeness:
        throw new Error("Union resolution failed due to a schema conflict or error.");
      case "prefer_non_null":
        return this.mergeNonNull(resolvedResults);
      case "merge_union":
        return this.mergeUnion(resolvedResults);
      default:
        return this.mergeNonNull(resolvedResults);
    }
  }

  private mergeNonNull(results: any[]): any {
    const merged: Record<string, any> = {};
    for (const result of results) {
      if (typeof result === 'object' && result !== null) {
        Object.keys(result).forEach(key => {
          if (!(key in merged) || merged[key] === null) {
            merged[key] = result[key];
          }
        });
      }
    }
    return merged;
  }

  private mergeUnion(results: any[]): any {
    const merged: Record<string, any> = {};
    let hasContent = false;

    for (const result of results) {
      if (typeof result === 'object' && result !== null) {
        Object.keys(result).forEach(key => {
          if (!(key in merged) || merged[key] === null) {
            merged[key] = result[key];
            hasContent = true;
          }
        });
      }
    }
    return hasContent ? merged : null;
  }
}