import { EventEmitter } from "node:events";

export type InterventionInput = Record<string, unknown>;

export interface InterventionRequiredPayload {
  intervention_required: boolean;
  prompt: string;
  context: Record<string, unknown>;
}

export class HumanInTheLoopManager extends EventEmitter {
  private isInterventionActive: boolean = false;
  private resolveIntervention: ((input: InterventionInput) => void) | null = null;
  private rejectIntervention: ((reason?: any) => void) | null = null;

  constructor() {
    super();
  }

  /**
   * Signals that human intervention is required, pausing the flow until input is received.
   * @param context The current execution context data.
   * @param payload The structured payload indicating intervention is needed.
   * @returns A Promise that resolves with the human-provided input when available.
   */
  public async requestIntervention(
    context: Record<string, unknown>,
    payload: InterventionRequiredPayload
  ): Promise<InterventionInput> {
    if (!payload.intervention_required) {
      throw new Error("Intervention payload must mark intervention_required as true.");
    }

    if (this.isInterventionActive) {
      throw new Error("Intervention is already active. Wait for the current cycle to resolve.");
    }

    this.isInterventionActive = true;

    return new Promise((resolve, reject) => {
      this.resolveIntervention = resolve;
      this.rejectIntervention = reject;
    })
    .then((input: InterventionInput) => {
      this.isInterventionActive = false;
      return input;
    })
    .catch((error) => {
      this.isInterventionActive = false;
      throw error;
    });
  }

  /**
   * Internal method called by the external system (e.g., UI handler)
   * to resume the flow with human input.
   * @param input The data provided by the human operator.
   */
  public signalInterventionComplete(input: InterventionInput): void {
    if (!this.isInterventionActive) {
      console.warn("Attempted to signal intervention completion, but no active intervention was pending.");
      return;
    }

    if (this.resolveIntervention) {
      this.resolveIntervention(input);
    }
  }

  /**
   * Internal method for handling failures during the intervention process.
   * @param reason The reason for the failure.
   */
  public signalInterventionFailed(reason: any): void {
    if (!this.isInterventionActive) {
      return;
    }

    if (this.rejectIntervention) {
      this.rejectIntervention(reason);
    }
  }

  /**
   * Checks if the manager is currently paused waiting for human input.
   */
  public isPaused(): boolean {
    return this.isInterventionActive;
  }
}

export { HumanInTheLoopManager };