import { describe, expect, it } from 'vitest';
import styles from './styles.css?raw';

describe('styles.css', () => {
  it('lays the live-region wrapper out as a real box, not display: contents', () => {
    const rule = /\.banner-alert-live\s*\{([^}]*)\}/.exec(styles);
    expect(rule).not.toBeNull();
    expect(rule![1]).not.toMatch(/display:\s*contents/);
  });
});
