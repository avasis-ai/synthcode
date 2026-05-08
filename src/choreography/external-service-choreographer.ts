import { EventEmitter } from "node:events";

export interface ServiceInteraction {
  id: string;
  endpoint: string;
  pollingIntervalMs: number;
  maxAttempts: number;
  successCriteria: (data: Record<string, unknown>) => boolean;
  // Function that simulates calling the external service API
  fetchStatus: (attempt: number) => Promise<Record<string, unknown>>;
}

export interface PollingResult {
  success: boolean;
  data: Record<string, unknown>;
  attempt: number;
}

export class ExternalServiceChoreographer extends EventEmitter {
  private activeInteractions: Map<string, Promise<Record<string, unknown>>> = new Map();

  /**
   * Initiates the polling process for a given service interaction.
   * This method returns a promise that resolves when the service state is resolved
   * or rejects if polling fails after max attempts.
   * @param interaction The definition of the external service interaction.
   * @returns A promise resolving with the final successful data payload.
   */
  public async initiate(interaction: ServiceInteraction): Promise<Record<string, unknown>> {
    if (this.activeInteractions.has(interaction.id)) {
      throw new Error(`Interaction ${interaction.id} is already active.`);
    }

    const promise = this.pollUntilSuccess(interaction);
    this.activeInteractions.set(interaction.id, promise);

    try {
      const result = await promise;
      this.emit("resolved", { id: interaction.id, result });
      return result;
    } finally {
      this.activeInteractions.delete(interaction.id);
    }
  }

  /**
   * Core polling logic. Recursively polls the service until success or failure.
   * @param interaction The service interaction definition.
   * @returns A promise that resolves with the final data or rejects on failure.
   */
  private async pollUntilSuccess(interaction: ServiceInteraction): Promise<Record<string, unknown>> {
    let attempt = 0;

    const poll = async (): Promise<Record<string, unknown>> => {
      if (attempt >= interaction.maxAttempts) {
        throw new Error(`Polling failed for ${interaction.id}: Exceeded max attempts (${interaction.maxAttempts}).`);
      }

      attempt++;
      console.log(`[Choreographer] Polling ${interaction.id} (Attempt ${attempt}/${interaction.maxAttempts})...`);

      try {
        const data = await interaction.fetchStatus(attempt);
        const success = interaction.successCriteria(data);

        if (success) {
          console.log(`[Choreographer] Success for ${interaction.id} on attempt ${attempt}.`);
          return data;
        } else {
          console.log(`[Choreographer] Status check for ${interaction.id} inconclusive. Retrying.`);
          // Wait for the defined interval before retrying
          await new Promise(resolve => setTimeout(resolve, interaction.pollingIntervalMs));
          return poll();
        }
      } catch (error) {
        console.error(`[Choreographer] Error during polling for ${interaction.id}:`, error);
        // Wait and retry on transient errors
        await new Promise(resolve => setTimeout(resolve, interaction.pollingIntervalMs));
        return poll();
      }
    };

    return poll();
  }

  /**
   * Checks the current status of an interaction without blocking.
   * @param id The ID of the interaction.
   * @returns A promise that resolves when the interaction is resolved or rejects if not found.
   */
  public getStatus(id: string): Promise<boolean> {
    if (!this.activeInteractions.has(id)) {
      return Promise.reject(new Error(`Interaction ${id} not found or already completed.`));
    }
    // We can't easily return a status without blocking, so we just confirm it's active.
    return Promise.resolve(true);
  }
}

export { ExternalServiceChoreographer };