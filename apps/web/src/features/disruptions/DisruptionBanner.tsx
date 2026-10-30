import { useState } from 'react';
import { AlertIcon } from '../../shared/components/Icons';
import { Freshness } from '../../shared/components/Freshness';
import type { TrainAlertsState } from './useTrainAlerts';

interface DisruptionBannerProps {
  alerts: TrainAlertsState;
  now: number;
}

// Inline notice above the page content, not a modal. It can be hidden,
// but it returns when the set of alerts changes.
export function DisruptionBanner({ alerts, now }: DisruptionBannerProps) {
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  const failedAt = alerts.status === 'ok' && alerts.refreshFailed ? alerts.alerts.fetchedAt : null;

  return (
    <>
      <NoticeSlot text={noticeFor(alerts)} failedAt={failedAt} now={now} />
      {alerts.status === 'ok' && (
        <Disruptions
          response={alerts.alerts}
          refreshFailed={alerts.refreshFailed}
          now={now}
          dismissedKey={dismissedKey}
          onDismiss={setDismissedKey}
        />
      )}
    </>
  );
}

function noticeFor(alerts: TrainAlertsState): string | null {
  if (alerts.status === 'unavailable') return 'Service alerts unavailable';
  if (alerts.status === 'ok' && alerts.refreshFailed) return "Couldn't refresh service alerts.";
  return null;
}

// The status container stays mounted so screen readers announce text added to it. Only static
// text goes inside; the age ticks every second, so it sits outside the live region.
function NoticeSlot({ text, failedAt, now }: { text: string | null; failedAt: string | null; now: number }) {
  return (
    <div className={text === null ? undefined : 'banner'}>
      <div role="status" aria-label="Service alerts" className="banner-live">
        {text !== null && <p className="banner-message">{text}</p>}
      </div>
      {text !== null && failedAt !== null && <Freshness fetchedAt={failedAt} now={now} label="Last checked" />}
    </div>
  );
}

interface DisruptionsProps {
  response: Extract<TrainAlertsState, { status: 'ok' }>['alerts'];
  refreshFailed: boolean;
  now: number;
  dismissedKey: string | null;
  onDismiss: (key: string) => void;
}

// The status wrapper holds only static text so a new disruption is announced. display: contents
// keeps the title, button and age laid out as one grid, and the ticking age stays outside it.
function Disruptions({ response, refreshFailed, now, dismissedKey, onDismiss }: DisruptionsProps) {
  const { data, fetchedAt } = response;
  const { status, alerts: items } = data;
  if (status !== 1 || items.length === 0) return null;

  const key = items.map((a) => `${a.line}|${a.createdAt}`).join(';');
  if (dismissedKey === key) return null;

  return (
    <section className="banner banner-alert" aria-label="MRT disruption">
      <div role="status" className="banner-alert-live">
        <span className="banner-title">
          <AlertIcon size={16} />
          MRT disruption
        </span>
        {items.map((alert) => (
          <div className="banner-item" key={`${alert.line}-${alert.createdAt}`}>
            <p className="banner-line">
              {alert.line} <span className="banner-direction">· {alert.direction}</span>
            </p>
            <p className="banner-message">{alert.message}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-quiet banner-dismiss"
        onClick={() => onDismiss(key)}
        aria-label="Hide MRT disruption notice"
      >
        Hide
      </button>
      {!refreshFailed && <Freshness fetchedAt={fetchedAt} now={now} label="Checked" />}
    </section>
  );
}
