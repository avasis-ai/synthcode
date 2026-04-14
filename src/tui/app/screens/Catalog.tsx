import React, { useState, useMemo, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput } from '@inkjs/ui';
import { MODEL_CATALOG } from '../../../model/catalog.js';
import type { CatalogEntry } from '../../../model/catalog.js';
import { COLORS, SPACING } from '../theme.js';

interface CatalogProps {
  width: number;
  height: number;
  onNavigate?: (screen: string) => void;
  onSelectModel?: (modelId: string) => void;
}

function formatContext(tokens: number): string {
  if (tokens >= 1048576) return `${(tokens / 1048576).toFixed(0)}M`;
  if (tokens >= 1024) return `${(tokens / 1024).toFixed(0)}K`;
  return `${tokens}`;
}

function ArchBadge({ arch }: { arch: string }) {
  if (arch === 'moe') {
    return <Text color={COLORS.warning}>{'<MoE>'}</Text>;
  }
  return <Text color={COLORS.dim}>dense</Text>;
}

function ToolBadge({ supports }: { supports: boolean }) {
  if (supports) {
    return <Text color={COLORS.cyan}>{'\u2699'}tools</Text>;
  }
  return <Text dimColor color={COLORS.dim}>{'\u2013'}no tools</Text>;
}

function ModelRow({ entry, selected, width }: { entry: CatalogEntry; selected: boolean; width: number }) {
  const params = entry.parameterSizes.join('/');
  const activeLabel = entry.activeParams ? ` (${entry.activeParams} active)` : '';
  const ctxLabel = formatContext(entry.contextWindow);
  const sizeGB = entry.quantizations.length > 0 ? entry.quantizations[0].sizeGB : 0;
  const bgColor = selected ? COLORS.primary : undefined;

  return (
    <Box flexDirection="column">
      <Box>
        <Text>{selected ? ' \u25B6 ' : '   '}</Text>
        <Text color={selected ? 'black' : COLORS.text} bold={selected} backgroundColor={bgColor}>
          {entry.name.padEnd(Math.min(30, width - 50))}
        </Text>
        <Text>{' '}</Text>
        <Text color={selected ? 'black' : COLORS.muted} backgroundColor={bgColor}>
          {params}{activeLabel}
        </Text>
        <Text>{' '}</Text>
        <ArchBadge arch={entry.architecture} />
        <Text>{' '}</Text>
        <Text color={selected ? 'black' : COLORS.dim} backgroundColor={bgColor}>
          {ctxLabel} ctx
        </Text>
        {sizeGB > 0 && (
          <>
            <Text>{' '}</Text>
            <Text color={selected ? 'black' : COLORS.warning} backgroundColor={bgColor}>
              {sizeGB}GB
            </Text>
          </>
        )}
        <Text>{' '}</Text>
        <ToolBadge supports={entry.supportsToolUse} />
      </Box>
      {selected && (
        <Box marginLeft={3}>
          <Text dimColor color={COLORS.muted}>
            {entry.maker} | {entry.provider} | {entry.recommendedFor.join(', ')}
          </Text>
        </Box>
      )}
    </Box>
  );
}

export function Catalog({ width, height, onSelectModel }: CatalogProps) {
  const [filter, setFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterActive, setFilterActive] = useState(false);
  const headerHeight = 5;
  const visibleItems = Math.max(1, height - headerHeight - 2);

  const filtered = useMemo(() => {
    if (!filter) return MODEL_CATALOG;
    const lower = filter.toLowerCase();
    return MODEL_CATALOG.filter(
      (e) =>
        e.name.toLowerCase().includes(lower) ||
        e.family.toLowerCase().includes(lower) ||
        e.maker.toLowerCase().includes(lower) ||
        e.id.toLowerCase().includes(lower) ||
        e.recommendedFor.some((r) => r.toLowerCase().includes(lower)) ||
        e.ollamaTags.some((t) => t.toLowerCase().includes(lower))
    );
  }, [filter]);

  const offset = useMemo(() => {
    const maxOffset = Math.max(0, filtered.length - visibleItems);
    const half = Math.floor(visibleItems / 2);
    const ideal = selectedIndex - half;
    return Math.max(0, Math.min(maxOffset, ideal));
  }, [selectedIndex, filtered.length, visibleItems]);

  const visible = useMemo(() => {
    return filtered.slice(offset, offset + visibleItems);
  }, [filtered, offset, visibleItems]);

  useInput((input, key) => {
    if (filterActive) return;
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(filtered.length - 1, prev + 1));
    } else if (key.return && filtered.length > 0) {
      onSelectModel?.(filtered[selectedIndex].id);
    } else if (input === '/') {
      setFilterActive(true);
    }
  });

  const handleFilterSubmit = useCallback(() => {
    setFilterActive(false);
    setSelectedIndex(0);
  }, []);

  return (
    <Box flexDirection="column" width={width}>
      <Box borderStyle="round" borderColor={COLORS.dim} flexDirection="column" paddingX={SPACING.padding * 2}>
        <Box>
          <Text bold color={COLORS.primary}>Model Catalog</Text>
          <Text color={COLORS.muted}>{' ' + filtered.length + ' models'}</Text>
        </Box>
        {filterActive ? (
          <Box marginTop={1}>
            <Text color={COLORS.warning}>Filter: </Text>
            <TextInput defaultValue={filter} onChange={setFilter} onSubmit={handleFilterSubmit} placeholder="type to filter..." />
          </Box>
        ) : (
          <Box marginTop={1}>
            {filter ? (
              <Text color={COLORS.muted}>{'Filtered: '}<Text color={COLORS.text}>{filter}</Text>{' '}<Text dimColor>[ Esc to clear ]</Text></Text>
            ) : (
              <Text dimColor color={COLORS.dim}>{'Press / to filter | \u2191\u2193 scroll | Enter select'}</Text>
            )}
          </Box>
        )}
        <Text color={COLORS.dim}>{'\u2500'.repeat(Math.min(width - 4, 80))}</Text>
      </Box>

      <Box flexDirection="column">
        {visible.map((entry, i) => {
          const globalIndex = i + offset;
          return (
            <ModelRow
              key={entry.id}
              entry={entry}
              selected={globalIndex === selectedIndex}
              width={width}
            />
          );
        })}
      </Box>

      {filtered.length > visibleItems && (
        <Box>
          <Text dimColor color={COLORS.dim}>
            {'  '}Showing {offset + 1}-{Math.min(offset + visibleItems, filtered.length)} of {filtered.length}
          </Text>
        </Box>
      )}
    </Box>
  );
}
