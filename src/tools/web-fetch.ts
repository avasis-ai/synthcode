import { z } from 'zod';
import { defineTool } from './tool.js';

const MAX_RESPONSE_SIZE = 100 * 1024;

export const WebFetchTool = defineTool({
  name: 'web_fetch',
  description:
    'Fetch content from a URL. Returns the response body as text. Supports HTTP and HTTPS.',
  inputSchema: z.object({
    url: z.string().url().describe('The URL to fetch'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional().describe('HTTP method (default: GET)'),
    headers: z.record(z.string()).optional().describe('Request headers'),
    body: z.string().optional().describe('Request body (for POST/PUT)'),
  }),
  isReadOnly: true,
  isConcurrencySafe: true,
  execute: async ({ url, method = 'GET', headers, body }, context) => {
    try {
      if (context.abortSignal?.aborted) {
        return 'Request aborted before execution';
      }

      const timeoutSignal = AbortSignal.timeout(30_000);
      let signal: AbortSignal;
      if (context.abortSignal) {
        signal = AbortSignal.any([context.abortSignal, timeoutSignal]);
      } else {
        signal = timeoutSignal;
      }

      const fetchOptions: RequestInit = {
        method,
        headers,
        signal,
        redirect: 'follow',
      };

      if (body && method !== 'GET') {
        fetchOptions.body = body;
      }

      const response = await fetch(url, fetchOptions);
      const contentType = response.headers.get('content-type') ?? 'unknown';
      const status = response.status;

      const text = await response.text();

      let result = `Status: ${status}\nContent-Type: ${contentType}\n\n`;
      if (text.length > MAX_RESPONSE_SIZE) {
        const half = Math.floor(MAX_RESPONSE_SIZE / 2);
        const notice = `\n\n... [response truncated: showing first ${half} and last ${half} of ${text.length} characters] ...\n\n`;
        result += text.slice(0, half) + notice + text.slice(-half);
      } else {
        result += text;
      }

      return result;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return 'Request aborted';
      }
      return `Error fetching URL: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
});
