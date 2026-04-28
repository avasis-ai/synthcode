import { ContextChunk, ContextState } from "./types";

export interface ContextFilter {
  filter(context: ContextChunk, contextState: ContextState): boolean;
}

export class ContextualRetrievalFilterChain {
  private filters: ContextFilter[];

  constructor(filters: ContextFilter[]) {
    this.filters = filters;
  }

  public filterAll(chunks: ContextChunk[], contextState: ContextState): ContextChunk[] {
    return chunks.filter(chunk => {
      for (const filter of this.filters) {
        if (!filter.filter(chunk, contextState)) {
          return false;
        }
      }
      return true;
    });
  }
}