import React, { useState } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { Sidebar, type SidebarItem } from './Sidebar.js';
import { Statusbar } from './Statusbar.js';
import { Dashboard } from './screens/Dashboard.js';
import { Inspect } from './screens/Inspect.js';
import { Catalog } from './screens/Catalog.js';
import { Leaderboard } from './screens/Leaderboard.js';
import { ModelDetail } from './screens/ModelDetail.js';
import { Project } from './screens/Project.js';
import { Playground } from './screens/Playground.js';
import { COLORS, SPACING } from './theme.js';

const SCREENS: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '\u25C6', key: '1' },
  { id: 'inspect', label: 'Inspect', icon: '\u2699', key: '2' },
  { id: 'catalog', label: 'Catalog', icon: '\u2261', key: '3' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '\u265B', key: '4' },
  { id: 'project', label: 'Project', icon: '\u2591', key: '5' },
  { id: 'playground', label: 'Playground', icon: '\u25B8', key: '6' },
];

export function App() {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [modelDetail, setModelDetail] = useState<string | null>(null);
  const { exit } = useApp();
  const { stdout } = useStdout();
  const width = stdout?.columns ?? 80;
  const height = stdout?.rows ?? 24;

  useInput((input, key) => {
    if (input === 'q' && !key.ctrl) {
      exit();
      return;
    }
    if (input === 'c' && key.ctrl) {
      exit();
      return;
    }
    const numKey = parseInt(input);
    if (numKey >= 1 && numKey <= SCREENS.length) {
      setModelDetail(null);
      setActiveScreen(SCREENS[numKey - 1].id);
    }
    if (key.escape) {
      setModelDetail(null);
    }
  });

  const contentHeight = height - 4;
  const contentWidth = width - SPACING.sidebarWidth - 4;

  function renderContent() {
    if (modelDetail) {
      return (
        <ModelDetail modelId={modelDetail} onBack={() => setModelDetail(null)} width={contentWidth} height={contentHeight} />
      );
    }

    switch (activeScreen) {
      case 'dashboard':
        return <Dashboard width={contentWidth} height={contentHeight} onNavigate={setActiveScreen} onSelectModel={setModelDetail} />;
      case 'inspect':
        return <Inspect width={contentWidth} height={contentHeight} onNavigate={setActiveScreen} onSelectModel={setModelDetail} />;
      case 'catalog':
        return <Catalog width={contentWidth} height={contentHeight} onNavigate={setActiveScreen} onSelectModel={setModelDetail} />;
      case 'leaderboard':
        return <Leaderboard width={contentWidth} height={contentHeight} onNavigate={setActiveScreen} onSelectModel={setModelDetail} />;
      case 'project':
        return <Project width={contentWidth} height={contentHeight} onNavigate={setActiveScreen} onSelectModel={setModelDetail} />;
      case 'playground':
        return <Playground width={contentWidth} height={contentHeight} onNavigate={setActiveScreen} onSelectModel={setModelDetail} />;
      default:
        return <Dashboard width={contentWidth} height={contentHeight} onNavigate={setActiveScreen} onSelectModel={setModelDetail} />;
    }
  }

  return (
    <Box flexDirection="column" height={height} width={width}>
      <Box flexDirection="row" flexGrow={1}>
        <Box flexDirection="column" width={SPACING.sidebarWidth}>
          <Box flexDirection="row" flexGrow={1}>
            <Sidebar
              items={SCREENS}
              active={activeScreen}
              onSelect={setActiveScreen}
              width={SPACING.sidebarWidth - 1}
            />
            <Box flexDirection="column">
              {Array.from({ length: height - 2 }, (_, i) => (
                <Text key={`divider-${i}`} color={COLORS.dim}>{'\u2502'}</Text>
              ))}
            </Box>
          </Box>
        </Box>
        <Box flexDirection="column" flexGrow={1} padding={SPACING.padding}>
          {renderContent()}
        </Box>
      </Box>
      <Statusbar activeScreen={modelDetail ? 'model-detail' : activeScreen} />
    </Box>
  );
}
