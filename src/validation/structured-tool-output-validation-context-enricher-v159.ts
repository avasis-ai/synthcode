import { Context, ValidationContext, Message, ToolResultMessage } from "./context-types";

interface ProjectContext {
  current_project_state: Record<string, any>;
  recent_file_changes: { path: string; changes: string }[];
}

interface AgentContext {
  user_intent_summary: string;
  session_history: Message[];
}

interface StructuredToolOutputValidationContextEnricher {
  enrichContext: (
    validationContext: ValidationContext,
    rawToolOutput: ToolResultMessage,
    projectContext: ProjectContext,
    agentContext: AgentContext
  ) => ValidationContext;
}

export const structuredToolOutputValidationContextEnricher: StructuredToolOutputValidationContextEnricher = {
  enrichContext: (
    validationContext: ValidationContext,
    rawToolOutput: ToolResultMessage,
    projectContext: ProjectContext,
    agentContext: AgentContext
  ): ValidationContext => {
    const enrichedContext: ValidationContext = {
      ...validationContext,
      metadata: {
        ...validationContext.metadata,
        tool_output_metadata: {
          raw_output: rawToolOutput.content,
          is_error: rawToolOutput.is_error ?? false,
          timestamp: Date.now(),
        },
        project_context: {
          project_state: projectContext.current_project_state,
          recent_files: projectContext.recent_file_changes,
        },
        agent_context: {
          user_intent: agentContext.user_intent_summary,
          history_summary: agentContext.session_history.slice(-5).map(m => ({
            role: m.role,
            content_snippet: typeof m.content === 'string' ? m.content.substring(0, 50) + '...' : 'N/A',
          })),
        },
      },
    };

    return enrichedContext;
  },
};