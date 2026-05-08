import { EventEmitter } from 'node:events';

type Message = { role: "user" | "assistant" | "tool"; content: any };
type ContentBlock = { type: "text" | "tool_use" | "thinking"; text?: string; id?: string; name?: string; input?: Record<string, unknown>; thinking?: string; };

interface StateStore {
    get(key: string): Promise<{ result: any; timestamp: number; isStale: boolean }>;
    set(key: string, result: any, ttlSeconds: number): Promise<void>;
}

class InMemoryStateStore implements StateStore {
    private cache: Map<string, { result: any; timestamp: number; ttl: number }>;

    constructor() {
        this.cache = new Map();
    }

    async get(key: string): Promise<{ result: any; timestamp: number; isStale: boolean }> {
        const entry = this.cache.get(key);
        if (!entry) {
            return { result: null, timestamp: 0, isStale: true };
        }

        const currentTime = Date.now();
        const age = currentTime - entry.timestamp;
        const isStale = age > entry.ttl * 1000;

        return {
            result: entry.result,
            timestamp: entry.timestamp,
            isStale: isStale,
        };
    }

    async set(key: string, result: any, ttlSeconds: number): Promise<void> {
        this.cache.set(key, {
            result: result,
            timestamp: Date.now(),
            ttl: ttlSeconds,
        });
    }
}

export class IdempotencyGateway {
    private store: StateStore;

    constructor(store: StateStore) {
        this.store = store;
    }

    /**
     * Wraps a service function to ensure idempotency using a unique key.
     * If a result exists and is not stale, it returns the cached result immediately.
     * Otherwise, it executes the service function and caches the result.
     * @param idempotencyKey The unique key identifying the operation.
     * @param ttlSeconds Time-to-live for the cached result.
     * @param serviceCall The asynchronous function to execute.
     * @returns A wrapped function that handles the idempotency logic.
     */
    public idempotentWrapper<T>(
        idempotencyKey: string,
        ttlSeconds: number,
        serviceCall: (...args: any[]) => Promise<T>
    ): (...args: any[]) => Promise<T> {
        return async (...args: any[]): Promise<T> => {
            try {
                const cachedState = await this.store.get(idempotencyKey);

                if (!cachedState.isStale && cachedState.result !== null) {
                    return cachedState.result as T;
                }

                const result = await serviceCall(...args);

                await this.store.set(idempotencyKey, result, ttlSeconds);
                return result;

            } catch (error) {
                // If execution fails, we do not cache the error result,
                // allowing subsequent calls to retry the operation.
                throw error;
            }
        };
    }
}

export { InMemoryStateStore, IdempotencyGateway };