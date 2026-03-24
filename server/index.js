import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Conversation, Persona } from './models.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: 'https://synidai.onrender.com',
  exposedHeaders: ['x-user-id'],
}));
app.use(express.json());

// ── Groq Config ───────────────────────────────────────────────────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

// ── Available Groq Models ─────────────────────────────────────────────────────
const GROQ_MODELS = [
  { name: 'llama-3.3-70b-versatile' },
  { name: 'llama-3.1-8b-instant' },
  { name: 'llama3-70b-8192' },
  { name: 'llama3-8b-8192' },
  { name: 'gemma2-9b-it' },
  { name: 'mixtral-8x7b-32768' },
  { name: 'deepseek-r1-distill-llama-70b' },
  { name: 'qwen-qwq-32b' },
  { name: 'meta-llama/llama-4-scout-17b-16e-instruct' },
  { name: 'meta-llama/llama-4-maverick-17b-128e-instruct' },
];

const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'llama-3.3-70b-versatile';

// ── MongoDB ───────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ── Middleware: extract userId from header ────────────────────────────────────
function getUserId(req) {
  return req.headers['x-user-id'] || 'anonymous';
}

// ── Helper: auto-generate title ───────────────────────────────────────────────
async function generateTitle(content) {
  try {
    const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'user',
            content: `Generate a short 4-6 word title for a chat that starts with: "${content.slice(0, 200)}". Reply with ONLY the title, no quotes, no punctuation at end.`
          }
        ],
        max_tokens: 20,
        stream: false,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || 'New Chat';
  } catch {
    return 'New Chat';
  }
}

