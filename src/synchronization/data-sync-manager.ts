import { EventEmitter } from "node:events"

type SourceId = string
type Payload = Record<string, unknown>

enum SyncConflictStrategy {
  LAST_WRITE_WINS = "lastWriteWins",
  FIELD_LEVEL_MERGING = "fieldLevelMerging",
  CONFLICT_REPORTING = "conflictReporting",
}

interface ConflictResolver {
  /**
   * Resolves a conflict between the existing state and the incoming payload.
   * @param existingState The current state stored in the external source.
   * @param incomingPayload The new data received from the source.
   * @returns The resolved, merged state.
   */
  resolve(existingState: Payload, incomingPayload: Payload): Payload
}

class DataSynchronizationManager extends EventEmitter {
  private readonly conflictResolvers: Map<SyncConflictStrategy, ConflictResolver>

  constructor() {
    super()
    super.set('name', 'DataSynchronizationManager')
    this.conflictResolvers = new Map()
    this.conflictResolvers.set(
      SyncConflictStrategy.LAST_WRITE_WINS,
      this.createLastWriteWinsResolver()
    )
    this.conflictResolvers.set(
      SyncConflictStrategy.FIELD_LEVEL_MERGING,
      this.createFieldLevelMergingResolver()
    )
    this.conflictResolvers.set(
      SyncConflictStrategy.CONFLICT_REPORTING,
      this.createConflictReportingResolver()
    )
  }

  private createLastWriteWinsResolver(): ConflictResolver {
    return {
      resolve: (existingState: Payload, incomingPayload: Payload): Payload => {
        // Simple implementation: incoming payload overwrites existing state
        return { ...existingState, ...incomingPayload }
      }
    }
  }

  private createFieldLevelMergingResolver(): ConflictResolver {
    return {
      resolve: (existingState: Payload, incomingPayload: Payload): Payload => {
        const merged: Payload = {}
        for (const key in incomingPayload) {
          const incomingValue = incomingPayload[key]
          const existingValue = existingState[key]

          if (typeof incomingValue === 'object' && incomingValue !== null &&
            typeof existingValue === 'object' && existingValue !== null) {
            // Recursive merge for nested objects
            merged[key] = { ...existingState[key], ...incomingPayload[key] } as Payload
          } else {
            // Simple overwrite or assignment
            merged[key] = incomingValue
          }
        }
        return merged
      }
    }
  }

  private createConflictReportingResolver(): ConflictResolver {
    return {
      resolve: (existingState: Payload, incomingPayload: Payload): Payload => {
        // In a real system, this would log conflicts and require manual intervention.
        // For simulation, we report and default to LWW.
        this.emit('conflictDetected', {
          existing: existingState,
          incoming: incomingPayload,
          strategy: SyncConflictStrategy.CONFLICT_REPORTING,
        })
        return { ...existingState, ...incomingPayload }
      }
    }
  }

  /**
   * Synchronizes a payload from a source against an existing state using a defined strategy.
   * @param sourceId The ID of the data source.
   * @param payload The incoming data payload.
   * @param strategy The conflict resolution strategy to use.
   * @returns The resolved state.
   * @throws Error if the strategy is unsupported.
   */
  public synchronize(
    sourceId: SourceId,
    payload: Payload,
    strategy: SyncConflictStrategy
  ): Payload {
    const resolver = this.conflictResolvers.get(strategy)
    if (!resolver) {
      throw new Error(`Unsupported synchronization strategy: ${strategy}`)
    }

    // Simulate fetching the existing state from the external source
    const existingState: Payload = this.fetchExistingState(sourceId)

    const resolvedState = resolver.resolve(existingState, payload)

    this.emit('syncCompleted', {
      sourceId,
      resolvedState,
      strategy,
    })

    return resolvedState
  }

  /**
   * Simulates fetching the current state from the external store.
   * @param sourceId The ID of the source.
   */
  private fetchExistingState(sourceId: SourceId): Payload {
    // Placeholder implementation: return a default state based on source ID
    return {
      last_synced: new Date().toISOString(),
      data_version: Math.floor(Math.random() * 100),
      source_id: sourceId,
      metadata: {
        status: "synced",
      }
    }
  }
}

export { DataSynchronizationManager, SyncConflictStrategy }