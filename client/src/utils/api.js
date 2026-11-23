class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, signal, sessionId } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (sessionId) headers['X-SYNID-Session'] = sessionId;
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal,
      credentials: 'same-origin', mode: 'same-origin', cache: 'no-store', redirect: 'error',
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error('Could not reach SYNID AI. Try again.');
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(response.status, data?.error || 'The request failed. Try again.');
  }
  return response;
}

async function getData(response) {
  return response.status === 204 ? null : response.json();
}

async function readSession(response) {
  const session = await response.json().catch(() => null);
  return typeof session?.id === 'string' && session.id.trim() ? session : null;
}

let openingSession;

export function openBrowserSession() {
  if (!openingSession) {
    const open = async () => {
      const response = await request('/session', { method: 'POST' });
      const session = await readSession(response);
      if (!session) {
        // The browser may have stored the session cookie before the response body was lost.
        const recovered = await request('/session').then(readSession).catch(() => null);
        if (recovered) return recovered;
        throw new Error('SYNID AI could not open a browser session. Check the site address and try again.');
      }
      if (response.status === 201) {
        try {
          await request('/session', { sessionId: session.id });
        } catch (error) {
          if (error.status === 401) throw new Error('Allow cookies for SYNID AI to keep your chats private in this browser.');
          throw error;
        }
      }
      return session;
    };
    // Coordinate initial visits from multiple tabs before they share a session cookie.
    const task = navigator.locks ? navigator.locks.request('synid-browser-session', open) : open();
    openingSession = task.finally(() => { openingSession = null; });
  }
  return openingSession;
}

async function readChat(response, onChunk) {
  if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream')) {
    throw new Error('Could not start the reply. Try again.');
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) throw new Error('The reply ended early. Try again.');
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const data = JSON.parse(line.slice(5));
        if (data.type === 'chunk') onChunk(data.content);
        if (data.type === 'error') throw new ApiError(data.status, data.message);
        if (data.type === 'done') return data.conversation;
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export function createChatApi(sessionId, onUnauthorized) {
  async function authenticated(action) {
    try {
      return await action();
    } catch (error) {
      if (error.status === 401) onUnauthorized(sessionId);
      throw error;
    }
  }

  const send = (path, options) => request(path, { ...options, sessionId });
  const data = (path, options) => authenticated(() => send(path, options).then(getData));
  const conversation = id => `/conversations/${encodeURIComponent(id)}`;

  return {
    getModels: signal => data('/models', { signal }),
    getConversations: signal => data('/conversations', { signal }),
    getConversation: (id, signal) => data(conversation(id), { signal }),
    updateConversation: (id, body) => data(conversation(id), { method: 'PATCH', body }),
    deleteConversation: id => data(conversation(id), { method: 'DELETE' }),
    clearAllConversations: () => data('/conversations', { method: 'DELETE' }),
    pinConversation: id => data(`${conversation(id)}/pin`, { method: 'PATCH' }),
    clearMessages: id => data(`${conversation(id)}/messages`, { method: 'DELETE' }),
    searchConversations: (query, signal) => data(`/search?${new URLSearchParams({ q: query })}`, { signal }),
    getPersonas: signal => data('/personas', { signal }),
    createPersona: body => data('/personas', { method: 'POST', body }),
    deletePersona: id => data(`/personas/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    streamChat: (body, signal, onChunk) => authenticated(async () => {
      const response = await send('/chat', { method: 'POST', body, signal });
      return readChat(response, onChunk);
    }),
    exportConversation: (id, format, signal) => authenticated(async () => {
      const response = await send(`${conversation(id)}/export?${new URLSearchParams({ format })}`, { signal });
      const blob = await response.blob();
      if (signal?.aborted) return;
      const filename = /filename="([A-Za-z0-9.-]+)"/.exec(response.headers.get('content-disposition') || '')?.[1];
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `synid-chat.${format === 'json' ? 'json' : 'md'}`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }),
  };
}
