import { describe, it, expect } from "vitest";
import {
  ResourceUsage,
  TemporalConstraint,
  GraphNodeMetadata,
} from "../src/visualization/tool-execution-dependency-graph-visualizer-v110";

describe("GraphNodeMetadata", () => {
  it("should correctly initialize with valid resource usage and temporal constraints", () => {
    const resourceUsage: ResourceUsage = {
      cpu_percent: 50.5,
      memory_mb: 1024,
      network_throughput_mbps: 50.0,
    };
    const temporalConstraint: TemporalConstraint = {
      start_time_ms: 1000,
      end_time_ms: 3000,
      duration_ms: 2000,
    };
    const nodeId = "node-abc-123";

    const metadata: GraphNodeMetadata = {
      nodeId: nodeId,
      resourceUsage: resourceUsage,
      temporalConstraint: temporalConstraint,
    };

    expect(metadata.nodeId).toBe(nodeId);
    expect(metadata.resourceUsage).toEqual(resourceUsage);
    expect(metadata.temporalConstraint).toEqual(temporalConstraint);
  });

  it("should handle zero values for resource usage metrics", () => {
    const resourceUsage: ResourceUsage = {
      cpu_percent: 0,
      memory_mb: 0,
      network_throughput_mbps: 0,
    };
    const temporalConstraint: TemporalConstraint = {
      start_time_ms: 0,
      end_time_ms: 0,
      duration_ms: 0,
    };
    const nodeId = "node-zero";

    const metadata: GraphNodeMetadata = {
      nodeId: nodeId,
      resourceUsage: resourceUsage,
      temporalConstraint: temporalConstraint,
    };

    expect(metadata.nodeId).toBe(nodeId);
    expect(metadata.resourceUsage).toEqual(resourceUsage);
    expect(metadata.temporalConstraint).toEqual(temporalConstraint);
  });

  it("should correctly structure metadata when only node ID is provided (assuming defaults if applicable, though structure requires all)", () => {
    // Since the interface requires all fields, we test a minimal valid structure
    const resourceUsage: ResourceUsage = {
      cpu_percent: 10.0,
      memory_mb: 512,
      network_throughput_mbps: 10.0,
    };
    const temporalConstraint: TemporalConstraint = {
      start_time_ms: 5000,
      end_time_ms: 7000,
      duration_ms: 2000,
    };
    const nodeId = "node-minimal";

    const metadata: GraphNodeMetadata = {
      nodeId: nodeId,
      resourceUsage: resourceUsage,
      temporalConstraint: temporalConstraint,
    };

    expect(metadata.nodeId).toBe(nodeId);
    expect(metadata.resourceUsage.cpu_percent).toBe(10.0);
    expect(metadata.temporalConstraint.duration_ms).toBe(2000);
  });
});