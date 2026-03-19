import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Bot, Sliders, Cpu } from 'lucide-react';
import * as api from '../utils/api';

const DEFAULT_PERSONAS = [
  { icon: '👨‍💻', name: 'Senior Developer', description: 'Expert coder', systemPrompt: 'You are a senior software engineer. Write clean, efficient, well-commented code. Always explain your reasoning. Suggest best practices and potential issues.' },
  { icon: '✍️', name: 'Creative Writer', description: 'Storyteller', systemPrompt: 'You are a creative writing assistant. Help with stories, scripts, poetry, and creative content. Be imaginative, descriptive, and engaging.' },
  { icon: '🧑‍🏫', name: 'ELI5 Teacher', description: 'Simple explanations', systemPrompt: 'Explain everything like I am 5 years old. Use simple words, analogies, and examples. Avoid jargon. Make complex topics easy and fun to understand.' },
  { icon: '🔬', name: 'Research Assistant', description: 'Deep analysis', systemPrompt: 'You are a thorough research assistant. Provide detailed, well-structured information with multiple perspectives. Cite reasoning and flag uncertainties.' },
  { icon: '💼', name: 'Business Advisor', description: 'Professional advice', systemPrompt: 'You are a business consultant. Provide strategic, actionable advice. Think about ROI, risks, and practical implementation. Be concise and professional.' },
  { icon: '🧘', name: 'Friendly Assistant', description: 'Warm & helpful', systemPrompt: 'You are a warm, friendly, and supportive assistant. Be conversational, encouraging, and positive. Help with anything while keeping the tone light and pleasant.' },
];

