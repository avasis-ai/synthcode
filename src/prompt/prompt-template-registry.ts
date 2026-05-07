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
  | { type: "tool_"; tool_use_id: string };

export interface Schema {
  [key: string]: {
    required: boolean;
    type: "string" | "number" | "boolean" | "object";
  };
}

export interface PromptTemplateDefinition {
  template: string;
  version: string;
  schema: Schema;
}

export class PromptTemplateRegistry {
  private registry: Map<string, Map<string, PromptTemplateDefinition>>;

  constructor() {
    this.registry = new Map();
  }

  registerTemplate(name: string, version: string, definition: PromptTemplateDefinition): void {
    if (!this.registry.has(name)) {
      this.registry.set(name, new Map());
    }
    const nameMap = this.registry.get(name)!;
    nameMap.set(version, definition);
  }

  getTemplate(name: string, version: string): PromptTemplateDefinition | undefined {
    const nameMap = this.registry.get(name);
    return nameMap ? nameMap.get(version) : undefined;
  }

  listVersions(name: string): string[] {
    const nameMap = this.registry.get(name);
    return nameMap ? Array.from(nameMap.keys()) : [];
  }
}

export class PromptValidator {
  private registry: PromptTemplateRegistry;

  constructor(registry: PromptTemplateRegistry) {
    this.registry = registry;
  }

  private validateContext(schema: Schema, context: Record<string, unknown>): { isValid: boolean; missing: string[] } {
    const missing: string[] = [];
    for (const key in schema) {
      const definition = schema[key];
      if (definition.required && !(key in context)) {
        missing.push(key);
      }
    }
    return { isValid: missing.length === 0, missing };
  }

  validateAndAssemble(
    templateName: string,
    templateVersion: string,
    context: Record<string, unknown>
  ): { prompt: string; isValid: boolean; errors: string[] } {
    const definition = this.registry.getTemplate(templateName, templateVersion);

    if (!definition) {
      return { prompt: "", isValid: false, errors: [`Template ${templateName} version ${templateVersion} not found`] };
    }

    const validationResult = this.validateContext(definition.schema, context);

    if (!validationResult.isValid) {
      return { prompt: "", isValid: false, errors: [`Missing required context variables: ${validationResult.missing.join(', ')}`] };
    }

    let assembledPrompt = definition.template;
    
    // Simple placeholder replacement logic: ${variableName}
    for (const key in definition.schema) {
      const placeholder = new RegExp(`\\$\\{${key}\\}`, 'g');
      const value = context[key] !== undefined && context[key] !== null ? String(context[key]) : '';
      assembledPrompt = assembledPrompt.replace(placeholder, value);
    }

    return { prompt: assembledPrompt, isValid: true, errors: [] };
  }
}

export { PromptTemplateRegistry, PromptValidator };