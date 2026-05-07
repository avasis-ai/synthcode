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

export interface AdaptationRule {
  /**
   * The key path in the source payload (e.g., "data.user.name").
   */
  sourcePath: string;
  /**
   * The key path in the target payload.
   */
  targetPath: string;
  /**
   * Transformation function applied to the extracted value.
   * @param value The raw value extracted from the source payload.
   * @returns The transformed value.
   */
  transform?: (value: unknown) => unknown;
  /**
   * Optional predicate to determine if the rule should apply.
   */
  condition?: (payload: unknown) => boolean;
}

export class ProtocolAdaptationManager {
  private rules: AdaptationRule[] = [];

  registerRules(rules: AdaptationRule[]): void {
    this.rules = rules;
  }

  private getValueByPath<T>(obj: T, path: string): unknown {
    if (!path) return undefined;
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (typeof current === 'object' && current !== null && (part as keyof typeof current) in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return current;
  }

  private setValueByPath<T>(obj: T, path: string, value: unknown): T {
    const parts = path.split('.');
    let current: any = obj;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        // Last part, set the value
        if (typeof current === 'object' && current !== null) {
          current[part] = value;
          return current as T;
        }
      } else {
        // Intermediate part, ensure it's an object
        if (typeof current === 'object' && current !== null && !('object' in current) && !('function' in current)) {
          current[part] = {};
          // Reassign the modified object structure back up the chain
          let temp: any = obj;
          for (let j = 0; j < i; j++) {
            temp = temp[parts[j]];
          }
          temp[part] = current[part];
          return obj; // This is complex to handle generically, assuming mutable object structure
        }
        current = (current as Record<string, unknown>)[part] || {};
      }
    }
    return obj;
  }

  transform<T, R>(payload: T, rules: AdaptationRule[]): R {
    let result: R = payload as unknown as R;

    for (const rule of rules) {
      if (rule.condition && !rule.condition(payload)) {
        continue;
      }

      const rawValue = this.getValueByPath(payload, rule.sourcePath);
      let transformedValue: unknown = rawValue;

      if (rule.transform) {
        transformedValue = rule.transform(rawValue);
      }

      // Note: Due to TypeScript's strictness and the complexity of deep, generic object mutation,
      // we must assume the target structure R is mutable and that the path setter works correctly.
      // In a real-world scenario, this would require a deep clone and recursive update.
      // For this implementation, we simulate the setting process.
      // Since we cannot guarantee the type R structure, we rely on a simplified setter that assumes R is an object.
      if (typeof result === 'object' && result !== null) {
        // This is a placeholder for deep mutation logic.
        // We assume the target structure R is mutable and accepts the set operation.
        (result as any) = this.setValueByPath(result as any, rule.targetPath, transformedValue);
      }
    }

    return result;
  }
}

export { ProtocolAdaptationManager };