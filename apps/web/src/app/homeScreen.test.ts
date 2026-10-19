import { describe, expect, it } from 'vitest';
import indexHtml from '../../index.html?raw';
import manifestRaw from '../../public/manifest.webmanifest?raw';

const publicFiles = Object.keys(import.meta.glob('../../public/*'));

interface Manifest {
  name: string;
  short_name: string;
  start_url: string;
  display: string;
  theme_color: string;
  icons: { src: string; type: string }[];
}

const manifest = JSON.parse(manifestRaw) as Manifest;

describe('home-screen install', () => {
  it('names the app and opens it standalone from the root', () => {
    expect(manifest.name).toBe('OnLah Bus Board');
    expect(manifest.short_name).toBe('OnLah');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
  });

  it('colours the browser chrome with the palette accent', () => {
    expect(manifest.theme_color).toBe('#F5ECD7');
  });

  it('ships every icon the manifest and the page point at', () => {
    const iconPaths = manifest.icons.map((icon) => `../../public${icon.src}`);
    for (const path of iconPaths) expect(publicFiles).toContain(path);
    expect(publicFiles).toContain('../../public/apple-touch-icon.png');
    expect(manifest.icons[0].type).toBe('image/svg+xml');
  });

  it('links the manifest, theme colour and icons from the page', () => {
    expect(indexHtml).toContain('rel="manifest" href="/manifest.webmanifest"');
    expect(indexHtml).toContain('name="theme-color" content="#F5ECD7"');
    expect(indexHtml).toContain('rel="icon" href="/icon.svg"');
    expect(indexHtml).toContain('rel="apple-touch-icon" href="/apple-touch-icon.png"');
  });
});
