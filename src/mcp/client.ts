import type { ChildProcess } from "node:child_process";

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPServerConfig {
  type: "stdio" | "sse";
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  headers?: Record<string, string>;
}

export class MCPClient {
  private config: MCPServerConfig;
  private tools: MCPToolDefinition[] = [];
  private proc: ChildProcess | null = null;
  private initialized = false;
  private nextId = 1;
  private messageBuffer = "";
  private pendingHandlers: Map<number, (msg: unknown) => void> = new Map();
  private sseEventSource: EventSource | null = null;
  private sseMessageEndpoint: string | null = null;

  constructor(config: MCPServerConfig) {
    this.config = config;
  }

  private send(proc: ChildProcess, method: string, params: Record<string, unknown>, id?: number): number {
    const msgId = id ?? this.nextId++;
    const msg = JSON.stringify({ jsonrpc: "2.0", id: msgId, method, params });
    proc.stdin!.write(msg + "\n");
    return msgId;
  }

  private setupMessageHandler(proc: ChildProcess): void {
    proc.stdout!.on("data", (data: Buffer) => {
      this.messageBuffer += data.toString();
      const lines = this.messageBuffer.split("\n");
      this.messageBuffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id !== undefined && this.pendingHandlers.has(msg.id)) {
            const handler = this.pendingHandlers.get(msg.id)!;
            this.pendingHandlers.delete(msg.id);
            handler(msg);
          } else if (msg.method === "initialize" && msg.id) {
            proc.stdin!.write(JSON.stringify({
              jsonrpc: "2.0",
              id: msg.id,
              result: { protocolVersion: "2024-11-05", capabilities: {}, serverInfo: { name: "synthcode-mcp-proxy", version: "0.6.0" } },
            }) + "\n");
          }
        } catch {}
      }
    });
    proc.stderr!.on("data", () => {});
  }

  async connect(): Promise<void> {
    if (this.config.type === "stdio") {
      const { spawn } = await import("node:child_process");
      const proc = spawn(this.config.command!, this.config.args ?? [], {
        env: { ...process.env, ...this.config.env },
        stdio: ["pipe", "pipe", "pipe"],
      });
      proc.on("error", (err) => { throw err; });
      proc.on("close", () => { this.initialized = false; });
      this.proc = proc;
      this.setupMessageHandler(proc);
      await new Promise<void>((resolve) => {
        const handler = (_data: Buffer) => {
          proc.stdout!.off("data", handler);
          resolve();
        };
        proc.stdout!.on("data", handler);
        setTimeout(() => {
          proc.stdout!.off("data", handler);
          resolve();
        }, 2000);
      });
      this.initialized = true;
    }
    if (this.config.type === "sse") {
      if (!this.config.url) throw new Error("SSE MCP server requires a url");

      const baseUrl = this.config.url.replace(/\/$/, "");
      const sseUrl = baseUrl.includes("/sse") ? baseUrl : `${baseUrl}/sse`;
      const headers: Record<string, string> = {
        "Accept": "text/event-stream",
        ...this.config.headers,
      };

      this.sseEventSource = new EventSource(sseUrl, { headers } as ConstructorParameters<typeof EventSource>[1]);

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("SSE connection timeout"));
        }, 10000);

        this.sseEventSource!.addEventListener("endpoint", (event) => {
          const endpointPath = (event as MessageEvent).data as string;
          this.sseMessageEndpoint = endpointPath.startsWith("http")
            ? endpointPath
            : `${new URL(baseUrl).origin}${endpointPath}`;
          clearTimeout(timeout);
          resolve();
        });

        this.sseEventSource!.addEventListener("message", (event) => {
          try {
            const msg = JSON.parse((event as MessageEvent).data as string);
            if (msg.id !== undefined && this.pendingHandlers.has(msg.id)) {
              const handler = this.pendingHandlers.get(msg.id)!;
              this.pendingHandlers.delete(msg.id);
              handler(msg);
            }
          } catch {}
        });

        this.sseEventSource!.onerror = () => {
          clearTimeout(timeout);
          if (!this.sseMessageEndpoint) {
            reject(new Error(`Failed to connect to SSE endpoint: ${sseUrl}`));
          }
        };
      });

      this.initialized = true;
    }
  }

  private async sseSend(method: string, params: Record<string, unknown>, id?: number): Promise<number> {
    const msgId = id ?? this.nextId++;
    if (!this.sseMessageEndpoint) throw new Error("SSE message endpoint not initialized");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.config.headers,
    };

    const response = await fetch(this.sseMessageEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ jsonrpc: "2.0", id: msgId, method, params }),
    });

    if (!response.ok) {
      throw new Error(`SSE send failed: ${response.status} ${response.statusText}`);
    }

    return msgId;
  }

  async listTools(): Promise<MCPToolDefinition[]> {
    if (this.config.type === "stdio" && this.proc) {
      const id = this.nextId++;
      const tools = await new Promise<MCPToolDefinition[]>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingHandlers.delete(id);
          reject(new Error("MCP listTools timeout"));
        }, 10000);
        this.pendingHandlers.set(id, (msg: unknown) => {
          clearTimeout(timeout);
          const m = msg as Record<string, unknown>;
          if ((m.result as Record<string, unknown>)?.tools) {
            resolve(
              ((m.result as Record<string, unknown>).tools as Record<string, unknown>[]).map((t) => ({
                name: t.name as string,
                description: (t.description as string) ?? "",
                inputSchema: (t.inputSchema as Record<string, unknown>) ?? { type: "object", properties: {} },
              })),
            );
          } else {
            resolve([]);
          }
        });
      });
      this.send(this.proc!, "tools/list", {}, id);
      this.tools = tools;
      return tools;
    }
    if (this.config.type === "sse" && this.sseEventSource && this.sseMessageEndpoint) {
      const id = await this.sseSend("tools/list", {});
      const tools = await new Promise<MCPToolDefinition[]>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingHandlers.delete(id);
          reject(new Error("SSE MCP listTools timeout"));
        }, 10000);
        this.pendingHandlers.set(id, (msg: unknown) => {
          clearTimeout(timeout);
          const m = msg as Record<string, unknown>;
          if ((m.result as Record<string, unknown>)?.tools) {
            resolve(
              ((m.result as Record<string, unknown>).tools as Record<string, unknown>[]).map((t) => ({
                name: t.name as string,
                description: (t.description as string) ?? "",
                inputSchema: (t.inputSchema as Record<string, unknown>) ?? { type: "object", properties: {} },
              })),
            );
          } else {
            resolve([]);
          }
        });
      });
      this.tools = tools;
      return tools;
    }
    return [];
  }

  async callTool(
    name: string,
    input: Record<string, unknown>,
  ): Promise<string> {
    if (this.config.type === "stdio" && this.proc) {
      const id = this.nextId++;
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingHandlers.delete(id);
          reject(new Error("MCP callTool timeout"));
        }, 30000);
        this.pendingHandlers.set(id, (msg: unknown) => {
          clearTimeout(timeout);
          const m = msg as Record<string, unknown>;
          if (m.result) {
            resolve(typeof m.result === "string" ? m.result : JSON.stringify(m.result));
          } else if (m.error) {
            reject(
              new Error(
                ((m.error as Record<string, unknown>).message as string) ?? "MCP tool error",
              ),
            );
          }
        });
        this.send(this.proc!, "tools/call", { name, arguments: input }, id);
      });
    }
    if (this.config.type === "sse" && this.sseEventSource && this.sseMessageEndpoint) {
      const id = await this.sseSend("tools/call", { name, arguments: input });
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingHandlers.delete(id);
          reject(new Error("SSE MCP callTool timeout"));
        }, 30000);
        this.pendingHandlers.set(id, (msg: unknown) => {
          clearTimeout(timeout);
          const m = msg as Record<string, unknown>;
          if (m.result) {
            const content = (m.result as Record<string, unknown>).content;
            if (Array.isArray(content)) {
              const textParts = content
                .filter((c: Record<string, unknown>) => c.type === "text")
                .map((c: Record<string, unknown>) => c.text as string);
              resolve(textParts.join("\n") || JSON.stringify(m.result));
            } else {
              resolve(typeof m.result === "string" ? m.result : JSON.stringify(m.result));
            }
          } else if (m.error) {
            reject(
              new Error(
                ((m.error as Record<string, unknown>).message as string) ?? "SSE MCP tool error",
              ),
            );
          }
        });
      });
    }
    throw new Error("MCP client not connected");
  }

  async disconnect(): Promise<void> {
    if (this.proc) {
      this.proc.kill();
      this.proc = null;
    }
    if (this.sseEventSource) {
      this.sseEventSource.close();
      this.sseEventSource = null;
      this.sseMessageEndpoint = null;
    }
  }

  getTools(): MCPToolDefinition[] {
    return this.tools;
  }
}
