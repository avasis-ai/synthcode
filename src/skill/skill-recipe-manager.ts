export type Message = any;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: any[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = any;

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

export type AgentContext = {
  history: Message[];
  state: Record<string, unknown>;
  resources: Record<string, boolean>;
};

export interface RecipeStep {
  toolName: string;
  requiredInputs: Record<string, { source: "context" | "user" | "step_output"; description: string }>;
  validationRules: (context: AgentContext, inputs: Record<string, unknown>) => boolean;
  onSuccess: (output: Record<string, unknown>) => Record<string, unknown>;
}

export interface SkillRecipe {
  version: string;
  name: string;
  prerequisites: {
    resources: Record<string, boolean>;
    contextChecks: (context: AgentContext) => boolean;
  };
  steps: RecipeStep[];
}

export class SkillRecipeManager {
  private registry: Map<string, SkillRecipe> = new Map();

  registerRecipe(recipe: SkillRecipe): void {
    const key = `${recipe.name}@${recipe.version}`;
    if (this.registry.has(key)) {
      throw new Error(`Recipe ${key} is already registered.`);
    }
    this.registry.set(key, recipe);
  }

  getRecipe(name: string, version: string): SkillRecipe | undefined {
    return this.registry.get(`${name}@${version}`);
  }

  async executeRecipe(
    recipeName: string,
    recipeVersion: string,
    initialContext: AgentContext,
    toolExecutor: (toolName: string, inputs: Record<string, unknown>) => Promise<Record<string, unknown>>
  ): Promise<{ finalContext: AgentContext; output: Record<string, unknown> }> {
    const recipe = this.getRecipe(recipeName, recipeVersion);
    if (!recipe) {
      throw new Error(`Recipe ${recipeName}@${recipeVersion} not found.`);
    }

    // 1. Context Validation
    if (!recipe.prerequisites.contextChecks(initialContext)) {
      throw new Error("Context prerequisites failed for the recipe.");
    }
    for (const [resource, required] of Object.entries(recipe.prerequisites.resources)) {
      if (required && !initialContext.resources[resource]) {
        throw new Error(`Resource ${resource} is required but unavailable.`);
      }
    }

    let currentContext: AgentContext = {
      ...initialContext,
      state: { ...initialContext.state }
    };
    let finalOutput: Record<string, unknown> = {};

    // 2. Step Execution
    for (const step of recipe.steps) {
      // Input gathering and validation
      const gatheredInputs: Record<string, unknown> = {};
      for (const [inputKey, definition] of Object.entries(step.requiredInputs)) {
        let value: unknown;
        if (definition.source === "context") {
          value = currentContext.state[inputKey];
        } else if (definition.source === "user") {
          // Simplified: assumes user input is passed separately or is in the context
          value = initialContext.history.find(m => m.role === 'user')?.content || null;
        } else if (definition.source === "step_output") {
          // Look for the output of the previous step
          value = finalOutput[inputKey];
        }
        gatheredInputs[inputKey] = value;
      }

      if (!step.validationRules(currentContext, gatheredInputs)) {
        throw new Error(`Validation failed for step: ${step.toolName}`);
      }

      // Tool Execution
      const stepOutput = await toolExecutor(step.toolName, gatheredInputs);

      // State Update and Context Propagation
      finalOutput = step.onSuccess(stepOutput);
      currentContext.state = { ...currentContext.state, ...finalOutput };
    }

    return { finalContext: currentContext, output: finalOutput };
  }
}