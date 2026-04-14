import React, { useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { MODEL_CATALOG } from '../../../model/catalog.js';
import type { CatalogEntry } from '../../../model/catalog.js';
import { COLORS, SPACING } from '../theme.js';

interface ModelDetailProps {
  modelId: string;
  onBack: () => void;
  width?: number;
  height?: number;
}

function ProgressBar({ value, max, width, color, label }: { value: number; max: number; width: number; color: string; label?: string }) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const filled = Math.round(width * ratio);
  const empty = width - filled;
  return (
    <Box>
      <Text>
        <Text color={color}>{'\u2588'.repeat(filled)}</Text>
        <Text color={COLORS.dim}>{'\u2588'.repeat(empty)}</Text>
      </Text>
      {label && <Text color={COLORS.muted}>{' ' + label}</Text>}
    </Box>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Box width={16}>
        <Text dimColor color={COLORS.muted}>{label.padEnd(14)}</Text>
      </Box>
      <Box>{children}</Box>
    </Box>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <Box marginRight={1}>
      <Text color={color}>{'<' + text + '>'}</Text>
    </Box>
  );
}

export function ModelDetail({ modelId, onBack, width = 80 }: ModelDetailProps) {
  const entry = useMemo(() => {
    return MODEL_CATALOG.find((e) => e.id === modelId || e.ollamaTags.includes(modelId)) ?? null;
  }, [modelId]);

  useInput((input, key) => {
    if (key.escape) onBack();
    if (input === 'q') onBack();
  });

  if (!entry) {
    return (
      <Box flexDirection="column" padding={SPACING.padding}>
        <Text bold color={COLORS.error}>{'Model not found: ' + modelId}</Text>
        <Text dimColor color={COLORS.muted}>Press Escape to go back</Text>
      </Box>
    );
  }

  const maxBench = 100;
  const barW = Math.min(25, Math.floor((width - 30) / 2));

  return (
    <Box flexDirection="column" padding={SPACING.padding} width={width}>
      <Box borderStyle="round" borderColor={COLORS.dim} flexDirection="column" paddingX={SPACING.padding * 2}>
        <Text bold color={COLORS.primary}>{entry.name}</Text>
        <Text dimColor color={COLORS.muted}>{entry.maker + ' ' + (entry.openWeight ? '| Open Weight' : '| Proprietary')}</Text>
        <Text color={COLORS.dim}>{'\u2500'.repeat(Math.min(width - 6, 76))}</Text>

        <Box marginTop={1} flexDirection="column">
          <Text bold color={COLORS.primary}>  Identity</Text>
          <DetailRow label="Family">
            <Text color={COLORS.text}>{entry.family}</Text>
          </DetailRow>
          <DetailRow label="Architecture">
            {entry.architecture === 'moe' ? (
              <Badge text="MoE" color={COLORS.secondary} />
            ) : (
              <Text color={COLORS.text}>Dense</Text>
            )}
            {entry.activeParams && <Text color={COLORS.secondary}>{' (' + entry.activeParams + ' active)'}</Text>}
          </DetailRow>
          <DetailRow label="Parameters">
            <Text color={COLORS.text}>{entry.parameterSizes.join(', ')}</Text>
          </DetailRow>
          <DetailRow label="Context">
            <Text color={COLORS.text}>{formatContext(entry.contextWindow)} tokens</Text>
          </DetailRow>
          <DetailRow label="Max Output">
            <Text color={COLORS.text}>{entry.maxOutputTokens.toLocaleString()} tokens</Text>
          </DetailRow>
          <DetailRow label="Released">
            <Text color={COLORS.text}>{entry.released}</Text>
          </DetailRow>
        </Box>

        <Box marginTop={1} flexDirection="column">
          <Text bold color={COLORS.primary}>  Capabilities</Text>
          <DetailRow label="Tool Use">
            {entry.supportsToolUse ? <Text color={COLORS.success}>{'\u2713'} Yes</Text> : <Text color={COLORS.dim}>{'\u2717'} No</Text>}
          </DetailRow>
          <DetailRow label="Streaming">
            {entry.supportsStreaming ? <Text color={COLORS.success}>{'\u2713'} Yes</Text> : <Text color={COLORS.dim}>{'\u2717'} No</Text>}
          </DetailRow>
          <DetailRow label="Vision">
            {entry.supportsVision ? <Text color={COLORS.success}>{'\u2713'} Yes</Text> : <Text color={COLORS.dim}>{'\u2717'} No</Text>}
          </DetailRow>
          <DetailRow label="Thinking">
            {entry.supportsThinking ? <Text color={COLORS.success}>{'\u2713'} Yes</Text> : <Text color={COLORS.dim}>{'\u2717'} No</Text>}
          </DetailRow>
        </Box>

        <Box marginTop={1} flexDirection="column">
          <Text bold color={COLORS.primary}>  Hardware Requirements</Text>
          <Box marginLeft={2}>
            <DetailRow label="Min VRAM">
              <ProgressBar value={entry.minVramGB} max={Math.max(entry.minVramGB, 48)} width={barW} color={entry.minVramGB > 32 ? COLORS.error : entry.minVramGB > 16 ? COLORS.warning : COLORS.success} label={`${entry.minVramGB} GB`} />
            </DetailRow>
          </Box>
          <Box marginLeft={2}>
            <DetailRow label="Min RAM">
              <ProgressBar value={entry.minRamGB} max={Math.max(entry.minRamGB, 64)} width={barW} color={entry.minRamGB > 32 ? COLORS.error : entry.minRamGB > 16 ? COLORS.warning : COLORS.success} label={`${entry.minRamGB} GB`} />
            </DetailRow>
          </Box>
        </Box>

        {entry.benchmarks && (
          <Box marginTop={1} flexDirection="column">
            <Text bold color={COLORS.primary}>  Benchmarks</Text>
            {entry.benchmarks.liveCodeBench != null && (
              <Box marginLeft={2}>
                <DetailRow label="LiveCodeBench">
                  <ProgressBar value={entry.benchmarks.liveCodeBench} max={maxBench} width={barW} color={COLORS.primary} label={`${entry.benchmarks.liveCodeBench}`} />
                </DetailRow>
              </Box>
            )}
            {entry.benchmarks.sweBench != null && (
              <Box marginLeft={2}>
                <DetailRow label="SWE-bench">
                  <ProgressBar value={entry.benchmarks.sweBench} max={maxBench} width={barW} color={COLORS.success} label={`${entry.benchmarks.sweBench}`} />
                </DetailRow>
              </Box>
            )}
            {entry.benchmarks.humaneval != null && (
              <Box marginLeft={2}>
                <DetailRow label="HumanEval">
                  <ProgressBar value={entry.benchmarks.humaneval} max={maxBench} width={barW} color={COLORS.cyan} label={`${entry.benchmarks.humaneval}`} />
                </DetailRow>
              </Box>
            )}
            {entry.benchmarks.mmlu != null && (
              <Box marginLeft={2}>
                <DetailRow label="MMLU">
                  <ProgressBar value={entry.benchmarks.mmlu} max={maxBench} width={barW} color={COLORS.accent} label={`${entry.benchmarks.mmlu}`} />
                </DetailRow>
              </Box>
            )}
            {entry.benchmarks.codeforcesElo != null && (
              <Box marginLeft={2}>
                <DetailRow label="Codeforces">
                  <ProgressBar value={entry.benchmarks.codeforcesElo} max={2500} width={barW} color={COLORS.secondary} label={`${entry.benchmarks.codeforcesElo}`} />
                </DetailRow>
              </Box>
            )}
          </Box>
        )}

        {entry.recommendedFor.length > 0 && (
          <Box marginTop={1} flexDirection="column">
            <Text bold color={COLORS.primary}>  Recommended For</Text>
            <Box marginLeft={2} flexWrap="wrap">
              {entry.recommendedFor.map((r) => (
                <Badge key={r} text={r} color={COLORS.text} />
              ))}
            </Box>
          </Box>
        )}

        {entry.quantizations.length > 0 && (
          <Box marginTop={1} flexDirection="column">
            <Text bold color={COLORS.primary}>  Quantizations</Text>
            {entry.quantizations.map((q, i) => (
              <Box key={i} marginLeft={2}>
                <Text dimColor color={COLORS.muted}>{'\u2022'} </Text>
                <Text color={COLORS.text}>{q.name.padEnd(10)}</Text>
                <Text color={COLORS.warning}>{q.sizeGB + ' GB'}</Text>
              </Box>
            ))}
          </Box>
        )}

        {entry.ollamaTags.length > 0 && (
          <Box marginTop={1} flexDirection="column">
            <Text bold color={COLORS.primary}>  Ollama Tags</Text>
            {entry.ollamaTags.map((tag, i) => (
              <Box key={i} marginLeft={2}>
                <Text dimColor color={COLORS.muted}>{'\u2192'} </Text>
                <Text color={COLORS.primary}>{tag}</Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Box marginTop={1}>
        <Text dimColor color={COLORS.muted}>  Press Escape to go back</Text>
      </Box>
    </Box>
  );
}

function formatContext(tokens: number): string {
  if (tokens >= 1048576) return `${(tokens / 1048576).toFixed(0)}M`;
  if (tokens >= 1024) return `${(tokens / 1024).toFixed(0)}K`;
  return `${tokens}`;
}
