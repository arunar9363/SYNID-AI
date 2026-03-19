import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../utils/api';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [streaming, setStreaming] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [ollamaOnline, setOllamaOnline] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    api.getModels()
      .then(m => { setModels(m); if (m.length > 0) setSelectedModel(m[0].name); setOllamaOnline(true); })
      .catch(() => setOllamaOnline(false));
  }, []);

  useEffect(() => {
    api.getConversations()
      .then(c => { setConversations(c); setLoadingConvos(false); })
      .catch(() => setLoadingConvos(false));
  }, []);

  const selectConversation = useCallback(async (id) => {
    if (id === activeId) return;
    setActiveId(id);
    const convo = await api.getConversation(id);
    setMessages(convo.messages);
    setSelectedModel(convo.model || selectedModel);
  }, [activeId, selectedModel]);

  const newChat = useCallback(() => { setActiveId(null); setMessages([]); }, []);

  const _doStream = useCallback(async ({ conversationId, message, systemPrompt, images = [], msgHistory }) => {
    setStreaming(true);
    let assistantContent = '';
    let resolvedId = conversationId;

    // Build the payload - include images as base64 if provided
    const imageData = images.map(img => img.base64);

    await api.streamChat({
      conversationId,
      message,
      model: selectedModel,
      systemPrompt,
      images: imageData,
      onConversationId: (id) => {
        resolvedId = id;
        setActiveId(id);
      },
      onChunk: (chunk) => {
        assistantContent += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantContent, _streaming: true };
          return updated;
        });
      },
      onDone: () => {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantContent, _streaming: false };
          return updated;
        });
        setStreaming(false);
      },
      onTitle: (title) => {
        setConversations(prev => {
          const exists = prev.find(c => c._id === resolvedId);
          if (exists) return prev.map(c => c._id === resolvedId ? { ...c, title } : c);
          return [{ _id: resolvedId, title, model: selectedModel, updatedAt: new Date() }, ...prev];
        });
      },
      onError: (err) => {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: `❌ Error: ${err}`, _streaming: false, _error: true };
          return updated;
        });
        setStreaming(false);
      },
    });
  }, [selectedModel]);

  const sendMessage = useCallback(async (text, systemPrompt = '', images = []) => {
    if ((!text.trim() && images.length === 0) || streaming) return;

    const userMsg = { role: 'user', content: text, timestamp: new Date(), images };
    const assistantMsg = { role: 'assistant', content: '', timestamp: new Date(), _streaming: true };
    setMessages(prev => [...prev, userMsg, assistantMsg]);

    await _doStream({ conversationId: activeId, message: text, systemPrompt, images });
  }, [activeId, streaming, _doStream]);

  // Edit a user message — truncate history to that message and re-send
  const editMessage = useCallback(async (msgIndex, newText, systemPrompt = '') => {
    if (streaming) return;
    const truncated = messages.slice(0, msgIndex);
    const userMsg = { role: 'user', content: newText, timestamp: new Date() };
    const assistantMsg = { role: 'assistant', content: '', timestamp: new Date(), _streaming: true };
    setMessages([...truncated, userMsg, assistantMsg]);

    // We need to start a new conversation or send truncated context
    // For simplicity: clear the conversation and re-stream
    await _doStream({ conversationId: null, message: newText, systemPrompt, images: [] });
  }, [messages, streaming, _doStream]);

  // Regenerate the last assistant response
  const regenerate = useCallback(async (systemPrompt = '') => {
    if (streaming || messages.length < 2) return;
    // Find the last user message
    const lastUserIdx = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserIdx === -1) return;
    const userMsg = messages[messages.length - 1 - lastUserIdx];

    // Remove last assistant message, add empty one
    const withoutLast = messages.slice(0, -1);
    const assistantMsg = { role: 'assistant', content: '', timestamp: new Date(), _streaming: true };
    setMessages([...withoutLast, assistantMsg]);

    await _doStream({ conversationId: activeId, message: userMsg.content, systemPrompt, images: [] });
  }, [messages, streaming, activeId, _doStream]);

  const deleteConversation = useCallback(async (id) => {
    await api.deleteConversation(id);
    setConversations(prev => prev.filter(c => c._id !== id));
    if (activeId === id) newChat();
  }, [activeId, newChat]);

  const renameConversation = useCallback(async (id, title) => {
    await api.updateConversation(id, { title });
    setConversations(prev => prev.map(c => c._id === id ? { ...c, title } : c));
  }, []);

  const clearAll = useCallback(async () => {
    await api.clearAllConversations();
    setConversations([]);
    newChat();
  }, [newChat]);

  return (
    <ChatContext.Provider value={{
      conversations, activeId, messages, models, selectedModel,
      setSelectedModel, streaming, loadingConvos, ollamaOnline,
      sidebarOpen, setSidebarOpen,
      selectConversation, newChat, sendMessage, editMessage, regenerate,
      deleteConversation, renameConversation, clearAll,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
