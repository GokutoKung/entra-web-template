import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { parse } from 'yaml';

const CONFIG_FILE = 'config/config.yaml';

function readConfigFile(): string | null {
  try {
    return readFileSync(CONFIG_FILE, 'utf8');
  } catch {
    // config.yaml is optional (fresh clone / Docker generates it) — return null.
    return null;
  }
}

// Port: env PORT > config/config.yaml server.port > 5173.
function resolvePort(): number {
  const fromEnv = Number(process.env.PORT);
  if (fromEnv > 0) return fromEnv;
  const raw = readConfigFile();
  if (raw) {
    const cfg = parse(raw) as { server?: { port?: number } } | null;
    const fromFile = Number(cfg?.server?.port);
    if (fromFile > 0) return fromFile;
  }
  return 5173;
}

function sendConfig(res: ServerResponse): void {
  const body = readConfigFile();
  if (body == null) {
    res.statusCode = 404;
    res.end('config.yaml not found');
    return;
  }
  res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(body);
}

// The browser fetches /config.yaml, but the source lives in config/ (like the
// other dev-tools). Serve it in dev/preview and copy it into the build.
function serveConfigYaml(): Plugin {
  return {
    name: 'serve-config-yaml',
    configureServer(server) {
      server.middlewares.use(
        '/config.yaml',
        (_req: IncomingMessage, res: ServerResponse) => sendConfig(res),
      );
    },
    configurePreviewServer(server) {
      server.middlewares.use(
        '/config.yaml',
        (_req: IncomingMessage, res: ServerResponse) => sendConfig(res),
      );
    },
    generateBundle() {
      const body = readConfigFile();
      if (body != null) {
        this.emitFile({ type: 'asset', fileName: 'config.yaml', source: body });
      }
    },
  };
}

const port = resolvePort();

export default defineConfig({
  plugins: [react(), serveConfigYaml()],
  server: {
    port,
    host: true,
    strictPort: false,
  },
  preview: {
    port,
    host: true,
    strictPort: false,
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    globals: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.{test,spec}.ts', 'src/vite-env.d.ts'],
    },
  },
});
