import { EventEmitter } from 'node:events'

type StateKey = string
type SourceId = string

interface SourceState {
    [key: StateKey]: any
}

type ConflictResolver = (
    sourceId: SourceId,
    currentState: any,
    newState: any
) => any

interface ExternalSource {
    readonly id: SourceId
    getLatestState: () => Promise<SourceState>
    getConflictResolver: () => ConflictResolver
}

interface SynchronizedState {
    unifiedState: SourceState
    sourceStates: Record<SourceId, SourceState>
    lastUpdated: Date
}

export class ExternalStateSynchronizationCoordinator {
    private sources: Map<SourceId, ExternalSource> = new Map()

    registerSource(source: ExternalSource): void {
        if (this.sources.has(source.id)) {
            throw new Error(`Source with ID ${source.id} is already registered.`);
        }
        this.sources.set(source.id, source)
    }

    async synchronize(sources: ExternalSource[]): Promise<SynchronizedState> {
        if (sources.length === 0) {
            return {
                unifiedState: {} as SourceState,
                sourceStates: {} as Record<SourceId, SourceState>,
                lastUpdated: new Date()
            }
        }

        const statePromises = sources.map(async (source) => {
            const state = await source.getLatestState()
            return {
                sourceId: source.id,
                state: state,
                resolver: source.getConflictResolver()
            }
        })

        const results = await Promise.all(statePromises)

        let unifiedState: SourceState = {}
        const sourceStates: Record<SourceId, SourceState> = {}

        for (const result of results) {
            const { sourceId, state, resolver } = result

            sourceStates[sourceId] = state

            // Apply conflict resolution logic iteratively
            const currentUnifiedState = unifiedState
            const resolvedState = resolver(sourceId, currentUnifiedState, state)

            // Deep merge the resolved state into the unified state
            unifiedState = {
                ...currentUnifiedState,
                ...resolvedState
            }
        }

        return {
            unifiedState: unifiedState,
            sourceStates: sourceStates,
            lastUpdated: new Date()
        }
    }
}