import { describe, expect, it } from 'vitest';
import html from '../index.html?raw';
import ogImage from '../public/og-image.png?inline';

function meta(attr: 'name' | 'property', key: string): string {
  const tag = html.match(new RegExp(`<meta\\s+${attr}="${key}"\\s+content="([^"]*)"`));
  if (!tag) throw new Error(`missing meta ${key}`);
  return tag[1];
}

describe('page metadata', () => {
  it('describes the app in one real sentence', () => {
    const description = meta('name', 'description');
    expect(description).not.toBe('OnLah bus board');
    expect(description).toMatch(/bus arrival/i);
    expect(meta('property', 'og:description')).toBe(description);
  });

  it('declares Open Graph and Twitter card tags', () => {
    expect(meta('property', 'og:type')).toBe('website');
    expect(meta('property', 'og:site_name')).toBe('OnLah');
    expect(meta('property', 'og:title')).toBeTruthy();
    expect(meta('property', 'og:locale')).toBe('en_SG');
    expect(meta('property', 'og:image:width')).toBe('1200');
    expect(meta('property', 'og:image:height')).toBe('630');
    expect(meta('property', 'og:image:alt')).toBeTruthy();
    expect(meta('name', 'twitter:card')).toBe('summary_large_image');
  });

  it('uses absolute URLs that agree with the canonical link', () => {
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    expect(canonical).toMatch(/^https:\/\//);
    expect(meta('property', 'og:url')).toBe(canonical);
    const image = meta('property', 'og:image');
    expect(image).toMatch(/^https:\/\//);
    expect(meta('name', 'twitter:image')).toBe(image);
  });

  it('ships the og:image file from public', () => {
    expect(new URL(meta('property', 'og:image')).pathname).toBe('/og-image.png');
    const png = Uint8Array.from(atob(ogImage.split(',')[1]), (c) => c.charCodeAt(0));
    const view = new DataView(png.buffer);
    expect(view.getUint32(16)).toBe(1200);
    expect(view.getUint32(20)).toBe(630);
    expect(png.length).toBeLessThan(150 * 1024);
  });
});
