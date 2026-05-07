export type Message = any
export interface UserMessage {
  role: "user";
  content: string;
}

export interface AssistantMessage {
  role: "assistant";
  content: any[];
}

export interface ToolResultMessage {
  role: "tool";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = any

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

export type LoopEvent = any

export type LineageSource = {
  sourceId: string;
  sourceType: string;
  description: string;
}

export type TransformationMetadata = {
  transformationId: string;
  transformationName: string;
  ruleDescription: string;
}

export interface LineageRecord {
  timestamp: number;
  source: LineageSource;
  transformation: TransformationMetadata;
  inputs: Record<string, unknown>;
  output: Record<string, unknown>;
}

export class DataLineageTracker {
  private lineageRecords: LineageRecord[] = [];

  /**
   * Records a single lineage event, capturing the source, transformation applied,
   * and the input/output data payloads.
   * @param source Metadata describing where the data originated.
   * @param transformation Metadata describing the rule or function applied.
   * @param inputs The data used as input for the transformation.
   * @param output The resulting data after the transformation.
   * @returns The created LineageRecord.
   */
  public recordLineage(
    source: LineageSource,
    transformation: TransformationMetadata,
    inputs: Record<string, unknown>,
    output: Record<string, unknown>
  ): LineageRecord {
    const record: LineageRecord = {
      timestamp: Date.now(),
      source: source,
      transformation: transformation,
      inputs: inputs,
      output: output,
    };
    this.lineageRecords.push(record);
    return record;
  }

  /**
   * Retrieves all recorded lineage records.
   * @returns An array of LineageRecord objects.
   */
  public getLineageHistory(): ReadonlyArray<LineageRecord> {
    return this.lineageRecords;
  }

  /**
   * Clears all recorded lineage history.
   */
  public clearHistory(): void {
    this.lineageRecords = [];
  }
}

export { DataLineageTracker }