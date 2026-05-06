export type SourceAuthority = number;
export type SourceTimestamp = number;

export interface Triple {
  subject: string;
  predicate: string;
  object: string;
}

export interface SourceTriple {
  triple: Triple;
  source: string;
  authority: SourceAuthority;
  timestamp: SourceTimestamp;
}

export interface ReconciliationReport {
  authoritativeTriples: Triple[];
  conflictsResolved: number;
  details: Map<string, {
  resolvedTriple: Triple;
  strategyUsed: string;
  sourcesCount: number;
}>;
}

export interface ConflictResolutionStrategy {
  resolve(conflictingTriples: SourceTriple[], key: string): Triple;
}

export class AuthorityBasedStrategy implements ConflictResolutionStrategy {
  resolve(conflictingTriples: SourceTriple[], key: string): Triple {
    let bestTriple: SourceTriple = conflictingTriples[0];
    for (const sourceTriple of conflictingTriples) {
      if (sourceTriple.authority > bestTriple.authority) {
        bestTriple = sourceTriple;
      }
    }
    return bestTriple.triple;
  }
}

export class RecencyBasedStrategy implements ConflictResolutionStrategy {
  resolve(conflictingTriples: SourceTriple[], key: string): Triple {
    let latestTriple: SourceTriple = conflictingTriples[0];
    for (const sourceTriple of conflictingTriples) {
      if (sourceTriple.timestamp > latestTriple.timestamp) {
        latestTriple = sourceTriple;
      }
    }
    return latestTriple.triple;
  }
}

export class MajorityVoteStrategy implements ConflictResolutionStrategy {
  resolve(conflictingTriples: SourceTriple[], key: string): Triple {
    const votes: Map<string, number> = new Map();
    const tripleCounts: Map<Triple, number> = new Map();

    for (const sourceTriple of conflictingTriples) {
      const tripleKey = `${sourceTriple.triple.subject}|${sourceTriple.triple.predicate}|${sourceTriple.triple.object}`;
      votes.set(tripleKey, (votes.get(tripleKey) || 0) + 1);
      
      const currentTriple = sourceTriple.triple;
      tripleCounts.set(currentTriple, (tripleCounts.get(currentTriple) || 0) + 1);
    }

    let winningTriple: Triple | undefined = undefined;
    let maxVotes = 0;

    for (const [triple, count] of tripleCounts.entries()) {
      if (count > maxVotes) {
        maxVotes = count;
        winningTriple = triple;
      }
    }
    
    return winningTriple || conflictingTriples[0].triple;
  }
}

export class KnowledgeGraphReconciler {
  private strategy: ConflictResolutionStrategy;

  constructor(strategy: ConflictResolutionStrategy) {
    this.strategy = strategy;
  }

  reconcile(sourceTriples: SourceTriple[]): ReconciliationReport {
    const groupedTriples = new Map<string, SourceTriple[]>();
    const reportDetails = new Map<string, {
      resolvedTriple: Triple;
      strategyUsed: string;
      sourcesCount: number;
    }>();

    for (const sourceTriple of sourceTriples) {
      const key = `${sourceTriple.triple.subject}|${sourceTriple.triple.predicate}|${sourceTriple.triple.object}`;
      if (!groupedTriples.has(key)) {
        groupedTriples.set(key, []);
      }
      groupedTriples.get(key)!.push(sourceTriple);
    }

    const authoritativeTriples: Triple[] = [];
    let conflictsResolved = 0;

    for (const [key, conflictingTriples] of groupedTriples.entries()) {
      if (conflictingTriples.length > 1) {
        conflictsResolved++;
        const resolvedTriple = this.strategy.resolve(conflictingTriples, key);

        const detail: {
          resolvedTriple: Triple;
          strategyUsed: string;
          sourcesCount: number;
        } = {
          resolvedTriple: resolvedTriple,
          strategyUsed: this.strategy.constructor.name,
          sourcesCount: conflictingTriples.length,
        };
        reportDetails.set(key, detail);
        authoritativeTriples.push(resolvedTriple);
      } else {
        const singleTriple = conflictingTriples[0].triple;
        authoritativeTriples.push(singleTriple);
        reportDetails.set(key, {
          resolvedTriple: singleTriple,
          strategyUsed: "N/A (No Conflict)",
          sourcesCount: 1,
        });
      }
    }

    return {
      authoritativeTriples,
      conflictsResolved,
      details: reportDetails,
    };
  }
}

export {
  KnowledgeGraphReconciler,
  AuthorityBasedStrategy,
  RecencyBasedStrategy,
  MajorityVoteStrategy,
}