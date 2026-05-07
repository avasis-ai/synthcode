interface Triple {
    subject: string;
    predicate: string;
    object: string;
}

export interface ConflictResolutionReport {
    resolvedTriples: Triple[];
    unresolvedConflicts: Triple[];
    resolutionDetails: Record<string, string>;
}

export interface Resolver {
    /**
     * Attempts to resolve a set of conflicting triples.
     * @param conflictingTriples The list of triples that conflict.
     * @returns A report containing the resolved state and any remaining conflicts.
     */
    resolve(conflictingTriples: Triple[]): ConflictResolutionReport;
}

class KnowledgeGraphConflictResolver {
    private resolvers: Resolver[];

    constructor(resolvers: Resolver[] = []) {
        this.resolvers = resolvers;
    }

    /**
     * Chains multiple resolvers together to determine the definitive truth for a set of conflicting triples.
     * The process iterates through resolvers, passing the current best resolution state to the next.
     * @param conflictingTriples The initial set of conflicting triples.
     * @returns The final ConflictResolutionReport after all resolvers have run.
     */
    public resolveConflicts(conflictingTriples: Triple[]): ConflictResolutionReport {
        let currentReport: ConflictResolutionReport = {
            resolvedTriples: [],
            unresolvedConflicts: [...conflictingTriples],
            resolutionDetails: {}
        };

        for (const resolver of this.resolvers) {
            // Only pass triples that are currently unresolved to the next resolver
            const conflictsToResolve = currentReport.unresolvedConflicts;

            if (conflictsToResolve.length === 0) {
                break;
            }

            // The resolver processes the current state and returns a new report
            const nextReport = resolver.resolve(conflictsToResolve);

            // Merge the results:
            // 1. Update resolved triples
            currentReport.resolvedTriples = [...currentReport.resolvedTriples, ...nextReport.resolvedTriples];
            // 2. Update unresolved conflicts (the next resolver only sees what the previous one left unresolved)
            currentReport.unresolvedConflicts = nextReport.unresolvedConflicts;
            // 3. Merge details
            currentReport.resolutionDetails = {
                ...currentReport.resolutionDetails,
                ...nextReport.resolutionDetails
            };
        }

        return currentReport;
    }
}

class AuthorityResolver implements Resolver {
    private authoritativeSource: string;

    constructor(authoritativeSource: string) {
        this.authoritativeSource = authoritativeSource;
    }

    resolve(conflictingTriples: Triple[]): ConflictResolutionReport {
        const resolved: Triple[] = [];
        const unresolved: Triple[] = [];
        const details: Record<string, string> = {};

        for (const triple of conflictingTriples) {
            // Simple logic: If the triple involves the authoritative source, accept it.
            // In a real system, this would check source metadata attached to the triple.
            if (triple.subject.includes(this.authoritativeSource) || triple.object.includes(this.authoritativeSource)) {
                resolved.push(triple);
                details[`${triple.subject}-${triple.predicate}-${triple.object}`] = `Accepted due to authority (${this.authoritativeSource})`;
            } else {
                unresolved.push(triple);
            }
        }

        return {
            resolvedTriples: resolved,
            unresolvedConflicts: unresolved,
            resolutionDetails: details
        };
    }
}

class RecencyResolver implements Resolver {
    // Assume the input triples are already sorted by recency (most recent first)
    resolve(conflictingTriples: Triple[]): ConflictResolutionReport {
        const resolved: Triple[] = [];
        const unresolved: Triple[] = [];
        const details: Record<string, string> = {};

        // Simple logic: Trust the first triple encountered (most recent)
        if (conflictingTriples.length > 0) {
            const definitiveTriple = conflictingTriples[0];
            resolved.push(definitiveTriple);
            details[`${definitiveTriple.subject}-${definitiveTriple.predicate}-${definitiveTriple.object}`] = `Accepted due to recency`;
        } else {
            unresolved.push(...conflictingTriples);
        }

        return {
            resolvedTriples: resolved,
            unresolvedConflicts: unresolved,
            resolutionDetails: details
        };
    }
}

export {
    KnowledgeGraphConflictResolver,
    AuthorityResolver,
    RecencyResolver,
    Triple,
    ConflictResolutionReport,
    Resolver
}