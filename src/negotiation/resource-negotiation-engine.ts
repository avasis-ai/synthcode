import { EventEmitter } from "node:events";

type ResourceId = string;
type ResourceType = "CPU" | "Memory" | "GPU" | "Storage" | "Network";
type Priority = number;

interface TimeWindow {
  start: Date;
  end: Date;
}

interface ResourceRequirement {
  resourceId: ResourceId;
  type: ResourceType;
  quantity: number;
  window: TimeWindow;
}

export interface NegotiationProposal {
  id: string;
  requiredResources: ResourceRequirement[];
  priority: Priority;
  requesterId: string;
}

export type NegotiationState = "PENDING" | "CONFLICTED" | "RESOLVED" | "REJECTED";

export interface Conflict {
  resourceId: ResourceId;
  conflictingProposalId: string;
  reason: string;
}

export interface ConflictResolver {
  resolve(
    proposal: NegotiationProposal,
    conflicts: Conflict[]
  ): {
    success: boolean;
    resolution: string;
    updatedProposal?: NegotiationProposal;
  };
}

class ResourceNegotiationEngine extends EventEmitter {
  private resourceState: Map<ResourceId, {
    allocated: Map<ResourceType, {
      quantity: number;
      windows: TimeWindow[];
    }>;
    owner: string;
  }>;

  private proposals: Map<string, NegotiationProposal>;

  constructor() {
    super();
    this.resourceState = new Map();
    this.proposals = new Map();
  }

  private checkConflict(
    proposal: NegotiationProposal,
    resourceId: ResourceId,
    type: ResourceType,
    quantity: number,
    window: TimeWindow
  ): Conflict | null {
    const state = this.resourceState.get(resourceId);
    if (!state) {
      return null;
    }

    const allocated = state.allocated.get(type);
    if (!allocated) {
      return null;
    }

    // Simplified conflict check: check if the required window overlaps with any existing allocation
    const isConflict = allocated.windows.some(existingWindow =>
      (window.start < existingWindow.end && window.end > existingWindow.start)
    );

    if (isConflict) {
      return {
        resourceId: resourceId,
        conflictingProposalId: "N/A", // In a real system, we'd track the conflicting proposal
        reason: `Temporal conflict detected for ${type} during the requested window.`
      };
    }
    return null;
  }

  public async negotiate(proposal: NegotiationProposal): Promise<{
    state: NegotiationState;
    message: string;
    resolvedProposal?: NegotiationProposal;
  }> {
    this.proposals.set(proposal.id, proposal);
    let conflicts: Conflict[] = [];

    // 1. Conflict Detection
    for (const req of proposal.requiredResources) {
      const conflict = this.checkConflict(
        proposal,
        req.resourceId,
        req.type,
        req.quantity,
        req.window
      );
      if (conflict) {
        conflicts.push(conflict);
      }
    }

    let currentState: NegotiationState = "PENDING";
    let resolutionMessage = "";
    let resolvedProposal: NegotiationProposal | undefined = undefined;

    if (conflicts.length > 0) {
      currentState = "CONFLICTED";
      resolutionMessage = `Conflict detected for ${conflicts.length} resources. Applying conflict resolution strategy.`;

      // 2. Conflict Resolution Strategy Application
      const resolver = this.getConflictResolverStrategy();
      const resolutionResult = resolver.resolve(proposal, conflicts);

      if (resolutionResult.success) {
        currentState = "RESOLVED";
        resolutionMessage = `Negotiation successful. Resources secured via ${resolutionResult.resolution}.`;
        resolvedProposal = resolutionResult.updatedProposal!;
      } else {
        currentState = "REJECTED";
        resolutionMessage = `Negotiation failed. Conflicts could not be resolved. ${resolutionResult.resolution}`;
      }
    } else {
      currentState = "RESOLVED";
      resolutionMessage = "All resources secured successfully. No conflicts detected.";
      resolvedProposal = { ...proposal };
    }

    this.emit("negotiation_completed", {
      proposalId: proposal.id,
      state: currentState,
      message: resolutionMessage,
      resolvedProposal: resolvedProposal
    });

    return {
      state: currentState,
      message: resolutionMessage,
      resolvedProposal: resolvedProposal
    };
  }

  private getConflictResolverStrategy(): ConflictResolver {
    // Example implementation: Priority-based resolution
    return {
      resolve(proposal: NegotiationProposal, conflicts: Conflict[]): {
        success: boolean;
        resolution: string;
        updatedProposal?: NegotiationProposal;
      } {
        if (conflicts.length === 0) {
          return { success: true, resolution: "None", updatedProposal: undefined };
        }

        // Simple strategy: If the proposal has high priority (e.g., > 5), assume success and adjust resources.
        if (proposal.priority >= 5) {
          return {
            success: true,
            resolution: "Priority Override",
            updatedProposal: {
              ...proposal,
              requiredResources: proposal.requiredResources.map(req => ({
                ...req,
                // Simulate resource adjustment due to override
                quantity: Math.max(1, Math.floor(req.quantity * 0.9)),
              }))
            }
          };
        }

        // Default failure
        return {
          success: false,
          resolution: "Insufficient Priority",
          updatedProposal: undefined
        };
      }
    };
  }

  public allocateResources(proposal: NegotiationProposal): void {
    if (proposal.requiredResources.length === 0) return;

    for (const req of proposal.requiredResources) {
      const { resourceId, type, quantity, window } = req;

      if (!this.resourceState.has(resourceId)) {
        this.resourceState.set(resourceId, {
          allocated: new Map(),
          owner: ""
        });
      }

      const state = this.resourceState.get(resourceId)!;
      if (!state.allocated.has(type)) {
        state.allocated.set(type, {
          quantity: 0,
          windows: []
        });
      }

      const allocated = state.allocated.get(type)!;

      // Update allocation state
      allocated.quantity += quantity;
      allocated.windows.push(window);
      
      // Simple owner tracking (assuming all resources in a single proposal come from one owner)
      state.owner = proposal.requesterId;
    }
  }
}

export { ResourceNegotiationEngine };