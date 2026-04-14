import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { MODEL_CATALOG } from '../../../model/catalog.js';
import type { CatalogEntry } from '../../../model/catalog.js';
import { COLORS, SPACING } from '../theme.js';

type TaskTab = 'Coding' | 'Reasoning' | 'Chat' | 'Agents';

interface LeaderboardProps {
  width: number;
  height: number;
  onNavigate?: (screen: string) => void;
  onSelectModel?: (modelId: string) => void;
}

const TABS: TaskTab[] = ['Coding', 'Reasoning', 'Chat', 'Agents'];

function scoreForTask(entry: CatalogEntry, task: string): number {
  const bm = entry.benchmarks ?? {};
  const lc = bm.liveCodeBench ?? 0;
  const swe = bm.sweBench ?? 0;
  const he = bm.humaneval ?? 0;
  const mmlu = bm.mmlu ?? 0;
  const elo = bm.codeforcesElo ?? 0;
  const tools = entry.supportsToolUse ? 1 : 0;

  switch (task) {
    case 'Coding':
      return lc * 0.5 + swe * 0.3 + he * 0.2;
    case 'Reasoning':
      return mmlu * 0.4 + (elo / 2500) * 100 * 0.3 + swe * 0.3;
    case 'Agents':
      return swe * 0.5 + lc * 0.3 + tools * 100 * 0.2;
    case 'Chat':
      return mmlu * 0.3 + he * 0.2 + lc * 0.3;
    default:
      return lc * 0.4 + swe * 0.3 + mmlu * 0.3;
  }
}

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) return <Text bold color={COLORS.warning}>{'\u2605'} 1st</Text>;
  if (rank === 2) return <Text bold color={COLORS.secondary}>{'\u2605'} 2nd</Text>;
  if (rank === 3) return <Text bold color={COLORS.secondary}>{'\u2605'} 3rd</Text>;
  return <Text color={COLORS.muted}>{`#${String(rank).padStart(2)}`}</Text>;
}

function ScoreBar({ value, max, width }: { value: number; max: number; width: number }) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  const filled = Math.round(width * ratio);
  const empty = width - filled;
  const color = ratio >= 0.8 ? COLORS.success : ratio >= 0.5 ? COLORS.primary : ratio >= 0.3 ? COLORS.warning : COLORS.error;
  return (
    <Text>
      <Text color={color}>{'\u2588'.repeat(filled)}</Text>
      <Text color={COLORS.dim}>{'\u2588'.repeat(empty)}</Text>
    </Text>
  );
}

interface RankedEntry {
  entry: CatalogEntry;
  score: number;
}

function LeaderboardRow({ ranked, rank, maxScore, width }: { ranked: RankedEntry; rank: number; maxScore: number; width: number }) {
  const e = ranked.entry;
  const barWidth = Math.max(8, Math.min(20, Math.floor((width - 55) / 2)));
  const nameWidth = Math.min(26, Math.floor(width / 3));
  const name = e.name.length > nameWidth ? e.name.slice(0, nameWidth - 1) + '\u2026' : e.name;

  return (
    <Box>
      <Box width={8}>
        <RankMedal rank={rank} />
      </Box>
      <Box width={nameWidth + 2}>
        <Text color={COLORS.text}>{name}</Text>
      </Box>
      <Box width={barWidth + 2}>
        <ScoreBar value={ranked.score} max={maxScore} width={barWidth} />
      </Box>
      <Box width={8}>
        <Text bold color={COLORS.primary}>{ranked.score.toFixed(1)}</Text>
      </Box>
      {e.architecture === 'moe' ? (
        <Box width={6}>
          <Text color={COLORS.warning}>MoE</Text>
        </Box>
      ) : (
        <Box width={6}>
          <Text color={COLORS.dim}>{'    '}</Text>
        </Box>
      )}
      {e.supportsToolUse ? (
        <Box width={6}>
          <Text color={COLORS.cyan}>{'\u2699'}Yes</Text>
        </Box>
      ) : (
        <Box width={6}>
          <Text color={COLORS.dim}>{'  No'}</Text>
        </Box>
      )}
      {e.quantizations.length > 0 ? (
        <Box width={8}>
          <Text color={COLORS.warning}>{e.quantizations[0].sizeGB}G</Text>
        </Box>
      ) : (
        <Box width={8}>
          <Text color={COLORS.dim}>cloud</Text>
        </Box>
      )}
    </Box>
  );
}

export function Leaderboard({ width, height }: LeaderboardProps) {
  const [tabIndex, setTabIndex] = useState(0);
  const activeTab = TABS[tabIndex];

  const ranked = useMemo(() => {
    return MODEL_CATALOG
      .map((entry) => ({
        entry,
        score: scoreForTask(entry, activeTab),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [activeTab]);

  const maxScore = ranked.length > 0 ? ranked[0].score : 100;
  const headerLines = 4;
  const visibleCount = Math.max(1, height - headerLines - 2);
  const visible = ranked.slice(0, visibleCount);

  useInput((input, key) => {
    if (key.leftArrow) {
      setTabIndex((prev) => (prev - 1 + TABS.length) % TABS.length);
    } else if (key.rightArrow) {
      setTabIndex((prev) => (prev + 1) % TABS.length);
    }
  });

  return (
    <Box flexDirection="column" width={width}>
      <Box borderStyle="round" borderColor={COLORS.dim} flexDirection="column" paddingX={SPACING.padding * 2}>
        <Text bold color={COLORS.primary}>Model Leaderboard</Text>
        <Box marginTop={1} flexDirection="row">
          {TABS.map((tab, i) => (
            <Box key={tab} marginRight={2}>
              {i === tabIndex ? (
                <Box>
                  <Text bold color={COLORS.primary} backgroundColor={COLORS.dim}>{' '}{tab}{' '}</Text>
                </Box>
              ) : (
                <Text dimColor color={COLORS.muted}>{' '}{tab}{' '}</Text>
              )}
            </Box>
          ))}
        </Box>
        <Box marginTop={1}>
          <Text dimColor color={COLORS.dim}>{'\u2500'.repeat(Math.min(width - 4, 80))}</Text>
        </Box>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Box width={8}><Text bold color={COLORS.muted}>Rank</Text></Box>
          <Box width={28}><Text bold color={COLORS.muted}>Model</Text></Box>
          <Box width={22}><Text bold color={COLORS.muted}>Score</Text></Box>
          <Box width={8}><Text bold color={COLORS.muted}>Score</Text></Box>
          <Box width={6}><Text bold color={COLORS.muted}>Arch</Text></Box>
          <Box width={6}><Text bold color={COLORS.muted}>Tools</Text></Box>
          <Box width={8}><Text bold color={COLORS.muted}>Size</Text></Box>
        </Box>
        <Text color={COLORS.dim}>{'\u2500'.repeat(Math.min(width - 2, 86))}</Text>
        {visible.map((r, i) => (
          <LeaderboardRow
            key={r.entry.id}
            ranked={r}
            rank={i + 1}
            maxScore={maxScore}
            width={width}
          />
        ))}
        {ranked.length > visibleCount && (
          <Box marginTop={1}>
            <Text dimColor color={COLORS.dim}>{'+ ' + (ranked.length - visibleCount) + ' more models'}</Text>
          </Box>
        )}
      </Box>

      <Box marginTop={1}>
        <Text dimColor color={COLORS.muted}>{'\u2190\u2192'} switch tabs</Text>
      </Box>
    </Box>
  );
}
