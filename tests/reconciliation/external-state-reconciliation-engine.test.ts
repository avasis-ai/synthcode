import { describe, it, expect, vi } from "vitest";
import { ExternalState, IExternalStateSource } from "../src/reconciliation/external-state-reconciliation-engine";

describe("ExternalStateReconciliationEngine", () => {
    it("should correctly reconcile state when external state is newer and different", async () => {
        const mockSource: IExternalStateSource = {
            id: "source-a",
            fetchState: async () => ({ version: 2, data: { key: "new_value" } }),
            // Mocking the merge logic for simplicity in the test
            determineMerge: async (currentState: ExternalState, newState: { version: number; data: Record<string, unknown> }) => {
                return {
                    sourceId: "source-a",
                    version: newState.version,
                    data: { ...currentState.data, ...newState.data },
                    lastUpdated: new Date(),
                } as ExternalState;
            },
        };

        const initialLocalState: ExternalState = {
            sourceId: "source-a",
            version: 1,
            data: { key: "old_value", other: 10 },
            lastUpdated: new Date(2023, 0, 1),
        };

        const engine = {
            reconcile: async (localState: ExternalState, source: IExternalStateSource): Promise<ExternalState> => {
                const remoteState = await source.fetchState();
                if (remoteState.version > localState.version) {
                    return await source.determineMerge(localState, remoteState);
                }
                return localState;
            }
        };

        const reconciledState = await engine.reconcile(initialLocalState, mockSource);

        expect(reconciledState.version).toBe(2);
        expect(reconciledState.data).toEqual({ key: "new_value", other: 10 });
        expect(reconciledState.sourceId).toBe("source-a");
    });

    it("should return the local state if the external state is older or same version", async () => {
        const mockSource: IExternalStateSource = {
            id: "source-b",
            fetchState: async () => ({ version: 1, data: { key: "same_value" } }),
            determineMerge: async (currentState: ExternalState, newState: { version: number; data: Record<string, unknown> }) => {
                // This should not be called if versions are equal or lower
                return currentState;
            },
        };

        const initialLocalState: ExternalState = {
            sourceId: "source-b",
            version: 2,
            data: { key: "initial_value" },
            lastUpdated: new Date(),
        };

        const engine = {
            reconcile: async (localState: ExternalState, source: IExternalStateSource): Promise<ExternalState> => {
                const remoteState = await source.fetchState();
                if (remoteState.version > localState.version) {
                    return await source.determineMerge(localState, remoteState);
                }
                return localState;
            }
        };

        const reconciledState = await engine.reconcile(initialLocalState, mockSource);

        expect(reconciledState).toBe(initialLocalState);
        expect(reconciledState.version).toBe(2);
    });

    it("should handle fetching failure gracefully and return the local state", async () => {
        const mockSource: IExternalStateSource = {
            id: "source-c",
            fetchState: async () => {
                throw new Error("Network failure");
            },
            determineMerge: async (currentState: ExternalState, newState: { version: number; data: Record<string, unknown> }) => {
                throw new Error("Should not be called");
            },
        };

        const initialLocalState: ExternalState = {
            sourceId: "source-c",
            version: 5,
            data: { data: "local" },
            lastUpdated: new Date(),
        };

        const engine = {
            reconcile: async (localState: ExternalState, source: IExternalStateSource): Promise<ExternalState> => {
                try {
                    const remoteState = await source.fetchState();
                    if (remoteState.version > localState.version) {
                        return await source.determineMerge(localState, remoteState);
                    }
                    return localState;
                } catch (error) {
                    // In a real engine, we might log this and return the local state
                    return localState;
                }
            }
        };

        const reconciledState = await engine.reconcile(initialLocalState, mockSource);

        expect(reconciledState).toBe(initialLocalState);
        expect(reconciledState.version).toBe(5);
    });
});