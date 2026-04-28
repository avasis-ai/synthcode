import { GraphPayload } from "./graph-payload";

export class UnifiedDependencyGraphVisualizer {
    private payload: GraphPayload;

    constructor(payload: GraphPayload) {
        this.payload = payload;
    }

    public renderToSVG(): string {
        const nodes = this.payload.nodes;
        const edges = this.payload.edges;
        const metadata = this.payload.metadata;

        if (!nodes || nodes.length === 0) {
            return "";
        }

        let svgContent = `<svg width="100%" height="500px" viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg">`;

        // Simplified SVG generation logic for demonstration
        svgContent += `<title>Dependency Graph Visualization</title>`;
        svgContent += `<desc>Graph Type: ${metadata.graphType || "Unknown"}</desc>`;

        // Edges (simplified)
        edges.forEach((edge: any) => {
            svgContent += `<line x1="${edge.sourceX || 50}" y1="${edge.sourceY || 50}" x2="${edge.targetX || 500}" y2="${edge.targetY || 50}" stroke="gray" stroke-width="2"/>`;
        });

        // Nodes (simplified)
        nodes.forEach((node: any) => {
            svgContent += `<rect x="${node.x || 100}" y="${node.y || 100}" width="${node.width || 150}" height="${node.height || 50}" fill="#ADD8E6" stroke="#000" stroke-width="1"/>`;
            svgContent += `<text x="${node.x + 10}" y="${node.y + 20}" font-size="14">${node.id}</text>`;
        });

        svgContent += `</svg>`;
        return svgContent;
    }

    public renderToCanvas(canvasId: string): void {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) {
            console.error(`Canvas element with ID "${canvasId}" not found.`);
            return;
        }
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            console.error("Could not get 2D rendering context.");
            return;
        }

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Edges (simplified)
        this.payload.edges.forEach((edge: any) => {
            ctx.beginPath();
            ctx.moveTo(edge.sourceX || 50, edge.sourceY || 50);
            ctx.lineTo(edge.targetX || 500, edge.targetY || 50);
            ctx.strokeStyle = "gray";
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Draw Nodes (simplified)
        this.payload.nodes.forEach((node: any) => {
            ctx.fillStyle = "#ADD8E6";
            ctx.fillRect(node.x || 100, node.y || 100, node.width || 150, node.height || 50);
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 1;
            ctx.strokeRect(node.x || 100, node.y || 100, node.width || 150, node.height || 50);
            ctx.fillStyle = "black";
            ctx.font = "14px Arial";
            ctx.fillText(node.id, node.x + 10, node.y + 20);
        });
    }
}