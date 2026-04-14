import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import { MachineInspector } from '../../../model/inspector.js';
import type { MachineProfile, GPUInfo, ProviderAvailability, InstalledModel } from '../../../model/inspector.js';
import { COLORS, SPACING } from '../theme.js';

interface InspectProps {
  width: number;
  height: number;
  onNavigate?: (screen: string) => void;
  onSelectModel?: (modelId: string) => void;
}

function Bar({ value, max, width, color, bgColor }: { value: number; max: number; width: number; color: string; bgColor?: string }) {
  const ratio = Math.min(1, Math.max(0, value / max));
  const filled = Math.round(width * ratio);
  const empty = width - filled;
  return (
    <Text>
      <Text color={color}>{'\u2588'.repeat(filled)}</Text>
      <Text color={bgColor ?? COLORS.dim}>{'\u2591'.repeat(empty)}</Text>
    </Text>
  );
}

function SystemInfo({ profile }: { profile: MachineProfile }) {
  const ramUsed = profile.totalRamGB - profile.availableRamGB;
  const ramPct = profile.totalRamGB > 0 ? Math.round((ramUsed / profile.totalRamGB) * 100) : 0;
  return (
    <Box flexDirection="column">
      <Text bold color={COLORS.primary}>  System</Text>
      <Box>
        <Text dimColor color={COLORS.muted}>{'Hostname'.padEnd(14)}</Text>
        <Text color={COLORS.text}>{profile.hostname}</Text>
      </Box>
      <Box>
        <Text dimColor color={COLORS.muted}>{'Platform'.padEnd(14)}</Text>
        <Text color={COLORS.text}>{profile.platform}/{profile.arch}</Text>
      </Box>
      <Box>
        <Text dimColor color={COLORS.muted}>{'CPU'.padEnd(14)}</Text>
        <Text color={COLORS.text}>{profile.cpuModel}</Text>
      </Box>
      <Box>
        <Text dimColor color={COLORS.muted}>{'Cores'.padEnd(14)}</Text>
        <Text color={COLORS.text}>{profile.cpuCores}</Text>
      </Box>
      <Box>
        <Text dimColor color={COLORS.muted}>{'RAM'.padEnd(14)}</Text>
        <Text color={COLORS.text}>{profile.totalRamGB.toFixed(1)} GB </Text>
        <Bar value={ramUsed} max={profile.totalRamGB} width={20} color={ramPct > 80 ? COLORS.error : COLORS.primary} bgColor={COLORS.dim} />
        <Text color={COLORS.dim}> {profile.availableRamGB.toFixed(1)} GB free ({ramPct}% used)</Text>
      </Box>
      {profile.hasMetal && (
        <Box>
          <Text dimColor color={COLORS.muted}>{'Metal'.padEnd(14)}</Text>
          <Text color={COLORS.success}>Supported</Text>
        </Box>
      )}
    </Box>
  );
}

function GPUInfoSection({ gpus }: { gpus: GPUInfo[] }) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold color={COLORS.primary}>  Graphics</Text>
      {gpus.map((gpu, i) => (
        <Box key={i} flexDirection="column" marginLeft={2}>
          <Box>
            <Text color={COLORS.accent}>{'\u25C6'}</Text>
            <Text color={COLORS.text}>{' ' + gpu.name + ' '}</Text>
            {gpu.type === 'apple-silicon' && <Text color={COLORS.success}>(Apple Silicon)</Text>}
            {gpu.type === 'nvidia' && <Text color={COLORS.warning}>(NVIDIA)</Text>}
            {gpu.type === 'amd' && <Text color={COLORS.error}>(AMD)</Text>}
            {gpu.type === 'intel' && <Text color={COLORS.cyan}>(Intel)</Text>}
          </Box>
          {gpu.vramGB > 0 && (
            <Box>
              <Text dimColor color={COLORS.muted}>{'VRAM'.padEnd(14)}</Text>
              <Bar value={gpu.vramGB} max={Math.max(gpu.vramGB, 24)} width={16} color={COLORS.warning} bgColor={COLORS.dim} />
              <Text color={COLORS.warning}> {gpu.vramGB.toFixed(1)} GB</Text>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}

function ProviderRow({ provider }: { provider: ProviderAvailability }) {
  return (
    <Box>
      <Text>{'  '}</Text>
      {provider.available ? (
        <Text color={COLORS.success}>{'\u2713'}</Text>
      ) : (
        <Text color={COLORS.error}>{'\u2717'}</Text>
      )}
      <Text>{' '}</Text>
      <Text color={provider.available ? COLORS.text : COLORS.dim}>{provider.name.padEnd(12)}</Text>
      {provider.version && <Text dimColor color={COLORS.muted}>{' v' + provider.version}</Text>}
      {provider.installedModels != null && provider.installedModels > 0 && (
        <Text dimColor color={COLORS.muted}>{' ' + provider.installedModels + ' models'}</Text>
      )}
      {provider.endpoint && <Text dimColor color={COLORS.dim}>{' ' + provider.endpoint}</Text>}
    </Box>
  );
}

function ProvidersSection({ providers }: { providers: ProviderAvailability[] }) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold color={COLORS.primary}>  Providers</Text>
      {providers.map((p, i) => (
        <ProviderRow key={i} provider={p} />
      ))}
    </Box>
  );
}

function InstalledModelsSection({ models }: { models: InstalledModel[] }) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text bold color={COLORS.primary}>  Installed Models</Text>
      {models.map((m, i) => (
        <Box key={i}>
          <Text dimColor color={COLORS.muted}>{'  \u2022 '}</Text>
          <Text color={COLORS.text}>{m.tag}</Text>
          {m.sizeGB > 0 && <Text color={COLORS.warning}>{' (' + m.sizeGB.toFixed(1) + ' GB)'}</Text>}
          {m.quantization && <Text dimColor color={COLORS.muted}>{' [' + m.quantization + ']'}</Text>}
        </Box>
      ))}
    </Box>
  );
}

export function Inspect({ width, height }: InspectProps) {
  const [profile, setProfile] = useState<MachineProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const inspector = new MachineInspector();
    inspector.inspect().then((result) => {
      setProfile(result);
      setLoading(false);
    }).catch((err) => {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Box flexDirection="column" padding={SPACING.padding}>
        <Text bold color={COLORS.primary}>SynthCode Machine Inspector</Text>
        <Box marginTop={1}>
          <Spinner label="Scanning hardware..." />
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

  return (
    <Box flexDirection="column" padding={SPACING.padding}>
      <Box borderStyle="round" borderColor={COLORS.dim} paddingX={SPACING.padding * 2} flexDirection="column">
        <Text bold color={COLORS.primary}>SynthCode Machine Inspector</Text>
        <Text dimColor color={COLORS.muted}>{'\u2500'.repeat(40)}</Text>
        <SystemInfo profile={profile} />
        {profile.gpus.length > 0 && <GPUInfoSection gpus={profile.gpus} />}
        <ProvidersSection providers={profile.providers} />
        {profile.installedModels.length > 0 && (
          <InstalledModelsSection models={profile.installedModels} />
        )}
        {profile.installedModels.length === 0 && (
          <Box marginTop={1}>
            <Text dimColor color={COLORS.dim}>  No models installed</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
