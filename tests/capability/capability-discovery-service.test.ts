import { describe, it, expect } from "vitest";
import { CapabilityDiscoveryService } from "../src/capability/capability-discovery-service";

describe("CapabilityDiscoveryService", () => {
  it("should be able to discover capabilities from a list of messages", async () => {
    const service = new CapabilityDiscoveryService();
    const messages = [
      { role: "user", content: "Can you help me book a flight to New York?" },
      { role: "assistant", content: "I can help with that. What are your travel dates?" },
    ];
    const capabilities = await service.discoverCapabilities(messages);
    expect(capabilities).toHaveLength(1);
    expect(capabilities[0].name).toBe("flight_booking");
  });

  it("should return an empty array if no capabilities are mentioned", async () => {
    const service = new CapabilityDiscoveryService();
    const messages = [
      { role: "user", content: "Hello, how are you doing today?" },
      { role: "assistant", content: "I'm doing well, thank you for asking!" },
    ];
    const capabilities = await service.discoverCapabilities(messages);
    expect(capabilities).toEqual([]);
  });

  it("should prioritize capabilities mentioned in user messages", async () => {
    const service = new CapabilityDiscoveryService();
    const messages = [
      { role: "assistant", content: "I can help with weather or stock prices." },
      { role: "user", content: "What's the weather like in London tomorrow?" },
    ];
    const capabilities = await service.discoverCapabilities(messages);
    expect(capabilities).toHaveLength(1);
    expect(capabilities[0].name).toBe("weather_query");
  });
});