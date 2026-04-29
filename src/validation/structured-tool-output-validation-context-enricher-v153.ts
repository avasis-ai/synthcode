import {
  Message,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

export interface ToolCallResult {
  tool_use_id: string;
  result: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface DependencyMetadata {
  source_step_id: string;
  source_type: "tool_call" | "manual";
  data_path: string;
  value: unknown;
}

export interface EnrichedValidationContext {
  original_context: Record<string, unknown>;
  dependency_metadata: DependencyMetadata[];
  cross_step_dependencies: Record<string, Record<string, unknown>>;
}

export class StructuredToolOutputValidationContextEnricher {
  enrich(
    context: Record<string, unknown>,
    preceding_results: ToolCallResult[],
  ): EnrichedValidationContext {
    const dependencyMetadata: DependencyMetadata[] = [];
    const crossStepDependencies: Record<string, Record<string, unknown>> = {};

    preceding_results.forEach((result, index) => {
      const stepId = `step_${index + 1}`;

      // 1. Collect Dependency Metadata
      if (result.metadata) {
        Object.entries(result.metadata).forEach(([key, value]) => {
          dependencyMetadata.push({
            source_step_id: stepId,
            source_type: "tool_call",
            data_path: key,
            value: value,
          });
        });
      }

      // 2. Build Cross-Step Dependencies Map
      const stepDependencies: Record<string, unknown> = {};
      if (result.result) {
        Object.entries(result.result).forEach(([key, value]) => {
          stepDependencies[key] = value;
        });
      }
      crossStepDependencies[stepId] = stepDependencies;
    });

    return {
      original_context: context,
      dependency_metadata: dependencyMetadata,
      cross_step_dependencies: crossStepDependencies,
    };
  }
}