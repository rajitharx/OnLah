import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { TrainAlertDetail, TrainAlertsResponse, TrainServiceStatus } from '../../types/domain';
import { DisruptionBanner } from './DisruptionBanner';
import type { TrainAlertsState } from './useTrainAlerts';

const NOW = Date.parse('2026-10-26T10:00:30Z');

function response(status: TrainServiceStatus, alerts: TrainAlertDetail[], refreshFailed = false): TrainAlertsState {
  const value: TrainAlertsResponse = { data: { status, alerts }, fetchedAt: '2026-10-26T10:00:00Z' };
  return { status: 'ok', alerts: value, refreshFailed };
}

function render(alerts: TrainAlertsState): string {
  return renderToStaticMarkup(<DisruptionBanner alerts={alerts} now={NOW} />).replace(/&#x27;/g, "'");
}

const EMPTY = '<div><div role="status" class="banner-live"></div></div>';

function liveRegion(html: string): string | undefined {
  return /<div role="status" class="banner-live">(.*?)<\/div>/.exec(html)?.[1];
}

const alert: TrainAlertDetail = { stations: ['Tampines'], line: 'EWL', direction: 'Pasir Ris', message: 'Delay of 10 minutes', createdAt: '2026-10-26T09:50:00Z' };

describe('DisruptionBanner', () => {
  it('renders only an empty live region before alerts have loaded', () => {
    expect(render({ status: 'loading' })).toBe(EMPTY);
  });

  it('renders only an empty live region when the network is normal', () => {
    expect(render(response(1, []))).toBe(EMPTY);
    expect(render(response(0, [alert]))).toBe(EMPTY);
  });

  it('shows each alert as a labelled status with a Hide button and freshness', () => {
    const html = renderToStaticMarkup(<DisruptionBanner alerts={response(1, [alert])} now={NOW} />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="MRT disruption"');
    expect(html).toContain('aria-label="Hide MRT disruption notice"');
    expect(html).toContain('Delay of 10 minutes');
    expect(html).toContain('Checked 30s ago');
  });

  it('says service alerts are unavailable, neutrally, when the fetch failed', () => {
    const html = renderToStaticMarkup(<DisruptionBanner alerts={{ status: 'unavailable' }} now={NOW} />);
    expect(html).toContain('role="status"');
    expect(html).toContain('Service alerts unavailable');
    expect(html).not.toContain('MRT disruption');
    expect(html).not.toContain('Hide');
  });

  it('says the refresh failed, with the last check time, after an all-clear result', () => {
    const html = render(response(1, [], true));
    expect(html).toContain("Couldn't refresh service alerts.");
    expect(html).toContain('Last checked 30s ago');
    expect(html).not.toContain('MRT disruption');
    expect(html).not.toContain('crowd-red');
  });

  it('keeps the alerts and adds the failed refresh notice, showing the age once', () => {
    const html = render(response(1, [alert], true));
    expect(html).toContain('Delay of 10 minutes');
    expect(html).toContain("Couldn't refresh service alerts.");
    expect(html.match(/30s ago/g)).toHaveLength(1);
  });

  it('shows no failure notice after a successful refresh', () => {
    const html = render(response(1, [alert]));
    expect(html).not.toContain("Couldn't refresh");
  });

  it('mounts the same live region in every state so a later notice is announced', () => {
    const states: TrainAlertsState[] = [
      { status: 'loading' },
      { status: 'unavailable' },
      response(1, []),
      response(1, [], true),
      response(1, [alert]),
    ];
    for (const state of states) expect(liveRegion(render(state))).toBeDefined();
  });

  it('puts the notice text in the live region and nothing in it when all is well', () => {
    expect(liveRegion(render({ status: 'unavailable' }))).toBe('<p class="banner-message">Service alerts unavailable</p>');
    expect(liveRegion(render(response(1, [], true)))).toBe("<p class=\"banner-message\">Couldn't refresh service alerts.</p>");
    expect(liveRegion(render(response(1, [])))).toBe('');
  });

  it('keeps the ticking age out of the live region', () => {
    const failed = response(1, [], true);
    const later = renderToStaticMarkup(<DisruptionBanner alerts={failed} now={NOW + 10_000} />).replace(/&#x27;/g, "'");
    expect(liveRegion(later)).toBe(liveRegion(render(failed)));
    expect(liveRegion(later)).not.toMatch(/\d+s ago/);
    expect(later).toContain('Last checked 40s ago');
  });

  it('adds no card chrome while there is nothing to say', () => {
    expect(render(response(1, []))).not.toContain('class="banner"');
    expect(render({ status: 'unavailable' })).toContain('class="banner"');
  });
});
