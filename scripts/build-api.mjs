// Bundles the Express API into api/[...all].js, which Vercel deploys as a serverless function.
// npm packages stay external (Vercel installs them); only our own TypeScript is compiled.
import { build } from 'esbuild';

await build({
  entryPoints: ['api-src/index.ts'],
  outfile: 'api/[...all].js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  packages: 'external',
  logLevel: 'info',
});
