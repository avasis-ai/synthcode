import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface Constraint {
  key: string;
  value: any;
  source: "initial" | "context";
  decayRate: number;
}

export interface ConstraintSource {
  name: string;
  constraints: Constraint[];
  timestamp: number;
}

export type PropagationRule = (
  sourceConstraints: Constraint[]
) => Constraint[];

export class ContextualConstraintPropagatorV5 {
  private initialConstraints: Constraint[];
  private contextSources: ConstraintSource[];
  private propagationRules: Map<string, PropagationRule>;

  constructor(
    initialConstraints: Constraint[],
    contextSources: ConstraintSource[],
    propagationRules: Map<string, PropagationRule>
  ) {
    this.initialConstraints = initialConstraints;
    this.contextSources = contextSources;
    this.propagationRules = propagationRules;
  }

  private applyDecay(constraints: Constraint[]): Constraint[] {
    const now = Date.now();
    return constraints.map(c => ({
      ...c,
      // Simple decay simulation: reduce value slightly based on time elapsed since source
      value: typeof c.value === 'number' ? Math.max(0, c.value * (1 - c.decayRate * (now / 100000))) : c.value,
    }));
  }

  private mergeConstraints(
    current: Constraint[],
    newConstraints: Constraint[]
  ): Constraint[] {
    const mergedMap = new Map<string, Constraint>();

    // Add existing constraints
    current.forEach(c => mergedMap.set(c.key, c));

    // Merge new constraints, prioritizing newer/stronger ones
    newConstraints.forEach(newC => {
      const existing = mergedMap.get(newC.key);
      if (!existing || newC.source === "context" && newC.decayRate > existing.decayRate) {
        mergedMap.set(newC.key, newC);
      }
    });

    return Array.from(mergedMap.values());
  }

  public propagate(): Constraint[] {
    let propagatedConstraints: Constraint[] = [...this.initialConstraints];

    // 1. Apply decay to initial constraints
    propagatedConstraints = this.applyDecay(propagatedConstraints);

    // 2. Process each context source
    for (const source of this.contextSources) {
      let derivedConstraints: Constraint[] = [];

      // Apply all relevant rules for this source
      for (const [ruleName, rule] of this.propagationRules.entries()) {
        if (ruleName.includes(source.name)) {
          const sourceDerived = rule(source.constraints);
          derivedConstraints = derivedConstraints.concat(sourceDerived);
        }
      }

      // Add source's direct constraints and derived constraints
      const combinedSourceConstraints: Constraint[] = [
        ...source.constraints,
        ...derivedConstraints
      ];

      // Merge into the running total
      propagatedConstraints = this.mergeConstraints(
        propagatedConstraints,
        combinedSourceConstraints
      );
    }

    // Final decay pass
    return this.applyDecay(propagatedConstraints);
  }
}