import { UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface IContextSource {
  getName(): string;
  getSnapshot(): any;
  diff(previousSnapshot: any): any;
}

export interface MemoryDiff {
  source: "memory";
  diff: any;
}

export interface GraphDiff {
  source: "graph";
  diff: any;
}

export interface HistoryDiff {
  source: "history";
  diff: any;
}

export interface ContextDiffPayload {
  memory: MemoryDiff;
  graph: GraphDiff;
  history: HistoryDiff;
}

export interface ContextDiffReport {
  payload: ContextDiffPayload;
  isDifferent: boolean;
  summary: string;
}

export class ContextualStateDiffingV4 {
  private sources: IContextSource[];

  constructor(sources: IContextSource[]) {
    this.sources = sources;
  }

  public diff(previousSources: { [key: string]: any }): ContextDiffReport {
    const sourcesMap: Map<string, IContextSource> = new Map();
    for (const source of this.sources) {
      sourcesMap.set(source.getName(), source);
    }

    const memorySource = sourcesMap.get("memory") as IContextSource | undefined;
    const graphSource = sourcesMap.get("graph") as IContextSource | undefined;
    const historySource = sourcesMap.get("history") as IContextSource | undefined;

    const memoryDiff: MemoryDiff = memorySource ? { source: "memory", diff: memorySource.diff(previousSources.memory) } : { source: "memory", diff: null };
    const graphDiff: GraphDiff = graphSource ? { source: "graph", diff: graphSource.diff(previousSources.graph) } : { source: "graph", diff: null };
    const historyDiff: HistoryDiff = historySource ? { source: "history", diff: historySource.diff(previousSources.history) } : { source: "history", diff: null };

    const payload: ContextDiffPayload = {
      memory: memoryDiff,
      graph: graphDiff,
      history: historyDiff,
    };

    const isDifferent = memoryDiff.diff !== undefined && JSON.stringify(memoryDiff.diff) !== JSON.stringify(previousSources.memory) ||
                         graphDiff.diff !== undefined && JSON.stringify(graphDiff.diff) !== JSON.stringify(previousSources.graph) ||
                         historyDiff.diff !== undefined && JSON.stringify(historyDiff.diff) !== JSON.stringify(previousSources.history);

    const summary = isDifferent
      ? "Context state has changed across one or more sources."
      : "Context state is identical across all tracked sources.";

    return {
      payload,
      isDifferent,
      summary,
    };
  }
}