import { EventEmitter } from 'node:events'

type FusionRule<T> = (existing: T, incoming: T, context: { source: string; timestamp: number }) => T

export interface FusionEvent {
  source: string
  timestamp: number
  payload: Record<string, unknown>
}

export interface FusedState {
  timestamp: number
  data: Record<string, unknown>
}

export class TemporalDataFusionManager extends EventEmitter {
  private state: Record<string, unknown> = {}
  private rules: Map<string, Record<string, FusionRule<any>>> = new Map()

  constructor() {
    super()
  }

  /**
   * Registers a fusion rule for a specific field and source combination.
   * @param field The field name to apply the rule to.
   * @param source The data source identifier.
   * @param rule The function defining how to merge existing and incoming values.
   */
  public registerRule<T>(field: string, source: string, rule: FusionRule<T>): void {
    if (!this.rules.has(field)) {
      this.rules.set(field, {})
    }
    const fieldRules = this.rules.get(field)!
    fieldRules[source] = rule as any
  }

  /**
   * Processes an incoming event, fuses it with the current state, and updates the state.
   * @param event The incoming data event.
   * @returns The resulting FusedState.
   */
  public processEvent(event: FusionEvent): FusedState {
    const newState: Record<string, unknown> = { ...this.state }
    let stateChanged = false

    for (const [field, incomingValue] of Object.entries(event.payload)) {
      const fieldName = field
      const incomingType = typeof incomingValue
      const incomingTimestamp = event.timestamp

      if (!this.rules.has(fieldName)) {
        // No specific rule defined, just overwrite (latest wins)
        newState[fieldName] = incomingValue
        stateChanged = true
        continue
      }

      const fieldRules = this.rules.get(fieldName)!
      const sourceRule = fieldRules[event.source]

      if (sourceRule) {
        const existingValue = this.state[fieldName]
        
        // Attempt to cast existing and incoming values to the expected type T
        // This requires runtime type checking or careful rule definition.
        // For simplicity, we assume the rule handles the type mismatch gracefully.
        const mergedValue = sourceRule(
          existingValue as any,
          incomingValue as any,
          { source: event.source, timestamp: incomingTimestamp }
        )

        if (existingValue !== mergedValue) {
          newState[fieldName] = mergedValue
          stateChanged = true
        }
      } else {
        // Fallback: If no specific rule, use simple overwrite
        newState[fieldName] = incomingValue
        stateChanged = true
      }
    }

    if (stateChanged) {
      this.state = newState
      const fusedState: FusedState = {
        timestamp: Math.max(event.timestamp, (this.state.timestamp || 0)),
        data: this.state
      }
      this.emit('stateUpdated', fusedState)
    }

    return fusedState
  }

  public getCurrentState(): Record<string, unknown> {
    return { ...this.state }
  }
}