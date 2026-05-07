import { EventEmitter } from "node:events"

export type Message = UserMessage | AssistantMessage | ToolResultMessage

export interface UserMessage {
  role: "user"
  content: string
}

export interface AssistantMessage {
  role: "assistant"
  content: ContentBlock[]
}

export interface ToolResultMessage {
  role: "tool"
  tool_use_id: string
  content: string
  is_error?: boolean
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock

export interface TextBlock {
  type: "text"
  text: string
}

export interface ToolUseBlock {
  type: "tool_use"
  id: string
  name: string
  input: Record<string, unknown>
}

export interface ThinkingBlock {
  type: "thinking"
  thinking: string
}

export interface AgentContext {
  history: Message[]
  state: Record<string, unknown>
  lastKnownGoal: string
}

export interface ExternalFeedback {
  source: string
  timestamp: number
  payload: Record<string, unknown>
  expectedContext: string
}

export type ConflictResolution = "REPLAN" | "UPDATE_CONTEXT" | "IGNORE"

export class ExternalFeedbackLoopManager extends EventEmitter {
  private context: AgentContext
  private feedbackQueue: ExternalFeedback[]

  constructor(initialContext: AgentContext) {
    super()
    this.context = initialContext
    this.feedbackQueue = []
  }

  public ingestFeedback(feedback: ExternalFeedback): void {
    this.feedbackQueue.push(feedback)
    this.emit("feedback_ingested")
  }

  public getQueueSize(): number {
    return this.feedbackQueue.length
  }

  private resolveConflict(feedback: ExternalFeedback): ConflictResolution {
    const contextMismatch = feedback.expectedContext !== this.context.lastKnownGoal
    const payloadSignificance = Object.keys(feedback.payload).length > 0

    if (contextMismatch && payloadSignificance) {
      return "REPLAN"
    }
    if (!contextMismatch && payloadSignificance) {
      return "UPDATE_CONTEXT"
    }
    return "IGNORE"
  }

  public processFeedback(): {
    action: ConflictResolution
    feedback: ExternalFeedback
  } | null {
    if (this.feedbackQueue.length === 0) {
      return null
    }

    const feedback = this.feedbackQueue[0]
    const action = this.resolveConflict(feedback)

    if (action === "IGNORE") {
      this.feedbackQueue.shift()
      return null
    }

    // Process and remove the feedback item
    this.feedbackQueue.shift()

    return {
      action: action,
      feedback: feedback,
    }
  }

  public updateContext(newContext: Partial<AgentContext>): void {
    this.context = {
      ...this.context,
      ...newContext,
    }
  }

  public getCurrentContext(): AgentContext {
    return this.context
  }
}