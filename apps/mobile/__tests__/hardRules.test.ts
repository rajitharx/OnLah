import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { test } from 'node:test';
import { colors } from '../src/shared/theme/colors';

// The mobile side of the hard rules in CLAUDE.md that are not design rules: no LTA key or host in the app,
// stop codes are strings, and the palette does not change. See designRules.test.ts for the design rules.

const mobileRoot = path.resolve(__dirname, '..', '..');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx|js|jsx)$/.test(entry.name) ? [full] : [];
  });
}

// What is scanned: app code, the entry file, the Expo and bundler config, and any .env file in the app folder.
// Tests are left out, since they name the forbidden things. node_modules and build output are not part of the app.
function appFiles(): string[] {
  const topLevel = fs
    .readdirSync(mobileRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^(App\.tsx|app\.config\..+|app\.json|babel\.config\.js|metro\.config\.js|\.env.*)$/.test(entry.name))
    .map((entry) => path.join(mobileRoot, entry.name));
  return [...sourceFiles(path.join(mobileRoot, 'src')), ...topLevel];
}

const ltaPatterns: Array<[string, RegExp]> = [
  ['an AccountKey', /account[-_]?key/i],
  ['the LTA DataMall host', /datamall\.lta\.gov\.sg/i],
  ['the LTA odata path', /ltaodataservice/i],
];

function ltaLeaks(code: string): string[] {
  return ltaPatterns.filter(([, pattern]) => pattern.test(code)).map(([name]) => name);
}

// A name like stopCode, busStopCode, nearestStopCodes or stop_code, in any case, declared as a number or turned into one.
// The scan goes line by line and by name. It does not follow a stop code that has been renamed.
const stopCodeName = String.raw`\w*stop_?codes?\w*`;
const numberDeclaration = new RegExp(String.raw`\b${stopCodeName}\??\s*:\s*number\b`, 'i');
const numberConversion = new RegExp(String.raw`\b(?:Number|parseInt|parseFloat)\([^)]*\b${stopCodeName}`, 'i');
const unaryPlus = new RegExp(String.raw`(?:^|[=(,:\s])\+\s*[\w.?!]*${stopCodeName}`, 'i');
const asNumber = new RegExp(String.raw`\b${stopCodeName}\s+as\s+(?:unknown\s+as\s+)?number\b`, 'i');

function stopCodeNumberUses(code: string): string[] {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .filter((line) => [numberDeclaration, numberConversion, unaryPlus, asNumber].some((re) => re.test(line)));
}

test('the app contains no LTA AccountKey and makes no direct LTA call', () => {
  const leaks = appFiles().flatMap((file) =>
    ltaLeaks(fs.readFileSync(file, 'utf8')).map((what) => `${path.relative(mobileRoot, file)} mentions ${what}`),
  );
  assert.deepEqual(leaks, [], 'All LTA calls go through the C# backend. Remove it from mobile code.');
});

test('the LTA scan flags a key, the host and the odata path', () => {
  assert.deepEqual(ltaLeaks("const h = { AccountKey: 'abc' };"), ['an AccountKey']);
  assert.deepEqual(ltaLeaks("fetch('https://datamall.lta.gov.sg/ltaodataservice/BusStops')"), [
    'the LTA DataMall host',
    'the LTA odata path',
  ]);
  assert.deepEqual(ltaLeaks("fetch(`${baseUrl}/api/v1/bus-stops/nearby`)"), []);
  assert.deepEqual(ltaLeaks('// the account key lives on the server'), []);
});

test('no stop code is declared or converted as a number', () => {
  const found = appFiles().flatMap((file) =>
    stopCodeNumberUses(fs.readFileSync(file, 'utf8')).map((line) => `${path.relative(mobileRoot, file)}: ${line.trim()}`),
  );
  assert.deepEqual(found, [], 'Bus stop codes are always String. A number drops the leading zero of 01012.');
});

test('the stop code scan flags number types and conversions, but not strings', () => {
  assert.equal(stopCodeNumberUses('stopCode: number;').length, 1);
  assert.equal(stopCodeNumberUses('busStopCode?: number').length, 1);
  assert.equal(stopCodeNumberUses('const n = Number(stop.busStopCode);').length, 1);
  assert.equal(stopCodeNumberUses('const n = parseInt(stopCode, 10);').length, 1);
  assert.equal(stopCodeNumberUses('const n = +stopCode;').length, 1);
  assert.equal(stopCodeNumberUses('stopCode: string;').length, 0);
  assert.equal(stopCodeNumberUses('// stopCode: number is wrong').length, 0);
  assert.equal(stopCodeNumberUses('const total = count + stopsAway;').length, 0);
  assert.equal(stopCodeNumberUses('bus_stop_code: number').length, 1);
  assert.equal(stopCodeNumberUses('const n = Number(stop.busStopCode.trim());').length, 1);
  assert.equal(stopCodeNumberUses('const n = stopCode as unknown as number;').length, 1);
  assert.equal(stopCodeNumberUses('const x = 1; // stopCode: number is wrong').length, 0);
  assert.equal(stopCodeNumberUses('/* stopCode: number */ const x = 1;').length, 0);
});

test('the colour palette is unchanged', () => {
  assert.deepEqual(colors, {
    background: '#0D0D0D',
    surface: '#1A1A1A',
    accent: '#F5ECD7',
    muted: '#666666',
    border: '#2A2A2A',
    crowdGreen: '#4CAF50',
    crowdAmber: '#FF9800',
    crowdRed: '#F44336',
    white: '#FFFFFF',
  }, 'colors.ts is a hard rule. Changing the palette needs the owner to approve and this test to be updated.');
});
