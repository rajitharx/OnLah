import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { TrainAlertDetail, TrainAlertsResponse, TrainServiceStatus } from '../../types/domain';
import { DisruptionBanner } from './DisruptionBanner';
import type { TrainAlertsState } from './useTrainAlerts';

const NOW = Date.parse('2026-10-26T10:00:30Z');

function response(status: TrainServiceStatus, alerts: TrainAlertDetail[]): TrainAlertsState {
  const value: TrainAlertsResponse = { data: { status, alerts }, fetchedAt: '2026-10-26T10:00:00Z' };
  return { status: 'ok', alerts: value };
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
});
