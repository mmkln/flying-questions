import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ThemeMode,
  nextThemeMode,
  normalizeThemeMode,
  resolveTheme,
} from './theme.js';

test('normalizes unknown theme modes to system', () => {
  assert.equal(normalizeThemeMode('sepia'), ThemeMode.SYSTEM);
  assert.equal(normalizeThemeMode(ThemeMode.DARK), ThemeMode.DARK);
});

test('resolves system mode from the operating-system preference', () => {
  assert.equal(resolveTheme(ThemeMode.SYSTEM, false), ThemeMode.LIGHT);
  assert.equal(resolveTheme(ThemeMode.SYSTEM, true), ThemeMode.DARK);
  assert.equal(resolveTheme(ThemeMode.LIGHT, true), ThemeMode.LIGHT);
  assert.equal(resolveTheme(ThemeMode.DARK, false), ThemeMode.DARK);
});

test('cycles through system, light, and dark', () => {
  assert.equal(nextThemeMode(ThemeMode.SYSTEM), ThemeMode.LIGHT);
  assert.equal(nextThemeMode(ThemeMode.LIGHT), ThemeMode.DARK);
  assert.equal(nextThemeMode(ThemeMode.DARK), ThemeMode.SYSTEM);
});
