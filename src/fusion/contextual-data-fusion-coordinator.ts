import { EventEmitter } from 'node:events';

export type SourceId = string;
export type CriteriaKey = string;

export interface SourceCriteria {
  sourceId: SourceId;
  requiredCriteria: Record<CriteriaKey, string>;
  // Optional: A predicate function to validate the incoming data structure/value
  validator?: (data: Record<string, unknown>) => boolean;
}

export interface FusionRecipe {
  description: string;
  sources: SourceCriteria[];
  // Time window in milliseconds after which the fusion attempt fails if criteria aren't met
  timeWindowMs: number;
  // Defines the logical combination required (e.g., 'AND', 'OR')
  combinationLogic: 'AND' | 'OR';
}

export interface ObservationState {
  [sourceId: SourceId]: {
    lastObserved: Date;
    data: Record<CriteriaKey, unknown>;
    isComplete: boolean;
  };
}

export class ContextualDataFusionCoordinator extends EventEmitter {
  private recipe: FusionRecipe | null = null;
  private state: ObservationState = {};
  private sources: Map<SourceId, SourceCriteria> = new Map();

  constructor() {
    super();
  }

  /**
   * Sets the fusion recipe that the coordinator must adhere to.
   * @param recipe The defined fusion recipe.
   */
  setRecipe(recipe: FusionRecipe): void {
    this.recipe = recipe;
    this.sources.clear();
    this.state = {};
    for (const source of recipe.sources) {
      this.sources.set(source.sourceId, source);
    }
  }

  /**
   * Processes an incoming observation, updates the internal state, and checks if the fusion criteria are met.
   * @param observation The incoming data payload.
   */
  public processObservation(observation: Record<SourceId, Record<CriteriaKey, unknown>>): void {
    if (!this.recipe) {
      console.warn("Fusion Coordinator has no recipe set.");
      return;
    }

    const now = new Date();
    let stateChanged = false;

    for (const [sourceId, observationData] of Object.entries(observation)) {
      const criteria = this.sources.get(sourceId);
      if (!criteria) {
        continue;
      }

      const currentState = this.state[sourceId] || {
        lastObserved: new Date(0),
        data: {},
        isComplete: false,
      };

      let isValid = true;
      const newCriteriaData: Record<CriteriaKey, unknown> = {};

      // 1. Validate against required criteria
      for (const [key, expectedValue] of Object.entries(criteria.requiredCriteria)) {
        const actualValue = observationData[key];
        if (actualValue !== expectedValue) {
          isValid = false;
          break;
        }
        newCriteriaData[key] = actualValue;
      }

      // 2. Run custom validator if provided
      if (isValid && criteria.validator) {
        if (!criteria.validator(observationData)) {
          isValid = false;
        }
      }

      // 3. Update state if valid and different
      if (isValid) {
        if (JSON.stringify(currentState.data) !== JSON.stringify(newCriteriaData)) {
          this.state[sourceId] = {
            lastObserved: now,
            data: { ...currentState.data, ...newCriteriaData },
            isComplete: true, // Assume successful observation updates completion status
          };
          stateChanged = true;
        }
      } else {
        // If observation is invalid, we might want to reset or flag it,
        // but for simplicity, we just update the timestamp and keep the state.
        this.state[sourceId] = {
            ...currentState,
            lastObserved: now,
        };
      }
    }

    if (stateChanged) {
      this.checkFusionCompletion();
    }
  }

  /**
   * Checks if all criteria defined in the recipe are met within the time window.
   */
  private checkFusionCompletion(): void {
    const recipe = this.recipe!;
    const now = new Date();
    let allSourcesReady = true;
    let criteriaMetCount = 0;

    for (const sourceCriteria of recipe.sources) {
      const state = this.state[sourceCriteria.sourceId];

      if (!state) {
        allSourcesReady = false;
        break;
      }

      // Check time window
      const timeElapsed = now.getTime() - state.lastObserved.getTime();
      if (timeElapsed > recipe.timeWindowMs) {
        // Source data is stale
        allSourcesReady = false;
        break;
      }

      // Check if required criteria are met in the current state
      let sourceCriteriaMet = true;
      for (const [key, expectedValue] of Object.entries(sourceCriteria.requiredCriteria)) {
        const actualValue = state.data[key];
        if (actualValue !== expectedValue) {
          sourceCriteriaMet = false;
          break;
        }
      }

      if (sourceCriteriaMet) {
        criteriaMetCount++;
      } else {
        allSourcesReady = false;
        break;
      }
    }

    // Final check: Are all sources accounted for AND are all criteria met?
    if (allSourcesReady && criteriaMetCount === recipe.sources.length) {
      this.emit('fusionComplete', {
        payload: this.generateEnrichedContext(),
        timestamp: new Date(),
      });
    }
  }

  /**
   * Generates the final enriched context payload from the current state.
   */
  private generateEnrichedContext(): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      fusion_timestamp: new Date().toISOString(),
      context_data: {},
    };

    for (const [sourceId, state] of Object.entries(this.state)) {
      payload.context_data[sourceId] = state.data;
    }
    return payload;
  }
}