import { useLayoutEffect, useState } from 'react';
import { ArrowUp, Sparkles, Square } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import TemplatesModal from './TemplatesModal';

export default function ChatInput({ textareaRef, onSend }) {
  const [showTemplates, setShowTemplates] = useState(false);
  const { draft, setDraft, sendMessage, streaming, stopGeneration, loadingChat, modelStatus, systemPrompt } = useChat();
  const canSend = Boolean(draft.trim()) && modelStatus === 'ready' && !loadingChat;

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [draft, textareaRef]);

  function handleSend() {
    if (!canSend || streaming) return;
    onSend();
    sendMessage(draft);
  }

  return (
    <div className="composer-wrap">
      <form className="composer" onSubmit={event => { event.preventDefault(); handleSend(); }}>
        <textarea ref={textareaRef} aria-label="Message" placeholder="Message SYNID AI" rows={1}
          value={draft} maxLength={8000} disabled={streaming || loadingChat} onChange={event => setDraft(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              handleSend();
            }
          }} />
        <div className="composer-actions">
          <button className="icon-button template-button" type="button" title="Prompt templates" disabled={streaming || loadingChat}
            onClick={() => setShowTemplates(true)}><Sparkles size={17} /></button>
          {streaming ? (
            <button key="stop" className="composer-send stop" type="button" title="Stop generating" onClick={event => {
              event.preventDefault();
              stopGeneration();
            }}>
              <Square size={13} fill="currentColor" />
            </button>
          ) : (
            <button key="send" className="composer-send" type="submit" disabled={!canSend} title="Send message"><ArrowUp size={21} /></button>
          )}
        </div>
      </form>
      <div className="composer-meta">
        <span>{modelStatus === 'error' ? 'AI service unavailable' : 'Prompts are processed by Groq.'}
          {systemPrompt && <span className="prompt-status"> Custom prompt active</span>}</span>
        {draft.length > 500 && <span>{draft.length.toLocaleString()} / 8,000</span>}
      </div>
      {showTemplates && <TemplatesModal onClose={() => setShowTemplates(false)} onSelect={prompt => {
        setDraft(prompt.slice(0, 8000));
        textareaRef.current?.focus();
      }} />}
    </div>
  );
}
