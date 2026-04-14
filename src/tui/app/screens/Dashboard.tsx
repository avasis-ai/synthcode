import React from 'react';
import { Box, Text } from 'ink';
import { COLORS } from '../theme.js';

interface DashboardProps {
  width: number;
  height: number;
  onNavigate?: (screen: string) => void;
  onSelectModel?: (modelId: string) => void;
}

export function Dashboard({ width, height }: DashboardProps) {
  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box flexDirection="column" alignItems="center" marginBottom={1}>
        <Text bold color={COLORS.primary}>
          {'  ███████╗███████╗███╗   ██╗████████╗██╗███╗   ██╗███████╗'}
        </Text>
        <Text bold color={COLORS.primary}>
          {'  ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝'}
        </Text>
        <Text bold color={COLORS.primary}>
          {'  ███████╗█████╗  ██╔██╗ ██║   ██║   ██║██╔██╗ ██║█████╗  '}
        </Text>
        <Text bold color={COLORS.primary}>
          {'  ╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║╚██╗██║██╔══╝  '}
        </Text>
        <Text bold color={COLORS.primary}>
          {'  ███████║███████╗██║ ╚████║   ██║   ██║██║ ╚████║███████╗'}
        </Text>
        <Text bold color={COLORS.primary}>
          {'  ╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝'}
        </Text>
      </Box>

      <Box justifyContent="center" marginBottom={1}>
        <Text color={COLORS.accent}>{'Synthesize any LLM into a production-grade AI agent'}</Text>
      </Box>

      <Box justifyContent="center" gap={2} marginBottom={1}>
        <StatCard label="Models" value="30+" color={COLORS.primary} />
        <StatCard label="Providers" value="4" color={COLORS.success} />
        <StatCard label="Tools" value="7" color={COLORS.warning} />
        <StatCard label="Benchmarks" value="5" color={COLORS.accent} />
      </Box>

      <Box justifyContent="center" marginBottom={1}>
        <Text color={COLORS.dim}>{'─'.repeat(Math.min(width - 4, 60))}</Text>
      </Box>

      <Box flexDirection="column" alignItems="center">
        <Text bold color={COLORS.text}>{'Quick Start'}</Text>
        <Box marginBottom={0} />
        <QuickAction icon="◆" label="Dashboard" desc="overview & stats" keyNum="1" />
        <QuickAction icon="⚙" label="Inspect" desc="machine analysis" keyNum="2" />
        <QuickAction icon="≡" label="Catalog" desc="browse models" keyNum="3" />
        <QuickAction icon="♛" label="Leaderboard" desc="model rankings" keyNum="4" />
        <QuickAction icon="░" label="Project" desc="code analysis" keyNum="5" />
        <QuickAction icon="▸" label="Playground" desc="agent chat" keyNum="6" />
      </Box>

      <Box justifyContent="center" marginTop={1}>
        <Text dimColor color={COLORS.muted}>{'Press 1-6 to navigate  •  q to quit'}</Text>
      </Box>
    </Box>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Box flexDirection="column" alignItems="center" width={16} borderStyle="round" paddingX={2} paddingY={0}>
      <Text bold color={color}>{value}</Text>
      <Text dimColor color={COLORS.muted}>{label}</Text>
    </Box>
  );
}

function QuickAction({ icon, label, desc, keyNum }: { icon: string; label: string; desc: string; keyNum: string }) {
  return (
    <Box>
      <Text color={COLORS.primary}>{`  ${icon} `}</Text>
      <Text bold color={COLORS.text}>{label}</Text>
      <Text dimColor color={COLORS.muted}>{` — ${desc}`}</Text>
      <Text color={COLORS.dim}>{`  [${keyNum}]`}</Text>
    </Box>
  );
}
