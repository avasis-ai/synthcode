import { EventEmitter } from "node:events"

export type OperationType = "INSERT" | "UPDATE" | "DELETE"

export interface SourceMetadata {
  sourceId: string
  sourceName: string
  timestamp: number
}

export interface ChangeDataEvent<T> {
  operation: OperationType
  payload: T
  metadata: SourceMetadata
}

export interface DataDelta<T> {
  key: string
  value: T
}

export class ContextualChangeDataCaptureService {
  private eventEmitter: EventEmitter

  constructor() {
    this.eventEmitter = new EventEmitter()
  }

  /**
   * Subscribes a listener function to the structured change stream.
   * @param listener The function to call when a change event occurs.
   * @returns A function to unsubscribe the listener.
   */
  subscribe(listener: (event: ChangeDataEvent<any>) => void): () => void {
    this.eventEmitter.on("change:data", listener)
    return () => this.eventEmitter.removeListener("change:data", listener)
  }

  /**
   * Internal method to normalize and emit a change event.
   * @param operation The type of change (INSERT, UPDATE, DELETE).
   * @param payload The data payload associated with the change.
   * @param sourceMetadata Metadata about the source of the change.
   * @param key The primary key identifying the record.
   */
  private emitChange(
    operation: OperationType,
    payload: any,
    sourceMetadata: SourceMetadata,
    key: string
  ): void {
    const event: ChangeDataEvent<any> = {
      operation,
      payload,
      metadata: { ...sourceMetadata, key }
    }
    this.eventEmitter.emit("change:data", event)
  }

  /**
   * Simulates connecting to a webhook endpoint and processing incoming raw events.
   * @param webhookHandler A function that processes the raw incoming data.
   * @param sourceId Unique ID for the source.
   * @param sourceName Name of the source.
   */
  public connectWebhook(
    webhookHandler: (rawEvent: any) => void,
    sourceId: string,
    sourceName: string
  ): void {
    console.log(`[CDC] Connecting webhook for ${sourceName} (${sourceId})`)
    // In a real implementation, this would set up an HTTP listener
    (this as any)._webhookHandler = { webhookHandler, sourceId, sourceName }
  }

  /**
   * Processes a raw event received from a webhook, normalizing it into a structured delta.
   * This is the core normalization logic.
   * @param rawEvent The raw data received from the external source.
   */
  public processRawWebhookEvent(rawEvent: any): void {
    const source = (this as any)._webhookHandler
    if (!source) {
      throw new Error("CDC Service not connected to a webhook source.");
    }

    const { webhookHandler, sourceId, sourceName } = source;
    const rawData = webhookHandler(rawEvent);

    if (!rawData || typeof rawData !== 'object') {
      console.warn("Received invalid raw data payload.");
      return
    }

    const { key, operation, data } = rawData;
    const metadata: SourceMetadata = {
      sourceId,
      sourceName,
      timestamp: Date.now()
    }

    if (!key || !operation || !data) {
      console.error("Missing required fields (key, operation, data) in raw event.");
      return
    }

    const changeEvent: ChangeDataEvent<any> = {
      operation: operation.toUpperCase() as OperationType,
      payload: data,
      metadata: metadata
    }

    this.emitChange(
      changeEvent.operation,
      changeEvent.payload,
      changeEvent.metadata,
      key
    )
  }

  /**
   * Simulates polling a source (e.g., a database change log table).
   * @param sourceId Unique ID for the source.
   * @param sourceName Name of the source.
   * @param pollFunction Function that fetches and processes a batch of changes.
   */
  public async pollSource(
    sourceId: string,
    sourceName: string,
    pollFunction: (sinceTimestamp: number) => Promise<any[]>
  ): Promise<void> {
    console.log(`[CDC] Starting poll cycle for ${sourceName} (${sourceId})`)
    let lastTimestamp = Date.now() - 3600000 // Start 1 hour ago

    while (true) {
      try {
        const changes = await pollFunction(lastTimestamp)
        if (changes.length === 0) {
          console.log(`[CDC] No changes found for ${sourceName}. Waiting 5 seconds...`)
          await new Promise((resolve) => setTimeout(resolve, 5000))
          continue
        }

        for (const change of changes) {
          const { key, operation, data } = change;
          const metadata: SourceMetadata = {
            sourceId,
            sourceName,
            timestamp: Date.now()
          }
          this.emitChange(
            operation as OperationType,
            data,
            metadata,
            key
          )
        }
        lastTimestamp = Date.now()
      } catch (error) {
        console.error(`[CDC] Error polling ${sourceName}:`, error)
        await new Promise((resolve) => setTimeout(resolve, 10000))
      }
    }
  }
}

export { ContextualChangeDataCaptureService }