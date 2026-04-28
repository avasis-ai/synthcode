export type SchemaDiff = {
    added: { [key: string]: any };
    removed: { [key: string]: any };
    modified: { [key: string]: { old: any; new: any; changes: { type: 'type' | 'required' | 'properties' | 'description' }[] } };
};

export interface SchemaDiffResult {
    diff: SchemaDiff;
    path: string;
}

type JsonSchema = Record<string, any>;

export function diffSchemas(
    schemaA: JsonSchema,
    schemaB: JsonSchema,
    currentPath: string = ""
): SchemaDiffResult {
    const diff: SchemaDiff = {
        added: {},
        removed: {},
        modified: {}
    };

    const compareProperties = (
        propsA: Record<string, any>,
        propsB: Record<string, any>,
        path: string
    ): SchemaDiffResult => {
        const result: SchemaDiff = {
            added: {},
            removed: {},
            modified: {}
        };

        const keysA = Object.keys(propsA);
        const keysB = Object.keys(propsB);

        const allKeys = new Set([...keysA, ...keysB]);

        for (const key of allKeys) {
            const keyPath = `${path}.${key}`;
            const propA = propsA[key];
            const propB = propsB[key];

            if (propsA && !propsB) {
                result.removed[key] = propA;
            } else if (!propsA && propsB) {
                result.added[key] = propB;
            } else if (propsA && propsB) {
                const subResult = compareProperties(
                    propA.properties || {},
                    propB.properties || {},
                    keyPath
                );

                const typeChanged = propA.type !== propB.type;
                const requiredChanged = propA.required !== propB.required;
                const descriptionChanged = propA.description !== propB.description;

                if (typeChanged || requiredChanged || descriptionChanged || Object.keys(subResult.diff.added) || Object.keys(subResult.diff.removed) || Object.keys(subResult.diff.modified)) {
                    result.modified[key] = {
                        old: propA,
                        new: propB,
                        changes: []
                    };
                    if (typeChanged) result.modified[key].changes.push({ type: 'type' });
                    if (requiredChanged) result.modified[key].changes.push({ type: 'required' });
                    if (descriptionChanged) result.modified[key].changes.push({ type: 'description' });
                    
                    if (Object.keys(subResult.diff.added).length > 0) {
                        result.modified[key].changes.push({ type: 'properties' });
                    }
                    if (Object.keys(subResult.diff.removed).length > 0) {
                        result.modified[key].changes.push({ type: 'properties' });
                    }
                    if (Object.keys(subResult.diff.modified).length > 0) {
                        result.modified[key].changes.push({ type: 'properties' });
                    }
                }
                
                // Merge sub-diffs into the main result
                result.added = { ...result.added, ...subResult.diff.added };
                result.removed = { ...result.removed, ...subResult.diff.removed };
                result.modified = { ...result.modified, ...subResult.diff.modified };
            }
        }

        return {
            diff: {
                added: result.added,
                removed: result.removed,
                modified: result.modified
            },
            path: `${currentPath}/${key}`
        };
    };

    const result = {
        diff: {
            added: {},
            removed: {},
            modified: {}
        }
    };

    const propertiesA = schemaA.properties || {};
    const propertiesB = schemaB.properties || {};

    const subResult = compareProperties(
        propertiesA,
        propertiesB,
        currentPath
    );

    result.diff.added = subResult.diff.added;
    result.diff.removed = subResult.diff.removed;
    result.diff.modified = subResult.diff.modified;

    return { diff: result.diff, path: currentPath };
}

export { diffSchemas };