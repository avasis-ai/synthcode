import { Message, ContentBlock, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export interface ContextualDependencyResolver {
  resolve(requiredDependencies: string[], context: { history: Message[]; state: Record<string, unknown> }): string[];
}

export class ContextualDependencyResolverImpl implements ContextualDependencyResolver {
  resolve(requiredDependencies: string[], context: { history: Message[]; state: Record<string, unknown> }): string[] {
    const resolvedDependencies: Set<string> = new Set(requiredDependencies);

    const analyzeContext = (context: { history: Message[]; state: Record<string, unknown> }): string[] => {
      const derivedDependencies: string[] = [];

      // 1. Analyze State for potential dependencies
      for (const key in context.state) {
        const value = context.state[key];
        if (typeof value === 'string' && value.length > 0) {
          // Simple heuristic: if state contains a recognizable identifier, treat it as a dependency
          if (key.toLowerCase().includes("id") || key.toLowerCase().includes("ref")) {
            derivedDependencies.push(`state:${key}`);
          }
        }
      }

      // 2. Analyze History for implicit dependencies (e.g., tool outputs)
      for (const message of context.history) {
        if (message.role === "tool" && message as ToolResultMessage).tool_use_id) {
          // If a tool result exists, its ID might be a dependency for the next step
          derivedDependencies.push(`tool_result:${message["tool_use_id"]}`);
        }
      }

      // 3. Semantic Check (Placeholder for advanced logic)
      // In a real system, this would involve NLP/Schema matching.
      // Here, we simulate finding a dependency if the required list mentions "user_input"
      if (requiredDependencies.some(dep => dep.toLowerCase().includes("user_input"))) {
        derivedDependencies.push("context:user_input_processed");
      }

      return derivedDependencies;
    };

    const derived = analyzeContext(context);
    const finalDependencies: string[] = [...requiredDependencies];

    derived.forEach(dep => {
      if (!resolvedDependencies.has(dep)) {
        finalDependencies.push(dep);
      }
    });

    return finalDependencies;
  }
}

export const createContextualDependencyResolver = (): ContextualDependencyResolver => {
  return new ContextualDependencyResolverImpl();
};