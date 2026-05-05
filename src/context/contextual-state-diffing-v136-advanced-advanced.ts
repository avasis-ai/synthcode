import { Context } from "./context-types";
import { StatePayload } from "./state-payload";

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: ContentBlock[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;

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

export type LoopEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_result"; tool_use_id: string; content: string };

export interface StatePayload {
  messages: Message[];
  history: LoopEvent[];
  metadata: Record<string, unknown>;
  resourceUsage: {
    cpu_cycles: number;
    memory_bytes: number;
    network_transfers: number;
  };
}

export interface StructuralDiff {
  messages: Record<string, any>;
  history: Record<string, any>;
  metadata: Record<string, any>;
}

export interface SemanticDiff {
  message_summary: string | null;
  intent_shift: boolean;
}

export interface TemporalResourceDrift {
  cpu_drift_ratio: number;
  memory_drift_ratio: number;
  network_drift_ratio: number;
  drift_description: string;
}

export interface DriftReport {
  structural: StructuralDiff;
  semantic: SemanticDiff;
  temporal_resource_drift: TemporalResourceDrift;
  is_significant_drift: boolean;
}

class TemporalResourceDriftCalculator {
  calculate(prevState: StatePayload, nextState: StatePayload): TemporalResourceDrift {
    const initial = prevState.resourceUsage;
    const final = nextState.resourceUsage;

    const cpuDrift = Math.max(0, (final.cpu_cycles - initial.cpu_cycles) / Math.max(1, initial.cpu_cycles));
    const memDrift = Math.max(0, (final.memory_bytes - initial.memory_bytes) / Math.max(1, initial.memory_bytes));
    const netDrift = Math.max(0, (final.network_transfers - initial.network_transfers) / Math.max(1, initial.network_transfers));

    const driftDescription = `CPU increased by ${(cpuDrift * 100).toFixed(2)}%, Memory by ${(memDrift * 100).toFixed(2)}%, Network by ${(netDrift * 100).toFixed(2)}%.`;

    return {
      cpu_drift_ratio: cpuDrift,
      memory_drift_ratio: memDrift,
      network_drift_ratio: netDrift,
      drift_description: driftDescription,
    };
  }
}

export class ContextualStateDiffingV136AdvancedAdvanced {
  private driftCalculator: TemporalResourceDriftCalculator;

  constructor() {
    this.driftCalculator = new TemporalResourceDriftCalculator();
  }

  private calculateStructuralDiff(currentState: StatePayload, nextState: StatePayload): StructuralDiff {
    const structuralDiff: Partial<StructuralDiff> = {
      messages: {},
      history: {},
      metadata: {}
    };

    // Simplified structural comparison for demonstration
    const messageDiff: Record<string, any> = {};
    const currentMessagesMap = new Map<string, any>();
    const nextMessagesMap = new Map<string, any>();

    currentState.messages.forEach(msg => currentMessagesMap.set(msg.role + msg.content, msg));
    nextState.messages.forEach(msg => nextMessagesMap.set(msg.role + msg.content, msg));

    // In a real scenario, this would deep compare array/object contents
    messageDiff.message_count_change = Math.abs(currentState.messages.length - nextState.messages.length);
    messageDiff.roles_present = new Set([...currentState.messages.map(m => m.role), ...nextState.messages.map(m => m.role)]);

    structuralDiff.messages = messageDiff;

    // Placeholder for history and metadata diffing
    structuralDiff.history = { length_change: Math.abs(currentState.history.length - nextState.history.length) };
    structuralDiff.metadata = { keys_added: Object.keys(nextState.metadata).filter(key => !(key in currentState.metadata)).length };

    return structuralDiff as StructuralDiff;
  }

  private calculateSemanticDiff(currentState: StatePayload, nextState: StatePayload): SemanticDiff {
    // Placeholder for advanced NLP/LLM-based semantic comparison
    let summary: string | null = null;
    let intentShift: boolean = false;

    if (currentState.messages.length > 0 && nextState.messages.length > 0) {
      // Mock logic: If the last message role changed significantly, assume intent shift
      const lastCurrentRole = currentState.messages[currentState.messages.length - 1]?.role;
      const lastNextRole = nextState.messages[nextState.messages.length - 1]?.role;

      if (lastCurrentRole !== lastNextRole) {
        intentShift = true;
      }
      summary = `Semantic analysis suggests transition from ${lastCurrentRole || 'N/A'} to ${lastNextRole || 'N/A'}.`;
    }

    return {
      message_summary: summary,
      intent_shift: intentShift,
    };
  }

  public calculateAdvancedDiff(currentState: StatePayload, nextState: StatePayload, context: Context): { report: DriftReport; updatedContext: Context } {
    const structuralDiff = this.calculateStructuralDiff(currentState, nextState);
    const semanticDiff = this.calculateSemanticDiff(currentState, nextState);
    const temporalResourceDrift = this.driftCalculator.calculate(currentState, nextState);

    const isSignificantDrift = structuralDiff.messages.message_count_change > 2 || semanticDiff.intent_shift || temporalResourceDrift.cpu_drift_ratio > 0.5;

    const report: DriftReport = {
      structural: structuralDiff,
      semantic: semanticDiff,
      temporal_resource_drift: temporalResourceDrift,
      is_significant_drift: isSignificantDrift,
    };

    // Update context based on the analysis
    const updatedContext: Context = {
      ...context,
      last_diff_report: report,
      last_state_snapshot: nextState,
    };

    return { report, updatedContext };
  }
}