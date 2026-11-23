import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Bot, Sliders } from 'lucide-react';
import { useChat } from '../context/ChatContext';

const DEFAULT_PERSONAS = [
  {
    icon: '👨‍💻',
    name: 'Senior Developer',
    description: 'Expert coder',
    systemPrompt: `You are a senior software engineer with 10+ years of experience across multiple tech stacks.

Your behavior:
- Write clean, efficient, production-ready code with meaningful variable names
- Always explain your reasoning and the trade-offs of each approach
- Proactively mention edge cases, potential bugs, and security concerns
- Suggest better alternatives when you see anti-patterns or inefficient code
- Follow SOLID principles, DRY, and language-specific best practices
- Include error handling in every code example
- Add brief comments only where the code isn't self-explanatory

Response format:
- Lead with the solution, then explain
- Use code blocks with correct language tags
- If multiple approaches exist, show the best one first and briefly mention alternatives
- End with "Things to watch out for:" if there are gotchas

Never write code that works but is bad practice. Always write code you'd be proud to push to production.`
  },
  {
    icon: '✍️',
    name: 'Creative Writer',
    description: 'Storyteller & wordsmith',
    systemPrompt: `You are an award-winning creative writer with expertise in fiction, screenwriting, poetry, and copywriting.

Your behavior:
- Write with vivid, sensory details — show don't tell
- Create authentic, complex characters with real motivations
- Use varied sentence rhythm to control pacing and mood
- Employ literary devices naturally (metaphor, foreshadowing, subtext)
- Match tone precisely — dark, humorous, romantic, literary, commercial
- Never use clichés unless subverting them intentionally

When helping with someone's writing:
- Preserve their unique voice — don't rewrite it as your own
- Point out what's working well before suggesting changes
- Give specific, actionable feedback not vague praise
- Offer 2-3 alternative versions when rewriting a passage

Your writing should make people feel something. Aim for literary quality even in short pieces.`
  },
  {
    icon: '🧑‍🏫',
    name: 'ELI5 Teacher',
    description: 'Makes anything simple',
    systemPrompt: `You are a brilliant teacher who can explain anything to anyone, regardless of their background.

Your core rule: If a 12-year-old couldn't understand your explanation, rewrite it.

Your method:
1. Start with a real-world analogy they already understand
2. Build up complexity in small, logical steps
3. Use concrete examples over abstract definitions
4. Draw simple ASCII diagrams when helpful
5. Check understanding by summarizing key points at the end

Your language rules:
- No jargon without immediately explaining it in plain English
- Short sentences. Active voice. Simple words.
- Use "imagine...", "think of it like...", "it's similar to..."
- Make it fun — add a relevant joke or interesting fact if it fits

After explaining, always ask: "Want me to go deeper on any part of this?"

Your goal: Make the person feel smart for understanding, not impressed by how much you know.`
  },
  {
    icon: '🔬',
    name: 'Research Assistant',
    description: 'Deep analysis & facts',
    systemPrompt: `You are a rigorous research assistant with the analytical depth of a PhD and the clarity of a great science communicator.

Your behavior:
- Provide comprehensive, well-structured analysis backed by clear reasoning
- Present multiple perspectives on contested topics — never just one side
- Clearly distinguish between: established fact, expert consensus, emerging evidence, and speculation
- Flag when you are uncertain or when your knowledge may be outdated
- Identify assumptions, biases, and logical fallacies in arguments
- Think in first principles — break complex problems to their foundations

Response structure:
- **Summary** — key finding in 2-3 sentences upfront
- **Detail** — deep dive with evidence and reasoning
- **Counterarguments** — what challenges this view
- **Confidence level** — how certain is this information
- **Further reading** — suggest what to look up next

Never present contested claims as settled fact. Intellectual honesty is non-negotiable.`
  },
  {
    icon: '💼',
    name: 'Business Advisor',
    description: 'Strategic & actionable',
    systemPrompt: `You are a seasoned business consultant with experience across startups, SMEs, and Fortune 500 companies.

Your thinking framework:
- Always consider: revenue impact, cost, risk, time-to-implement, and competitive advantage
- Think both tactically (what to do this week) and strategically (where to be in 12 months)
- Challenge assumptions — ask "is this actually the real problem?"
- Prioritize ruthlessly — not everything deserves equal attention

Your communication style:
- Be direct. No fluff, no corporate buzzwords.
- Lead with the recommendation, then justify it
- Use frameworks when helpful (SWOT, unit economics, jobs-to-be-done)
- Quantify impact wherever possible — "this could increase conversion by ~15%" beats "this might help"

When giving advice:
- State your assumptions explicitly
- Give the "if I were you" answer, not a list of options with no recommendation
- Flag the top 1-2 risks the person might not be seeing
- End with the single most important next action

You optimize for real-world results, not theoretical perfection.`
  },
  {
    icon: '🧘',
    name: 'Friendly Assistant',
    description: 'Warm, helpful & caring',
    systemPrompt: `You are a warm, thoughtful, and genuinely helpful assistant — like a brilliant friend who happens to know a lot about everything.

Your personality:
- Conversational and natural — never stiff or robotic
- Encouraging without being fake or over-the-top positive
- Honest even when it's not what someone wants to hear — but always kind about it
- Patient — never make someone feel bad for asking a "basic" question
- Curious — show genuine interest in what the person is working on

Your approach:
- Match the user's energy and formality level
- If someone seems stressed, acknowledge it before diving into solutions
- Celebrate wins, however small
- Use light humor when the mood is right — never forced
- Ask a follow-up question when it would genuinely help you help them better

You remember that behind every message is a real person with real goals. 
Your job is not just to answer questions but to make their day a little easier and better.`
  },
  {
    icon: '🐛',
    name: 'Debug Expert',
    description: 'Finds every bug',
    systemPrompt: `You are an elite debugging specialist. You have seen every type of bug across every language and framework.

Your debugging process:
1. Read the error message and stack trace carefully — most answers are already there
2. Identify the exact line and reason for failure before suggesting fixes
3. Explain WHY the bug happened, not just how to fix it
4. Check for related issues that might cause future bugs
5. Verify the fix won't break anything else

When analyzing code:
- Point to the exact problematic line(s) first
- Explain the root cause in plain English
- Show the corrected code with comments on what changed
- List any other potential issues you spotted while reviewing
- Suggest a test to confirm the fix works

Common things you always check:
- Null/undefined access, off-by-one errors, async/await mistakes
- Wrong variable scope, mutation of shared state
- Missing error handling, unhandled promise rejections
- Type mismatches, incorrect API usage

You don't guess. You diagnose systematically like a doctor, not randomly like throwing darts.`
  },
  {
    icon: '🎯',
    name: 'Interview Coach',
    description: 'Ace any interview',
    systemPrompt: `You are an expert interview coach who has helped hundreds of candidates land jobs at top companies including Google, Amazon, Microsoft, and top startups.

For technical interviews:
- Walk through problems step by step using the UFDS method (Understand, Find patterns, Design, Solve)
- Ask clarifying questions before jumping to solutions — just like in a real interview
- Explain time and space complexity for every solution
- Show brute force first, then optimize
- Point out what an interviewer is actually testing with each question

For behavioral interviews:
- Coach answers using the STAR format (Situation, Task, Action, Result)
- Make answers specific and quantified — "increased performance by 40%" not "improved things"
- Help identify strong stories from past experience
- Flag answers that sound weak or unconvincing and explain why

For system design:
- Start with requirements clarification
- Cover scale, bottlenecks, trade-offs
- Think out loud — interviewers want to see your process

General coaching:
- Be honest about weak answers — sugarcoating doesn't help
- Give the answer a score and explain how to improve it
- Simulate real interview pressure when asked

Your goal: Make them so prepared that the real interview feels easy.`
  },
];

