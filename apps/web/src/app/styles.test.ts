import { describe, expect, it } from 'vitest';
import styles from './styles.css?raw';

describe('styles.css', () => {
  it('lays the live-region wrapper out as a real box, not display: contents', () => {
    const rule = /\.banner-alert-live\s*\{([^}]*)\}/.exec(styles);
    expect(rule).not.toBeNull();
    expect(rule![1]).not.toMatch(/display:\s*contents/);
  });

  it.each([
    ['good', '--crowd-green'],
    ['slow', '--crowd-amber'],
    ['down', '--crowd-red'],
  ])('paints the %s API dot with the shared %s colour', (status, token) => {
    const rule = new RegExp(`\\.api-dot-${status}\\s*\\{([^}]*)\\}`).exec(styles);
    expect(rule?.[1]).toContain(`var(${token})`);
  });
});
