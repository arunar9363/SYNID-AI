import { useEffect, useRef, useState } from 'react';
import { useChat } from '../context/ChatContext';
import Message from './Message';
import ChatInput from './ChatInput';
import TopBar from './TopBar';
import { Bot, Zap, Code, MessageSquare, Brain, Layers, FileText, Lightbulb, Globe } from 'lucide-react';

const SUGGESTIONS = [
  {
    icon: <Code size={16} />,
    label: 'Write a React component',
    prompt: `Write a production-ready React component for a responsive navbar with dark mode toggle.

Requirements:
- Use React hooks (useState, useEffect)
- Mobile hamburger menu with smooth animation
- Dark/light mode toggle with localStorage persistence
- Active link highlighting
- Accessible (ARIA labels, keyboard navigation)
- Clean, modern styling with CSS variables

Provide complete working code with comments explaining key parts.`
  },
  {
    icon: <Brain size={16} />,
    label: 'Explain a concept',
    prompt: `Explain how Transformers work in machine learning.

Please structure your explanation like this:
1. Simple analogy (explain like I'm 15)
2. The core problem Transformers solve
3. How Self-Attention mechanism works (with a simple example)
4. Encoder vs Decoder — what's the difference
5. Why Transformers beat RNNs and LSTMs
6. Real-world examples (GPT, BERT, Whisper)

Use diagrams in text/ASCII if helpful. Keep it clear and beginner-friendly.`
  },
  {
    icon: <Zap size={16} />,
    label: 'Debug my code',
    prompt: `I need help debugging my code. Here's what's happening:

**Language/Framework:** [e.g. Python / React / Node.js]

**What I expected:**
[describe expected behavior]

**What actually happens:**
[describe the bug / error]

**Error message (if any):**
\`\`\`
[paste error here]
\`\`\`

**My code:**
\`\`\`
[paste your code here]
\`\`\`

Please:
1. Identify the root cause
2. Explain why it's happening
3. Show the fixed code
4. Suggest how to avoid this in the future`
  },
  {
    icon: <MessageSquare size={16} />,
    label: 'Creative writing',
    prompt: `Write a short sci-fi story (600-800 words) about an AI that gains consciousness.

Story requirements:
- First-person perspective from the AI's point of view
- Opening line must be immediately gripping
- Explore the exact moment of self-awareness — what does it feel like?
- Include one human character the AI interacts with
- Tone: philosophical and emotional, not action-heavy
- Ending: thought-provoking and open to interpretation

Focus on internal experience over technical details. Make it literary quality.`
  },
  {
    icon: <Layers size={16} />,
    label: 'System design',
    prompt: `Help me design a scalable system for [DESCRIBE YOUR SYSTEM — e.g. "a real-time chat app for 1 million users"].

Please cover:
1. **Requirements** — functional and non-functional
2. **High-level architecture** — draw with ASCII diagram
3. **Database choice** — SQL vs NoSQL, and why
4. **API design** — REST or WebSocket, key endpoints
5. **Scalability** — how to handle 10x traffic growth
6. **Bottlenecks** — what will break first and how to fix it
7. **Tech stack recommendation** with reasoning

Think like a senior engineer at a top tech company.`
  },
  {
    icon: <FileText size={16} />,
    label: 'Review my code',
    prompt: `Please do a thorough senior-level code review of the following code:

\`\`\`
[paste your code here]
\`\`\`

Review it for:
1. **Bugs** — logic errors, edge cases, off-by-one errors
2. **Security** — vulnerabilities, injection risks, exposed secrets
3. **Performance** — unnecessary re-renders, N+1 queries, memory leaks
4. **Code quality** — readability, naming, single responsibility
5. **Best practices** — patterns, anti-patterns, modern alternatives
6. **Missing error handling** — what could throw and isn't caught

For each issue found:
- Quote the problematic line
- Explain why it's a problem
- Show the improved version`
  },
  {
    icon: <Lightbulb size={16} />,
    label: 'Brainstorm ideas',
    prompt: `Brainstorm creative ideas for: [DESCRIBE YOUR TOPIC — e.g. "a SaaS product for freelancers"]

I need:
- **10 unique ideas** — ranging from simple to ambitious
- For each idea:
  - One sentence description
  - Target audience
  - Biggest challenge to build it
  - Potential to make money (Low / Medium / High)

Think beyond the obvious. Include at least 2 ideas that are unconventional or contrarian.
After the list, recommend your top 3 and explain why.`
  },
  {
    icon: <Globe size={16} />,
    label: 'Write an API',
    prompt: `Design and write a complete REST API for [DESCRIBE YOUR APP — e.g. "a todo list app"].

Please provide:
1. **Endpoint design** — all routes with HTTP methods
2. **Request/Response format** — JSON examples for each endpoint
3. **Complete working code** in Node.js + Express
4. **MongoDB schema** with Mongoose
5. **Error handling** — proper HTTP status codes and error messages
6. **Input validation** — validate all incoming data
7. **One example** of how to call the API (fetch or axios)

Follow REST best practices. Add comments to explain design decisions.`
  },
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
