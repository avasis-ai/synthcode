export type ComponentName = string;

export enum ReplacementStrategy {
  MOCK,
  SKIP,
  REPLACE_WITH_SIMPLE,
}

export interface AblationRule {
  componentName: ComponentName;
  strategy: ReplacementStrategy;
  mockImplementation?: (input: any) => any;
  simpleReplacement?: (input: any) => any;
}

export class ComponentAblationManager {
  private rules: Map<ComponentName, AblationRule> = new Map();

  constructor() {}

  addRule(rule: AblationRule): void {
    if (!rule.componentName) {
      throw new Error("AblationRule must specify a componentName.");
    }
    this.rules.set(rule.componentName, rule);
  }

  getRule(componentName: ComponentName): AblationRule | undefined {
    return this.rules.get(componentName);
  }

  /**
   * Applies the configured ablation rule for a given component.
   * This simulates the interception point in the execution pipeline.
   * @param componentName The name of the component being called.
   * @param input The input arguments passed to the component.
   * @returns The result of the ablation (mocked value, skipped execution, or original result if no rule exists).
   */
  applyAblation(componentName: ComponentName, input: any): any {
    const rule = this.getRule(componentName);

    if (!rule) {
      // No rule defined, execute normally (or return original result)
      return input;
    }

    switch (rule.strategy) {
      case ReplacementStrategy.SKIP:
        // Simulate skipping execution entirely, returning a neutral placeholder.
        console.warn(`[AblationManager] Skipping execution for component: ${componentName}`);
        return null;

      case ReplacementStrategy.MOCK:
        if (rule.mockImplementation) {
          return rule.mockImplementation(input);
        }
        throw new Error(`Ablation rule for ${componentName} requires a mockImplementation.`);

      case ReplacementStrategy.REPLACE_WITH_SIMPLE:
        if (rule.simpleReplacement) {
          return rule.simpleReplacement(input);
        }
        throw new Error(`Ablation rule for ${componentName} requires a simpleReplacement.`);
    }
  }

  /**
   * Clears all registered ablation rules.
   */
  reset(): void {
    this.rules.clear();
  }
}

export { ComponentAblationManager };