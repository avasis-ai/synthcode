import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { defineTool } from './tool.js';
import { fuzzyReplace } from './fuzzy-edit.js';

export const FileEditTool = defineTool({
  name: 'file_edit',
  description:
    'Edit an existing file by replacing a string match with new content. Uses 9-strategy fuzzy matching (exact, line-trimmed, block-anchor with Levenshtein, whitespace-normalized, indentation-flexible, escape-normalized, trimmed-boundary, context-aware, multi-occurrence) so the oldString does not need to be a perfect character-for-character match. For multi-line edits, include enough surrounding context to ensure uniqueness.',
  inputSchema: z.object({
    path: z.string().describe('Path to the file'),
    oldString: z.string().describe('The string to find and replace (fuzzy-matched)'),
    newString: z.string().describe('The replacement string'),
    replaceAll: z.boolean().optional().describe('Replace all occurrences instead of just the first'),
  }),
  isReadOnly: false,
  isConcurrencySafe: false,
  execute: async ({ path: filePath, oldString, newString, replaceAll = false }, context) => {
    try {
      const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(context.cwd, filePath);

      const content = await fs.readFile(resolved, 'utf-8');

      let newContent: string;
      let count = 0;

      if (replaceAll) {
        const occurrences = content.split(oldString).length - 1;
        if (occurrences === 0) {
          try {
            newContent = fuzzyReplace(content, oldString, newString, true);
            count = 1;
          } catch {
            return `Error: oldString not found in ${filePath} (tried 9 fuzzy strategies)`;
          }
        } else {
          newContent = content.split(oldString).join(newString);
          count = occurrences;
        }
      } else {
        try {
          newContent = fuzzyReplace(content, oldString, newString, false);
          count = 1;
        } catch (err) {
          const kind = (err as { kind?: string }).kind;
          if (kind === "ambiguous") {
            return `Error: Multiple matches for oldString in ${filePath}. Provide more surrounding context or set replaceAll to true.`;
          }
          return `Error: oldString not found in ${filePath} (tried 9 fuzzy strategies)`;
        }
      }

      await fs.writeFile(resolved, newContent, 'utf-8');

      return `Replaced ${count} occurrence(s) in ${filePath}`;
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return `Error: File not found: ${filePath}`;
      }
      return `Error editing file: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
});
