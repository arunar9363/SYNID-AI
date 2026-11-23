import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { createGroq } from './groq.js';

dotenv.config({ path: fileURLToPath(new URL('.env', import.meta.url)) });

async function start() {
  const { MONGODB_URI, NODE_ENV, APP_ORIGIN, DEFAULT_MODEL, GROQ_CHAT_MODELS } = process.env;
  const port = Number(process.env.PORT || 5000);
  const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
  const production = NODE_ENV === 'production';
  if (!MONGODB_URI) throw new Error('Set MONGODB_URI before starting the server.');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Set PORT to a valid port number.');
  if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0) throw new Error('Set TRUST_PROXY_HOPS to a nonnegative integer.');

  let publicOrigin;
  if (APP_ORIGIN) {
    const parsed = URL.parse(APP_ORIGIN);
    const validProtocol = parsed?.protocol === 'https:' || (!production && parsed?.protocol === 'http:');
    if (!validProtocol || (parsed.origin !== APP_ORIGIN.replace(/\/$/, ''))) {
      throw new Error('Set APP_ORIGIN to the site origin, including the scheme and hostname.');
    }
    publicOrigin = parsed.origin;
  }

  const keys = [process.env.GROQ_API_KEY, ...Array.from({ length: 5 }, (_, i) => process.env[`GROQ_API_KEY_${i + 1}`])]
    .filter(Boolean);
  const groq = createGroq({ keys, configuredModel: DEFAULT_MODEL, configuredModels: GROQ_CHAT_MODELS });
  if (!groq.available()) console.warn('Groq API keys are missing. AI chat is unavailable.');

  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  } catch (error) {
    throw new Error(`MongoDB startup failed (${error.name}). Check the connection and index permissions.`);
  }

  const app = createApp({ groq, production, publicOrigin, trustProxyHops });
  const server = app.listen(port, () => console.log(`SYNID AI is listening on port ${port}.`));
  server.headersTimeout = 15_000;
  server.requestTimeout = 30_000;
  server.once('error', error => {
    console.error(`HTTP server failed (${error.code || error.name}).`);
    process.exitCode = 1;
    void mongoose.disconnect();
  });

  const shutdown = () => {
    const forceClose = setTimeout(() => server.closeAllConnections(), 10_000);
    forceClose.unref();
    server.close(async () => {
      clearTimeout(forceClose);
      await mongoose.disconnect();
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

start().catch(async error => {
  console.error(error.message);
  process.exitCode = 1;
  await mongoose.disconnect();
});
