import { EventEmitter } from 'node:events'

export type Message = any

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: any[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = any

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

export type LoopEvent = any

export interface StreamDefinition {
  streamId: string
  dataType: new (...args: any[]) => any
}

export type ContextPayload = Record<string, any>

export class TemporalStreamJoiner extends EventEmitter {
  private streamDefinitions: Map<string, StreamDefinition>
  private buffer: Map<string, {
    data: Record<string, any>
    timestamps: Record<string, number>
  }>

  constructor() {
    super()
    super.set('buffer', new Map())
  }

  /**
   * Initializes the joiner with required streams.
   * @param definitions A map of stream IDs to their definitions.
   */
  public initialize(definitions: Map<string, StreamDefinition>): void {
    this.streamDefinitions = definitions
    this.buffer = new Map()
  }

  /**
   * Adds incoming data point to the internal buffer for a given correlation ID.
   * @param streamId The ID of the stream providing the data.
   * @param correlationId The unique ID linking the event sequence.
   * @param data The actual data payload.
   */
  public addStreamData(streamId: string, correlationId: string, data: any): void {
    if (!this.streamDefinitions.has(streamId)) {
      return
    }

    if (!this.buffer.has(correlationId)) {
      this.buffer.set(correlationId, {
        data: {}
        timestamps: {}
      })
    }

    const entry = this.buffer.get(correlationId)!
    entry.data[streamId] = data
    entry.timestamps[streamId] = Date.now()
  }

  /**
   * Attempts to join the context for a given correlation ID if all required streams
   * have data within the specified time window.
   * @param correlationId The ID to check.
   * @param windowMs The maximum allowed time difference between the first and last event.
   * @returns The joined context payload if successful, otherwise null.
   */
  public attemptJoin(correlationId: string, windowMs: number): ContextPayload | null {
    const entry = this.buffer.get(correlationId)
    if (!entry) {
      return null
    }

    const timestamps = entry.timestamps
    const streamIds = Array.from(this.streamDefinitions.keys())

    if (streamIds.length === 0) {
      return null
    }

    const minTimestamp = Math.min(...Object.values(timestamps))
    const maxTimestamp = Math.max(...Object.values(timestamps))
    const timeDifference = maxTimestamp - minTimestamp

    if (timeDifference > windowMs) {
      return null
    }

    // All streams are present and within the window
    const joinedContext: ContextPayload = {
      correlationId: correlationId,
      timestamp: Date.now(),
      streams: entry.data
    }

    this.emit('joined', joinedContext)
    this.clearContext(correlationId)
    return joinedContext
  }

  /**
   * Clears the buffered data for a specific correlation ID.
   * @param correlationId The ID to clear.
   */
  private clearContext(correlationId: string): void {
    this.buffer.delete(correlationId)
  }
}