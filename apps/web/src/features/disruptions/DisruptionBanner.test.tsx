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
  return renderToStaticMarkup(<DisruptionBanner alerts={alerts} now={NOW} />).replaceAll('&#x27;', "'");
}

const alert: TrainAlertDetail = { stations: ['Tampines'], line: 'EWL', direction: 'Pasir Ris', message: 'Delay of 10 minutes', createdAt: '2026-10-26T09:50:00Z' };

describe('DisruptionBanner', () => {
  it('renders nothing before alerts have loaded', () => {
    expect(renderToStaticMarkup(<DisruptionBanner alerts={{ status: 'loading' }} now={NOW} />)).toBe('');
  });

  it('renders nothing when the network is normal', () => {
    expect(renderToStaticMarkup(<DisruptionBanner alerts={response(1, [])} now={NOW} />)).toBe('');
    expect(renderToStaticMarkup(<DisruptionBanner alerts={response(0, [alert])} now={NOW} />)).toBe('');
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
});
