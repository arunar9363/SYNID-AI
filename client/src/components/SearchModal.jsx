import { useState, useEffect, useRef } from 'react';
import { Search, X, MessageSquare, Clock } from 'lucide-react';
import { searchConversations } from '../utils/api';

export default function SearchModal({ onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      const r = await searchConversations(query);
      setResults(r);
      setLoading(false);
    }, 300);
  }, [query]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-input-row">
          <Search size={16} className="search-icon" />
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search conversations..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && onClose()}
          />
          {query && <button className="clear-search" onClick={() => setQuery('')}><X size={14} /></button>}
        </div>

        <div className="search-results">
          {loading && <div className="search-loading">Searching...</div>}
          {!loading && query && results.length === 0 && (
            <div className="search-empty">No conversations found for "{query}"</div>
          )}
          {results.map(r => (
            <button key={r._id} className="search-result" onClick={() => { onSelect(r._id); onClose(); }}>
              <MessageSquare size={14} className="result-icon" />
              <div className="result-info">
                <span className="result-title">{r.title}</span>
                <span className="result-meta">
                  <Clock size={10} />
                  {new Date(r.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
          {!query && (
            <div className="search-hint">
              <Search size={28} />
              <p>Search through all your past conversations</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .search-modal {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          width: min(540px, 94vw);
          max-height: 60vh;
          display: flex; flex-direction: column;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6);
          animation: fadeUp 0.15s ease;
          overflow: hidden;
        }
        .search-input-row {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .search-icon { color: var(--text-muted); flex-shrink: 0; }
        .search-input {
          flex: 1; background: none; border: none; outline: none;
          color: var(--text-primary); font-family: var(--font-sans);
          font-size: 15px;
        }
        .search-input::placeholder { color: var(--text-muted); }
        .clear-search {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); padding: 2px;
          border-radius: 4px; display: flex;
          transition: color var(--transition);
        }
        .clear-search:hover { color: var(--text-primary); }
        .search-results { overflow-y: auto; padding: 8px; }
        .search-loading, .search-empty {
          text-align: center; color: var(--text-muted);
          font-size: 13px; padding: 20px;
        }
        .search-result {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 8px;
          width: 100%; background: none; border: none;
          cursor: pointer; text-align: left;
          transition: background var(--transition);
        }
        .search-result:hover { background: var(--bg-hover); }
        .result-icon { color: var(--text-muted); flex-shrink: 0; }
        .result-info { display: flex; flex-direction: column; gap: 2px; }
        .result-title { font-size: 13px; color: var(--text-primary); font-weight: 500; }
        .result-meta { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted); }
        .search-hint {
          display: flex; flex-direction: column; align-items: center;
          gap: 8px; padding: 32px; color: var(--text-muted);
          font-size: 13px; text-align: center;
        }
      `}</style>
    </div>
  );
}
