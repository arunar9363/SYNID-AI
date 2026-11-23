import mongoose from 'mongoose';

const ownerId = { type: mongoose.Schema.Types.ObjectId, required: true, immutable: true };

const sessionSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  ownerId,
  browser: Boolean,
  expiresAt: { type: Date, required: true, expires: 0 },
});

sessionSchema.index({ ownerId: 1 }, { unique: true, partialFilterExpression: { browser: true } });

const rateLimitSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  count: { type: Number, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  tokens: { type: Number, default: 0 },
});

const conversationSchema = new mongoose.Schema({
  ownerId,
  title: { type: String, default: 'New Chat' },
  model: { type: String, required: true },
  systemPrompt: { type: String, default: '' },
  messages: [messageSchema],
  pinned: { type: Boolean, default: false },
  tokenCount: { type: Number, default: 0 },
  folder: { type: String, default: '' },
  revision: { type: Number, default: 0 },
}, { timestamps: true });

conversationSchema.index({ ownerId: 1, pinned: -1, updatedAt: -1 });

const personaSchema = new mongoose.Schema({
  ownerId,
  name: { type: String, required: true },
  description: { type: String, default: '' },
  systemPrompt: { type: String, required: true },
  icon: { type: String, default: '🤖' },
  createdAt: { type: Date, default: Date.now },
});

personaSchema.index({ ownerId: 1, createdAt: -1 });

export const Session = mongoose.model('Session', sessionSchema);
export const RateLimit = mongoose.model('RateLimit', rateLimitSchema);
export const Conversation = mongoose.model('Conversation', conversationSchema);
export const Persona = mongoose.model('Persona', personaSchema);
