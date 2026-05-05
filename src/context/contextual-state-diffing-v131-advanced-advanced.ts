import { Message, ContentBlock, UserMessage, AssistantMessage, ToolResultMessage } from "./types";

export interface CausalLink {
  sourceId: string;
  targetId: string;
  dependencyType: "direct" | "indirect";
}

export interface ResourceConstraint {
  resourceName: string;
  requiredAmount: number;
  unit: "cpu_cycles" | "memory_mb" | "network_bw";
}

export interface StatePayload {
  state: Record<string, unknown>;
  causalLinks: CausalLink[];
  resourceConstraints: ResourceConstraint[];
}

export interface DiffReport {
  stateDiff: Record<string, unknown>;
  causallyNecessaryChanges: {
    key: string;
    oldValue: unknown;
    newValue: unknown;
    reason: string;
  }[];
  resourceImpactDelta: {
    resourceName: string;
    delta: number;
    unit: "cpu_cycles" | "memory_mb" | "network_bw";
  }[];
  divergencePath: string[];
}

export class ContextualStateDiffer {
  private readonly initialContext: StatePayload;

  constructor(initialContext: StatePayload) {
    this.initialContext = initialContext;
  }

  private calculateStateDiff(oldState: Record<string, unknown>, newState: Record<string, unknown>): Record<string, unknown> {
    const diff: Record<string, unknown> = {};
    for (const key in newState) {
      if (!(key in oldState) || oldState[key] !== newState[key]) {
        diff[key] = newState[key];
      }
    }
    return diff;
  }

  private calculateCausality(oldLinks: CausalLink[], newLinks: CausalLink[]): {
    necessaryChanges: {
      key: string;
      oldValue: unknown;
      newValue: unknown;
      reason: string;
    }[];
    divergencePath: string[];
  } {
    const necessaryChanges: {
      key: string;
      oldValue: unknown;
      newValue: unknown;
      reason: string;
    }[] = [];
    const divergencePath: string[] = [];

    // Simplified causality check: assume any link change implies a necessary change in state dependency
    const oldLinkMap = new Map<string, CausalLink>();
    oldLinks.forEach(link => oldLinkMap.set(`${link.sourceId}->${link.targetId}`, link));

    for (const newLink of newLinks) {
      const key = `${newLink.sourceId}->${newLink.targetId}`;
      if (!oldLinkMap.has(key)) {
        necessaryChanges.push({
          key: key,
          oldValue: undefined,
          newValue: newLink,
          reason: "New causal link established, requiring state update.",
        });
      } else if (oldLinkMap.get(key) !== newLink) {
        necessaryChanges.push({
          key: key,
          oldValue: oldLinkMap.get(key),
          newValue: newLink,
          reason: "Causal link modified, requiring state adjustment.",
        });
      }
    }

    // Placeholder for actual path divergence calculation
    divergencePath.push("State evolution path diverged based on new causal links.");

    return { necessaryChanges, divergencePath };
  }

  private calculateResourceImpact(oldResources: ResourceConstraint[], newResources: ResourceConstraint[]): {
    resourceImpactDelta: {
      resourceName: string;
      delta: number;
      unit: "cpu_cycles" | "memory_mb" | "network_bw";
    }[];
  } {
    const resourceMap = new Map<string, { total: number; unit: "cpu_cycles" | "memory_mb" | "network_bw" }>();

    const aggregateResources = (resources: ResourceConstraint[], map: Map<string, { total: number; unit: "cpu_cycles" | "memory_mb" | "network_bw" }>) => {
      for (const res of resources) {
        if (!map.has(res.resourceName)) {
          map.set(res.resourceName, { total: 0, unit: res.unit });
        }
        map.get(res.resourceName)!.total += res.requiredAmount;
      }
    };

    aggregateResources(oldResources, resourceMap);
    aggregateResources(newResources, resourceMap);

    const delta: {
      resourceName: string;
      delta: number;
      unit: "cpu_cycles" | "memory_mb" | "network_bw";
    }[] = [];

    for (const [name, oldData] of resourceMap.entries()) {
      const newResource = newResources.find(r => r.resourceName === name);
      const oldAmount = oldData.total;
      const newAmount = newResource ? newResource.requiredAmount : 0;
      const unit = oldData.unit;

      const deltaValue = newAmount - oldAmount;

      if (Math.abs(deltaValue) > 0.001) {
        delta.push({
          resourceName: name,
          delta: parseFloat(deltaValue.toFixed(2)),
          unit: unit,
        });
      }
    }
    return { resourceImpactDelta: delta };
  }

  public diff(newStatePayload: StatePayload): DiffReport {
    const stateDiff = this.calculateStateDiff(
      this.initialContext.state,
      newStatePayload.state
    );

    const { necessaryChanges: causalChanges, divergencePath } = this.calculateCausality(
      this.initialContext.causalLinks,
      newStatePayload.causalLinks
    );

    const { resourceImpactDelta } = this.calculateResourceImpact(
      this.initialContext.resourceConstraints,
      newStatePayload.resourceConstraints
    );

    return {
      stateDiff,
      causallyNecessaryChanges: causalChanges,
      resourceImpactDelta,
      divergencePath,
    };
  }
}