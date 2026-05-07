import { EventEmitter } from "node:events";

export interface ExternalState {
    sourceId: string;
    version: number;
    data: Record<string, unknown>;
    lastUpdated: Date;
}

export interface IExternalStateSource {
    id: string;
    /**
     * Fetches the current state from the external system.
     * @returns A promise resolving to the external state data.
     */
    fetchState: () => Promise<{ version: number; data: Record<string, unknown> }>;
    /**
     * Determines how to merge the incoming state with the current reconciled state.
     * This handles conflict resolution logic.
     * @param currentState The currently reconciled state data.
     * @param incomingState The state fetched from the external source.
     * @returns The merged state data.
     */
    resolveConflict: (currentState: Record<string, unknown>, incomingState: { version: number; data: Record<string, unknown> }) => Record<string, unknown>;
}

export interface ReconciliationResult {
    sourceId: string;
    newState: ExternalState;
    isConflictResolved: boolean;
}

export class ExternalStateReconciliationEngine extends EventEmitter {
    private sources: Map<string, IExternalStateSource>;
    private reconciledState: Map<string, ExternalState>;

    constructor() {
        super();
        this.sources = new Map<string, IExternalStateSource>();
        this.reconciledState = new Map<string, ExternalState>();
    }

    addSource(source: IExternalStateSource): void {
        if (this.sources.has(source.id)) {
            throw new Error(`Source ID ${source.id} already registered.`);
        }
        this.sources.set(source.id, source);
        this.emit("sourceAdded", source.id);
    }

    getReconciledState(): Map<string, ExternalState> {
        return this.reconciledState;
    }

    /**
     * Runs a full reconciliation cycle across all registered sources.
     * This method should be called periodically or upon significant external events.
     * @returns A promise that resolves with an array of reconciliation results.
     */
    async reconcile(): Promise<ReconciliationResult[]> {
        const promises: Promise<ReconciliationResult>[] = [];

        for (const source of this.sources.values()) {
            promises.push(this.processSource(source));
        }

        const results = await Promise.all(promises);
        this.updateInternalState(results);
        return results;
    }

    private async processSource(source: IExternalStateSource): Promise<ReconciliationResult> {
        try {
            const incoming = await source.fetchState();
            const currentState = this.reconciledState.get(source.id);

            let mergedData: Record<string, unknown>;
            let isConflictResolved = false;

            if (currentState) {
                mergedData = source.resolveConflict(currentState.data, incoming);
                // Simple conflict detection: if the resolved data differs significantly from the current data
                if (JSON.stringify(mergedData) !== JSON.stringify(currentState.data)) {
                    isConflictResolved = true;
                }
            } else {
                mergedData = incoming.data;
            }

            const newState: ExternalState = {
                sourceId: source.id,
                version: incoming.version,
                data: mergedData,
                lastUpdated: new Date(),
            };

            return {
                sourceId: source.id,
                newState: newState,
                isConflictResolved: isConflictResolved,
            };
        } catch (error) {
            console.error(`Failed to reconcile state for source ${source.id}:`, error);
            return {
                sourceId: source.id,
                newState: null as unknown as ExternalState,
                isConflictResolved: false,
            };
        }
    }

    private updateInternalState(results: ReconciliationResult[]): void {
        for (const result of results) {
            if (result.newState) {
                this.reconciledState.set(result.newState.sourceId, result.newState);
            }
        }
    }
}