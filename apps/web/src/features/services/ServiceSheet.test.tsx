// @vitest-environment jsdom
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('./useBusServiceDetails', () => ({
  useBusServiceDetails: () => ({ details: null, loading: true, failed: false }),
}));

const { ServiceSheet } = await import('./ServiceSheet');

function Harness({ onClose }: { onClose: () => void }) {
  return (
    <>
      <button type="button">Opener</button>
      <ServiceSheet serviceNo="10" arrivals={null} onClose={onClose} />
    </>
  );
}

function Host() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Opener</button>
      {open && <ServiceSheet serviceNo="10" arrivals={null} onClose={() => setOpen(false)} />}
    </>
  );
}

const closeButton = (): HTMLElement => screen.getByRole('button', { name: 'Close bus details' });

describe('ServiceSheet focus', () => {
  afterEach(cleanup);

  it('moves focus to the Close button on open', () => {
    render(<Harness onClose={() => undefined} />);
    expect(document.activeElement).toBe(closeButton());
  });

  it('keeps Tab inside the dialog', () => {
    render(<Harness onClose={() => undefined} />);
    const close = closeButton();

    fireEvent.keyDown(close, { key: 'Tab' });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(close);
  });

  it('pulls focus back in when it sits outside the dialog', () => {
    render(<Harness onClose={() => undefined} />);
    const opener = screen.getByRole('button', { name: 'Opener' });
    opener.focus();
    fireEvent.keyDown(opener, { key: 'Tab' });
    expect(document.activeElement).toBe(closeButton());
  });

  it('returns focus to the opener on close', () => {
    render(<Host />);
    const opener = screen.getByRole('button', { name: 'Opener' });
    opener.focus();
    fireEvent.click(opener);
    expect(document.activeElement).toBe(closeButton());

    fireEvent.click(closeButton());
    expect(document.activeElement).toBe(opener);
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps one key listener when onClose changes and calls the latest one', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const { rerender } = render(<Harness onClose={() => undefined} />);
    const keydownCount = (): number => add.mock.calls.filter(([type]) => type === 'keydown').length;
    const before = keydownCount();
    const latest = vi.fn();
    rerender(<Harness onClose={latest} />);
    expect(keydownCount()).toBe(before);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(latest).toHaveBeenCalledTimes(1);
    add.mockRestore();
  });
});
