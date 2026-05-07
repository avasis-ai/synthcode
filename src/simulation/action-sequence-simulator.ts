import { EventEmitter } from "node:events"

type ResourceState = Record<string, number>

interface SystemState {
  resources: ResourceState
  data: Record<string, any>
  status: "IDLE" | "BUSY" | "ERROR"
}

interface Action {
  name: string
  inputs: Record<string, unknown>
  requiredResources: Record<string, number>
  stateTransition: (currentState: SystemState, inputs: Record<string, unknown>) => {
    newState: SystemState
    consumedResources: Record<string, number>
    success: boolean
    message: string
  }
}

interface Conflict {
  actionName: string
  step: number
  reason: string
  severity: "WARNING" | "ERROR"
}

interface StepLog {
  step: number
  actionName: string
  success: boolean
  newState: SystemState
  consumedResources: Record<string, number>
  conflict?: Conflict
}

interface SimulationResult {
  finalState: SystemState
  log: StepLog[]
  conflicts: Conflict[]
}

export class ActionSequenceSimulator {
  private initialState: SystemState
  private log: StepLog[] = []
  private conflicts: Conflict[] = []

  constructor(initialState: SystemState) {
    this.initialState = initialState
  }

  simulate(actions: Action[]): SimulationResult {
    let currentState: SystemState = { ...this.initialState }
    this.log = []
    this.conflicts = []

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i]
      const step = i + 1

      const required = action.requiredResources
      let canExecute = true
      let resourceCheck: Record<string, number> = {}

      for (const resource in required) {
        const needed = required[resource]
        const available = currentState.resources[resource] || 0
        if (needed > available) {
          canExecute = false
          this.conflicts.push({
            actionName: action.name,
            step: step,
            reason: `Insufficient resources: Needs ${needed} of ${resource}, but only ${available} available.`,
            severity: "ERROR"
          })
        }
      }

      let stepResult: StepLog
      let simulatedState: SystemState = { ...currentState }
      let consumed: Record<string, number> = {}

      if (canExecute) {
        const transitionResult = action.stateTransition(currentState, action.inputs)
        simulatedState = transitionResult.newState
        consumed = transitionResult.consumedResources
        
        stepResult = {
          step: step,
          actionName: action.name,
          success: true,
          newState: simulatedState,
          consumedResources: consumed,
        }
      } else {
        stepResult = {
          step: step,
          actionName: action.name,
          success: false,
          newState: currentState,
          consumedResources: {},
          conflict: {
            actionName: action.name,
            step: step,
            reason: "Execution blocked due to resource constraints.",
            severity: "ERROR"
          }
        }
      }

      this.log.push(stepResult)
      currentState = stepResult.newState
    }

    return {
      finalState: currentState,
      log: this.log,
      conflicts: this.conflicts
    }
  }

  getFinalState(): SystemState {
    // Note: In a real implementation, this would require running simulate first.
    // For simplicity, we return the state after the last successful simulation run.
    if (this.log.length > 0) {
      return this.log[this.log.length - 1].newState
    }
    return this.initialState
  }

  getLog(): StepLog[] {
    return this.log
  }

  getConflicts(): Conflict[] {
    return this.conflicts
  }
}