import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { OperatorLogo } from './OperatorLogo';

describe('OperatorLogo', () => {
  it('shows the operator name rather than its code when no logo is available', () => {
    const html = renderToStaticMarkup(<OperatorLogo operator="SBST" />);
    expect(html).toContain('SBS Transit');
    expect(html).not.toContain('>SBST<');
  });
});
