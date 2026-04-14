import React from 'react';
import { Box, Text } from 'ink';
import { COLORS } from './theme.js';

interface StatusbarProps {
  activeScreen: string;
}

const SCREEN_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  inspect: 'Inspect',
  catalog: 'Catalog',
  leaderboard: 'Leaderboard',
  project: 'Project',
  playground: 'Playground',
};

export function Statusbar({ activeScreen }: StatusbarProps) {
  const label = SCREEN_LABELS[activeScreen] ?? activeScreen;
  return (
    <Box
      width="100%"
      paddingX={1}
      borderStyle="single"
      borderTop={true}
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
    >
      <Text color={COLORS.primary} bold>
        {`◆ ${label}`}
      </Text>
      <Text color={COLORS.dim}>{'  │  '}</Text>
      <Text dimColor color={COLORS.muted}>
        SynthCode v1.4.0
      </Text>
      <Box flexGrow={1} />
      <Text dimColor color={COLORS.muted}>
        {'[1-6] navigate  [q] quit  [esc] back'}
      </Text>
    </Box>
  );
}