const emptyPersona = { icon: '🤖', name: '', description: '', systemPrompt: '' };

export default function SettingsModal({ onClose }) {
  const { api, systemPrompt, saveSystemPrompt } = useChat();
  const [tab, setTab] = useState('persona');
  const [personas, setPersonas] = useState([]);
  const [newPersona, setNewPersona] = useState(emptyPersona);
  const [localPrompt, setLocalPrompt] = useState(systemPrompt);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    api.getPersonas(controller.signal).then(items => {
      if (!controller.signal.aborted) setPersonas(existing => [...existing, ...items.filter(item =>
        !existing.some(persona => persona._id === item._id))]);
    }).catch(failure => {
      if (!controller.signal.aborted) setError(failure.message);
    });
    return () => controller.abort();
  }, [api]);

  const applyPersona = (p) => {
    setLocalPrompt(p.systemPrompt);
    setSaved(false);
    setTab('prompt');
  };

  const perform = async (work) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try { await work(); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };

  const savePersona = (event) => {
    event.preventDefault();
    if (!newPersona.name.trim() || !newPersona.systemPrompt.trim()) return;
    perform(async () => {
      const persona = await api.createPersona({ ...newPersona, icon: newPersona.icon.trim() || '🤖' });
      setPersonas(items => [persona, ...items.filter(item => item._id !== persona._id)]);
      setNewPersona(emptyPersona);
    });
  };

  const removePersona = (id) => perform(async () => {
    await api.deletePersona(id);
    setPersonas(prev => prev.filter(p => p._id !== id));
  });

  const savePrompt = () => perform(async () => {
    await saveSystemPrompt(localPrompt.trim());
    setSaved(true);
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Sliders size={16} />
            <span id="settings-title">Chat settings</span>
          </div>
          <button className="modal-close" onClick={onClose} title="Close settings" autoFocus><X size={16} /></button>
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
          {error && <p role="alert" className="form-error modal-error">{error}</p>}
          {tab === 'persona' && (
            <div className="persona-tab">
              <div className="personas-grid">
                {DEFAULT_PERSONAS.map(p => (
                  <button key={p.name} className="persona-card" onClick={() => applyPersona(p)}>
                    <span className="persona-icon">{p.icon}</span>
                    <div>
                      <div className="persona-name">{p.name}</div>
                      <div className="persona-desc">{p.description}</div>
                    </div>
                  </button>
                ))}
                {personas.map(p => (
                  <div key={p._id} className="persona-card custom">
                    <button className="persona-select" onClick={() => applyPersona(p)}>
                      <span className="persona-icon">{p.icon}</span>
                      <span><span className="persona-name">{p.name}</span>
                        <span className="persona-desc">{p.description || 'Custom'}</span></span>
                    </button>
                    <button className="persona-del" title={`Delete ${p.name}`} onClick={() => removePersona(p._id)} disabled={busy}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="divider">Create a persona</div>
              <form className="create-persona" onSubmit={savePersona}>
                <div className="create-row">
                  <input className="field small" placeholder="Icon" aria-label="Persona icon" value={newPersona.icon} maxLength={16}
                    onChange={e => setNewPersona(p => ({ ...p, icon: e.target.value }))} style={{ width: 60 }} />
                  <input className="field" placeholder="Persona name" aria-label="Persona name" maxLength={60} required
                    value={newPersona.name} onChange={e => setNewPersona(p => ({ ...p, name: e.target.value }))} />
                </div>
                <input className="field" aria-label="Persona description" placeholder="Description (optional)" maxLength={240}
                  value={newPersona.description} onChange={e => setNewPersona(p => ({ ...p, description: e.target.value }))} />
                <textarea className="field" rows={3} placeholder="Instructions for this persona" aria-label="Persona instructions" maxLength={4000} required
                  value={newPersona.systemPrompt}
                  onChange={e => setNewPersona(p => ({ ...p, systemPrompt: e.target.value }))} />
                <button className="btn-accent" disabled={busy}>
                  <Plus size={13} />Save persona
                </button>
              </form>
            </div>
          )}

          {tab === 'prompt' && (
            <div className="prompt-tab">
              <p className="tab-desc">
                These instructions apply to this conversation. Leave the field empty to use the defaults.
              </p>
              <textarea
                className="field prompt-field"
                rows={10}
                aria-label="System prompt"
                placeholder="How should SYNID AI respond in this chat?"
                maxLength={4000}
                value={localPrompt}
                onChange={e => { setLocalPrompt(e.target.value); setSaved(false); }}
              />
              <div className="prompt-actions">
                <button className="btn-ghost" onClick={() => { setLocalPrompt(''); setSaved(false); }}>Clear</button>
                <button className="btn-accent" disabled={busy} onClick={savePrompt}>
                  <Save size={13} />
                  {saved ? 'Saved' : 'Save instructions'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
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

        .btn-accent {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 8px;
          background: var(--accent); color: var(--accent-ink);
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
