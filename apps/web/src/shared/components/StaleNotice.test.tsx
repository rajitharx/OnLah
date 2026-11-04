import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { StaleNotice } from './StaleNotice';

const NOW = Date.parse('2026-10-26T10:01:00Z');

type Props = { role?: string; onClick?: () => void; children?: ReactNode };

function notice(fetchedAt = '2026-10-26T10:00:00Z', onRetry: () => void = () => undefined): ReactElement<Props> {
  return StaleNotice({ fetchedAt, now: NOW, onRetry }) as ReactElement<Props>;
}

function elements(node: ReactNode): ReactElement<Props>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Props>(node)) return [];
  return [node, ...elements(node.props.children)];
}

function text(node: ReactNode): string {
  if (Array.isArray(node)) return node.map(text).join('');
  if (isValidElement<Props>(node)) return text(node.props.children);
  return typeof node === 'string' || typeof node === 'number' ? String(node) : '';
}

describe('StaleNotice', () => {
  it('says the refresh failed and how old the data on screen is', () => {
    const visible = text(notice());

    expect(visible).toContain("Couldn't refresh.");
    expect(visible).toContain('Showing data from 60s ago.');
  });

  it('offers a Try again button that retries', () => {
    const onRetry = vi.fn();
    const button = elements(notice(undefined, onRetry)).find((el) => el.type === 'button');

    expect(button && text(button)).toBe('Try again');
    button?.props.onClick?.();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('announces only the failure, never the age that changes every second', () => {
    const root = notice();
    const alerts = elements(root).filter((el) => el.props.role === 'alert');

    expect(alerts).toHaveLength(1);
    expect(text(alerts[0])).toBe("Couldn't refresh.");
    expect(text(alerts[0])).not.toMatch(/\d+s ago/);
    expect(text(root)).toMatch(/Showing data from 60s ago\./);
  });

  it('can announce politely, so many cards failing at once do not each interrupt', () => {
    const root = StaleNotice({ fetchedAt: '2026-10-26T10:00:00Z', now: NOW, onRetry: () => undefined, tone: 'status' }) as ReactElement<Props>;
    const roles = elements(root).map((el) => el.props.role);

    expect(roles).toContain('status');
    expect(roles).not.toContain('alert');
  });

  it('never shows a negative or NaN age for an unreadable timestamp', () => {
    expect(text(notice('not a date'))).toContain('Showing data from 0s ago.');
  });
});
