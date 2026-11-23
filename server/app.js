import { fileURLToPath } from 'node:url';
import express from 'express';
import mongoose from 'mongoose';
import { createBrowserSessions } from './session.js';
import { chatRoute, conversationDetails, conversationSummary, requireModel } from './chat.js';
import { checkFields, handle, HttpError, textField } from './http.js';
import { Conversation, Persona } from './models.js';

const dist = fileURLToPath(new URL('../client/dist', import.meta.url));
const personaFields = 'name description systemPrompt icon createdAt';
const patchFields = ['title', 'model', 'systemPrompt', 'pinned', 'folder'];

function ownedRecord(req) {
  return { _id: req.params.id, ownerId: req.session.ownerId };
}

function found(record, label = 'Conversation') {
  if (!record) throw new HttpError(404, `${label} not found.`);
  return record;
}

function setSecurityHeaders(res, production) {
  res.set({
    'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  });
  if (production) res.set('Strict-Transport-Security', 'max-age=31536000');
}

export function createApp({ groq, production = false, publicOrigin, trustProxyHops = 0 }) {
  const app = express();
  app.disable('x-powered-by');
  app.disable('etag');
  app.set('query parser', 'simple');
  app.set('trust proxy', trustProxyHops);
  app.use((req, res, next) => {
    setSecurityHeaders(res, production);
    next();
  });

  const api = express.Router();
  const { open, requireSession } = createBrowserSessions({ secureCookies: production });
  api.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const origin = req.get('origin');
      const fetchSite = req.get('sec-fetch-site');
      const allowed = publicOrigin || `${production ? 'https' : 'http'}://${req.get('host')}`;
      if ((origin !== undefined && origin !== allowed) || (fetchSite && !['same-origin', 'none'].includes(fetchSite))) {
        return next(new HttpError(403, 'This request must come from the SYNID AI site.'));
      }
      const hasBody = Number(req.get('content-length')) > 0 || req.get('transfer-encoding') !== undefined;
      if (hasBody && !req.is('application/json')) {
        return next(new HttpError(415, 'Send a JSON request.'));
      }
    }
    next();
  });
  api.use(express.json({ limit: '80kb', inflate: false }));
  api.get('/health', (req, res) => {
    const ready = mongoose.connection.readyState === 1;
    res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'unavailable' });
  });
  api.post('/session', open);
  api.get('/session', requireSession, (req, res) => res.json({ id: req.session.ownerId.toString() }));
  api.use(requireSession);

  api.param('id', (req, res, next, value) => {
    if (!mongoose.isObjectIdOrHexString(value)) return next(new HttpError(404, 'Record not found.'));
    next();
  });

  api.get('/models', (req, res, next) => {
    if (!groq.available()) return next(new HttpError(503, 'The AI service is unavailable.'));
    res.json(groq.models.map(model => ({ ...model, default: model.name === groq.defaultModel })));
  });

  api.get('/conversations', handle(async (req, res) => {
    const conversations = await Conversation.find({ ownerId: req.session.ownerId })
      .select(conversationSummary).sort({ pinned: -1, updatedAt: -1 }).limit(100).lean();
    res.json(conversations);
  }));

  api.post('/conversations', handle(async (req, res) => {
    const { model = groq.defaultModel } = checkFields(req.body || {}, ['model']);
    const { _id, title, pinned, folder, createdAt, updatedAt, messages, systemPrompt, tokenCount } =
      await Conversation.create({ ownerId: req.session.ownerId, model: requireModel(model, groq) });
    res.status(201).json({ _id, model, title, pinned, folder, createdAt, updatedAt, messages, systemPrompt, tokenCount });
  }));

  api.get('/conversations/:id', handle(async (req, res) => {
    const conversation = await Conversation.findOne(ownedRecord(req)).select(conversationDetails).lean();
    res.json(found(conversation));
  }));

  api.patch('/conversations/:id', handle(async (req, res) => {
    const body = checkFields(req.body, patchFields);
    const changes = {};
    if (body.title !== undefined) changes.title = textField(body.title, 'Title', 120);
    if (body.model !== undefined) changes.model = requireModel(body.model, groq);
    if (body.systemPrompt !== undefined) changes.systemPrompt = textField(body.systemPrompt, 'System prompt', 4000, { allowEmpty: true });
    if (body.folder !== undefined) changes.folder = textField(body.folder, 'Folder', 120, { allowEmpty: true });
    if (body.pinned !== undefined) {
      if (typeof body.pinned !== 'boolean') throw new HttpError(400, 'Pinned must be true or false.');
      changes.pinned = body.pinned;
    }
    if (!Object.keys(changes).length) throw new HttpError(400, 'Provide at least one change.');
    const conversation = await Conversation.findOneAndUpdate(ownedRecord(req), {
      $set: changes, $inc: { revision: 1 },
    }, { new: true, runValidators: true }).select(conversationSummary).lean();
    res.json(found(conversation));
  }));

  api.delete('/conversations/:id', handle(async (req, res) => {
    found(await Conversation.findOneAndDelete(ownedRecord(req)).select('_id').lean());
    res.status(204).end();
  }));

  api.delete('/conversations', handle(async (req, res) => {
    await Conversation.deleteMany({ ownerId: req.session.ownerId });
    res.status(204).end();
  }));

  api.patch('/conversations/:id/pin', handle(async (req, res) => {
    const conversation = await Conversation.findOneAndUpdate(ownedRecord(req), [
      { $set: { pinned: { $not: ['$pinned'] } } },
    ], { new: true }).select(conversationSummary).lean();
    res.json(found(conversation));
  }));

  api.delete('/conversations/:id/messages', handle(async (req, res) => {
    const conversation = await Conversation.findOneAndUpdate(ownedRecord(req), {
      $set: { messages: [], title: 'New Chat', tokenCount: 0 }, $inc: { revision: 1 },
    }, { new: true }).select(conversationSummary).lean();
    res.json(found(conversation));
  }));

  api.get('/conversations/:id/export', handle(async (req, res) => {
    const { format = 'markdown' } = req.query;
    if (format !== 'markdown' && format !== 'json') throw new HttpError(400, 'Choose Markdown or JSON.');
    const conversation = found(await Conversation.findOne(ownedRecord(req)).select(conversationDetails).lean());
    const filename = conversation.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 64) || 'synid-chat';
    if (format === 'json') return res.attachment(`${filename}.json`).json(conversation);
    const messages = conversation.messages.map(message => `### ${message.role === 'user' ? 'You' : 'Assistant'}\n\n${message.content}`);
    const markdown = [`# ${conversation.title}`, `**Model** ${conversation.model}`, ...messages].join('\n\n');
    res.attachment(`${filename}.md`).type('text/markdown').send(markdown);
  }));

  api.get('/search', handle(async (req, res) => {
    const query = textField(req.query.q ?? '', 'Search', 160, { allowEmpty: true });
    if (!query) return res.json([]);
    const literal = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = { $regex: literal, $options: 'i' };
    const conversations = await Conversation.find({
      ownerId: req.session.ownerId,
      $or: [{ title: matches }, { 'messages.content': matches }],
    }).select(conversationSummary).sort({ updatedAt: -1 }).limit(20).maxTimeMS(3000).lean();
    res.json(conversations);
  }));

  api.post('/chat', handle(chatRoute(groq)));

  api.get('/personas', handle(async (req, res) => {
    const personas = await Persona.find({ ownerId: req.session.ownerId }).select(personaFields)
      .sort({ createdAt: -1 }).limit(100).lean();
    res.json(personas);
  }));

  api.post('/personas', handle(async (req, res) => {
    const data = checkFields(req.body, ['name', 'description', 'systemPrompt', 'icon']);
    const { _id, name, description, systemPrompt, icon, createdAt } = await Persona.create({
      ownerId: req.session.ownerId,
      name: textField(data.name, 'Name', 60),
      description: textField(data.description ?? '', 'Description', 240, { allowEmpty: true }),
      systemPrompt: textField(data.systemPrompt, 'System prompt', 4000),
      icon: textField(data.icon ?? '🤖', 'Icon', 16),
    });
    res.status(201).json({ _id, name, description, systemPrompt, icon, createdAt });
  }));

  api.delete('/personas/:id', handle(async (req, res) => {
    found(await Persona.findOneAndDelete(ownedRecord(req)).select('_id').lean(), 'Persona');
    res.status(204).end();
  }));

  api.use((req, res, next) => next(new HttpError(404, 'Endpoint not found.')));
  app.use('/api', api);
  app.use(express.static(dist, { dotfiles: 'deny' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.' });
    if (error.status === 415) return res.status(415).json({ error: 'Unsupported request format.' });
    if (error.status === 400) return res.status(400).json({ error: 'Invalid request.' });
    if (error.code === 50) return res.status(503).json({ error: 'The search timed out. Try a more specific query.' });
    console.error('Request failed', error.name);
    res.status(500).json({ error: 'Something went wrong. Try again.' });
  });

  return app;
}
