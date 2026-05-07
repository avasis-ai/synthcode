export type Message = any;

export interface ToolContext {
  state: Record<string, unknown>;
  messages: Message[];
}

export interface ToolStep {
  name: string;
  description: string;
  execute: (context: ToolContext) => Promise<{ result: unknown; updatedContext: ToolContext }>;
}

export interface CompositeToolDefinition {
  name: string;
  description: string;
  steps: ToolStep[];
}

export class CompositeToolBuilder {
  private definition: {
    name: string;
    description: string;
    steps: ToolStep[];
  } = {
    name: "",
    description: "",
    steps: [],
  };

  constructor(name: string, description: string) {
    this.definition.name = name;
    this.definition.description = description;
  }

  addStep(step: ToolStep): CompositeToolBuilder {
    if (!step.name || !step.execute) {
      throw new Error("ToolStep must have a name and an execute function.");
    }
    this.definition.steps.push(step);
    return this;
  }

  build(): CompositeToolDefinition {
    if (!this.definition.name || !this.definition.description) {
      throw new Error("CompositeToolBuilder requires a name and description.");
    }
    if (this.definition.steps.length === 0) {
      throw new Error("CompositeToolBuilder must add at least one step.");
    }
    return {
      name: this.definition.name,
      description: this.definition.description,
      steps: this.definition.steps,
    };
  }
}

export class CompositeToolExecutor {
  private definition: CompositeToolDefinition;

  constructor(definition: CompositeToolDefinition) {
    this.definition = definition;
  }

  async execute(initialContext: ToolContext): Promise<{ finalResult: unknown; finalContext: ToolContext }> {
    let currentContext: ToolContext = {
      state: { ...initialContext.state },
      messages: [...initialContext.messages],
    };

    let lastResult: unknown = null;

    for (const step of this.definition.steps) {
      try {
        const { result, updatedContext } = await step.execute(currentContext);
        
        lastResult = result;
        currentContext = updatedContext;

        console.log(`[CompositeToolExecutor] Successfully executed step: ${step.name}`);

      } catch (error) {
        console.error(`[CompositeToolExecutor] Failed executing step ${step.name}:`, error);
        throw new Error(`Composite Tool execution failed at step ${step.name}: ${(error as Error).message}`);
      }
    }

    return {
      finalResult: lastResult,
      finalContext: currentContext,
    };
  }
}

export {
  CompositeToolDefinition,
  CompositeToolBuilder,
  CompositeToolExecutor,
}