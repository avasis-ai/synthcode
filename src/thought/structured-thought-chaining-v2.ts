import { Message, ContentBlock, ThinkingBlock, ToolUseBlock, TextBlock } from "./types";

export interface ValidationSchema {
  [key: string]: any;
}

export interface ThoughtStep {
  id: string;
  description: string;
  dependencies: string[];
  validationSchema: ValidationSchema;
  execute: (context: Record<string, any>) => Promise<{ result: any; contextUpdate: Record<string, any> }>;
}

export class StructuredThoughtChainer {
  private steps: ThoughtStep[];

  constructor(steps: ThoughtStep[]) {
    this.steps = steps;
  }

  private getExecutionOrder(steps: ThoughtStep[]): string[] {
    const stepMap = new Map<string, ThoughtStep>(steps.map(step => [step.id, step]));
    const executionOrder: string[] = [];
    const completedIds = new Set<string>();
    const pendingIds = new Set<string>(steps.map(step => step.id));

    while (completedIds.size < steps.length) {
      let foundNext = false;
      for (const step of steps) {
        if (!completedIds.has(step.id)) {
          const dependenciesMet = step.dependencies.every(depId => completedIds.has(depId));
          if (dependenciesMet) {
            executionOrder.push(step.id);
            completedIds.add(step.id);
            pendingIds.delete(step.id);
            foundNext = true;
            break;
          }
        }
      }
      if (!foundNext && completedIds.size < steps.length) {
        throw new Error("Circular dependency detected or unresolvable dependency graph.");
      }
    }
    return executionOrder;
  }

  public async chainThoughts(initialContext: Record<string, any>): Promise<{ finalContext: Record<string, any>; results: { stepId: string; result: any }[] }> {
    const orderedIds = this.getExecutionOrder(this.steps);
    let currentContext = { ...initialContext };
    const results: { stepId: string; result: any }[] = [];

    for (const stepId of orderedIds) {
      const step = this.steps.find(s => s.id === stepId)!;

      // 1. Dependency Validation (Implicitly handled by ordering, but we validate context availability)
      for (const depId of step.dependencies) {
        if (!(depId in currentContext)) {
          throw new Error(`Dependency missing for step ${stepId}: Required context key '${depId}' not found.`);
        }
      }

      // 2. Execute Step
      const executionResult = await step.execute(currentContext);
      const result = executionResult.result;
      const contextUpdate = executionResult.contextUpdate;

      // 3. Context Update
      currentContext = { ...currentContext, ...contextUpdate };

      // 4. Validation (Schema check placeholder)
      // In a real scenario, we would validate 'result' against 'step.validationSchema'
      // For this implementation, we assume successful execution implies validity if the schema check passes.
      if (Object.keys(step.validationSchema).length > 0) {
        // Placeholder for actual schema validation logic (e.g., using Zod or Joi)
        // if (!isValid(result, step.validationSchema)) {
        //   throw new Error(`Validation failed for step ${stepId} against schema.`);
        // }
      }

      results.push({ stepId: stepId, result: result });
    }

    return { finalContext: currentContext, results };
  }
}