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

export type ObservationSource = "system" | "background" | "scheduled" | "external";

export type Priority = number;

export interface ObservationQueueItem {
  payload: Message;
  source: ObservationSource;
  timestamp: number;
  priority: Priority;
}

export class ContextualObservationQueue {
  private queue: ObservationQueueItem[] = [];

  constructor() {}

  /**
   * Enqueues a new observation item into the queue.
   * @param payload The observation content (as a Message).
   * @param source The origin of the observation.
   * @param priority The relevance score (higher is more relevant).
   */
  enqueueObservation(
    payload: Message,
    source: ObservationSource,
    priority: Priority,
  ): void {
    const item: ObservationQueueItem = {
      payload,
      source,
      timestamp: Date.now(),
      priority,
    };
    this.queue.push(item);
  }

  /**
   * Retrieves the next most relevant observation, considering priority and temporal decay.
   * @param decayRate A factor determining how quickly older items lose relevance (e.g., 0.01 per minute).
   * @returns The next observation item, or null if the queue is empty.
   */
  retrieveNextObservation(decayRate: number = 0.01): ObservationQueueItem | null {
    if (this.queue.length === 0) {
      return null;
    }

    const now = Date.now();

    const scoredQueue = this.queue.map((item) => {
      const ageMs = now - item.timestamp;
      // Calculate decay: 1.0 at age 0, decreasing over time.
      // We normalize age to minutes for a more stable decay calculation.
      const ageMinutes = ageMs / (1000 * 60);
      const decayFactor = Math.exp(-decayRate * ageMinutes);
      
      // Combined score: Priority * DecayFactor
      const score = item.priority * decayFactor;
      return { item, score };
    });

    // Find the item with the highest score
    let bestMatch = scoredQueue.reduce(
      (best, current) => (current.score > best.score ? current : best),
      scoredQueue[0]
    );

    const bestItem = bestMatch.item;

    // Remove the retrieved item from the queue
    this.queue = this.queue.filter((_, index) => index !== this.queue.indexOf(bestItem));

    return bestItem;
  }

  /**
   * Checks if there are any observations pending retrieval.
   */
  hasObservations(): boolean {
    return this.queue.length > 0;
  }
}