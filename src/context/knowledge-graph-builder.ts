import { TextBlock } from "./types";

export interface Triple {
  subject: string;
  predicate: string;
  object: string;
}

export interface TemporalConstraint {
  entity: string;
  start?: Date | string;
  end?: Date | string;
}

export interface KnowledgeGraphPayload {
  entities: string[];
  triples: Triple[];
  temporal_constraints: TemporalConstraint[];
}

export class KnowledgeGraphBuilder {
  private contextChunks: TextBlock[];
  private entities: Set<string> = new Set();
  private triples: Triple[] = [];
  private temporalConstraints: TemporalConstraint[] = [];

  constructor(contextChunks: TextBlock[]) {
    this.contextChunks = contextChunks;
  }

  private extractEntities(text: string): string[] {
    // Placeholder for advanced NER logic
    const foundEntities: string[] = [];
    if (text.includes("Apple")) {
      foundEntities.push("Apple");
    }
    if (text.includes("London")) {
      foundEntities.push("London");
    }
    return foundEntities;
  }

  private extractTriples(text: string): Triple[] {
    // Placeholder for advanced Relation Extraction logic
    const foundTriples: Triple[] = [];
    if (text.includes("Apple released iPhone")) {
      foundTriples.push({
        subject: "Apple",
        predicate: "released",
        object: "iPhone",
      });
    }
    return foundTriples;
  }

  private extractTemporalConstraints(text: string): TemporalConstraint[] {
    // Placeholder for advanced Temporal Extraction logic
    const foundConstraints: TemporalConstraint[] = [];
    if (text.includes("last year")) {
      foundConstraints.push({
        entity: "Event",
        start: "last year",
      });
    }
    return foundConstraints;
  }

  private processChunk(chunk: TextBlock): void {
    const text = chunk.text;

    const entities = this.extractEntities(text);
    entities.forEach(e => this.entities.add(e));

    const triples = this.extractTriples(text);
    this.triples.push(...triples);

    const temporal = this.extractTemporalConstraints(text);
    this.temporalConstraints.push(...temporal);
  }

  public build(): KnowledgeGraphPayload {
    this.contextChunks.forEach(this.processChunk);

    return {
      entities: Array.from(this.entities),
      triples: this.triples,
      temporal_constraints: this.temporalConstraints,
    };
  }
}