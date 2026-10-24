import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { build, type Plugin } from 'vite';

const NOT_PRECACHED = new Set(['sw.js', '_redirects', '_headers']);

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

// Builds src/sw/sw.ts into dist/sw.js after the app build, with the app shell file list and a content hash baked in.
// A changed hash means a new cache name, so each deploy installs fresh and drops the old cache.
export function offlineWorker(): Plugin {
  let outDir = 'dist';
  let root = process.cwd();

  return {
    name: 'onlah-offline-worker',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
      root = config.root;
    },
    async closeBundle() {
      const dist = join(root, outDir);
      const files = listFiles(dist)
        .map((path) => relative(dist, path).split(sep).join('/'))
        .filter((file) => !NOT_PRECACHED.has(file))
        .sort();

      const hash = createHash('sha256');
      for (const file of files) hash.update(file).update(readFileSync(join(dist, file)));
      const version = hash.digest('hex').slice(0, 12);
      const precache = files.map((file) => (file === 'index.html' ? '/' : `/${file}`));

      await build({
        configFile: false,
        root,
        publicDir: false,
        logLevel: 'warn',
        define: { __PRECACHE__: JSON.stringify(precache), __VERSION__: JSON.stringify(version) },
        build: {
          outDir,
          emptyOutDir: false,
          minify: true,
          lib: { entry: join(root, 'src/sw/sw.ts'), formats: ['iife'], name: 'onlahWorker', fileName: () => 'sw.js' },
        },
      });
    },
  };
}
