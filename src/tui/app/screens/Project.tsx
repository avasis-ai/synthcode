import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import { ProjectAnalyzer } from '../../../model/project.js';
import type { ProjectProfile, LanguageInfo, FrameworkInfo } from '../../../model/project.js';
import { COLORS, SPACING } from '../theme.js';

interface ProjectProps {
  width: number;
  height: number;
  onNavigate?: (screen: string) => void;
  onSelectModel?: (modelId: string) => void;
}

function ProgressBar({ value, max, width, color }: { value: number; max: number; width: number; color: string }) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const filled = Math.round(width * ratio);
  const empty = width - filled;
  return (
    <Text>
      <Text color={color}>{'\u2588'.repeat(filled)}</Text>
      <Text color={COLORS.dim}>{'\u2588'.repeat(empty)}</Text>
    </Text>
  );
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  Swift: '#F05138',
  'C#': '#178600',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  Vue: '#41b883',
  Svelte: '#ff3e00',
};

function LanguageBar({ lang, maxPct }: { lang: LanguageInfo; maxPct: number }) {
  const barWidth = Math.min(20, Math.max(8, Math.floor(maxPct / 5)));
  const color = LANG_COLORS[lang.language] ?? COLORS.primary;
  return (
    <Box>
      <Box width={16}>
        <Text color={COLORS.text}>{lang.language}</Text>
      </Box>
      <Box width={barWidth + 2}>
        <ProgressBar value={lang.percentage} max={100} width={barWidth} color={color} />
      </Box>
      <Text color={COLORS.muted}>{' ' + lang.percentage.toFixed(1) + '%'}</Text>
      <Text dimColor color={COLORS.dim}>{' (' + lang.fileCount + ' files)'}</Text>
    </Box>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  frontend: COLORS.primary,
  backend: COLORS.success,
  fullstack: COLORS.accent,
  mobile: '#f06498',
  data: COLORS.warning,
  infra: COLORS.cyan,
};

function FrameworkBadge({ fw }: { fw: FrameworkInfo }) {
  const color = CATEGORY_COLORS[fw.category] ?? COLORS.text;
  return (
    <Box marginRight={1}>
      <Text color={color}>{'<' + fw.category + '>'}</Text>
      <Text color={COLORS.text}>{' ' + fw.name}</Text>
    </Box>
  );
}

function ComplexityIndicator({ complexity }: { complexity: ProjectProfile['complexity'] }) {
  const levels: ProjectProfile['complexity'][] = ['tiny', 'small', 'medium', 'large', 'monorepo'];
  const idx = levels.indexOf(complexity);
  const colors = [COLORS.success, COLORS.success, COLORS.warning, COLORS.secondary, COLORS.error];
  const color = colors[idx] ?? COLORS.muted;
  return (
    <Box>
      {levels.map((level, i) => (
        <Text key={level}>
          <Text color={i <= idx ? color : COLORS.dim}>{'\u2588'}</Text>
        </Text>
      ))}
      <Text color={color}>{' ' + complexity.toUpperCase()}</Text>
    </Box>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Box width={18}>
        <Text dimColor color={COLORS.muted}>{label.padEnd(16)}</Text>
      </Box>
      <Box>{children}</Box>
    </Box>
  );
}

export function Project({ width, height }: ProjectProps) {
  const [profile, setProfile] = useState<ProjectProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const analyzer = new ProjectAnalyzer();
    try {
      const result = analyzer.analyze(process.cwd());
      setProfile(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Box flexDirection="column" padding={SPACING.padding}>
        <Text bold color={COLORS.primary}>SynthCode Project Analyzer</Text>
        <Box marginTop={1}>
          <Spinner label="Analyzing project..." />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" padding={SPACING.padding}>
        <Text bold color={COLORS.error}>{'Error: ' + error}</Text>
        <Text dimColor color={COLORS.muted}>Press Escape to go back</Text>
      </Box>
    );
  }

  if (!profile) return null;

  const maxLangPct = profile.languages.length > 0 ? profile.languages[0].percentage : 100;

  return (
    <Box flexDirection="column" padding={SPACING.padding} width={width}>
      <Box borderStyle="round" borderColor={COLORS.dim} flexDirection="column" paddingX={SPACING.padding * 2}>
        <Text bold color={COLORS.primary}>{'Project: ' + profile.name}</Text>
        <Text dimColor color={COLORS.muted}>{profile.rootDir}</Text>
        <Text color={COLORS.dim}>{'\u2500'.repeat(Math.min(width - 6, 76))}</Text>

        <Box marginTop={1} flexDirection="column">
          <Text bold color={COLORS.primary}>  Overview</Text>
          <DetailRow label="Total Files">
            <Text color={COLORS.text}>{profile.totalFiles.toLocaleString()}</Text>
          </DetailRow>
          <DetailRow label="Lines of Code">
            <Text color={COLORS.text}>{profile.totalLinesOfCode.toLocaleString()}</Text>
          </DetailRow>
          <DetailRow label="Complexity">
            <ComplexityIndicator complexity={profile.complexity} />
          </DetailRow>
          <DetailRow label="TypeScript">
            {profile.hasTypeScript ? <Text color={COLORS.success}>Yes</Text> : <Text color={COLORS.dim}>No</Text>}
          </DetailRow>
          <DetailRow label="Tests">
            {profile.hasTests ? <Text color={COLORS.success}>{'\u2713'} Present</Text> : <Text color={COLORS.warning}>{'\u2717'} None detected</Text>}
          </DetailRow>
          <DetailRow label="CI">
            {profile.hasCI ? <Text color={COLORS.success}>{'\u2713'} Configured</Text> : <Text color={COLORS.dim}>Not detected</Text>}
          </DetailRow>
          <DetailRow label="Docker">
            {profile.hasDocker ? <Text color={COLORS.success}>{'\u2713'} Yes</Text> : <Text color={COLORS.dim}>No</Text>}
          </DetailRow>
        </Box>

        {profile.languages.length > 0 && (
          <Box marginTop={1} flexDirection="column">
            <Text bold color={COLORS.primary}>  Languages</Text>
            {profile.languages.slice(0, 10).map((lang) => (
              <LanguageBar key={lang.language} lang={lang} maxPct={maxLangPct} />
            ))}
          </Box>
        )}

        {profile.frameworks.length > 0 && (
          <Box marginTop={1} flexDirection="column">
            <Text bold color={COLORS.primary}>  Frameworks</Text>
            <Box marginLeft={2} flexWrap="wrap">
              {profile.frameworks.map((fw, i) => (
                <FrameworkBadge key={i} fw={fw} />
              ))}
            </Box>
          </Box>
        )}

        <Box marginTop={1} flexDirection="column">
          <Text bold color={COLORS.primary}>  Tooling</Text>
          <DetailRow label="Package Manager">
            {profile.packageManager ? <Text color={COLORS.text}>{profile.packageManager}</Text> : <Text color={COLORS.dim}>Not detected</Text>}
          </DetailRow>
          <DetailRow label="Test Framework">
            {profile.testFramework ? <Text color={COLORS.text}>{profile.testFramework}</Text> : <Text color={COLORS.dim}>Not detected</Text>}
          </DetailRow>
          <DetailRow label="Build Tool">
            {profile.buildTool ? <Text color={COLORS.text}>{profile.buildTool}</Text> : <Text color={COLORS.dim}>Not detected</Text>}
          </DetailRow>
        </Box>

        <Box marginTop={1} flexDirection="column">
          <Text bold color={COLORS.primary}>  Model Requirements</Text>
          <DetailRow label="Min Context">
            <Text color={COLORS.text}>{profile.modelRequirements.minContextTokens.toLocaleString()} tokens</Text>
          </DetailRow>
          <DetailRow label="Reasoning">
            {profile.modelRequirements.reasoningNeeded ? <Text color={COLORS.warning}>Recommended</Text> : <Text color={COLORS.dim}>Not needed</Text>}
          </DetailRow>
          <DetailRow label="Tool Use">
            {profile.modelRequirements.toolUseNeeded ? <Text color={COLORS.success}>Required</Text> : <Text color={COLORS.dim}>Optional</Text>}
          </DetailRow>
          <DetailRow label="Code Heavy">
            {profile.modelRequirements.codeHeavy ? <Text color={COLORS.primary}>Yes</Text> : <Text color={COLORS.dim}>No</Text>}
          </DetailRow>
        </Box>
      </Box>
    </Box>
  );
}
