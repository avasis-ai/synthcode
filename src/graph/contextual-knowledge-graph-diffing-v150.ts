import { Graph, Triple } from "./graph-types";

export type DiffReport = {
  addedTriples: Triple[];
  deletedTriples: Triple[];
  modifiedTriples: {
    old: Triple;
    new: Triple;
  }[];
};

export class ContextualKnowledgeGraphDiffer {
  private readonly graphA: Graph;
  private readonly graphB: Graph;

  constructor(graphA: Graph, graphB: Graph) {
    this.graphA = graphA;
    this.graphB = graphB;
  }

  private getTripleKey(triple: Triple): string {
    return `${triple.subject}|${triple.predicate}|${triple.object}`;
  }

  private getTripleSet(graph: Graph): Map<string, Triple> {
    const triples = new Set<Triple>();
    graph.getTriples().forEach(t => triples.add(t));
    const map = new Map<string, Triple>();
    triples.forEach(t => map.set(this.getTripleKey(t), t));
    return map;
  }

  public diff(sourceContext: string): DiffReport {
    const triplesA = this.getTripleSet(this.graphA);
    const triplesB = this.getTripleSet(this.graphB);

    const addedTriples: Triple[] = [];
    const deletedTriples: Triple[] = [];
    const modifiedTriples: { old: Triple; new: Triple; }[] = [];

    const keysA = Array.from(triplesA.keys());
    const keysB = Array.from(triplesB.keys());

    const allKeys = new Set([...keysA, ...keysB]);

    for (const key of allKeys) {
      const tripleA = triplesA.get(key);
      const tripleB = triplesB.get(key);

      if (tripleA && !tripleB) {
        deletedTriples.push(tripleA);
      } else if (!tripleA && tripleB) {
        addedTriples.push(tripleB);
      } else if (tripleA && tripleB) {
        if (this.areTriplesDifferent(tripleA, tripleB)) {
          modifiedTriples.push({
            old: tripleA,
            new: tripleB,
          });
        }
      }
    }

    return {
      addedTriples,
      deletedTriples,
      modifiedTriples,
    };
  }

  private areTriplesDifferent(t1: Triple, t2: Triple): boolean {
    if (t1.subject !== t2.subject || t1.predicate !== t2.predicate || t1.object !== t2.object) {
      return true;
    }
    return false;
  }
}