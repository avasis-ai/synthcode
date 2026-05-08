class BulkheadManager {
    private bulkheads: Map<string, { limit: number; current: number; }> = new Map();

    configureBulkhead(id: string, limit: number): void {
        if (limit <= 0) {
            throw new Error("Bulkhead limit must be positive.");
        }
        this.bulkheads.set(id, { limit, current: 0 });
    }

    private getBulkheadState(id: string): { limit: number; current: number; } | undefined {
        return this.bulkheads.get(id);
    }

    private acquirePermit(id: string): Promise<boolean> {
        const state = this.getBulkheadState(id);
        if (!state) {
            throw new Error(`Bulkhead '${id}' is not configured.`);
        }

        if (state.current >= state.limit) {
            return Promise.resolve(false);
        }

        state.current += 1;
        return Promise.resolve(true);
    }

    private releasePermit(id: string): void {
        const state = this.getBulkheadState(id);
        if (!state) {
            return;
        }
        if (state.current > 0) {
            state.current -= 1;
        }
    }

    async executeWithBulkhead<T>(
        bulkheadId: string,
        task: () => Promise<T>
    ): Promise<T> {
        const acquired = await this.acquirePermit(bulkheadId);

        if (!acquired) {
            throw new Error(`Bulkhead '${bulkheadId}' is at its limit. Cannot execute task.`);
        }

        try {
            const result = await task();
            return result;
        } finally {
            this.releasePermit(bulkheadId);
        }
    }
}

export { BulkheadManager };