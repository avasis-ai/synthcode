export type WorkspaceResourceMap = Record<string, any>;

export interface WorkspaceState {
  version: number;
  lastUpdated: number;
  resources: WorkspaceResourceMap;
  history: Array<{
    version: number;
    timestamp: number;
    mutatorId: string;
    description: string;
  }>;
}

export interface Mutation {
  resourceId: string;
  payload: any;
  description: string;
}

export interface Conflict {
  resourceId: string;
  currentValue: any;
  proposedValue: any;
  message: string;
}

export class CollaborativeWorkspaceManager {
  private state: WorkspaceState;

  constructor(initialState: WorkspaceState) {
    this.state = initialState;
  }

  getWorkspaceState(): WorkspaceState {
    return this.state;
  }

  private detectConflict(mutation: Mutation): Conflict | null {
    const resourceId = mutation.resourceId;
    const currentValue = this.state.resources[resourceId];

    if (!currentValue) {
      return null; // Resource doesn't exist, no conflict yet
    }

    // Simple conflict detection: If the mutation payload suggests a change
    // that fundamentally differs from the current state's structure or value.
    // For this example, we assume a conflict if the resource exists
    // and the proposed payload is significantly different (e.g., type mismatch or major structural change).
    // A real system would use CRDTs or operational transformation.
    if (typeof mutation.payload !== typeof currentValue || JSON.stringify(mutation.payload) !== JSON.stringify(currentValue)) {
      return {
        resourceId: resourceId,
        currentValue: currentValue,
        proposedValue: mutation.payload,
        message: `Conflict detected on resource ${resourceId}. Current value differs from proposed payload.`,
      };
    }
    return null;
  }

  proposeMutation(agentId: string, mutation: Mutation): {
    conflict: Conflict | null;
    newState: WorkspaceState;
  } {
    const conflict = this.detectConflict(mutation);

    const newState: WorkspaceState = {
      ...this.state,
      version: this.state.version + 1,
      lastUpdated: Date.now(),
      resources: {
        ...this.state.resources,
        [mutation.resourceId]: mutation.payload,
      },
      history: [
        ...this.state.history,
        {
          version: this.state.version + 1,
          timestamp: Date.now(),
          mutatorId: agentId,
          description: mutation.description,
        },
      ],
    };

    return {
      conflict,
      newState: newState,
    };
  }

  resolveConflict(agentId: string, mutation: Mutation): WorkspaceState {
    const conflict = this.detectConflict(mutation);

    if (conflict) {
      throw new Error(`Cannot commit mutation: ${conflict.message}`);
    }

    // If no conflict, commit the mutation and update the state
    this.state = {
      ...this.state,
      version: this.state.version + 1,
      lastUpdated: Date.now(),
      resources: {
        ...this.state.resources,
        [mutation.resourceId]: mutation.payload,
      },
      history: [
        ...this.state.history,
        {
          version: this.state.version + 1,
          timestamp: Date.now(),
          mutatorId: agentId,
          description: mutation.description,
        },
      ],
    };

    return this.state;
  }
}

export { CollaborativeWorkspaceManager };