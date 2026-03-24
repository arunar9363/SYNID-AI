import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, User, Bot, Edit3, RefreshCw, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { useChat } from '../context/ChatContext';

function CopyBtn({ text, small }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button className={`copy-btn ${small ? 'small' : ''}`} onClick={copy} title="Copy">
      {copied ? <Check size={small ? 11 : 13} /> : <Copy size={small ? 11 : 13} />}
      {!small && (copied ? 'Copied' : 'Copy')}
    </button>
  );
}

function CodeBlock({ node, inline, className, children, ...props }) {
  const match = /language-(\w+)/.exec(className || '');
  const lang = match?.[1] || '';
  const code = String(children).replace(/\n$/, '');
  if (!inline && (match || code.includes('\n'))) {
    return (
      <div className="code-wrapper">
        <div className="code-header">
          <span className="code-lang">{lang || 'code'}</span>
          <CopyBtn text={code} />
        </div>
        <SyntaxHighlighter
          style={oneDark} language={lang || 'text'} PreTag="div"
          customStyle={{ margin: 0, borderRadius: '0 0 10px 10px', background: '#0d0d14', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}
          {...props}
        >{code}</SyntaxHighlighter>
      </div>
    );
  }
  return <code className="inline-code" {...props}>{children}</code>;
}

function StreamingCursor() {
  return <span className="streaming-cursor">▋</span>;
}

export default function Message({ message, onEdit, onRegenerate, isLast }) {
  const isUser = message.role === 'user';
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(message.content);
  const [reaction, setReaction] = useState(null);
  const [hovered, setHovered] = useState(false);
  const { streaming } = useChat();

  const commitEdit = () => {
    if (editVal.trim() && editVal !== message.content) onEdit?.(editVal.trim());
    setEditing(false);
  };

  return (
    <div
      className={`message-row ${isUser ? 'user' : 'assistant'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
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
                  rows={3}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); } if (e.key === 'Escape') setEditing(false); }}
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
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
                {message.content}
              </ReactMarkdown>
              {message._streaming && <StreamingCursor />}
            </div>
          )}
        </div>

        {!message._streaming && hovered && (
          <div className={`msg-actions ${isUser ? 'user' : ''}`}>
            <CopyBtn text={message.content} small />
            {isUser && !streaming && (
              <button className="msg-action-btn" onClick={() => setEditing(true)} title="Edit message">
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

      <style>{`
        .message-row {
          display: flex; gap: 14px; padding: 16px 0;
          animation: fadeUp 0.22s ease; align-items: flex-start;
        }
        .message-row.user { flex-direction: row-reverse; }
        .msg-avatar {
          width: 32px; height: 32px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 2px;
        }
        .message-row.user .msg-avatar { background: var(--accent-dim); border: 1px solid var(--accent-glow); color: var(--accent); }
        .message-row.assistant .msg-avatar { background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-secondary); }
        .msg-bubble { flex: 1; min-width: 0; max-width: 85%; }
        .message-row.user .msg-bubble { display: flex; flex-direction: column; align-items: flex-end; }
        .msg-header { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
        .message-row.user .msg-header { flex-direction: row-reverse; }
        .msg-role { font-size: 12px; font-weight: 600; color: var(--text-muted); }
        .msg-time { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }
        .msg-content { width: 100%; }
        .user-text {
          display: inline-block;
          background: var(--user-bubble); border: 1px solid rgba(74,172,207,0.18);
          border-radius: 14px 14px 4px 14px; padding: 10px 16px;
          font-size: 14px; line-height: 1.65; color: var(--text-primary);
          max-width: 100%; white-space: pre-wrap; word-break: break-word;
        }
        .markdown-body { font-size: 14px; line-height: 1.78; color: var(--text-primary); }
        .markdown-body p { margin-bottom: 10px; }
        .markdown-body p:last-child { margin-bottom: 0; }
        .markdown-body h1,.markdown-body h2,.markdown-body h3 { font-weight: 600; margin: 18px 0 10px; color: var(--text-primary); letter-spacing: -0.3px; }
        .markdown-body h1 { font-size: 20px; } .markdown-body h2 { font-size: 17px; } .markdown-body h3 { font-size: 15px; }
        .markdown-body ul,.markdown-body ol { padding-left: 20px; margin-bottom: 10px; }
        .markdown-body li { margin-bottom: 4px; }
        .markdown-body blockquote { border-left: 3px solid var(--accent); padding: 8px 14px; margin: 10px 0; background: var(--accent-dim); border-radius: 0 8px 8px 0; color: var(--text-secondary); }
        .markdown-body table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
        .markdown-body th { background: var(--bg-elevated); padding: 8px 12px; text-align: left; font-weight: 600; border: 1px solid var(--border); }
        .markdown-body td { padding: 7px 12px; border: 1px solid var(--border-subtle); }
        .markdown-body tr:nth-child(even) { background: var(--bg-surface); }
        .markdown-body a { color: var(--accent); text-decoration: none; }
        .markdown-body a:hover { text-decoration: underline; }
        .markdown-body strong { font-weight: 600; color: var(--text-primary); }
        .markdown-body hr { border: none; border-top: 1px solid var(--border); margin: 18px 0; }
        .inline-code { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 5px; padding: 1px 6px; font-family: var(--font-mono); font-size: 12.5px; color: #e2a96e; }
        .code-wrapper { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; margin: 12px 0; }
        .code-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 14px; background: #141420; border-bottom: 1px solid var(--border); }
        .code-lang { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px; }
        .copy-btn { display: flex; align-items: center; gap: 5px; background: none; border: 1px solid var(--border); border-radius: 5px; padding: 3px 9px; color: var(--text-muted); font-family: var(--font-sans); font-size: 11px; cursor: pointer; transition: all var(--transition); }
        .copy-btn.small { border: none; padding: 3px 6px; }
        .copy-btn:hover { border-color: var(--accent); color: var(--accent); }
        .streaming-cursor { display: inline-block; color: var(--accent); animation: blink 1s infinite; font-weight: 300; }
        .msg-actions {
          display: flex; align-items: center; gap: 4px;
          margin-top: 8px; padding: 4px 0;
          animation: fadeIn 0.15s ease;
        }
        .msg-actions.user { justify-content: flex-end; }
        .msg-action-btn {
          display: flex; align-items: center; gap: 4px;
          background: none; border: 1px solid var(--border-subtle); border-radius: 5px;
          padding: 3px 8px; color: var(--text-muted);
          font-family: var(--font-sans); font-size: 11px; cursor: pointer;
          transition: all var(--transition);
        }
        .msg-action-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }
        .reaction-btns { display: flex; gap: 2px; margin-left: 4px; }
        .reaction-btn {
          background: none; border: 1px solid var(--border-subtle); border-radius: 5px;
          padding: 3px 6px; cursor: pointer; color: var(--text-muted);
          display: flex; align-items: center; transition: all var(--transition);
        }
        .reaction-btn:hover { border-color: var(--border); color: var(--text-primary); }
        .reaction-btn.active-up { border-color: var(--success); color: var(--success); background: rgba(74,222,128,0.1); }
        .reaction-btn.active-down { border-color: var(--danger); color: var(--danger); background: rgba(248,113,113,0.1); }
        .edit-box { width: 100%; }
        .edit-textarea {
          width: 100%; background: var(--bg-elevated); border: 1px solid var(--accent);
          border-radius: 10px; padding: 10px 14px; color: var(--text-primary);
          font-family: var(--font-sans); font-size: 14px; line-height: 1.6;
          resize: vertical; outline: none; min-height: 80px;
          box-shadow: 0 0 0 3px var(--accent-dim);
        }
        .edit-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
        .edit-cancel,.edit-save {
          display: flex; align-items: center; gap: 5px;
          padding: 6px 14px; border-radius: 7px; font-family: var(--font-sans);
          font-size: 12px; cursor: pointer; transition: all var(--transition);
        }
        .edit-cancel { background: none; border: 1px solid var(--border); color: var(--text-muted); }
        .edit-cancel:hover { color: var(--text-primary); border-color: var(--text-muted); }
        .edit-save { background: var(--accent); border: none; color: white; }
        .edit-save:hover { background: var(--accent-hover); }
      `}</style>
    </div>
  );
}