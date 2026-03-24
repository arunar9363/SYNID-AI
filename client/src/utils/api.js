import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://synid-ai.onrender.com';

// ── Get or create a unique user ID stored in localStorage ────────────────────
export function getUserId() {
  let uid = localStorage.getItem('synid_user_id');
  if (!uid) {
    uid = 'user_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('synid_user_id', uid);
  }
  return uid;
}

const api = axios.create({ baseURL: `${BASE_URL}/api` });

// ── Attach userId to every request automatically ──────────────────────────────
api.interceptors.request.use(config => {
  config.headers['x-user-id'] = getUserId();
  return config;
});

export const getModels = () => api.get('/models').then(r => r.data);
export const getConversations = () => api.get('/conversations').then(r => r.data);
export const getConversation = (id) => api.get(`/conversations/${id}`).then(r => r.data);
export const createConversation = (model) => api.post('/conversations', { model }).then(r => r.data);
export const updateConversation = (id, data) => api.patch(`/conversations/${id}`, data).then(r => r.data);
export const deleteConversation = (id) => api.delete(`/conversations/${id}`).then(r => r.data);
export const clearAllConversations = () => api.delete('/conversations').then(r => r.data);
export const pinConversation = (id) => api.patch(`/conversations/${id}/pin`).then(r => r.data);
export const clearMessages = (id) => api.delete(`/conversations/${id}/messages`).then(r => r.data);
export const searchConversations = (q) => api.get(`/search?q=${encodeURIComponent(q)}`).then(r => r.data);
export const exportConversation = (id, format = 'markdown') => {
  window.open(`${BASE_URL}/api/conversations/${id}/export?format=${format}`, '_blank');
};

// Personas
export const getPersonas = () => api.get('/personas').then(r => r.data);
export const createPersona = (data) => api.post('/personas', data).then(r => r.data);
export const deletePersona = (id) => api.delete(`/personas/${id}`).then(r => r.data);

// Streaming chat using fetch + SSE
export async function streamChat({ conversationId, message, model, systemPrompt, images = [], onChunk, onDone, onError, onConversationId, onTitle }) {
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
      },
      body: JSON.stringify({ conversationId, message, model, systemPrompt, images }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'chunk')           onChunk?.(data.content);
          if (data.type === 'done')            onDone?.(data);
          if (data.type === 'error')           onError?.(data.message);
          if (data.type === 'conversation_id') onConversationId?.(data.id);
          if (data.type === 'title')           onTitle?.(data.title);
        } catch { /* skip */ }
      }
    }
  } catch (err) {
    onError?.(err.message);
  }
}