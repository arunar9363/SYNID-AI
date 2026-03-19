import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  tokens: { type: Number, default: 0 },
});

const conversationSchema = new mongoose.Schema({
  title: { type: String, default: 'New Chat' },
  model: { type: String, default: 'llama3.2' },
  systemPrompt: { type: String, default: '' },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  pinned: { type: Boolean, default: false },
  tokenCount: { type: Number, default: 0 },
  folder: { type: String, default: '' },
});

conversationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const personaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  systemPrompt: { type: String, required: true },
  icon: { type: String, default: '🤖' },
  createdAt: { type: Date, default: Date.now },
});

export const Conversation = mongoose.model('Conversation', conversationSchema);
export const Persona = mongoose.model('Persona', personaSchema);
