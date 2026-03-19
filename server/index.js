import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Conversation, Persona } from './models.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ── MongoDB ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

const OLLAMA = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

// ── Helper: auto-generate title from first message ──────────────────────────
async function generateTitle(content, model) {
  try {
    const res = await fetch(`${OLLAMA}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: `Generate a short 4-6 word title for a chat that starts with: "${content.slice(0, 200)}". Reply with ONLY the title, no quotes, no punctuation at end.`,
        stream: false,
      }),
    });
    const data = await res.json();
    return data.response?.trim() || 'New Chat';
  } catch {
    return 'New Chat';
  }
}

// ── GET /api/models ──────────────────────────────────────────────────────────
app.get('/api/models', async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA}/api/tags`);
    const data = await response.json();
    res.json(data.models || []);
  } catch (err) {
    res.status(500).json({ error: 'Ollama not running. Start with: ollama serve' });
  }
});

// ── GET /api/conversations ───────────────────────────────────────────────────
app.get('/api/conversations', async (req, res) => {
  try {
    const convos = await Conversation.find({}, '-messages')
      .sort({ pinned: -1, updatedAt: -1 })
      .limit(100);
    res.json(convos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/conversations/:id ───────────────────────────────────────────────
app.get('/api/conversations/:id', async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.id);
    if (!convo) return res.status(404).json({ error: 'Not found' });
    res.json(convo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/conversations ──────────────────────────────────────────────────
app.post('/api/conversations', async (req, res) => {
  try {
    const convo = new Conversation({ model: req.body.model || process.env.DEFAULT_MODEL });
    await convo.save();
    res.json(convo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/conversations/:id ─────────────────────────────────────────────
app.patch('/api/conversations/:id', async (req, res) => {
  try {
    const convo = await Conversation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(convo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/conversations/:id ────────────────────────────────────────────
app.delete('/api/conversations/:id', async (req, res) => {
  try {
    await Conversation.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/conversations ─────────────────────────────────────────────────
app.delete('/api/conversations', async (req, res) => {
  try {
    await Conversation.deleteMany({});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/chat (STREAMING) ───────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { conversationId, message, model, images = [] } = req.body;

  if (!message?.trim()) return res.status(400).json({ error: 'Message required' });

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    // Load or create conversation
    let convo = conversationId
      ? await Conversation.findById(conversationId)
      : null;

    if (!convo) {
      convo = new Conversation({ model: model || process.env.DEFAULT_MODEL });
    }

    const activeModel = model || convo.model || process.env.DEFAULT_MODEL;

    // Add user message
    convo.messages.push({ role: 'user', content: message });
    send({ type: 'conversation_id', id: convo._id.toString() });

    // Build messages array for Ollama — prepend system prompt if set
    const systemPrompt = req.body.systemPrompt ?? convo.systemPrompt ?? '';
    const ollamaMessages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...convo.messages.map(m => ({ role: m.role, content: m.content })),
    ];

    // For multimodal models (llava etc), attach images to last user message
    if (images.length > 0 && ollamaMessages.length > 0) {
      const last = ollamaMessages[ollamaMessages.length - 1];
      if (last.role === 'user') last.images = images;
    }

    // Stream from Ollama
    const ollamaRes = await fetch(`${OLLAMA}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: activeModel, messages: ollamaMessages, stream: true }),
    });

    if (!ollamaRes.ok) {
      throw new Error(`Ollama error: ${ollamaRes.statusText}`);
    }

    let fullResponse = '';
    const reader = ollamaRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.trim());

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            fullResponse += json.message.content;
            send({ type: 'chunk', content: json.message.content });
          }
          if (json.done) {
            send({ type: 'done', eval_count: json.eval_count });
          }
        } catch { /* skip malformed lines */ }
      }
    }

    // Save assistant message
    convo.messages.push({ role: 'assistant', content: fullResponse });

    // Update system prompt if provided
    if (req.body.systemPrompt !== undefined) convo.systemPrompt = req.body.systemPrompt;

    // Auto-generate title from first exchange
    if (convo.messages.length === 2) {
      convo.title = await generateTitle(message, activeModel);
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

// ── GET /api/conversations/search ────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const results = await Conversation.find({
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

// ── GET /api/conversations/:id/export ────────────────────────────────────────
app.get('/api/conversations/:id/export', async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.id);
    if (!convo) return res.status(404).json({ error: 'Not found' });

    const { format = 'markdown' } = req.query;

    if (format === 'json') {
      res.setHeader('Content-Disposition', `attachment; filename="${convo.title}.json"`);
      res.setHeader('Content-Type', 'application/json');
      return res.json(convo);
    }

    // Markdown export
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

// ── PATCH /api/conversations/:id/pin ─────────────────────────────────────────
app.patch('/api/conversations/:id/pin', async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.id);
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
    const convo = await Conversation.findById(req.params.id);
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
  try { res.json(await Persona.find().sort({ createdAt: -1 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/personas', async (req, res) => {
  try {
    const p = new Persona(req.body);
    await p.save();
    res.json(p);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/personas/:id', async (req, res) => {
  try {
    await Persona.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
