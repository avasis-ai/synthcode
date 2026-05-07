import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
} from "./types";

type Message = UserMessage | AssistantMessage | ToolResultMessage;

type MessageProtocolValidator = (message: Message) => { isValid: boolean; error?: string };

interface AgentSession {
  lastMessage: Message;
  sequenceNumber: number;
  protocolName: string;
}

export class InterAgentMessageRouter {
  private protocols: Map<string, MessageProtocolValidator>;
  private sessions: Map<string, Map<string, AgentSession>>;

  constructor() {
    this.protocols = new Map<string, MessageProtocolValidator>();
    this.sessions = new Map<string, Map<string, AgentSession>>();
  }

  registerProtocol(protocolName: string, validator: MessageProtocolValidator): void {
    if (this.protocols.has(protocolName)) {
      throw new Error(`Protocol "${protocolName}" is already registered.`);
    }
    this.protocols.set(protocolName, validator);
  }

  private getSessionKey(agentId: string, targetId: string): string {
    return `${agentId}:${targetId}`;
  }

  private getOrCreateSession(agentId: string, targetId: string, initialProtocol: string): AgentSession {
    const key = this.getSessionKey(agentId, targetId);
    if (!this.sessions.has(key)) {
      const newSession: Map<string, AgentSession> = new Map();
      const initialSession: AgentSession = {
        lastMessage: { role: "user", content: "" },
        sequenceNumber: 0,
        protocolName: initialProtocol,
      };
      newSession.set(targetId, initialSession);
      this.sessions.set(key, newSession);
    }
    return this.sessions.get(key)!.get(targetId)!;
  }

  private validateMessage(protocolName: string, message: Message): { isValid: boolean; error?: string } {
    const validator = this.protocols.get(protocolName);
    if (!validator) {
      return { isValid: false, error: `No protocol registered for "${protocolName}"` };
    }
    return validator(message);
  }

  sendMessage(
    senderId: string,
    targetId: string,
    message: Message,
    protocolName: string
  ): { success: boolean; message: string; session?: AgentSession } {
    const sessionKey = this.getSessionKey(senderId, targetId);

    if (!this.protocols.has(protocolName)) {
      return { success: false, message: `Protocol "${protocolName}" is not registered.` };
    }

    const validationResult = this.validateMessage(protocolName, message);
    if (!validationResult.isValid) {
      return { success: false, message: `Message failed validation: ${validationResult.error}` };
    }

    const session = this.getOrCreateSession(senderId, targetId, protocolName);

    // Update session state
    const newSession: AgentSession = {
      lastMessage: message,
      sequenceNumber: session.sequenceNumber + 1,
      protocolName: protocolName,
    };

    const sessionsMap = this.sessions.get(sessionKey)!;
    sessionsMap.set(targetId, newSession);

    return {
      success: true,
      message: `Message successfully routed from ${senderId} to ${targetId}. Sequence: ${newSession.sequenceNumber}`,
      session: newSession,
    };
  }
}