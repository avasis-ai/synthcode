import { Message, UserMessage, AssistantMessage, ToolResultMessage, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

type StateGraph = Map<string, Set<string>>;

interface CausalDiff {
  addedEdges: Set<[string, string]>;
  removedEdges: Set<[string, string]>;
  modifiedEdges: Set<[string, string]>;
}

export class ContextualStateDiffer {
  private readonly stateGraphBuilder: (state: any) => StateGraph;

  constructor(stateGraphBuilder: (state: any) => StateGraph) {
    this.stateGraphBuilder = stateGraphBuilder;
  }

  private buildGraph(state: any): StateGraph {
    return this.stateGraphBuilder(state);
  }

  private compareGraphs(
    previousGraph: StateGraph,
    currentGraph: StateGraph
  ): CausalDiff {
    const addedEdges = new Set<[string, string]>();
    const removedEdges = new Set<[string, string]>();
    const modifiedEdges = new Set<[string, string]>();

    const allNodes = new Set<string>();
    previousGraph.forEach((_, source) => allNodes.add(source));
    currentGraph.forEach((_, source) => allNodes.add(source));
    previousGraph.forEach((edges, source) => {
      edges.forEach(target => allNodes.add(target));
    });

    for (const node of allNodes) {
      // Check outgoing edges (Source -> Target)
      const prevOutgoing = previousGraph.get(node) || new Set<string>();
      const currOutgoing = currentGraph.get(node) || new Set<string>();

      // Check for removed/modified outgoing edges
      for (const target of prevOutgoing) {
        const edge: [string, string] = [node, target];
        if (!currOutgoing.has(target)) {
          removedEdges.add(edge);
        } else {
          // Simple check: if the edge exists, we consider it potentially modified
          // In a real scenario, we'd compare edge metadata, but here we just track existence change.
          // For simplicity, we assume existence implies potential modification if the target set changed.
          // A more robust check would compare the *value* associated with the edge.
          // For this implementation, we treat any existing edge as potentially modified if the set changed.
          if (!currOutgoing.has(target) || prevOutgoing.has(target)) {
             modifiedEdges.add(edge);
          }
        }
      }

      // Check for added/modified outgoing edges
      for (const target of currOutgoing) {
        const edge: [string, string] = [node, target];
        if (!prevOutgoing.has(target)) {
          addedEdges.add(edge);
        } else {
          // If it exists and we are here, it was already handled above, but we ensure it's marked as modified if necessary.
          // Since we iterate over currOutgoing, if it was present, it was covered by the 'else' block above.
          // We only explicitly add it to modified if it was *not* in the previous set AND it's in the current set (handled by addedEdges).
          // If it was in both, we rely on the previous loop's logic, but to be safe:
          if (prevOutgoing.has(target) && !removedEdges.has(edge)) {
             modifiedEdges.add(edge);
          }
        }
      }
    }

    // Refinement: A simpler, more direct comparison for edges:
    const finalAdded = new Set<[string, string]>();
    const finalRemoved = new Set<[string, string]>();
    const finalModified = new Set<[string, string]>();

    for (const [source, prevTargets] of previousGraph.entries()) {
      const currTargets = currentGraph.get(source) || new Set<string>();
      for (const target of prevTargets) {
        const edge: [string, string] = [source, target];
        if (!currTargets.has(target)) {
          finalRemoved.add(edge);
        } else {
          // If it exists in both, we mark it as potentially modified if the set structure changed around it.
          // For this context, we'll conservatively mark it as modified if the target set size changed, or if we must report *any* change.
          // Since we don't have edge metadata, we assume existence implies modification if the set structure changed.
          if (prevTargets.size !== currTargets.size || prevTargets.has(target)) {
             finalModified.add(edge);
          }
        }
      }
    }

    for (const [source, currTargets] of currentGraph.entries()) {
      const prevTargets = previousGraph.get(source) || new Set<string>();
      for (const target of currTargets) {
        const edge: [string, string] = [source, target];
        if (!prevTargets.has(target)) {
          finalAdded.add(edge);
        }
      }
    }

    return {
      addedEdges: finalAdded,
      removedEdges: finalRemoved,
      modifiedEdges: finalModified,
    };
  }

  /**
   * Calculates the contextual diff between two states based on their causal graph links.
   * @param previousState The previous state object.
   * @param currentState The current state object.
   * @returns A CausalDiff report detailing changes in dependency links.
   */
  public diff(previousState: any, currentState: any): CausalDiff {
    const previousGraph = this.buildGraph(previousState);
    const currentGraph = this.buildGraph(currentState);

    return this.compareGraphs(previousGraph, currentGraph);
  }
}