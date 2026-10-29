// Entry point for the Vercel serverless function (bundled to api/index.js).
// vercel.json rewrites /api/<anything> to /api/index?__p=<anything>; the original
// path is restored here so Express routing works the same everywhere.
import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../server';

const app = createApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '/', 'http://localhost');
  const original = url.searchParams.get('__p');
  if (original !== null) {
    url.searchParams.delete('__p');
    req.url = `/api/${original}${url.search}`;
  }
  return (app as unknown as (a: IncomingMessage, b: ServerResponse) => void)(req, res);
}
