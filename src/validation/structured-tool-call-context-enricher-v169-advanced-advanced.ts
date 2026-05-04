import { Message, ContentBlock, TextBlock, ToolUseBlock, ThinkingBlock } from "./types";

export enum MergeStrategy {
  Precedence = "precedence",
  Merge = "merge",
  Deduplicate = "deduplicate",
}

export interface ContextSource {
  priority: number;
  data: Message;
}

export class StructuredToolCallContextEnricher {
  private sources: ContextSource[];
  private strategy: MergeStrategy;

  constructor(sources: ContextSource[], strategy: MergeStrategy) {
    this.sources = sources;
    this.strategy = strategy;
  }

  private resolveConflict(
    key: string,
    values: (any)[],
  ): any {
    switch (this.strategy) {
      case MergeStrategy.Precedence:
        // For precedence, we assume the source with the highest priority
        // that contributed to this key wins. Since we process sources
        // in order, we need a more complex mechanism if the key conflict
        // is within the *content* of the message, not just the message object itself.
        // For simplicity here, we'll assume the last highest priority source wins.
        // A real implementation would need to track which source provided the value.
        // For now, we take the last one encountered if multiple sources contribute.
        return values[values.length - 1];

      case MergeStrategy.Merge:
        // For merging, we attempt to combine arrays or objects.
        // This is highly dependent on the structure.
        // For simplicity, if it's an array, we deduplicate and concatenate.
        if (Array.isArray(values)) {
          const uniqueSet = new Set<any>();
          const mergedArray: any[] = [];
          for (const value of values) {
            if (!uniqueSet.has(value)) {
              uniqueSet.add(value);
              mergedArray.push(value);
            }
          }
          return mergedArray;
        }
        // For non-array types, the last one wins (similar to precedence fallback)
        return values[values.length - 1];

      case MergeStrategy.Deduplicate:
        // Deduplicate based on JSON string representation for complex types
        const uniqueMap = new Map<string, any>();
        for (const value of values) {
          const key = JSON.stringify(value);
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, value);
          }
        }
        return Array.from(uniqueMap.values());

      default:
        return values[values.length - 1];
    }
  }

  public enrichContext(): Message {
    if (this.sources.length === 0) {
      throw new Error("Context sources cannot be empty.");
    }

    // Use a Map to aggregate properties by key across all sources
    const aggregatedData = new Map<string, any>();

    for (const source of this.sources) {
      const data = source.data;
      if (typeof data !== 'object' || data === null) continue;

      // Simple deep merge simulation for demonstration.
      // In a real scenario, we'd need to traverse the structure (Message/ContentBlock)
      // and apply the strategy at every conflicting leaf node.
      const processMessage = (message: Message, currentMap: Map<string, any>) => {
        if (typeof message !== 'object' || message === null) return;

        for (const key in message) {
          if (!Object.prototype.hasOwnProperty.call(message, key)) continue;
          const value = (message as any)[key];

          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            if (!currentMap.has(key) || typeof currentMap.get(key) !== 'object') {
              currentMap.set(key, {});
            }
            const nestedMap = currentMap.get(key) as Record<string, any>;
            processMessage(value as Message, nestedMap);
          } else {
            const existingValues = currentMap.get(key) as any[] || [];
            const allValues = [...existingValues, value];
            const resolvedValue = this.resolveConflict(key, allValues);
            currentMap.set(key, resolvedValue);
          }
        }
      };

      // Since Message structure is fixed (role, content), we focus on merging content blocks
      // and potentially overriding top-level fields if they conflict.
      const mergedMessage: Partial<Message> = {};

      // 1. Merge top-level fields (role, etc.) - usually only one source is valid for role
      for (const key in data) {
        if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
        const value = (data as any)[key];

        if (key === 'role' || key === 'tool_use_id') {
          // For role/ID, precedence dictates the winner
          if (!mergedMessage[key] || source.priority > (mergedMessage as any)[key].priority) {
             mergedMessage[key] = { [key]: value, priority: source.priority };
          }
        } else if (key === 'content') {
          // Content is an array of ContentBlock, this is where merging is critical
          const existingContent = (mergedMessage as any).content || [];
          const newContent = Array.isArray(value) ? value : [value];

          const allContentBlocks: ContentBlock[] = [...(existingContent as ContentBlock[]), ...(newContent as ContentBlock[])];
          
          // Simple deduplication for ContentBlock array
          const uniqueContentMap = new Map<string, ContentBlock>();
          for (const block of allContentBlocks) {
              const key = JSON.stringify(block);
              if (!uniqueContentMap.has(key)) {
                  uniqueContentMap.set(key, block);
              }
          }
          (mergedMessage as any).content = Array.from(uniqueContentMap.values());
        } else {
            // Fallback for other fields
            const existingValues = (mergedMessage as any)[key] as any[] || [];
            const allValues = [...existingValues, value];
            const resolvedValue = this.resolveConflict(key, allValues);
            (mergedMessage as any)[key] = resolvedValue;
        }
      }
      
      // Since the structure is complex, we return the result of the aggregation
      // which simulates the final merged message structure.
      return {
          role: data.role,
          content: (mergedMessage as any).content || (data as any).content,
          // Add other fields if necessary, but sticking to Message structure for return type
      } as Message;
    }
    
    // Fallback return, though the loop should handle it
    return this.sources[0].data;
  }
}