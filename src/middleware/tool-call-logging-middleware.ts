import { Message, ToolUseBlock } from "./types";

export type ToolCallContext = {
  message: Message;
  toolCall: ToolUseBlock;
  context: Record<string, unknown>;
};

export type ToolCallLogger = (
  context: ToolCallContext,
  next: (enrichedContext: ToolCallContext) => Promise<any>
) => Promise<any>;

export class ToolCallLoggingMiddleware {
  private readonly logger: (payload: any) => void;

  constructor(logger: (payload: any) => void) {
    this.logger = logger;
  }

  public createMiddleware(): ToolCallLogger {
    return async (context: ToolCallContext, next) => {
      const { message, toolCall, context: originalContext } = context;

      const logPayload: {
        timestamp: number;
        user_id: string | undefined;
        agent_id: string | undefined;
        tool_call_details: {
          id: string;
          name: string;
          input: Record<string, unknown>;
        };
        message_context: {
          role: "user" | "assistant";
          content: string;
        };
        original_context: Record<string, unknown>;
      } = {
        timestamp: Date.now(),
        user_id: (originalContext as any)?.user_id || undefined,
        agent_id: (originalContext as any)?.agent_id || undefined,
        tool_call_details: {
          id: toolCall.id,
          name: toolCall.name,
          input: toolCall.input,
        },
        message_context: {
          role: message.role,
          content: message.content.text || "N/A",
        },
        original_context: originalContext,
      };

      this.logger(logPayload);

      const enrichedContext: ToolCallContext = {
        ...context,
        context: {
          ...originalContext,
          tool_call_log: logPayload,
        },
      };

      return next(enrichedContext);
    };
}