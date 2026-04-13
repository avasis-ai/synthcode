import React from "react";
import { Box, Text } from "ink";

export interface DisplayEntry {
  id: number;
  type: "user" | "assistant" | "thinking" | "tool_use" | "tool_result";
  content: string;
  toolName?: string;
  toolInput?: string;
  isError?: boolean;
}

interface MessageBubbleProps {
  entry: DisplayEntry;
}

const MAX_RESULT_LINES = 5;
const MAX_INPUT_PREVIEW = 100;

function truncateOutput(output: string): string {
  const lines = output.split("\n");
  if (lines.length <= MAX_RESULT_LINES) return output;
  const shown = lines.slice(0, MAX_RESULT_LINES).join("\n");
  return `${shown}\n  ... ${lines.length - MAX_RESULT_LINES} more lines`;
}

function previewInput(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    const values = Object.values(parsed);
    if (values.length === 1 && typeof values[0] === "string") {
      return values[0].length > MAX_INPUT_PREVIEW
        ? `${values[0].slice(0, MAX_INPUT_PREVIEW)}...`
        : values[0];
    }
  } catch {}
  return raw.length > MAX_INPUT_PREVIEW ? `${raw.slice(0, MAX_INPUT_PREVIEW)}...` : raw;
}

export function MessageBubble({ entry }: MessageBubbleProps) {
  switch (entry.type) {
    case "user":
      return (
        <Box marginTop={1}>
          <Text color="cyan" bold>{"> "}</Text>
          <Text bold>{entry.content}</Text>
        </Box>
      );

    case "assistant": {
      if (!entry.content) return null;
      const lines = entry.content.split("\n");
      return (
        <Box flexDirection="column">
          {lines.map((line, i) => (
            <Text key={i} color="green">
              {line}
            </Text>
          ))}
        </Box>
      );
    }

    case "thinking": {
      const lines = entry.content.split("\n");
      return (
        <Box paddingLeft={2} flexDirection="column">
          {lines.map((line, i) => (
            <Text key={i} dimColor italic>
              {line}
            </Text>
          ))}
        </Box>
      );
    }

    case "tool_use":
      return (
        <Box paddingLeft={2} marginTop={1}>
          <Text color="yellow">{`[${entry.toolName ?? "tool"}]`}</Text>
          <Text>{" "}</Text>
          <Text dimColor>{previewInput(entry.toolInput ?? "")}</Text>
        </Box>
      );

    case "tool_result": {
      const output = truncateOutput(entry.content);
      const lines = output.split("\n");
      return (
        <Box paddingLeft={4} flexDirection="column">
          {lines.map((line, i) => (
            <Text
              key={i}
              dimColor
              color={entry.isError ? "red" : undefined}
            >
              {line}
            </Text>
          ))}
        </Box>
      );
    }

    default:
      return null;
  }
}
