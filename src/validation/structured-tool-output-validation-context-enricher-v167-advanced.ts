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

export type ValidationContext = {
  messages: Message[];
  knowledgeGraph: Record<string, any>;
  toolSchemas: Record<string, any>;
};

export interface SchemaDefinition {
  type: string;
  properties: Record<string, any>;
  required: string[];
}

export class StructuredToolOutputValidationContextEnricher {
  private readonly knowledgeGraphQueryService: {
    query: (keys: string[]) => Promise<Record<string, any>>;
  };

  constructor(knowledgeGraphQueryService: {
    query: (keys: string[]) => Promise<Record<string, any>>;
  }) {
    this.knowledgeGraphQueryService = knowledgeGraphQueryService;
  }

  private extractSchemaKeys(schema: SchemaDefinition): string[] {
    if (!schema.properties) {
      return [];
    }
    return Object.keys(schema.properties);
  }

  private buildSemanticConstraint(key: string, schema: SchemaDefinition): string {
    const prop = schema.properties[key];
    if (prop.description && prop.description.includes("relates to")) {
      const match = prop.description.match(/relates to\s+([A-Za-z0-9]+)/i);
      if (match && match[1]) {
        return `Must relate to entity: ${match[1]}`;
      }
    }
    return "";
  }

  private enrichWithSemanticContext(
    context: ValidationContext,
    schema: SchemaDefinition,
  ): Promise<ValidationContext> {
    const keys = this.extractSchemaKeys(schema);
    if (keys.length === 0) {
      return Promise.resolve(context);
    }

    return this.knowledgeGraphQueryService.query(keys).then((kgData) => {
      const enrichedContext: ValidationContext = {
        ...context,
        knowledgeGraph: {
          ...context.knowledgeGraph,
          ...kgData,
        },
      };

      const semanticConstraints: Record<string, string[]> = {};
      keys.forEach((key) => {
        const constraint = this.buildSemanticConstraint(key, schema);
        if (constraint) {
          if (!semanticConstraints[key]) {
            semanticConstraints[key] = [];
          }
          semanticConstraints[key].push(constraint);
        }
      });

      (enrichedContext as any).semanticConstraints = semanticConstraints;
      return enrichedContext;
    });
  }

  public async enrichContext(
    context: ValidationContext,
    schema: SchemaDefinition,
  ): Promise<ValidationContext> {
    return this.enrichWithSemanticContext(context, schema);
  }
}