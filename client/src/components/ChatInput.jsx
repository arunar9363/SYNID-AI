import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '../context/ChatContext';
import { Send, Square, Sparkles } from 'lucide-react';
import TemplatesModal from './TemplatesModal';

export default function ChatInput({ systemPrompt, inputValue, setInputValue }) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { sendMessage, streaming } = useChat();
  const textareaRef = useRef(null);

  const text = inputValue;
  const setText = setInputValue;

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 220) + 'px';
  }, [text]);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const handleSend = () => {
    if (!text.trim() || streaming) return;
    sendMessage(text.trim(), systemPrompt, []);
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const insertTemplate = (prompt) => { setText(prompt); textareaRef.current?.focus(); };

  const charCount = text.length;
  const isOverLimit = charCount > 8000;

  return (
    <>
      <div className="input-wrapper">
        <div className={`input-box ${streaming ? 'streaming' : ''} ${isOverLimit ? 'over-limit' : ''}`}>
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            placeholder="Talk to SYNID AI..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            disabled={streaming}
          />

          <div className="input-actions">
            {charCount > 500 && (
              <span className={`char-count ${isOverLimit ? 'over' : ''}`}>
                {charCount.toLocaleString()}
              </span>
            )}
            <button className="action-btn" onClick={() => setShowTemplates(true)} title="Prompt templates">
              <Sparkles size={15} />
            </button>
            <button
              className={`send-btn ${text.trim() && !streaming ? 'active' : ''} ${streaming ? 'stop' : ''}`}
              onClick={handleSend}
              title={streaming ? 'Stop generating' : 'Send (Enter)'}
            >
              {streaming ? <Square size={14} fill="currentColor" /> : <Send size={14} />}
            </button>
          </div>
        </div>

        <div className="input-footer">
          <span className="input-hint">
            {systemPrompt ? <><span className="prompt-active">⚡ System prompt active</span> · </> : ''}
            Private &amp; local
          </span>
        </div>
      </div>

      {showTemplates && <TemplatesModal onClose={() => setShowTemplates(false)} onSelect={insertTemplate} />}

      <style>{`
        .input-wrapper { padding: 10px 18px 14px; border-top: 1px solid var(--border-subtle); background: var(--bg-base); position: relative; }
        .input-box {
          display: flex; align-items: flex-end; gap: 8px;
          background: var(--bg-elevated); border: 1px solid var(--border);
          border-radius: 14px; padding: 10px 10px 10px 16px;
          transition: border-color var(--transition), box-shadow var(--transition);
        }
        .input-box:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-dim); }
        .input-box.streaming { border-color: rgba(74,172,207,0.4); }
        .input-box.over-limit { border-color: var(--danger); box-shadow: 0 0 0 3px rgba(248,113,113,0.15); }
        .chat-textarea {
          flex: 1; background: none; border: none; outline: none;
          color: var(--text-primary); font-family: var(--font-sans);
          font-size: 14px; line-height: 1.6; resize: none; max-height: 220px; overflow-y: auto;
        }
        .chat-textarea::placeholder { color: var(--text-muted); }
        .chat-textarea:disabled { opacity: 0.5; }
        .input-actions { display: flex; align-items: flex-end; gap: 4px; flex-shrink: 0; }
        .char-count { font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); padding: 0 4px; align-self: center; }
        .char-count.over { color: var(--danger); font-weight: 600; }
        .action-btn {
          width: 32px; height: 32px; border-radius: 8px; background: none; border: none;
          cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center;
          transition: all var(--transition);
        }
        .action-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        .send-btn {
          width: 34px; height: 34px; border-radius: 9px; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all var(--transition); background: var(--bg-hover); color: var(--text-muted); flex-shrink: 0;
        }
        .send-btn.active { background: var(--accent); color: white; }
        .send-btn.active:hover { background: var(--accent-hover); transform: scale(1.05); }
        .send-btn.stop { background: rgba(248,113,113,0.15); color: var(--danger); border: 1px solid rgba(248,113,113,0.3); }
        .input-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 7px; }
        .input-hint { font-size: 11px; color: var(--text-muted); }
        .prompt-active { color: var(--accent); font-weight: 500; }
      `}</style>
    </>
  );
}