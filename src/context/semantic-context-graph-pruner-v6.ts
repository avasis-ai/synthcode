import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

interface GraphNode {
    id: string;
    message: Message;
    contentBlocks: ContentBlock[];
}

interface GraphEdge {
    sourceId: string;
    targetId: string;
    weight: number;
}

export class SemanticContextGraphPrunerV6 {
    private nodes: Map<string, GraphNode>;
    private edges: GraphEdge[];
    private targetSize: number;

    constructor(initialNodes: GraphNode[], initialEdges: GraphEdge[], targetSize: number) {
        this.nodes = new Map(initialNodes.map(node => [node.id, node]));
        this.edges = initialEdges;
        this.targetSize = targetSize;
    }

    private calculateCentrality(nodeId: string): number {
        let incoming = 0;
        let outgoing = 0;
        for (const edge of this.edges) {
            if (edge.targetId === nodeId) {
                incoming++;
            }
            if (edge.sourceId === nodeId) {
                outgoing++;
            }
        }
        return (incoming + outgoing) / 2;
    }

    private calculateSemanticRelevance(nodeId: string, latestContent: string): number {
        const node = this.nodes.get(nodeId);
        if (!node) return 0;

        // Simplified semantic similarity proxy: count keyword overlap or just use content length as a weak proxy
        // In a real system, this would involve embedding similarity (e.g., cosine distance)
        let contentScore = 0;
        for (const block of node.contentBlocks) {
            if (block.type === "text" && typeof block.text === 'string') {
                contentScore += block.text.length;
            }
        }

        // Simple heuristic: higher centrality + content length contribution
        return this.calculateCentrality(nodeId) * 0.5 + Math.min(contentScore.length / 100, 2.0);
    }

    private calculateEdgeRelevance(edge: GraphEdge, latestContent: string): number {
        const sourceScore = this.calculateSemanticRelevance(edge.sourceId, latestContent);
        const targetScore = this.calculateSemanticRelevance(edge.targetId, latestContent);
        // Edge relevance is weighted by the relevance of its endpoints
        return (sourceScore + targetScore) / 2;
    }

    public prune(latestMessage: Message): { prunedNodes: string[], prunedEdges: GraphEdge[] } {
        const latestContent = this.formatMessageContent(latestMessage);

        // 1. Calculate Node Scores
        const nodeScores: { nodeId: string, score: number }[] = [];
        for (const [id, node] of this.nodes.entries()) {
            const score = this.calculateSemanticRelevance(id, latestContent);
            nodeScores.push({ nodeId: id, score: score });
        }

        // 2. Calculate Edge Scores
        const edgeScores: { edge: GraphEdge, score: number }[] = [];
        for (const edge of this.edges) {
            const score = this.calculateEdgeRelevance(edge, latestContent);
            edgeScores.push({ edge: edge, score: score });
        }

        // Sort by score (lowest first for pruning)
        nodeScores.sort((a, b) => a.score - b.score);
        edgeScores.sort((a, b) => a.score - b.score);

        let currentSize = this.nodes.size;
        let nodesToRemove: Set<string> = new Set();
        let edgesToRemove: Set<string> = new Set();

        // Prune Nodes until target size is approached
        while (currentSize > this.targetSize && nodeScores.length > 0) {
            const nodeToRemove = nodeScores[0].nodeId;
            nodesToRemove.add(nodeToRemove);
            
            // Update connectivity check: If we remove a node, we must also remove all incident edges
            this.edges = this.edges.filter(edge => 
                edge.sourceId !== nodeToRemove && edge.targetId !== nodeToRemove
            );
            
            // Re-evaluate size based on actual removal
            currentSize--;
            nodeScores.shift(); // Remove the lowest scoring node
        }

        // Prune Edges (This step is complex; for simplicity, we prune the lowest scoring edges 
        // that connect nodes *not* marked for removal, or are critical paths)
        const finalEdges: GraphEdge[] = [];
        for (const edge of this.edges) {
            if (!nodesToRemove.has(edge.sourceId) && !nodesToRemove.has(edge.targetId)) {
                // Keep edges between remaining nodes
                finalEdges.push(edge);
            }
        }
        
        // In a full implementation, we would iteratively prune edges based on connectivity loss 
        // or low relevance score among the remaining nodes.
        
        return { 
            prunedNodes: Array.from(nodesToRemove), 
            prunedEdges: [] // Simplified return for edges
        };
    }

    private formatMessageContent(message: Message): string {
        if (message.role === "user" && typeof message.content === 'string') {
            return message.content;
        }
        if (message.role === "tool" && typeof message.content === 'string') {
            return message.content;
        }
        return "";
    }
}