export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export interface VisualInput {
  imageData?: string;
  boundingBoxes?: BoundingBox[];
  ocrResults?: {
  text: string;
  boundingBox: BoundingBox;
}[]
}

export interface SemanticNode {
  id: string;
  type: "element" | "relationship" | "constraint";
  data: Record<string, unknown>;
}

export interface VisualContextPayload {
  nodes: SemanticNode[];
  summary: string;
  spatialConstraints: string[];
}

class VisualContextualizer {
  constructor() {}

  private generateUniqueId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private analyzeOCR(ocrResults: {
    text: string;
    boundingBox: BoundingBox;
  }[]): SemanticNode[] {
    if (!ocrResults || ocrResults.length === 0) {
      return [];
    }

    const nodes: SemanticNode[] = [];
    for (const result of ocrResults) {
      const id = this.generateUniqueId();
      nodes.push({
        id: id,
        type: "element",
        data: {
          text: result.text,
          boundingBox: result.boundingBox,
          source: "OCR",
        },
      });
    }
    return nodes;
  }

  private analyzeBoundingBoxes(boundingBoxes: BoundingBox[]): SemanticNode[] {
    if (!boundingBoxes || boundingBoxes.length === 0) {
      return [];
    }

    const nodes: SemanticNode[] = [];
    for (let i = 0; i < boundingBoxes.length; i++) {
      const id = this.generateUniqueId();
      nodes.push({
        id: id,
        type: "element",
        data: {
          boundingBox: boundingBoxes[i],
          source: "BoundingBox",
        },
      });
    }
    return nodes;
  }

  private inferRelationships(nodes: SemanticNode[]): SemanticNode[] {
    // Simplified relationship inference: assumes proximity implies relationship
    if (nodes.length < 2) {
      return [];
    }

    const relationships: SemanticNode[] = [];
    // In a real scenario, this would involve complex geometric and semantic checks.
    // Here, we simulate finding a relationship between the first two elements.
    if (nodes.length >= 2) {
      relationships.push({
        id: this.generateUniqueId(),
        type: "relationship",
        data: {
          description: "Elements are spatially related (e.g., adjacent, contained).",
          relatedIds: [nodes[0].id, nodes[1].id],
        },
      });
    }
    return relationships;
  }

  private generateSummary(nodes: SemanticNode[]): string {
    const elementCount = nodes.filter(n => n.type === "element").length;
    const relationshipCount = nodes.filter(n => n.type === "relationship").length;

    return `Visual context analyzed. Found ${elementCount} key elements and ${relationshipCount} inferred relationships. The layout suggests a structured form or document.`;
  }

  public process(input: VisualInput): VisualContextPayload {
    const ocrNodes = this.analyzeOCR(input.ocrResults);
    const bboxNodes = this.analyzeBoundingBoxes(input.boundingBoxes);

    const allNodes: SemanticNode[] = [
      ...ocrNodes,
      ...bboxNodes,
    ];

    const relationships = this.inferRelationships(allNodes);

    const finalNodes: SemanticNode[] = [
      ...allNodes,
      ...relationships,
    ];

    const summary = this.generateSummary(finalNodes);

    return {
      nodes: finalNodes,
      summary: summary,
      spatialConstraints: ["Elements are generally arranged in a grid-like structure.", "Key interactive areas are defined by bounding boxes."],
    };
  }
}

export const visualContextualizer = new VisualContextualizer();