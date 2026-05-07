import { EventEmitter } from "node:events";

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

export type PluginContext = {
  history: Message[];
  current_context: Record<string, unknown>;
  metadata: Record<string, unknown>;
  event_emitter: EventEmitter;
};

export interface IPlugin {
  readonly name: string;
  getMetadata(): {
    description: string;
    hook_points: string[];
  };
  initialize(): Promise<void>;
  execute(context: PluginContext): Promise<PluginContext>;
}

export class PluginHostManager extends EventEmitter {
  private plugins: IPlugin[] = [];

  constructor() {
    super();
  }

  public async loadPlugin(plugin: IPlugin): Promise<void> {
    if (this.plugins.some(p => p.name === plugin.name)) {
      throw new Error(`Plugin already loaded: ${plugin.name}`);
    }
    await plugin.initialize();
    this.plugins.push(plugin);
    console.log(`[PluginHostManager] Loaded and initialized plugin: ${plugin.name}`);
  }

  public getPluginMetadata(): {
    all_plugins: {
      name: string;
      description: string;
      hook_points: string[];
    }[];
  } {
    return this.plugins.map(plugin => ({
      name: plugin.name,
      description: plugin.getMetadata().description,
      hook_points: plugin.getMetadata().hook_points,
    }));
  }

  /**
   * Executes all loaded plugins sequentially for a given hook point.
   * Plugins can modify the context passed through the chain.
   * @param hookPoint The specific lifecycle point (e.g., 'pre_tool_call').
   * @param initialContext The starting context for the execution chain.
   * @returns The final, modified context after all plugins have run.
   */
  public async executePlugins(
    hookPoint: string,
    initialContext: PluginContext
  ): Promise<PluginContext> {
    let currentContext: PluginContext = {
      history: initialContext.history,
      current_context: { ...initialContext.current_context },
      metadata: { ...initialContext.metadata },
      event_emitter: initialContext.event_emitter,
    };

    const relevantPlugins = this.plugins.filter(plugin =>
      plugin.getMetadata().hook_points.includes(hookPoint)
    );

    if (relevantPlugins.length === 0) {
      return currentContext;
    }

    for (const plugin of relevantPlugins) {
      try {
        currentContext = await plugin.execute(currentContext);
      } catch (error) {
        this.emit("plugin_execution_error", {
          pluginName: plugin.name,
          hookPoint: hookPoint,
          error: error,
        });
        // Decide whether to halt or continue on error
      }
    }

    return currentContext;
  }
}

export { PluginHostManager };