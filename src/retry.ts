// src/retry.ts
// Feature: Retry Strategy
// Gap: SynthCode lacks a retry strategy pattern to handle transient errors in service calls. This is important for ensuring the agent can recover from temporary service outages without crashing.
// Approach: Implement a retry strategy in the agent loop. The retry strategy should be configurable and have a retry delay. If a service fails more than a certain number of times within a time window, the retry strategy should stop retrying for a period of time.
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
//     runs: dict[str, WorkflowRun]
//
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

// TypeScript for SynthCode. Rules: ESM .js imports, Zod schemas, defineTool(), Vitest tests, strict mode. Export main class/function. Under 150 lines. No comments. No markdown.