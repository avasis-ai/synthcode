import { DependencyGraph } from "../types/dependency-graph";

export class DependencyGraphVisualizer {
    visualize(graph: DependencyGraph): string {
        if (!graph || !graph.nodes || graph.nodes.length === 0) {
            return "No dependency graph provided.";
        }

        const visited = new Set<string>();
        const resultLines: string[] = [];

        const traverse = (nodeId: string, prefix: string, isLast: boolean): void => {
            if (visited.has(nodeId)) return;

            visited.add(nodeId);

            const node = graph.nodes.find(n => n.id === nodeId);
            if (!node) return;

            let line = `${prefix}${node.id}: ${node.name}`;
            resultLines.push(line);

            const children = graph.getDependencies(nodeId);

            if (children.length > 0) {
                const childPrefix = isLast ? "└── " : "├── ";
                let currentPrefix = prefix + (isLast ? "    " : "│   ");

                children.forEach((childId, index) => {
                    const childIsLast = index === children.length - 1;
                    traverse(childId, currentPrefix, childIsLast);
                });
            }
        };

        // Assuming the graph structure allows iterating over root nodes or we pick one entry point.
        // For a general visualization, we'll try to find all nodes that are not dependencies of any other node (roots).
        const allDependencies = new Set<string>();
        graph.nodes.forEach(node => {
            node.dependencies.forEach(depId => allDependencies.add(depId));
        });

        const rootNodes = graph.nodes.filter(node => !allDependencies.has(node.id));

        if (rootNodes.length === 0 && graph.nodes.length > 0) {
            // If no clear roots (e.g., a single cycle or fully connected), just visualize the first node.
            rootNodes.push(graph.nodes[0]);
        }

        // To handle multiple disconnected components, we iterate through potential roots.
        rootNodes.forEach((rootNode, index) => {
            const rootId = rootNode.id;
            const rootChildren = graph.getDependencies(rootId);

            if (index > 0) {
                resultLines.push(""); // Add separation between components
            }

            const rootPrefix = "";
            const rootIsLast = index === rootNodes.length - 1;
            
            // We need a wrapper to handle the root node itself and its children structure correctly.
            const componentLines: string[] = [];
            
            // Manually handle the root node line first
            componentLines.push(`${rootId}: ${rootNode.name}`);

            // Then recursively handle children
            let currentPrefix = "";
            let childIndex = 0;
            
            rootChildren.forEach((childId, index) => {
                const childIsLast = index === rootChildren.length - 1;
                const childPrefix = childIsLast ? "    " : "│   ";
                
                const childLines: string[] = [];
                
                // Recursive helper for children structure
                const childTraverse = (nodeId: string, prefix: string, isLast: boolean): void => {
                    if (visited.has(nodeId)) return;
                    visited.add(nodeId);

                    const node = graph.nodes.find(n => n.id === nodeId);
                    if (!node) return;

                    let line = `${prefix}${node.id}: ${node.name}`;
                    childLines.push(line);

                    const children = graph.getDependencies(nodeId);
                    if (children.length > 0) {
                        const nextPrefix = isLast ? "    " : "│   ";
                        children.forEach((childId, childIndex) => {
                            const childIsLast = childIndex === children.length - 1;
                            childTraverse(childId, nextPrefix, childIsLast);
                        });
                    }
                };

                childTraverse(childId, currentPrefix, childIsLast);
                componentLines.push(...childLines);
            });
            
            resultLines.push(...componentLines);
        });

        return resultLines.join("\n");
    }
}