import React from 'react';
import { render } from 'ink';
import { App } from './App.js';

export function runTUI() {
  render(<App />, { alternateScreen: true, exitOnCtrlC: false });
}
