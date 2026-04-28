import { CapabilityRegistry } from "../registry/capability-registry";

export type CapabilityNode = {
  id: string;
  name: string;
  description: string;
};

export type CapabilityEdge = {
  sourceCapabilityId: string;
  targetCapabilityId: string;
  relationship: "requires";
  description: string;
};

export type CapabilityGraph = {
  nodes: CapabilityNode[];
  edges: CapabilityEdge[];
};

export class CapabilityGraphBuilder {
  private registry: CapabilityRegistry;

  constructor(registry: CapabilityRegistry) {
    this.registry = registry;
  }

  build(requiredCapabilities: string[]): CapabilityGraph {
    const nodesMap = new Map<string, CapabilityNode>();
    const edges: CapabilityEdge[] = [];

    const addNode = (id: string, name: string, description: string) => {
      if (!nodesMap.has(id)) {
        nodesMap.set(id, { id, name, description });
      }
    };

    const addEdge = (sourceId: string, targetId: string, description: string) => {
      edges.push({
        sourceCapabilityId: sourceId,
        targetCapabilityId: targetId,
        relationship: "requires",
        description: description,
      });
    };

    requiredCapabilities.forEach(reqId => {
      addNode(reqId, reqId, `Core capability: ${reqId}`);
    });

    // Simulate dependency resolution using the registry
    const resolvedDependencies = this.registry.resolveDependencies(requiredCapabilities);

    resolvedDependencies.forEach(dep => {
      addNode(dep.id, dep.id, `Supporting capability: ${dep.description}`);
      addEdge(dep.sourceId, dep.targetId, `To achieve ${dep.sourceName}, ${dep.targetName} is required.`);
    });

    const nodes: CapabilityNode[] = Array.from(nodesMap.values());

    return {
      nodes: nodes,
      edges: edges,
    };
  }
}

export class CapabilityDependencyGraphVisualizer {
  private graph: CapabilityGraph;

  constructor(graph: CapabilityGraph) {
    this.graph = graph;
  }

  renderVisualization(): string {
    let html = "<h2>Capability Dependency Graph</h2>";

    html += "<h3>Required Capabilities (Nodes)</h3>";
    html += "<ul>";
    this.graph.nodes.forEach(node => {
      html += `<li><strong>${node.name}</strong>: ${node.description}</li>`;
    });
    html += "</ul>";

    html += "<h3>Dependencies (Edges)</h3>";
    html += "<p>Visual representation would connect these nodes based on the following relationships:</p>";
    html += "<ul>";
    this.graph.edges.forEach(edge => {
      html += `<li>${edge.sourceCapabilityId} --[${edge.relationship}]--> ${edge.targetCapabilityId} (${edge.description})</li>`;
    });
    html += "</ul>";

    return html;
  }
}