import assert from 'node:assert/strict';
import * as path from 'node:path';
import { test } from 'node:test';
import { checkSource, checkTree, describe } from './support/designRules';

const today = '2026-11-09';
const rulesOf = (code: string) => checkSource('Fixture.tsx', code, today).map((v) => v.rule);

test('the app follows the mobile design rules', () => {
  const root = path.resolve(__dirname, '..', '..');
  const found = checkTree(root, new Date().toISOString().slice(0, 10));
  assert.equal(found.length, 0, `\n${describe(found)}\n`);
});

test('flags an inline style object, including one mixed into a style array', () => {
  assert.deepEqual(rulesOf('const a = <View style={{ flex: 1 }} />;'), ['no-inline-style']);
  assert.deepEqual(rulesOf('const a = <View style={[styles.a, { opacity: 0.5 }]} />;'), ['no-inline-style']);
  assert.deepEqual(rulesOf('const a = <View style={[styles.a, pressed && styles.b]} />;'), []);
});

test('flags colour literals but not words that merely contain a hash', () => {
  assert.deepEqual(rulesOf("const a = { color: '#F5ECD7' };"), ['no-colour-literal']);
  assert.deepEqual(rulesOf("const a = { color: 'rgba(0, 0, 0, 0.5)' };"), ['no-colour-literal']);
  assert.deepEqual(rulesOf("const a = 'Stop #12 is closed';"), []);
});

test('flags hardcoded spacing and font sizes, but allows zero and tokens', () => {
  assert.deepEqual(rulesOf('const s = { padding: 12, marginTop: 8 };'), ['no-spacing-literal', 'no-spacing-literal']);
  assert.deepEqual(rulesOf('const s = { fontSize: 12 };'), ['no-fontsize-literal']);
  assert.deepEqual(rulesOf('const s = { padding: 0, gap: spacing.sm, ...typography.caption };'), []);
});

test('flags TouchableOpacity, console.log and any', () => {
  assert.deepEqual(rulesOf("import { TouchableOpacity } from 'react-native';"), ['use-pressable']);
  assert.deepEqual(rulesOf('console.log(x);'), ['no-console-log']);
  assert.deepEqual(rulesOf('function f(x: any) { return x; }'), ['no-any']);
});

test('an exception needs a reason, an expiry and a human, and stops working after it expires', () => {
  const line = (comment: string) => `${comment}\nconst s = { fontSize: 12 };`;
  assert.deepEqual(rulesOf(line('// design-rule-exception: no-fontsize-literal | matches the legacy badge | expires 2026-12-01 | approved by Rajitha')), []);
  assert.deepEqual(rulesOf(line('// design-rule-exception: no-fontsize-literal | matches the legacy badge | expires 2026-11-01 | approved by Rajitha')).sort(), ['expired-exception', 'no-fontsize-literal']);
  assert.deepEqual(rulesOf(line('// design-rule-exception: no-fontsize-literal')).sort(), ['bad-exception', 'no-fontsize-literal']);
  assert.deepEqual(rulesOf(line('// design-rule-exception: no-any | wrong rule | expires 2026-12-01 | approved by Rajitha')), ['no-fontsize-literal']);
});
