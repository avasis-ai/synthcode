import React from "react";
import { Box, Text, useStdout } from "ink";

interface StatusBarProps {
  model: string;
  turn: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  isStreaming: boolean;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function StatusBar({ model, turn, inputTokens, outputTokens, cost, isStreaming }: StatusBarProps) {
  const { stdout } = useStdout();
  const width = stdout?.columns ?? 80;
  const separator = "\u2500".repeat(Math.max(width - 2, 20));

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text dimColor>{separator}</Text>
      <Box paddingX={1}>
        <Box flexGrow={1}>
          <Text dimColor bold>
            {model}
          </Text>
          {isStreaming && (
            <Text color="green">{" *"}</Text>
          )}
        </Box>
        <Box>
          <Text dimColor>{`Turn ${turn}`}</Text>
        </Box>
        <Box flexGrow={1} justifyContent="flex-end">
          <Text dimColor>
            {`${fmt(inputTokens)} in / ${fmt(outputTokens)} out | $${cost.toFixed(4)}`}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
