import { useLayoutEffect, useRef } from 'react';
import { ArrowUpRight, Brain, Code2, FileText, Lightbulb, X } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import Message from './Message';
import ChatInput from './ChatInput';
import TopBar from './TopBar';

const welcomeMessages = [
  ['Good to see you.', 'Ask anything. Think clearly. Build better.'],
  ['Your AI. Your rules.', 'Your chat history follows this browser profile.'],
  ["Let's get to work.", 'Code, write, and analyze with SYNID AI.'],
  ['Think it. Ask it.', 'Start with whatever is on your mind.'],
  ['Intelligence, on demand.', 'Powered by open models. Built for real work.'],
  ['Start with a question.', 'Every great idea begins with curiosity.'],
  ['Your thoughts deserve better tools.', 'Bring an idea, a question, or a draft.'],
  ['Ready when you are.', 'Pick a suggestion or type your own message below.'],
];

function nextWelcome() {
  let index = Math.floor(Math.random() * welcomeMessages.length);
  try {
    const key = 'synid-welcome-index';
    if (sessionStorage.getItem(key) === String(index)) index = (index + 1) % welcomeMessages.length;
    sessionStorage.setItem(key, String(index));
  } catch { /* The welcome can still rotate when browser storage is unavailable. */ }
  return welcomeMessages[index];
}

const [welcomeTitle, welcomeSubtitle] = nextWelcome();

const suggestions = [
  { icon: Code2, label: 'Review code', prompt: 'Review this code for correctness, clarity, and edge cases.\n\n' },
  { icon: Brain, label: 'Explain a concept', prompt: 'Help me understand ' },
  { icon: Lightbulb, label: 'Brainstorm ideas', prompt: 'Help me brainstorm practical ideas for ' },
  { icon: FileText, label: 'Draft a message', prompt: 'Help me write a clear message about ' },
];

function WelcomeScreen({ onSelect }) {
  return (
    <div className="chat-welcome">
      <div className="welcome-logo"><img src="/assets/synidailogo.png" alt="" /></div>
      <h1>{welcomeTitle}</h1>
      <p className="welcome-subtitle">{welcomeSubtitle}</p>
      <div className="suggestions-grid">
        {suggestions.map(({ icon: Icon, label, prompt }) => (
          <button key={label} className="suggestion" onClick={() => onSelect(prompt)}>
            <Icon size={18} className="suggestion-icon" /><span>{label}</span><ArrowUpRight size={14} className="suggestion-arrow" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatArea() {
  const { activeId, messages, loadingChat, editMessage, regenerate, setDraft, notice, dismissNotice } = useChat();
  const container = useRef(null);
  const follow = useRef(true);
  const composer = useRef(null);

  useLayoutEffect(() => { follow.current = true; }, [activeId]);
  useLayoutEffect(() => {
    if (follow.current && container.current) container.current.scrollTop = container.current.scrollHeight;
  }, [messages]);

  function handleScroll(event) {
    const { scrollHeight, scrollTop, clientHeight } = event.currentTarget;
    follow.current = scrollHeight - scrollTop - clientHeight < 160;
  }

  return (
    <main className="chat-area">
      <TopBar />
      <div className="message-scroll" ref={container} onScroll={handleScroll} aria-busy={loadingChat}>
        {loadingChat ? <p className="chat-loading" role="status">Opening conversation…</p>
          : messages.length === 0 ? <WelcomeScreen onSelect={prompt => {
            setDraft(prompt);
            composer.current?.focus();
          }} /> : (
            <div className="message-list">
              {messages.map((message, index) => (
                <Message key={message._id || `${message.timestamp}-${index}`} message={message}
                  isLast={index === messages.length - 1} onEdit={content => editMessage(index, content)}
                  onRegenerate={regenerate} />
              ))}
            </div>
          )}
      </div>
      {notice && (
        <div className={`chat-notice${notice.error ? ' error' : ''}`} role={notice.error ? 'alert' : 'status'}>
          <span>{notice.message}</span>
          <button className="icon-button small" onClick={dismissNotice} title="Dismiss"><X size={15} /></button>
        </div>
      )}
      <ChatInput textareaRef={composer} onSend={() => { follow.current = true; }} />
    </main>
  );
}
