import { useEffect, useRef, useState } from 'react';
import { useChat } from '../context/ChatContext';
import Message from './Message';
import ChatInput from './ChatInput';
import TopBar from './TopBar';
import { Bot, Zap, Code, MessageSquare, Brain } from 'lucide-react';

const SUGGESTIONS = [
  { icon: <Code size={16} />, label: 'Write a React component', prompt: 'Write a React component for a responsive navbar with dark mode toggle' },
  { icon: <Brain size={16} />, label: 'Explain a concept', prompt: 'Explain how transformers work in machine learning in simple terms' },
  { icon: <Zap size={16} />, label: 'Debug my code', prompt: 'Help me debug this Python code and explain the issue' },
  { icon: <MessageSquare size={16} />, label: 'Creative writing', prompt: 'Write a short sci-fi story about an AI that gains consciousness' },
];

function WelcomeScreen() {
  const { sendMessage, selectedModel } = useChat();

  return (
    <div className="welcome">
      <div className="welcome-icon">
        <Bot size={32} />
      </div>
      <h1 className="welcome-title">SYNID AI</h1>
      <p className="welcome-subtitle">
        Running <span className="model-badge">{selectedModel}</span> Local AI Chat Application. Start the conversation by selecting a suggestion below or typing your own message!
      </p>

      <div className="suggestions-grid">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            className="suggestion-card"
            onClick={() => sendMessage(s.prompt)}
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <span className="suggestion-icon">{s.icon}</span>
            <span className="suggestion-label">{s.label}</span>
          </button>
        ))}
      </div>

      <style>{`
        .welcome {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          padding: 40px 20px;
          animation: fadeIn 0.4s ease;
        }
        .welcome-icon {
          width: 64px; height: 64px;
          background: var(--accent-dim);
          border: 1px solid var(--accent-glow);
          border-radius: 18px;
          display: flex; align-items: center; justify-content: center;
          color: var(--accent);
          margin-bottom: 18px;
          box-shadow: 0 0 30px var(--accent-dim);
        }
        .welcome-title {
          font-size: 28px; font-weight: 700;
          letter-spacing: -0.8px;
          background: linear-gradient(135deg, var(--text-primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 10px;
        }
        .welcome-subtitle {
          font-size: 14px; color: var(--text-muted);
          margin-bottom: 36px;
        }
        .model-badge {
          background: var(--accent-dim);
          border: 1px solid var(--accent-glow);
          border-radius: 5px;
          padding: 1px 7px;
          color: var(--accent);
          font-family: var(--font-mono);
          font-size: 12px;
        }
        .suggestions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          max-width: 480px;
          width: 100%;
        }
        .suggestion-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 14px 16px;
          cursor: pointer;
          display: flex; align-items: center; gap: 10px;
          text-align: left;
          transition: all var(--transition);
          animation: fadeUp 0.3s ease both;
        }
        .suggestion-card:hover {
          border-color: var(--accent);
          background: var(--bg-hover);
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(124,106,247,0.1);
        }
        .suggestion-icon { color: var(--accent); flex-shrink: 0; }
        .suggestion-label {
          font-size: 13px; color: var(--text-secondary); font-weight: 500;
          line-height: 1.3;
        }
      `}</style>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="thinking-row">
      <div className="thinking-avatar"><Bot size={14} /></div>
      <div className="thinking-dots">
        <span /><span /><span />
      </div>
      <style>{`
        .thinking-row {
          display: flex; align-items: center; gap: 14px;
          padding: 18px 0;
        }
        .thinking-avatar {
          width: 32px; height: 32px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-secondary);
          flex-shrink: 0;
        }
        .thinking-dots {
          display: flex; gap: 5px; align-items: center;
        }
        .thinking-dots span {
          width: 7px; height: 7px;
          background: var(--accent);
          border-radius: 50%;
          animation: pulse 1.2s ease infinite;
        }
        .thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
        .thinking-dots span:nth-child(3) { animation-delay: 0.4s; }
      `}</style>
    </div>
  );
}

export default function ChatArea() {
  const { messages, streaming, editMessage, regenerate } = useChat();
  const [systemPrompt, setSystemPrompt] = useState('');
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showThinking = streaming && messages.length > 0 &&
    messages[messages.length - 1].role === 'user';

  return (
    <div className="chat-area">
      <TopBar systemPrompt={systemPrompt} setSystemPrompt={setSystemPrompt} />
      <div className="messages-container" ref={containerRef}>
        {messages.length === 0 ? (
          <WelcomeScreen />
        ) : (
          <div className="messages-inner">
            {messages.map((msg, i) => (
              <Message
                key={i}
                message={msg}
                isLast={i === messages.length - 1}
                onEdit={(newText) => editMessage(i, newText, systemPrompt)}
                onRegenerate={() => regenerate(systemPrompt)}
              />
            ))}
            {showThinking && <ThinkingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <ChatInput systemPrompt={systemPrompt} />

      <style>{`
        .chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--bg-base);
        }
        .messages-container {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .messages-inner {
          max-width: 760px;
          width: 100%;
          margin: 0 auto;
          padding: 24px 24px 0;
        }
      `}</style>
    </div>
  );
}
