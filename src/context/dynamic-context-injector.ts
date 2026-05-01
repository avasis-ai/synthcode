import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface InjectionRule<T> {
  /**
   * Determines if this rule should be applied based on the current context.
   * @param context The current state context.
   * @returns True if the rule should execute, false otherwise.
   */
  shouldApply(context: Record<string, any>): boolean;

  /**
   * Executes the injection logic.
   * @param context The current state context.
   * @returns The updated context state or a partial update object.
   */
  inject(context: Record<string, any>): Record<string, any>;
}

export class DynamicContextInjector {
  private rules: InjectionRule<any>[];

  constructor(rules: InjectionRule<any>[]) {
    this.rules = rules;
  }

  /**
   * Processes the context through all registered injection rules sequentially.
   * @param initialContext The starting context state.
   * @returns The fully updated context state.
   */
  public injectContext(initialContext: Record<string, any>): Record<string, any> {
    let currentContext: Record<string, any> = { ...initialContext };

    for (const rule of this.rules) {
      if (rule.shouldApply(currentContext)) {
        const updates = rule.inject(currentContext);
        currentContext = {
          ...currentContext,
          ...updates,
        };
      }
    }

    return currentContext;
  }
}