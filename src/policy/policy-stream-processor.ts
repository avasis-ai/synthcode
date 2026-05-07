import { EventEmitter } from "events";

export type Message = { role: "user"; content: string } | { role: "assistant"; content: any[] } | { role: "tool"; tool_use_id: string; content: string; is_error?: boolean };

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; tool_use_id: string; content: string };

export interface PolicyViolationEvent {
  policyName: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  violationDetails: string;
  suggestedAction: "PAUSE" | "MODIFY_GOAL" | "CONTINUE" | "NONE";
  timestamp: number;
}

export type PolicyCheckFunction = (event: LoopEvent) => PolicyViolationEvent | null;

export interface Policy {
  name: string;
  description: string;
  check: PolicyCheckFunction;
}

export class PolicyStreamProcessor extends EventEmitter {
  private policies: Policy[] = [];

  registerPolicy(policy: Policy): void {
    this.policies.push(policy);
  }

  /**
   * Processes an incoming stream event against all registered policies.
   * Emits a PolicyViolationEvent for every violation found.
   * @param event The incoming stream event.
   */
  processStreamEvent(event: LoopEvent): void {
    const violations: PolicyViolationEvent[] = [];

    for (const policy of this.policies) {
      const violation = policy.check(event);
      if (violation) {
        violations.push(violation);
      }
    }

    if (violations.length > 0) {
      // Emit all detected violations
      violations.forEach(violation => this.emit("policyViolation", violation));
    } else {
      this.emit("policySuccess", { event, message: "All policies passed." });
    }
  }

  /**
   * Simulates starting the subscription to an external data stream.
   * In a real application, this would connect to a Kafka topic, WebSocket, etc.
   */
  startStreamSubscription(streamHandler: (event: LoopEvent) => void): void {
    console.log("PolicyStreamProcessor: Starting stream subscription...");
    // Simulate continuous listening loop
    setInterval(() => {
      // In a real scenario, the stream source would call streamHandler
      // For demonstration, we assume the external system calls processStreamEvent directly
    }, 100);
  }
}

export { PolicyStreamProcessor };