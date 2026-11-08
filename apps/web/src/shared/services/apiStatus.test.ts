import { describe, expect, it } from 'vitest';
import { SLOW_MS, classifyProbe } from './apiStatus';

describe('classifyProbe', () => {
  it('is good when the API answers quickly', () => {
    expect(classifyProbe({ ok: true, ms: 120 })).toBe('good');
  });

  it('is slow when the API answers but takes longer than the limit', () => {
    expect(classifyProbe({ ok: true, ms: SLOW_MS + 1 })).toBe('slow');
  });

  it('counts an answer right at the limit as good', () => {
    expect(classifyProbe({ ok: true, ms: SLOW_MS })).toBe('good');
  });

  it('is down when the API does not answer', () => {
    expect(classifyProbe({ ok: false, ms: 50 })).toBe('down');
  });
});
