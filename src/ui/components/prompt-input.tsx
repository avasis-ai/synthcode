import React from "react";
import { Box, Text, useInput } from "ink";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function PromptInput({ value, onChange, onSubmit, disabled }: PromptInputProps) {
  useInput((input, key) => {
    if (disabled) return;
    if (key.ctrl) return;
    if (key.escape) return;
    if (key.return) {
      if (value.trim()) onSubmit();
      return;
    }
    if (key.backspace || key.delete) {
      onChange(value.slice(0, -1));
      return;
    }
    if (key.leftArrow || key.rightArrow || key.upArrow || key.downArrow) return;
    if (key.tab) return;
    if (key.pageUp || key.pageDown) return;
    if (key.home || key.end) return;
    onChange(value + input);
  });

  if (disabled) {
    return (
      <Box marginTop={1}>
        <Text color="cyan" bold>{"> "}</Text>
        <Text dimColor italic>
          thinking...
        </Text>
      </Box>
    );
  }

  return (
    <Box marginTop={1}>
      <Text color="cyan" bold>{"> "}</Text>
      <Text>{value}</Text>
      <Text dimColor>{"\u2588"}</Text>
    </Box>
  );
}
