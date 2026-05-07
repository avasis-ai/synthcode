import { EventEmitter } from 'node:events';

type Schema = Record<string, { type: string; required: boolean }>;
type TemplateDefinition = {
  version: string;
  schema: Schema;
  content: string;
};

type Context = Record<string, any>;

class TemplateLoader {
  private templates: Map<string, TemplateDefinition> = new Map();

  loadTemplate(templateId: string, definition: TemplateDefinition): void {
    if (!definition.version || !definition.schema || !definition.content) {
      throw new Error(`Template definition for ${templateId} is incomplete.`);
    }
    this.templates.set(templateId, definition);
  }

  getTemplate(templateId: string): TemplateDefinition | undefined {
    return this.templates.get(templateId);
  }
}

export class PromptTemplateManager extends EventEmitter {
  private loader: TemplateLoader;

  constructor(loader: TemplateLoader) {
    super();
    this.loader = loader;
  }

  private validateContext(schema: Schema, context: Context): void {
    for (const key in schema) {
      const fieldSchema = schema[key];
      if (fieldSchema.required && !(key in context) || context[key] === null) {
        throw new Error(`Context validation failed: Missing required field '${key}'.`);
      }
    }
  }

  private resolvePlaceholders(content: string, context: Context): string {
    let resolvedContent = content;
    const placeholderRegex = /\$\{(\w+)\}/g;

    resolvedContent = resolvedContent.replace(placeholderRegex, (match, key) => {
      const value = context[key];
      if (value !== undefined && value !== null) {
        return String(value);
      }
      return match;
    });
    return resolvedContent;
  }

  private processConditionals(content: string, context: Context): string {
    let processedContent = content;

    // Simple regex for {% if key %}...{% endif %}
    const ifRegex = /{% if\s*(\w+)\s*%}([\s\S]*?){%\s*endif\s*%}/g;

    processedContent = processedContent.replace(ifRegex, (match, key, blockContent) => {
      const value = context[key];
      if (typeof value === 'boolean' || (typeof value === 'string' && value.toLowerCase() === 'true')) {
        return blockContent.trim();
      }
      return '';
    });

    // Simple regex for {% else %}...{% endif %}
    const elseRegex = /{% else %}([\s\S]*?){%\s*endif\s*%}/g;
    processedContent = processedContent.replace(elseRegex, (match, blockContent) => {
      // This assumes the 'if' block was processed first, and if the 'if' block was empty, we use 'else'.
      // For simplicity, we assume if the key is missing or false, we use the else block.
      // A full implementation would require state tracking.
      return ''; // Simplified: Requires complex parsing for robust else/else if logic.
    });

    return processedContent;
  }

  render(templateId: string, context: Context): string {
    const template = this.loader.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ID '${templateId}' not found.`);
    }

    this.validateContext(template.schema, context);

    let rendered = template.content;

    // 1. Process conditional logic first (removes irrelevant blocks)
    rendered = this.processConditionals(rendered, context);

    // 2. Resolve placeholders in the remaining content
    rendered = this.resolvePlaceholders(rendered, context);

    return rendered.trim();
  }
}