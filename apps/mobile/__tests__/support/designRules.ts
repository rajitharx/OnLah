import * as fs from 'node:fs';
import * as path from 'node:path';
import * as ts from 'typescript';

// The mobile rules from .claude/commands/ui.md that the compiler cannot see. Each message names
// what to use instead, so an agent that trips a rule is told the supported way, not just "no".

export interface Violation {
  file: string;
  line: number;
  rule: string;
  message: string;
}

const SPACING_PROPS = new Set([
  'padding', 'paddingHorizontal', 'paddingVertical', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
  'margin', 'marginHorizontal', 'marginVertical', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'gap', 'rowGap', 'columnGap',
]);

const COLOUR_LITERAL = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i;

// A line may opt out of one rule with a comment on the same or previous line:
//   // design-rule-exception: <rule> | <reason> | expires YYYY-MM-DD | approved by <human>
const EXCEPTION = /design-rule-exception:\s*([\w-]+)\s*\|\s*(.+?)\s*\|\s*expires (\d{4}-\d{2}-\d{2})\s*\|\s*approved by (\S.*)$/;

export function checkSource(file: string, text: string, today: string): Violation[] {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const lines = text.split('\n');
  const found: Violation[] = [];
  const lineOf = (node: ts.Node) => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
  const add = (node: ts.Node, rule: string, message: string) => found.push({ file, line: lineOf(node), rule, message });

  const visit = (node: ts.Node): void => {
    if (ts.isJsxAttribute(node) && /^(style|\w+Style)$/.test(node.name.getText(source)) && node.initializer) {
      const inline = findObjectLiteral(node.initializer);
      if (inline) add(inline, 'no-inline-style', 'Inline style object. Put it in StyleSheet.create() at the bottom of the file.');
    }
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && COLOUR_LITERAL.test(node.text)) {
      add(node, 'no-colour-literal', `Colour literal "${node.text}". Use colors.* from shared/theme, or withAlpha(colors.*, opacity) for a tint.`);
    }
    if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && isNumber(node.initializer)) {
      const name = node.name.text;
      if (SPACING_PROPS.has(name) && Number(node.initializer.getText(source)) !== 0) {
        add(node, 'no-spacing-literal', `${name}: ${node.initializer.getText(source)} is a hardcoded spacing number. Use spacing.* from shared/theme.`);
      }
      if (name === 'fontSize') {
        add(node, 'no-fontsize-literal', 'fontSize literal. Spread a typography.* style from shared/theme, or add a token there.');
      }
    }
    if ((ts.isIdentifier(node) && node.text === 'TouchableOpacity') && !ts.isImportSpecifier(node.parent)) {
      add(node, 'use-pressable', 'TouchableOpacity. Use Pressable with a pressed style.');
    }
    if (ts.isImportSpecifier(node) && node.name.text === 'TouchableOpacity') {
      add(node, 'use-pressable', 'TouchableOpacity. Use Pressable with a pressed style.');
    }
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'console.log') {
      add(node, 'no-console-log', 'console.log in committed code. Remove it.');
    }
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      add(node, 'no-any', 'The any type. Type it explicitly, or use unknown and narrow.');
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  return found.filter((violation) => !isExcused(violation, lines, today)).concat(badExceptions(file, lines, today));
}

function isNumber(node: ts.Expression): boolean {
  return ts.isNumericLiteral(node) || (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand));
}

function findObjectLiteral(node: ts.Node): ts.ObjectLiteralExpression | undefined {
  if (ts.isObjectLiteralExpression(node)) return node;
  return ts.forEachChild(node, findObjectLiteral);
}

function exceptionFor(violation: Violation, lines: string[]) {
  for (const index of [violation.line - 1, violation.line - 2]) {
    const match = EXCEPTION.exec(lines[index] ?? '');
    if (match && match[1] === violation.rule) return { expires: match[3] };
  }
  return undefined;
}

function isExcused(violation: Violation, lines: string[], today: string): boolean {
  const exception = exceptionFor(violation, lines);
  return exception !== undefined && exception.expires >= today;
}

// An exception that is malformed, or past its expiry, is itself a violation, so it cannot linger.
function badExceptions(file: string, lines: string[], today: string): Violation[] {
  const bad: Violation[] = [];
  lines.forEach((text, index) => {
    if (!text.includes('design-rule-exception:')) return;
    const match = EXCEPTION.exec(text);
    if (!match) {
      bad.push({ file, line: index + 1, rule: 'bad-exception', message: 'Write it as: design-rule-exception: <rule> | <reason> | expires YYYY-MM-DD | approved by <human>' });
    } else if (match[3] < today) {
      bad.push({ file, line: index + 1, rule: 'expired-exception', message: `This exception expired on ${match[3]}. Remove it and fix the line, or get it renewed by ${match[4]}.` });
    }
  });
  return bad;
}

const EXEMPT_DIRS = [`${path.sep}shared${path.sep}theme${path.sep}`];

export function checkTree(root: string, today: string): Violation[] {
  const files: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry.name) && !EXEMPT_DIRS.some((exempt) => full.includes(exempt))) files.push(full);
    }
  };
  walk(path.join(root, 'src'));
  const app = path.join(root, 'App.tsx');
  if (fs.existsSync(app)) files.push(app);
  return files.flatMap((file) => checkSource(path.relative(root, file), fs.readFileSync(file, 'utf8'), today));
}

export function describe(violations: Violation[]): string {
  return violations.map((v) => `${v.file}:${v.line} [${v.rule}] ${v.message}`).join('\n');
}
