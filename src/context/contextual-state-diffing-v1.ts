import {
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
} from "./types";

type Context = {
  messages: Message[];
  tools: Record<string, any>;
  memory: Map<string, any>;
  graphNodes: Map<string, any>;
};

export interface ContextDiff {
  messages: {
    added: Message[];
    removed: Message[];
    modified: { old: Message; new: Message }[];
  };
  tools: {
    added: Record<string, any>;
    removed: Record<string, any>;
    modified: Record<string, { old: any; new: any }>;
  };
  memory: {
    added: Map<string, any>;
    removed: Map<string, any>;
    modified: Map<string, { old: any; new: any }>;
  };
  graphNodes: {
    added: Map<string, any>;
    removed: Map<string, any>;
    modified: Map<string, { old: any; new: any }>;
  };
}

type Message = UserMessage | AssistantMessage | ToolResultMessage;

const deepEqual = (a: any, b: any): boolean => {
  if (typeof a !== typeof b) return false;
  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
    if (Array.isArray(a) && !Array.isArray(b)) return false;
    if (!Array.isArray(a) && Array.isArray(b)) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key) || !deepEqual(a[key], b[key])) {
        return false;
      }
    }
    return true;
  }
  return a === b;
};

const diffMessages = (oldMessages: Message[], newMessages: Message[]): {
  added: Message[];
  removed: Message[];
  modified: { old: Message; new: Message }[];
} => {
  const oldMap = new Map<string, Message>();
  const newMap = new Map<string, Message>();

  oldMessages.forEach((msg, index) => oldMap.set(`${msg.role}:${index}`, msg));
  newMessages.forEach((msg, index) => newMap.set(`${msg.role}:${index}`, msg));

  const added: Message[] = [];
  const removed: Message[] = [];
  const modified: { old: Message; new: Message }[] = [];

  // Simple index-based comparison for messages (assuming order matters and structure is stable)
  const maxLen = Math.max(oldMessages.length, newMessages.length);

  for (let i = 0; i < maxLen; i++) {
    const oldMsg = oldMessages[i];
    const newMsg = newMessages[i];

    if (!oldMsg && newMsg) {
      added.push(newMsg);
    } else if (oldMsg && !newMsg) {
      removed.push(oldMsg);
    } else if (oldMsg && newMsg && !deepEqual(oldMsg, newMsg)) {
      modified.push({ old: oldMsg, new: newMsg });
    }
  }

  return { added, removed, modified };
};

const diffMap = <K extends string, V>(
  oldMap: Map<K, V>,
  newMap: Map<K, V>
): {
  added: Map<K, V>;
  removed: Map<K, V>;
  modified: Map<K, { old: V; new: V }>;
} => {
  const added = new Map<K, V>();
  const removed = new Map<K, V>();
  const modified = new Map<K, { old: V; new: V }>();

  const allKeys = new Set<K>([...oldMap.keys(), ...newMap.keys()]);

  for (const key of allKeys) {
    const oldVal = oldMap.get(key);
    const newVal = newMap.get(key);

    if (!oldVal && newVal) {
      added.set(key, newVal);
    } else if (oldVal && !newVal) {
      removed.set(key, oldVal);
    } else if (oldVal && newVal && !deepEqual(oldVal, newVal)) {
      modified.set(key, { old: oldVal, new: newVal });
    }
  }

  return { added, removed, modified };
};

const calculateDiff = (
  oldContext: Context,
  newContext: Context
): ContextDiff => {
  const msgDiff = diffMessages(oldContext.messages, newContext.messages);

  const toolDiff = diffMap<string, any>(
    new Map(Object.entries(oldContext.tools)),
    new Map(Object.entries(newContext.tools))
  );

  const memoryDiff = diffMap<string, any>(
    oldContext.memory,
    newContext.memory
  );

  const graphDiff = diffMap<string, any>(
    oldContext.graphNodes,
    newContext.graphNodes
  );

  return {
    messages: msgDiff,
    tools: {
      added: toolDiff.added,
      removed: toolDiff.removed,
      modified: toolDiff.modified,
    },
    memory: {
      added: memoryDiff.added,
      removed: memoryDiff.removed,
      modified: memoryDiff.modified,
    },
    graphNodes: {
      added: graphDiff.added,
      removed: graphDiff.removed,
      modified: graphDiff.modified,
    },
  };
};

export { calculateDiff };