import fs from 'node:fs';
import path from 'node:path';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  const bundlePath = path.join(process.cwd(), 'dist', 'server.cjs');

  if (!isProduction) {
    const { startServer } = await import('./server/app.ts');
    await startServer();
    return;
  }

  let hasBundle = fs.existsSync(bundlePath);

  if (!hasBundle) {
    try {
      const { buildSync } = await import('esbuild');
      buildSync({
        entryPoints: ['server/app.ts'],
        bundle: true,
        platform: 'node',
        format: 'cjs',
        packages: 'external',
        sourcemap: true,
        outfile: bundlePath,
      });
      hasBundle = fs.existsSync(bundlePath);
    } catch (buildErr) {
      console.error('Failed to compile server bundle on the fly:', buildErr);
    }
  }

  if (hasBundle) {
    const bundle = await import(bundlePath);
    // If not already auto-started by the bundle, invoke startServer
    if (typeof bundle.startServer === 'function' && !bundle.__started) {
      await bundle.startServer();
    }
  } else {
    const { startServer } = await import('./server/app.ts');
    await startServer();
  }
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap server:', err);
  process.exit(1);
});
