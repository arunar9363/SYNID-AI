import { HttpError } from './http.js';

const completionsUrl = 'https://api.groq.com/openai/v1/chat/completions';
const fastModel = 'openai/gpt-oss-20b';
const productionModels = [
  { name: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B', description: 'Detailed answers and complex reasoning' },
  { name: fastModel, label: 'GPT-OSS 20B', description: 'Quick replies and everyday questions' },
];

export function createGroq({ keys, configuredModel, configuredModels, fetcher = fetch }) {
  const modelNames = configuredModels?.split(',').map(name => name.trim()).filter(Boolean);
  const models = [...new Set(modelNames?.length ? modelNames : productionModels.map(model => model.name))]
    .map(name => productionModels.find(model => model.name === name) || { name, label: name });
  const supports = name => models.some(model => model.name === name);
  const defaultModel = supports(configuredModel) ? configuredModel : models[0].name;
  const activeKeys = new Set(keys.map(key => key.trim()).filter(Boolean));
  let nextKey = 0;

  async function request(payload, signal) {
    const pool = [...activeKeys];
    const start = pool.length ? nextKey++ % pool.length : 0;
    let rateLimited = false;

    for (let offset = 0; offset < pool.length; offset++) {
      const key = pool[(start + offset) % pool.length];
      let response;
      try {
        response = await fetcher(completionsUrl, {
          method: 'POST',
          redirect: 'error',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify(payload),
          signal,
        });
      } catch (error) {
        if (signal.aborted) throw error;
        console.warn('Groq connection failed', error.cause?.code || error.name);
        const blocked = ['EACCES', 'EPERM'].includes(error.cause?.code);
        throw new HttpError(503, blocked
          ? 'The server’s network permissions are blocking Groq.'
          : 'The server could not reach Groq. Try again.');
      }
      if (response.ok) return response;
      await response.body?.cancel();
      if (response.status === 401) {
        activeKeys.delete(key);
      } else if (response.status === 429) {
        rateLimited = true;
      } else {
        throw new HttpError(502, 'The AI service could not answer. Try again or choose another model.');
      }
    }
    if (rateLimited) throw new HttpError(429, 'The AI service is busy. Try again in a moment.');
    throw new HttpError(503, 'The AI service is unavailable.');
  }

  async function* stream({ model, messages, signal }) {
    const response = await request({ model, messages, stream: true, max_completion_tokens: 8192 }, signal);
    if (!response.body) throw new HttpError(502, 'The AI service returned an empty response.');
    const decoder = new TextDecoder();
    let buffer = '';
    for await (const bytes of response.body) {
      buffer += decoder.decode(bytes, { stream: true });
      let newline = buffer.indexOf('\n');
      while (newline !== -1) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          if (data === '[DONE]') return;
          const event = JSON.parse(data);
          if (event.error) throw new HttpError(502, 'The AI service could not finish the reply.');
          const content = event.choices?.[0]?.delta?.content;
          if (typeof content === 'string' && content) yield content;
        }
        newline = buffer.indexOf('\n');
      }
      if (buffer.length > 128_000) break;
    }
    throw new HttpError(502, 'The AI response ended early. Try again.');
  }

  async function title(message, signal) {
    const normalize = value => value.replace(/[\s\p{Cc}]+/gu, ' ').trim().slice(0, 80);
    const fallback = normalize(message) || 'New Chat';
    if (!supports(fastModel)) return fallback;
    try {
      const response = await request({
        model: fastModel,
        messages: [
          { role: 'system', content: 'Write a short title of 4–6 words for the user message. Return only the title.' },
          { role: 'user', content: message.slice(0, 400) },
        ],
        reasoning_effort: 'low',
        max_completion_tokens: 200,
      }, AbortSignal.any([signal, AbortSignal.timeout(3500)]));
      const result = await response.json();
      return normalize(result.choices?.[0]?.message?.content || '') || fallback;
    } catch {
      return fallback;
    }
  }

  return { models, supports, defaultModel, available: () => activeKeys.size > 0, stream, title };
}
