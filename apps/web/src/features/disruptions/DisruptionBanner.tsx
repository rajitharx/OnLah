import { useState } from 'react';
import type { TrainAlertsResponse } from '../../types/domain';
import { AlertIcon } from '../../shared/components/Icons';
import { Freshness } from '../../shared/components/Freshness';

interface DisruptionBannerProps {
  alerts: TrainAlertsResponse | null;
  now: number;
}

// Inline notice above the page content, not a modal. It can be hidden,
// but it returns when the set of alerts changes.
export function DisruptionBanner({ alerts, now }: DisruptionBannerProps) {
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  if (alerts === null) return null;
  const { status, alerts: items } = alerts.data;
  if (status !== 1 || items.length === 0) return null;

  const key = items.map((a) => `${a.line}|${a.createdAt}`).join(';');
  if (dismissedKey === key) return null;

  return (
    <section className="banner" role="status" aria-label="MRT disruption">
      <div className="banner-head">
        <span className="banner-title">
          <AlertIcon size={16} />
          MRT disruption
        </span>
        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => setDismissedKey(key)}
          aria-label="Hide MRT disruption notice"
        >
          Hide
        </button>
      </div>
      {items.map((alert) => (
        <div className="banner-item" key={`${alert.line}-${alert.createdAt}`}>
          <p className="banner-line">
            {alert.line} <span className="banner-direction">· {alert.direction}</span>
          </p>
          <p className="banner-message">{alert.message}</p>
        </div>
      ))}
      <Freshness fetchedAt={alerts.fetchedAt} now={now} label="Checked" />
    </section>
  );
}
