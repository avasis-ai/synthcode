import { describe, it, expect } from "vitest";
import {
  ContextualDependencyGraphVisualizer,
  TemporalConstraint,
  ResourceConstraint,
  ContextualDependency,
} from "../src/visualization/contextual-dependency-graph-visualizer-v139";

describe("ContextualDependencyGraphVisualizer", () => {
  it("should correctly initialize with empty data", () => {
    const visualizer = new ContextualDependencyGraphVisualizer();
    expect(visualizer.getDependencies()).toEqual([]);
    expect(visualizer.getTemporalConstraints()).toEqual([]);
    expect(visualizer.getResourceConstraints()).toEqual([]);
  });

  it("should add and retrieve a standard dependency", () => {
    const visualizer = new ContextualDependencyGraphVisualizer();
    const dependency: ContextualDependency = {
      sourceId: "A",
      targetId: "B",
      dependencyType: "standard",
      message: "Standard link",
    };
    visualizer.addDependency(dependency);
    expect(visualizer.getDependencies()).toContainEqual(dependency);
  });

  it("should add and retrieve temporal and resource constraints", () => {
    const visualizer = new ContextualDependencyGraphVisualizer();
    const temporal: TemporalConstraint = {
      start_time: 100,
      end_time: 200,
      description: "Must happen between 100 and 200",
    };
    const resource: ResourceConstraint = {
      resource_name: "CPU",
      required_amount: 2,
      unit: "cores",
    };
    visualizer.addTemporalConstraint(temporal);
    visualizer.addResourceConstraint(resource);

    expect(visualizer.getTemporalConstraints()).toContainEqual(temporal);
    expect(visualizer.getResourceConstraints()).toContainEqual(resource);
  });
});