interface ConflictResolver {
    resolve(field: string, values: any[]): any;
}

class LastWriteWinsResolver implements ConflictResolver {
    resolve(field: string, values: any[]): any {
        return values[values.length - 1];
    }
}

class DeepMergeResolver implements ConflictResolver {
    resolve(field: string, values: any[]): any {
        if (values.length === 0) {
            return undefined;
        }

        const result: Record<string, any> = {};

        for (const value of values) {
            if (typeof value === 'object' && value !== null) {
                for (const key in value) {
                    if (Object.prototype.hasOwnProperty.call(value, key)) {
                        const keyValue = value[key];
                        if (!result[key]) {
                            result[key] = {};
                        }
                        if (typeof result[key] === 'object' && result[key] !== null && typeof keyValue === 'object' && keyValue !== null) {
                            (result[key] as Record<string, any>)[key] = (result[key] as Record<string, any>)[key] || {};
                            (result[key] as Record<string, any>)[key] = {
                                ...(result[key] as Record<string, any>)[key],
                                ...(typeof keyValue === 'object' && keyValue !== null ? keyValue : {})
                            };
                        } else {
                            result[key] = keyValue;
                        }
                    }
                }
            } else {
                result[field] = value;
            }
        }

        return result;
    }
}

export class StateConflictResolver {
    private resolvers: Map<string, ConflictResolver>;

    constructor(resolvers: Map<string, ConflictResolver> = new Map()) {
        this.resolvers = new Map<string, ConflictResolver>();
        this.registerDefaultResolvers();
        for (const [name, resolver] of resolvers) {
            this.resolvers.set(name, resolver);
        }
    }

    private registerDefaultResolvers() {
        this.resolvers.set('last-write-wins', new LastWriteWinsResolver());
        this.resolvers.set('deep-merge', new DeepMergeResolver());
    }

    getResolver(name: string): ConflictResolver | undefined {
        return this.resolvers.get(name);
    }

    /**
     * Resolves conflicts for a given state path using a specified resolver.
     * @param field The field name experiencing conflict.
     * @param values An array of conflicting values from different sources.
     * @param resolverName The name of the conflict resolution strategy to use.
     * @returns The resolved value.
     * @throws Error if the specified resolver is not found.
     */
    resolveConflict(field: string, values: any[], resolverName: string): any {
        const resolver = this.getResolver(resolverName);
        if (!resolver) {
            throw new Error(`Unknown conflict resolver: ${resolverName}`);
        }
        return resolver.resolve(field, values);
    }

    /**
     * Merges multiple state objects, resolving conflicts based on provided strategies.
     * @param states An array of state objects to merge.
     * @param strategies A map defining resolution strategies for specific fields.
     * @returns The merged state object.
     */
    mergeStates(states: Record<string, any>[], strategies: Map<string, string>): Record<string, any> {
        if (states.length === 0) {
            return {};
        }

        const mergedState: Record<string, any> = {};

        for (const field in states[0]) {
            if (!Object.prototype.hasOwnProperty.call(states[0], field)) {
                continue;
            }

            const fieldValues: any[] = states.map(state => state[field]);
            const strategy = strategies.get(field) || 'last-write-wins';

            try {
                const resolver = this.getResolver(strategy);
                if (!resolver) {
                    throw new Error(`Strategy '${strategy}' not implemented.`);
                }
                mergedState[field] = resolver.resolve(field, fieldValues);
            } catch (e) {
                console.error(`Failed to resolve conflict for field ${field} using ${strategy}:`, e);
                // Fallback: Use the last write wins if resolution fails
                mergedState[field] = fieldValues[fieldValues.length - 1];
            }
        }

        return mergedState;
    }
}