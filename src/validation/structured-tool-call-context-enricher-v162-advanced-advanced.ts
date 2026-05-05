import { AgentContext } from "./agent-context";
import { ContextManager } from "./context-manager";
import { ConstraintPropagator } from "./constraint-propagator";
import { ToolCallValidator } from "./tool-call-validator";

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

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_use"; tool_use_id: string };

export interface EnrichedContext {
  history: Message[];
  currentState: Record<string, unknown>;
  globalConstraints: Record<string, unknown>;
  dynamicContext: Record<string, unknown>;
  lastToolCallId: string | null;
}

export class StructuredToolCallContextEnricher {
  private agentContext: AgentContext;
  private contextManager: ContextManager;
  private constraintPropagator: ConstraintPropagator;

  constructor(
    agentContext: AgentContext,
    contextManager: ContextManager,
    constraintPropagator: ConstraintPropagator
  ) {
    this.agentContext = agentContext;
    this.contextManager = contextManager;
    this.constraintPropagator = constraintPropagator;
  }

  private enrichContext(): EnrichedContext {
    const history = this.agentContext.getHistory();
    const currentState = this.agentContext.getCurrentState();
    const globalConstraints = this.constraintPropagator.getConstraints();
    const dynamicContext = this.contextManager.getDynamicContext();

    const lastToolCallId = this.contextManager.getLastToolCallId();

    return {
      history,
      currentState,
      globalConstraints,
      dynamicContext,
      lastToolCallId,
    };
  }

  public enrich(): EnrichedContext {
    return this.enrichContext();
  }

  public enrichForValidator(validator: ToolCallValidator): ToolCallValidator {
    const enrichedContext = this.enrich();
    return {
      ...validator,
      validateWithEnrichedContext: (
        toolCall: { name: string; input: Record<string, unknown> },
        context: EnrichedContext
      ): boolean => {
        console.log("Validating tool call with enriched context:", context);
        // Placeholder for actual validation logic using enriched context
        // In a real scenario, this would pass the enriched context to the validator's internal logic.
        return true;
      },
    } as ToolCallValidator;
  }
}