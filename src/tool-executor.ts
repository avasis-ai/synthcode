from enum import Enum

from pydantic import BaseModel


class WorkflowRunStatus(Enum):
    FAILURE = 'failure'
    COMPLETED = 'completed'
    PENDING = 'pending'

    def __eq__(self, other):
        if isinstance(other, str):
            return self.value == other
        return super().__eq__(other)


class WorkflowRun(BaseModel):
    id: str
    name: str
    status: WorkflowRunStatus

    model_config = {'use_enum_values': True}


class WorkflowRunGroup(BaseModel):
    runs: dict[str, WorkflowRun]


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
  tool_id: string;
  config?: any;
  inputs?: any;
}

export interface ThinkingBlock {
  type: "thinking";
  text: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  inputs: any;
  outputs: any;
  config_schema?: any;
  dependencies?: any;
}

export interface ToolExecutorConfig {
  tool_registry_url: string;
  default_tool_config?: any;
}

export class ToolExecutor {
  private _tool_registry_url: string;
  private _default_tool_config?: any;
  private _tools: { [key: string]: any } = {};

  constructor(config: ToolExecutorConfig) {
    this._tool_registry_url = config.tool_registry_url;
    this._default_tool_config = config.default_tool_config;
  }

  async load_tool_definitions(): Promise<void> {
    // Implementation details omitted for brevity
  }

  async execute_tool(
    tool_id: string,
    inputs: any,
    config?: any,
    parent_run?: WorkflowRun
  ): Promise<WorkflowRun> {
    // Implementation details omitted for brevity
  }

  private _run_tool(
    tool_id: string,
    inputs: any,
    config?: any,
    parent_run?: WorkflowRun
  ): Promise<WorkflowRun> {
    // Implementation details omitted for brevity
  }

  private _handle_tool_output(
    tool_use_id: string,
    output: any,
    parent_run: WorkflowRun
  ): void {
    // Implementation details omitted for brevity
  }

  private _handle_tool_error(
    tool_use_id: string,
    error: any,
    parent_run: WorkflowRun
  ): void {
    // Implementation details omitted for brevity
  }

  private _create_workflow_run(
    name: string,
    status: WorkflowRunStatus,
    parent_run?: WorkflowRun
  ): WorkflowRun {
    // Implementation details omitted for brevity
  }

  private _update_workflow_run(
    run: WorkflowRun,
    status: WorkflowRunStatus,
    message?: string
  ): void {
    // Implementation details omitted for brevity
  }

  private _log(message: string): void {
    // Implementation details omitted for brevity
  }
}

export function defineTool(
  id: string,
  name: string,
  description: string,
  inputs: any,
  outputs: any,
  config_schema?: any,
  dependencies?: any
): ToolDefinition {
  return {
    id,
    name,
    description,
    inputs,
    outputs,
    config_schema,
    dependencies
  };
}

export function createWorkflowRun(
  name: string,
  status: WorkflowRunStatus,
  parent_run?: WorkflowRun
): WorkflowRun {
  return new ToolExecutor({})._create_workflow_run(name, status, parent_run);
}

export function updateWorkflowRun(
  run: WorkflowRun,
  status: WorkflowRunStatus,
  message?: string
): void {
  new ToolExecutor({})._update_workflow_run(run, status, message);
}

export function log(message: string): void {
  new ToolExecutor({})._log(message);
}

export function executeTool(
  tool_id: string,
  inputs: any,
  config?: any,
  parent_run?: WorkflowRun
): Promise<WorkflowRun> {
  return new ToolExecutor({}).execute_tool(tool_id, inputs, config, parent_run);
}

export function loadToolDefinitions(): Promise<void> {
  return new ToolExecutor({}).load_tool_definitions();
}

export function defineWorkflowRunGroup(runs: WorkflowRun[]): WorkflowRunGroup {
  return { runs };
}

export function createWorkflowRunGroup(runs: WorkflowRun[]): WorkflowRunGroup {
  return { runs };
}

export function updateWorkflowRunGroup(
  group: WorkflowRunGroup,
  status: WorkflowRunStatus,
  message?: string
): void {
  for (const run of group.runs) {
    updateWorkflowRun(run, status, message);
  }
}

export function logWorkflowRunGroup(group: WorkflowRunGroup): void {
  for (const run of group.runs) {
    log(`Run ${run.id}: ${run.status}`);
  }
}

export function executeWorkflowRunGroup(
  group: WorkflowRunGroup,
  config?: any
): Promise<WorkflowRunGroup> {
  return Promise.all(
    Object.values(group.runs).map((run) => executeTool(run.tool_use_id, run.inputs, config, run))
  ).then((runs) => ({ runs }));
}

e