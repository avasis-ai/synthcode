import { exec } from 'node:child_process';
import { z } from 'zod';
import { defineTool } from './tool.js';

const MAX_OUTPUT = 50 * 1024;
const TRUNCATE_HALF = 25 * 1024;

function truncateOutput(output: string): string {
  if (output.length <= MAX_OUTPUT) return output;
  const notice = `\n\n... [output truncated: showing first ${TRUNCATE_HALF} and last ${TRUNCATE_HALF} of ${output.length} characters] ...\n\n`;
  return output.slice(0, TRUNCATE_HALF) + notice + output.slice(-TRUNCATE_HALF);
}

export const BashTool = defineTool({
  name: 'bash',
  description:
    'Execute a shell command. Returns stdout and stderr. Use for running build commands, git operations, package managers, and other CLI tools.',
  inputSchema: z.object({
    command: z.string().describe('The shell command to execute'),
    timeout: z.number().optional().describe('Timeout in milliseconds (default 120000)'),
    workdir: z.string().optional().describe('Working directory for the command'),
  }),
  isReadOnly: false,
  isConcurrencySafe: false,
  execute: async ({ command, timeout = 120000, workdir }, context) => {
    return new Promise<string>((resolve) => {
      let settled = false;
      const done = (result: string) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };

      if (context.abortSignal?.aborted) {
        done('Command aborted before execution');
        return;
      }

      const child = exec(
        command,
        {
          cwd: workdir ?? context.cwd,
          timeout,
          maxBuffer: 10 * 1024 * 1024,
          killSignal: 'SIGKILL',
        },
        (error, stdout, stderr) => {
          let output = '';
          if (stdout) output += `STDOUT:\n${stdout}\n\n`;
          if (stderr) output += `STDERR:\n${stderr}\n\n`;
          output += `Exit code: ${error?.code ?? 0}`;
          if (error && error.killed) {
            output = `Command timed out after ${timeout}ms\n\n${output}`;
          }
          done(truncateOutput(output));
        },
      );

      child.on('error', (err) => {
        done(`Failed to execute command: ${err.message}`);
      });

      if (context.abortSignal) {
        context.abortSignal.addEventListener(
          'abort',
          () => {
            child.kill('SIGKILL');
            done('Command aborted');
          },
          { once: true },
        );
      }
    });
  },
});
