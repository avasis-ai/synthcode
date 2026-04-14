import React from 'react';
import { Box, Text } from 'ink';
import { COLORS, SPACING } from './theme.js';

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  key: string;
}

interface SidebarProps {
  items: SidebarItem[];
  active: string;
  onSelect: (id: string) => void;
  width: number;
}

export function Sidebar({ items, active, onSelect, width }: SidebarProps) {
  return (
    <Box flexDirection="column" width={width}>
      <Box paddingX={1} marginBottom={0}>
        <Text bold color={COLORS.primary}>{'┌──────────────────────┐'}</Text>
      </Box>
      <Box paddingX={1}>
        <Text bold color={COLORS.primary}>{'│'}</Text>
        <Text bold color={COLORS.primary}> SynthCode </Text>
        <Text bold color={COLORS.primary}>{'│'}</Text>
      </Box>
      <Box paddingX={1} marginBottom={1}>
        <Text bold color={COLORS.primary}>{'└──────────────────────┘'}</Text>
      </Box>
      <Box paddingX={1} marginBottom={0}>
        <Text dimColor color={COLORS.muted}>v1.4.0</Text>
      </Box>
      <Box paddingX={1} marginBottom={1}>
        <Text color={COLORS.dim}>{'─'.repeat(width - 4)}</Text>
      </Box>
      {items.map((item) => (
        <SidebarRow
          key={item.id}
          item={item}
          isActive={active === item.id}
          onSelect={() => onSelect(item.id)}
        />
      ))}
      <Box marginTop={1} paddingX={1}>
        <Text color={COLORS.dim}>{'─'.repeat(width - 4)}</Text>
      </Box>
      <Box paddingX={1}>
        <Text dimColor color={COLORS.muted}>{'  q'} quit  {'↑↓'} nav</Text>
      </Box>
    </Box>
  );
}

function SidebarRow({ item, isActive, onSelect }: { item: SidebarItem; isActive: boolean; onSelect: () => void }) {
  return (
    <Box paddingX={1}>
      <Text color={isActive ? COLORS.bg : undefined} backgroundColor={isActive ? COLORS.primary : undefined}>
        {isActive ? ' ▸ ' : '   '}
      </Text>
      <Text color={isActive ? COLORS.primary : COLORS.text} bold={isActive}>
        {` ${item.icon} ${item.label}`}
      </Text>
      <Text dimColor color={COLORS.dim}>{` [${item.key}]`}</Text>
    </Box>
  );
}
