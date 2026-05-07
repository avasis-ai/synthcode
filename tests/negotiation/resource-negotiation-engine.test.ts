import { describe, it, expect } from "vitest";
import { NegotiationProposal } from "../src/negotiation/resource-negotiation-engine.js";

describe("NegotiationProposal", () => {
  it("should correctly structure a basic proposal", () => {
    const proposal: NegotiationProposal = {
      id: "proposal-123",
      requiredResources: [
        {
          resourceId: "cpu-001",
          type: "CPU",
          quantity: 2,
          window: { start: new Date(), end: new Date() },
        },
      ],
      priority: 5,
      requesterId: "user-A",
    };
    expect(proposal.id).toBe("proposal-123");
    expect(proposal.priority).toBe(5);
    expect(proposal.requiredResources.length).toBe(1);
    expect(proposal.requiredResources[0].type).toBe("CPU");
  });

  it("should handle multiple resource types and requirements", () => {
    const proposal: NegotiationProposal = {
      id: "proposal-multi",
      requiredResources: [
        {
          resourceId: "mem-001",
          type: "Memory",
          quantity: 8,
          window: { start: new Date(), end: new Date() },
        },
        {
          resourceId: "gpu-002",
          type: "GPU",
          quantity: 1,
          window: { start: new Date(), end: new Date() },
        },
        {
          resourceId: "net-001",
          type: "Network",
          quantity: 100,
          window: { start: new Date(), end: new Date() },
        },
      ],
      priority: 10,
      requesterId: "user-B",
    };
    expect(proposal.requiredResources.length).toBe(3);
    expect(proposal.requiredResources.some(r => r.type === "Memory" && r.quantity === 8)).toBe(true);
    expect(proposal.requiredResources.some(r => r.type === "Network" && r.quantity === 100)).toBe(true);
  });

  it("should assign a unique ID and high priority to critical requests", () => {
    const proposal: NegotiationProposal = {
      id: "critical-proposal-456",
      requiredResources: [
        {
          resourceId: "storage-001",
          type: "Storage",
          quantity: 1000,
          window: { start: new Date(), end: new Date() },
        },
      ],
      priority: 100,
      requesterId: "system-admin",
    };
    expect(proposal.id).toBe("critical-proposal-456");
    expect(proposal.priority).toBe(100);
    expect(proposal.requesterId).toBe("system-admin");
  });
});