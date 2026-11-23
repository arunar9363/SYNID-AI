import { isValidElement, lazy, Suspense, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, User, Edit3, RefreshCw, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import './message.css';

const HighlightedCode = lazy(() => import('./HighlightedCode'));

function CopyBtn({ text, small }) {
  const [status, setStatus] = useState('');
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    clearTimeout(timer.current);
    try { await navigator.clipboard.writeText(text); setStatus('Copied'); }
    catch { setStatus('Copy failed'); }
    timer.current = setTimeout(() => setStatus(''), 2000);
  };
  return (
    <button className={`copy-btn ${small ? 'small' : ''}`} onClick={copy} title={status || 'Copy'}>
      {status === 'Copied' ? <Check size={small ? 12 : 14} /> : <Copy size={small ? 12 : 14} />}
      {(!small || status) && <span role={status ? 'status' : undefined}>{status || 'Copy'}</span>}
    </button>
  );
}

function CodeBlock({ children }) {
  if (!isValidElement(children)) return <pre>{children}</pre>;
  const lang = /language-([\w+-]+)/.exec(children.props.className || '')?.[1];
  const code = String(children.props.children).replace(/\n$/, '');
  const plain = <pre className="code-plain"><code>{code}</code></pre>;
  return (
    <div className="code-wrapper">
      <div className="code-header"><span className="code-lang">{lang || 'code'}</span><CopyBtn text={code} /></div>
      {lang ? <Suspense fallback={plain}><HighlightedCode language={lang} code={code} /></Suspense> : plain}
    </div>
  );
}

const markdownComponents = {
  pre: CodeBlock,
  code: ({ children }) => <code className="inline-code">{children}</code>,
  img: ({ alt }) => alt ? <span>{alt}</span> : null,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
  table: ({ children }) => <div className="table-scroll"><table>{children}</table></div>,
};

function StreamingCursor() {
  return <span className="streaming-cursor">▋</span>;
}

export default function Message({ message, onEdit, onRegenerate, isLast }) {
  const isUser = message.role === 'user';
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(message.content);
  const [reaction, setReaction] = useState(null);
  const { streaming } = useChat();

  const commitEdit = () => {
    if (editVal.trim() && editVal !== message.content) onEdit?.(editVal.trim());
    setEditing(false);
  };

  return (
    <article className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className="msg-avatar">
        {isUser ? <User size={14} /> : <img src="/assets/synidailogo.png" alt="SYNID AI" style={{ width: 30, height: 30, objectFit: 'contain' }} />}
      </div>

      <div className="msg-bubble">
        <div className="msg-header">
          <span className="msg-role">{isUser ? 'You' : 'Assistant'}</span>
          <span className="msg-time">
            {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>

        <div className="msg-content">
          {isUser ? (
            editing ? (
              <div className="edit-box">
                <textarea
                  className="edit-textarea"
                  value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  rows={3} maxLength={8000} aria-label="Edit message"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); commitEdit(); } if (e.key === 'Escape') setEditing(false); }}
                />
                <div className="edit-actions">
                  <button className="edit-cancel" onClick={() => setEditing(false)}><X size={12} />Cancel</button>
                  <button className="edit-save" onClick={commitEdit}><Check size={12} />Send</button>
                </div>
              </div>
            ) : (
              <p className="user-text">{message.content}</p>
            )
          ) : (
            <div className="markdown-body">
              <ReactMarkdown skipHtml remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {message.content}
              </ReactMarkdown>
              {message._streaming && <StreamingCursor />}
            </div>
          )}
        </div>

        {!message._streaming && (
          <div className={`msg-actions ${isUser ? 'user' : ''}`}>
            <CopyBtn text={message.content} small />
            {isUser && !streaming && (
              <button className="msg-action-btn" onClick={() => { setEditVal(message.content); setEditing(true); }} title="Edit message in a new chat">
                <Edit3 size={11} />Edit
              </button>
            )}
            {!isUser && isLast && !streaming && (
              <button className="msg-action-btn" onClick={onRegenerate} title="Regenerate response">
                <RefreshCw size={11} />Retry
              </button>
            )}
            {!isUser && (
              <div className="reaction-btns">
                <button
                  className={`reaction-btn ${reaction === 'up' ? 'active-up' : ''}`}
                  onClick={() => setReaction(r => r === 'up' ? null : 'up')}
                  title="Good response"
                ><ThumbsUp size={11} /></button>
                <button
                  className={`reaction-btn ${reaction === 'down' ? 'active-down' : ''}`}
                  onClick={() => setReaction(r => r === 'down' ? null : 'down')}
                  title="Bad response"
                ><ThumbsDown size={11} /></button>
              </div>
            )}
          </div>
        )}
      </div>

    </article>
  );
}
