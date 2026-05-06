import { setTimeout } from "timers/promises"

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

export interface ServiceCallRequest {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers: Record<string, string>;
  payload?: Record<string, unknown>;
}

export interface ServiceCallResult {
  success: boolean;
  data: Record<string, unknown>;
  statusCode: number;
  logs: string[];
}

export class ServiceCallManager {
  private readonly MAX_RETRIES: number = 3;
  private readonly INITIAL_BACKOFF_MS: number = 1000;

  private async executeHttpRequest(request: ServiceCallRequest): Promise<Response> {
    const response = await fetch(request.url, {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
        ...request.headers,
      },
      body: request.payload ? JSON.stringify(request.payload) : undefined,
    });
    return response;
  }

  private async executeWithRetry(request: ServiceCallRequest): Promise<ServiceCallResult> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < this.MAX_RETRIES) {
      try {
        const response = await this.executeHttpRequest(request);
        const statusCode = response.status;
        const data = await response.json().catch(() => ({}));
        
        if (statusCode >= 200 && statusCode < 300) {
          return {
            success: true,
            data: data,
            statusCode: statusCode,
            logs: [`Successfully executed call to ${request.url} on attempt ${attempt + 1}.`],
          };
        }

        if (statusCode === 429) {
          const retryAfter = parseInt(response.headers.get("Retry-After") || "5", 10) * 1000;
          throw new Error(`Rate limit exceeded (429). Retrying after ${retryAfter}ms.`);
        }

        if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
          return {
            success: false,
            data: { error: `Client error: ${statusCode}` },
            statusCode: statusCode,
            logs: [`Failed due to client error (${statusCode}). No retry performed.`],
          };
        }

        if (statusCode >= 500) {
          throw new Error(`Server error (${statusCode}). Retrying...`);
        }

      } catch (error) {
        lastError = error as Error;
        attempt++;
        
        if (attempt < this.MAX_RETRIES) {
          const backoffTime = this.INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
          console.warn(`Attempt ${attempt} failed. Retrying in ${backoffTime}ms. Error: ${error.message}`);
          await setTimeout(backoffTime);
        }
      }
    }

    return {
      success: false,
      data: { error: `Failed after ${this.MAX_RETRIES} attempts. Last error: ${lastError?.message || 'Unknown error'}` },
      statusCode: 0,
      logs: [`Failed to execute call after ${this.MAX_RETRIES} attempts.`],
    };
  }

  public async executeCall(request: ServiceCallRequest): Promise<ServiceCallResult> {
    return this.executeWithRetry(request);
  }

  public mapServiceError(statusCode: number, errorContent: Record<string, unknown>): { isRetryable: boolean; message: string } {
    if (statusCode === 429) {
      return { isRetryable: true, message: "Rate limit exceeded. Please wait and retry." };
    }
    if (statusCode === 503) {
      return { isRetryable: true, message: "Service unavailable. Try again later." };
    }
    if (statusCode === 401 || statusCode === 403) {
      return { isRetryable: false, message: "Authentication failed. Check credentials." };
    }
    return { isRetryable: false, message: `Unknown error (${statusCode}).` };
  }
}

export { ServiceCallManager }