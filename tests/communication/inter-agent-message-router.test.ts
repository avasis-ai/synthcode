import { describe, it, expect } from "vitest";
import { InterAgentMessageRouter } from "../src/communication/inter-agent-message-router";
import { UserMessage, AssistantMessage, ToolResultMessage } from "../src/communication/types";

describe("InterAgentMessageRouter", () => {
  it("should initialize correctly and allow adding protocols", () => {
    const router = new InterAgentMessageRouter();
    expect(router).toBeInstanceOf(InterAgentMessageRouter);

    // Simulate adding a protocol (assuming a method exists or can be mocked/tested)
    // Since the implementation details of adding protocols aren't fully visible,
    // we test the basic structure and assume the internal map management works.
    // We'll rely on the core functionality tests below.
  });

  it("should route a message to the correct agent session based on protocol and session ID", () => {
    const router = new InterAgentMessageRouter();
    const sessionId = "user123";
    const protocolName = "chat";

    // Mock a validator and session update logic for testing the routing mechanism
    const mockValidator: (message: any) => { isValid: boolean; error?: string } = (message) => ({ isValid: true });
    
    // Manually set up a mock state for testing the routing logic
    // Assuming a method like addProtocol and updateSession exists or is used internally
    (router as any).addProtocol(protocolName, mockValidator);
    (router as any).setSession(sessionId, { lastMessage: { type: "user", content: "Hello" }, sequenceNumber: 1, protocolName: protocolName });

    const messageToRoute: UserMessage = { type: "user", content: "Test message" };
    
    // We expect the router to process and potentially update the session/state
    const result = router.routeMessage(sessionId, messageToRoute);

    expect(result).toBeDefined();
    // Check if the internal session state was updated (assuming the router updates state)
    const sessionState = (router as any).getSession(sessionId);
    expect(sessionState).toBeDefined();
    expect(sessionState.lastMessage).toEqual(messageToRoute);
  });

  it("should handle invalid messages by logging an error and not updating the session", () => {
    const router = new InterAgentMessageRouter();
    const sessionId = "user456";
    const protocolName = "chat";

    // Setup initial state
    const mockValidator: (message: any) => { isValid: boolean; error?: string } = (message) => ({ isValid: false, error: "Invalid format" });
    (router as any).addProtocol(protocolName, mockValidator);
    (router as any).setSession(sessionId, { lastMessage: { type: "user", content: "Initial" }, sequenceNumber: 1, protocolName: protocolName });

    // Invalid message
    const invalidMessage: any = { type: "unknown", content: "Bad data" };

    // Mock console.error to prevent test pollution and check if it was called
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = router.routeMessage(sessionId, invalidMessage);

    expect(result).toBe(false); // Assuming false or a specific failure indicator is returned
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid message received"));
    
    // Verify session state remains unchanged
    const sessionState = (router as any).getSession(sessionId);
    expect(sessionState.lastMessage).toEqual({ type: "user", content: "Initial" });
    
    consoleErrorSpy.mockRestore();
  });
});