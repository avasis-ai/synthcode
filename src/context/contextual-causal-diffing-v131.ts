import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

interface CausalLink {
  source: string;
  target: string;
  weight: number;
  type: "direct" | "indirect";
}

interface CausalDiffReport {
  addedLinks: CausalLink[];
  removedLinks: CausalLink[];
  modifiedLinks: CausalLink[];
}

interface AgentContext {
  state: Record<string, any>;
  causalLinks: CausalLink[];
}

class CausalDiffCalculator {
  private contextA: AgentContext;
  private contextB: AgentContext;

  constructor(contextA: AgentContext, contextB: AgentContext) {
    this.contextA = contextA;
    this.contextB = contextB;
  }

  private calculateDiff(linksA: CausalLink[], linksB: CausalLink[]): CausalDiffReport {
    const linkMapA = new Map<string, CausalLink>();
    const linkMapB = new Map<string, CausalLink>();

    const getKey = (link: CausalLink): string =>
      `${link.source}->${link.target}:${link.weight}:${link.type}`;

    linksA.forEach(link => linkMapA.set(getKey(link), link));
    linksB.forEach(link => linkMapB.set(getKey(link), link));

    const addedLinks: CausalLink[] = [];
    const removedLinks: CausalLink[] = [];
    const modifiedLinks: CausalLink[] = [];

    // Check for additions and modifications (A -> B)
    for (const keyB of linkMapB.keys()) {
      const linkB = linkMapB.get(keyB)!;
      if (!linkMapA.has(keyB)) {
        addedLinks.push(linkB);
      } else {
        const linkA = linkMapA.get(keyB)!;
        if (linkA.weight !== linkB.weight || linkA.type !== linkB.type) {
          modifiedLinks.push(linkB);
        }
      }
    }

    // Check for removals (A exists, B does not)
    for (const keyA of linkMapA.keys()) {
      if (!linkMapB.has(keyA)) {
        const linkA = linkMapA.get(keyA)!;
        removedLinks.push(linkA);
      }
    }

    return {
      addedLinks,
      removedLinks,
      modifiedLinks,
    };
  }

  public calculateCausalDiff(): CausalDiffReport {
    return this.calculateDiff(this.contextA.causalLinks, this.contextB.causalLinks);
  }
}

export { CausalDiffCalculator };