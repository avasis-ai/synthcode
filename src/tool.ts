// src/tool.ts
// Feature: Tool Execution
// Gap: SynthCode lacks a standardized way to define, register, and execute tools. The current approach uses a mix of global functions and ad-hoc communication between components. This can lead to tight coupling and make it difficult to reason about the flow of data and control.
// Approach: Introduce a standardized tool definition and execution model. Define a clear interface for tools, including input/output schemas, and provide a registry for registering tools. The orchestration layer should be responsible for scheduling and executing tools based on the defined model.
// Reference pattern:
// from enum import Enum
//
// from pydantic import BaseModel
//
//
// class WorkflowRunStatus(Enum):
//     FAILURE = 'failure'
//     COMPLETED = 'completed'
//     PENDING = 'pending'
//
//     def __eq__(self, other):
//         if isinstance(other, str):
//             return self.value == other
//         return super().__eq__(other)
//
//
// class WorkflowRun(BaseModel):
//     id: str
//     name: str
//     status: WorkflowRunStatus
//
//     model_config = {'use_enum_values': True}
//
//
// class WorkflowRunGroup(BaseModel):
//     runs: dict[str, Workf

// Existing SynthCode types (src/types.ts, first 500 chars):
// export type Message = UserMessage | AssistantMessage | ToolResultMessage;
//
// export interface UserMessage {
//   role: "user";
//   content: string;
// }
//
// export interface AssistantMessage {
//   role: "assistant";
//   content: ContentBlock[];
// }
//
// export interface ToolResultMessage {
//   role: "tool";
//   tool_use_id: string;
//   content: string;
//   is_error?: boolean;
// }
//
// export type ContentBlock = TextBlock | ToolUseBlock | ThinkingBlock;
//
// export interface TextBlock {
//   type: "text";
//   text: string;
// }
//
// export interfac

// Write ONLY the TypeScript code for src/tool.ts. No explanation.