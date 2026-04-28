import { EventEmitter } from "events";

export enum DependencyState {
  PENDING = "PENDING",
  RESOLVED = "RESOLVED",
  FAILED = "FAILED",
  STALE = "STALE",
}

export interface DependencyLink {
  sourceId: string;
  targetId: string;
  state: DependencyState;
  timestamp: number;
}

export interface SessionContext {
  sessionId: string;
  startTime: number;
}

export class StatefulDependencyTracker extends EventEmitter {
  private dependencies: Map<string, Map<string, DependencyLink>>;
  private context: SessionContext;

  constructor(context: SessionContext) {
    super();
    super.setMaxListeners(20);
    this.context = context;
    this.dependencies = new Map();
  }

  private getDependencyKey(sourceId: string, targetId: string): string {
    return `${sourceId}->${targetId}`;
  }

  public recordDependency(sourceId: string, targetId: string, state: DependencyState): DependencyLink {
    const key = this.getDependencyKey(sourceId, targetId);
    const existingDependencies = this.dependencies.get(sourceId) || new Map<string, DependencyLink>();

    const newLink: DependencyLink = {
      sourceId,
      targetId,
      state,
      timestamp: Date.now(),
    };

    const currentLink = existingDependencies.get(targetId);

    if (currentLink && currentLink.state === state && currentLink.timestamp === newLink.timestamp) {
      return currentLink; // No actual change
    }

    existingDependencies.set(targetId, newLink);
    if (!this.dependencies.has(sourceId)) {
      this.dependencies.set(sourceId, existingDependencies);
    }

    this.dependencies.set(sourceId, existingDependencies);

    this.emit("stateChanged", {
      sourceId,
      targetId,
      newState: state,
      oldState: currentLink ? currentLink.state : "UNKNOWN",
      link: newLink,
    });

    return newLink;
  }

  public getDependencyState(sourceId: string, targetId: string): DependencyState | undefined {
    const sourceMap = this.dependencies.get(sourceId);
    if (!sourceMap) {
      return undefined;
    }
    const link = sourceMap.get(targetId);
    return link ? link.state : undefined;
  }

  public getAllDependencies(): Map<string, Map<string, DependencyLink>> {
    return new Map(this.dependencies);
  }
}