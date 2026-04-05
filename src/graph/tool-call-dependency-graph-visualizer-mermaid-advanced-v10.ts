import { Message, ContentBlock, ToolUseBlock, ThinkingBlock } from "./types";

export interface AdvancedGraphConfig {
  mermaidGraphType: "graph TD";
  nodes: Record<string, string>;
  links: { from: string; to: string; label?: string; style?: "dashed" | "solid"; condition?: (fromNode: string, toNode: string) => boolean };
  toolCallDependencies: {
    sourceId: string;
    targetId: string;
    toolName: string;
    dependencyType: "required" | "optional";
  }[];
}

export class ToolCallDependencyGraphVisualizerMermaidAdvancedV10 {
  private readonly config: AdvancedGraphConfig;

  constructor(config: AdvancedGraphConfig) {
    this.config = config;
  }

  private generateNodesMermaid(nodes: Record<string, string>): string {
    let mermaidNodes = "";
    for (const [id, content] of Object.entries(nodes)) {
      mermaidNodes += `${id}["${content}"]\n`;
    }
    return mermaidNodes;
  }

  private generateLinksMermaid(links: { from: string; to: string; label?: string; style?: "dashed" | "solid"; condition?: (fromNode: string, toNode: string) => boolean }[]): string {
    let mermaidLinks = "";
    for (const link of links) {
      if (link.condition && !link.condition(link.from, link.to)) {
        continue;
      }
      const style = link.style === "dashed" ? "style=dashed" : "";
      const label = link.label ? ` -- "${link.label}" -->` : " -->";
      mermaidLinks += `${link.from}${style}${label}${link.to}\n`;
    }
    return mermaidLinks;
  }

  private generateToolCallDependenciesMermaid(dependencies: {
    sourceId: string;
    targetId: string;
    toolName: string;
    dependencyType: "required" | "optional";
  }[]): string {
    let mermaidToolLinks = "";
    for (const dep of dependencies) {
      const style = dep.dependencyType === "required" ? "style=bold,stroke-width:2px" : "style=dashed";
      const label = `[${dep.toolName}] (${dep.dependencyType})`;
      mermaidToolLinks += `${dep.sourceId}${style}${label}-->${dep.targetId}\n`;
    }
    return mermaidToolLinks;
  }

  public renderMermaidGraph(): string {
    let mermaid = `graph TD\n`;

    mermaid += `%% Nodes Definition\n`;
    mermaid += this.generateNodesMermaid(this.config.nodes);

    mermaid += `\n%% Core Dependencies\n`;
    mermaid += this.generateLinksMermaid(this.config.links);

    mermaid += `\n%% Advanced Tool Call Dependencies (V10 Feature)\n`;
    mermaid += this.generateToolCallDependenciesMermaid(this.config.toolCallDependencies);

    return mermaid;
  }
}