// ── GET /api/models ───────────────────────────────────────────────────────────
app.get('/api/models', async (req, res) => {
  try {
    res.json(GROQ_MODELS);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/conversations ────────────────────────────────────────────────────
app.get('/api/conversations', async (req, res) => {
  try {
    const userId = getUserId(req);
    const convos = await Conversation.find({ userId }, '-messages')
      .sort({ pinned: -1, updatedAt: -1 })
      .limit(100);
    res.json(convos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/conversations/:id ────────────────────────────────────────────────
app.get('/api/conversations/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const convo = await Conversation.findOne({ _id: req.params.id, userId });
    if (!convo) return res.status(404).json({ error: 'Not found' });
    res.json(convo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/conversations ───────────────────────────────────────────────────
app.post('/api/conversations', async (req, res) => {
  try {
    const userId = getUserId(req);
    const convo = new Conversation({ model: req.body.model || DEFAULT_MODEL, userId });
    await convo.save();
    res.json(convo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/conversations/:id ──────────────────────────────────────────────
app.patch('/api/conversations/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const convo = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true }
    );
    res.json(convo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/conversations/:id ─────────────────────────────────────────────
app.delete('/api/conversations/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    await Conversation.findOneAndDelete({ _id: req.params.id, userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/conversations ─────────────────────────────────────────────────
app.delete('/api/conversations', async (req, res) => {
  try {
    const userId = getUserId(req);
    await Conversation.deleteMany({ userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/chat (STREAMING with Groq) ─────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { conversationId, message, model, systemPrompt } = req.body;
  const userId = getUserId(req);

  if (!message?.trim()) return res.status(400).json({ error: 'Message required' });

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    // Load or create conversation — always scoped to userId
    let convo = conversationId
      ? await Conversation.findOne({ _id: conversationId, userId })
      : null;

    if (!convo) {
      convo = new Conversation({ model: model || DEFAULT_MODEL, userId });
    }

    const activeModel = model || convo.model || DEFAULT_MODEL;
    const activeSystemPrompt = systemPrompt ?? convo.systemPrompt ?? '';

    // Add user message
    convo.messages.push({ role: 'user', content: message });
    send({ type: 'conversation_id', id: convo._id.toString() });

    // Build messages for Groq
    const groqMessages = [
      ...(activeSystemPrompt ? [{ role: 'system', content: activeSystemPrompt }] : []),
      ...convo.messages.map(m => ({ role: m.role, content: m.content })),
    ];

    // ── Stream from Groq ──────────────────────────────────────────────────────
    const groqRes = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: activeModel,
        messages: groqMessages,
        stream: true,
        max_tokens: 8192,
      }),
    });

    if (!groqRes.ok) {
      const errData = await groqRes.json();
      throw new Error(errData.error?.message || groqRes.statusText);
    }

    let fullResponse = '';
    const reader = groqRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.trim() && l !== 'data: [DONE]');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const json = JSON.parse(line.slice(6));
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            fullResponse += content;
            send({ type: 'chunk', content });
          }
          if (json.choices?.[0]?.finish_reason === 'stop') {
            send({ type: 'done' });
          }
        } catch { /* skip malformed lines */ }
      }
    }

    // Save assistant message
    convo.messages.push({ role: 'assistant', content: fullResponse });

    // Update system prompt if provided
    if (systemPrompt !== undefined) convo.systemPrompt = systemPrompt;

    // Auto-generate title from first exchange
    if (convo.messages.length === 2) {
      convo.title = await generateTitle(message);
    }

    convo.model = activeModel;
    await convo.save();

    send({ type: 'title', title: convo.title });
    res.end();

  } catch (err) {
    console.error(err);
    send({ type: 'error', message: err.message });
    res.end();
  }
});

// ── GET /api/search ───────────────────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { q } = req.query;
    if (!q) return res.json([]);
    const results = await Conversation.find({
      userId,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { 'messages.content': { $regex: q, $options: 'i' } },
      ]
    }, '-messages').limit(20).sort({ updatedAt: -1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/conversations/:id/export ─────────────────────────────────────────
app.get('/api/conversations/:id/export', async (req, res) => {
  try {
    const userId = getUserId(req);
    const convo = await Conversation.findOne({ _id: req.params.id, userId });
    if (!convo) return res.status(404).json({ error: 'Not found' });

    const { format = 'markdown' } = req.query;

    if (format === 'json') {
      res.setHeader('Content-Disposition', `attachment; filename="${convo.title}.json"`);
      res.setHeader('Content-Type', 'application/json');
      return res.json(convo);
    }

    let md = `# ${convo.title}\n\n`;
    md += `**Model:** ${convo.model}  \n`;
    md += `**Date:** ${new Date(convo.createdAt).toLocaleString()}  \n\n---\n\n`;
    for (const msg of convo.messages) {
      md += `### ${msg.role === 'user' ? '👤 You' : '🤖 Assistant'}\n\n`;
      md += `${msg.content}\n\n`;
    }
    res.setHeader('Content-Disposition', `attachment; filename="${convo.title}.md"`);
    res.setHeader('Content-Type', 'text/markdown');
    res.send(md);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/conversations/:id/pin ──────────────────────────────────────────
app.patch('/api/conversations/:id/pin', async (req, res) => {
  try {
    const userId = getUserId(req);
    const convo = await Conversation.findOne({ _id: req.params.id, userId });
    if (!convo) return res.status(404).json({ error: 'Not found' });
    convo.pinned = !convo.pinned;
    await convo.save();
    res.json({ pinned: convo.pinned });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/conversations/:id/messages ────────────────────────────────────
app.delete('/api/conversations/:id/messages', async (req, res) => {
  try {
    const userId = getUserId(req);
    const convo = await Conversation.findOne({ _id: req.params.id, userId });
    if (!convo) return res.status(404).json({ error: 'Not found' });
    convo.messages = [];
    convo.title = 'New Chat';
    await convo.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PERSONA ROUTES ────────────────────────────────────────────────────────────
app.get('/api/personas', async (req, res) => {
  try {
    const userId = getUserId(req);
    res.json(await Persona.find({ userId }).sort({ createdAt: -1 }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/personas', async (req, res) => {
  try {
    const userId = getUserId(req);
    const p = new Persona({ ...req.body, userId });
    await p.save();
    res.json(p);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/personas/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    await Persona.findOneAndDelete({ _id: req.params.id, userId });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});