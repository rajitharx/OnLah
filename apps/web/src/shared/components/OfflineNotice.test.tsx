import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { OFFLINE_MESSAGE, OfflineBanner } from './OfflineNotice';

describe('OfflineBanner', () => {
  it('announces the offline state in words as a status message', () => {
    const html = renderToStaticMarkup(<OfflineBanner />);
    expect(html).toContain('role="status"');
    expect(html).toContain("You&#x27;re offline");
    expect(OFFLINE_MESSAGE).toContain('Saved stops still open');
  });
});