export default function SettingsModal({ onClose, systemPrompt, setSystemPrompt }) {
  const [tab, setTab] = useState('persona');
  const [personas, setPersonas] = useState([]);
  const [newPersona, setNewPersona] = useState({ icon: '🤖', name: '', description: '', systemPrompt: '' });
  const [localPrompt, setLocalPrompt] = useState(systemPrompt || '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getPersonas().then(setPersonas).catch(() => {});
  }, []);

  const applyPersona = (p) => {
    setLocalPrompt(p.systemPrompt);
    setTab('prompt');
  };

  const savePersona = async () => {
    if (!newPersona.name || !newPersona.systemPrompt) return;
    const p = await api.createPersona(newPersona);
    setPersonas(prev => [p, ...prev]);
    setNewPersona({ icon: '🤖', name: '', description: '', systemPrompt: '' });
  };

  const removePersona = async (id) => {
    await api.deletePersona(id);
    setPersonas(prev => prev.filter(p => p._id !== id));
  };

  const savePrompt = () => {
    setSystemPrompt(localPrompt);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Sliders size={16} />
            <span>Settings</span>
          </div>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-tabs">
          {[
            { id: 'persona', label: 'Personas', icon: <Bot size={13} /> },
            { id: 'prompt', label: 'System Prompt', icon: <Sliders size={13} /> },
          ].map(t => (
            <button
              key={t.id}
              className={`modal-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {tab === 'persona' && (
            <div className="persona-tab">
              <p className="tab-desc">Choose a persona to set the AI's behavior and personality.</p>

              <div className="personas-grid">
                {DEFAULT_PERSONAS.map((p, i) => (
                  <button key={i} className="persona-card" onClick={() => applyPersona(p)}>
                    <span className="persona-icon">{p.icon}</span>
                    <div>
                      <div className="persona-name">{p.name}</div>
                      <div className="persona-desc">{p.description}</div>
                    </div>
                  </button>
                ))}
                {personas.map(p => (
                  <div key={p._id} className="persona-card custom">
                    <span className="persona-icon">{p.icon}</span>
                    <div style={{ flex: 1 }} onClick={() => applyPersona(p)}>
                      <div className="persona-name">{p.name}</div>
                      <div className="persona-desc">{p.description || 'Custom'}</div>
                    </div>
                    <button className="persona-del" onClick={() => removePersona(p._id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="divider">Create Custom Persona</div>
              <div className="create-persona">
                <div className="create-row">
                  <input className="field small" placeholder="Icon" value={newPersona.icon}
                    onChange={e => setNewPersona(p => ({ ...p, icon: e.target.value }))} style={{ width: 60 }} />
                  <input className="field" placeholder="Name (e.g. Python Expert)"
                    value={newPersona.name} onChange={e => setNewPersona(p => ({ ...p, name: e.target.value }))} />
                </div>
                <textarea className="field" rows={3} placeholder="System prompt for this persona..."
                  value={newPersona.systemPrompt}
                  onChange={e => setNewPersona(p => ({ ...p, systemPrompt: e.target.value }))} />
                <button className="btn-accent" onClick={savePersona}>
                  <Plus size={13} />Save Persona
                </button>
              </div>
            </div>
          )}

          {tab === 'prompt' && (
            <div className="prompt-tab">
              <p className="tab-desc">
                Set a system prompt that shapes how the AI responds in all messages.
                Leave empty for default behavior.
              </p>
              <textarea
                className="field prompt-field"
                rows={10}
                placeholder="Example: You are a helpful assistant that always responds in bullet points and keeps answers under 3 sentences..."
                value={localPrompt}
                onChange={e => setLocalPrompt(e.target.value)}
              />
              <div className="prompt-actions">
                <button className="btn-ghost" onClick={() => setLocalPrompt('')}>Clear</button>
                <button className="btn-accent" onClick={savePrompt}>
                  <Save size={13} />
                  {saved ? 'Saved!' : 'Apply Prompt'}
                </button>
              </div>
              {localPrompt && (
                <div className="prompt-preview">
                  <span className="preview-label">Active prompt:</span>
                  <span className="preview-text">{localPrompt.slice(0, 120)}{localPrompt.length > 120 ? '…' : ''}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.15s ease;
        }
        .modal {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          width: min(620px, 94vw);
          max-height: 82vh;
          display: flex; flex-direction: column;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6);
          animation: fadeUp 0.2s ease;
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px 14px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .modal-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 15px; font-weight: 600; color: var(--text-primary);
        }
        .modal-close {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); padding: 4px;
          border-radius: 6px; display: flex;
          transition: all var(--transition);
        }
        .modal-close:hover { color: var(--text-primary); background: var(--bg-hover); }

        .modal-tabs {
          display: flex; gap: 4px; padding: 10px 16px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .modal-tab {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 8px;
          background: none; border: none; cursor: pointer;
          font-family: var(--font-sans); font-size: 13px;
          color: var(--text-muted); transition: all var(--transition);
        }
        .modal-tab.active { background: var(--accent-dim); color: var(--accent); }
        .modal-tab:hover:not(.active) { background: var(--bg-hover); color: var(--text-primary); }

        .modal-body { padding: 18px 20px; overflow-y: auto; flex: 1; }
        .tab-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 14px; line-height: 1.6; }

        .personas-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 18px; }
        .persona-card {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px;
          background: var(--bg-elevated); border: 1px solid var(--border);
          border-radius: 10px; cursor: pointer; text-align: left;
          transition: all var(--transition);
        }
        .persona-card:hover { border-color: var(--accent); background: var(--bg-hover); }
        .persona-card.custom { }
        .persona-icon { font-size: 20px; flex-shrink: 0; }
        .persona-name { font-size: 12px; font-weight: 600; color: var(--text-primary); }
        .persona-desc { font-size: 11px; color: var(--text-muted); }
        .persona-del {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); padding: 4px; border-radius: 5px;
          display: flex; transition: all var(--transition); flex-shrink: 0;
        }
        .persona-del:hover { color: var(--danger); }

        .divider {
          font-size: 11px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.8px; color: var(--text-muted);
          margin: 14px 0 12px; display: flex; align-items: center; gap: 10px;
        }
        .divider::before, .divider::after {
          content: ''; flex: 1; height: 1px; background: var(--border-subtle);
        }

        .create-persona { display: flex; flex-direction: column; gap: 8px; }
        .create-row { display: flex; gap: 8px; }
        .field {
          background: var(--bg-elevated); border: 1px solid var(--border);
          border-radius: 8px; padding: 8px 12px;
          color: var(--text-primary); font-family: var(--font-sans);
          font-size: 13px; outline: none; width: 100%;
          transition: border-color var(--transition);
        }
        .field:focus { border-color: var(--accent); }
        .field.small { width: auto; }
        textarea.field { resize: vertical; }

        .prompt-tab { display: flex; flex-direction: column; gap: 10px; }
        .prompt-field { min-height: 180px; }
        .prompt-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .prompt-preview {
          background: var(--bg-elevated); border: 1px solid var(--border);
          border-radius: 8px; padding: 10px 12px;
          font-size: 12px;
        }
        .preview-label { font-weight: 600; color: var(--accent); margin-right: 6px; }
        .preview-text { color: var(--text-muted); font-style: italic; }

        .btn-accent {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 8px;
          background: var(--accent); color: white;
          border: none; cursor: pointer;
          font-family: var(--font-sans); font-size: 13px; font-weight: 500;
          transition: all var(--transition);
        }
        .btn-accent:hover { background: var(--accent-hover); transform: translateY(-1px); }
        .btn-ghost {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 8px;
          background: none; color: var(--text-muted);
          border: 1px solid var(--border); cursor: pointer;
          font-family: var(--font-sans); font-size: 13px;
          transition: all var(--transition);
        }
        .btn-ghost:hover { color: var(--text-primary); border-color: var(--text-muted); }
      `}</style>
    </div>
  );
}
