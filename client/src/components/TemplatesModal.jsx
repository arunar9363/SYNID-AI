import { useState } from 'react';
import { X, Sparkles, ChevronRight, Search } from 'lucide-react';

const TEMPLATES = [
  {
    category: '💻 Coding',
    items: [
      { title: 'Code Review', prompt: 'Please review the following code for bugs, performance issues, and best practices. Explain each issue found:\n\n```\n[paste your code here]\n```' },
      { title: 'Explain Code', prompt: 'Explain this code step by step like I\'m a beginner. What does it do and how does it work?\n\n```\n[paste your code here]\n```' },
      { title: 'Convert Language', prompt: 'Convert the following [SOURCE_LANG] code to [TARGET_LANG], maintaining the same logic and adding comments:\n\n```\n[paste your code here]\n```' },
      { title: 'Write Unit Tests', prompt: 'Write comprehensive unit tests for the following function. Cover edge cases, happy paths, and error cases:\n\n```\n[paste your function here]\n```' },
      { title: 'Debug Help', prompt: 'I\'m getting this error:\n\n```\n[paste error here]\n```\n\nHere\'s my code:\n\n```\n[paste code here]\n```\n\nWhat\'s causing it and how do I fix it?' },
      { title: 'Optimize Code', prompt: 'Optimize this code for performance and readability. Explain what you changed and why:\n\n```\n[paste your code here]\n```' },
    ]
  },
  {
    category: '✍️ Writing',
    items: [
      { title: 'Improve Writing', prompt: 'Improve the following text. Make it clearer, more engaging, and fix any grammar issues. Show the improved version and explain key changes:\n\n[paste your text here]' },
      { title: 'Email Draft', prompt: 'Write a professional email with the following details:\n- To: [recipient]\n- Purpose: [purpose]\n- Key points: [points]\n- Tone: [formal/casual]' },
      { title: 'Summarize Text', prompt: 'Summarize the following text in 3-5 bullet points, highlighting the most important information:\n\n[paste your text here]' },
      { title: 'Blog Post', prompt: 'Write a detailed, engaging blog post about [TOPIC]. Include:\n- Catchy headline\n- Introduction hook\n- 4-5 main sections with subheadings\n- Conclusion with CTA\nTarget audience: [AUDIENCE]' },
      { title: 'LinkedIn Post', prompt: 'Write a compelling LinkedIn post about [TOPIC]. Make it professional yet personal, include a hook, value, and call-to-action. Keep it under 300 words.' },
    ]
  },
  {
    category: '🧠 Learning',
    items: [
      { title: 'Explain Concept', prompt: 'Explain [CONCEPT] in simple terms. Start with a basic definition, then give a real-world analogy, then explain how it works in more detail.' },
      { title: 'Study Guide', prompt: 'Create a comprehensive study guide for [TOPIC] that includes:\n- Key concepts and definitions\n- Important formulas/rules\n- Common mistakes to avoid\n- Practice questions with answers' },
      { title: 'Pros & Cons', prompt: 'Give me a detailed pros and cons analysis of [TOPIC/DECISION]. Consider different perspectives including short-term vs long-term, and different stakeholders.' },
      { title: 'Compare Options', prompt: 'Compare [OPTION A] vs [OPTION B] in a detailed table format covering: features, performance, cost, ease of use, best use cases, and who should choose each.' },
    ]
  },
  {
    category: '📊 Analysis',
    items: [
      { title: 'Data Analysis', prompt: 'Analyze the following data and provide:\n1. Key trends and patterns\n2. Notable outliers\n3. Actionable insights\n4. Recommendations\n\n[paste your data here]' },
      { title: 'SWOT Analysis', prompt: 'Perform a detailed SWOT analysis for [COMPANY/PRODUCT/IDEA]. Be specific and actionable for each quadrant.' },
      { title: 'Root Cause Analysis', prompt: 'Help me do a root cause analysis for this problem: [PROBLEM]. Use the 5 Whys technique and suggest solutions for each root cause.' },
    ]
  },
  {
    category: '🎨 Creative',
    items: [
      { title: 'Story Starter', prompt: 'Write the opening 3 paragraphs of a [GENRE] story set in [SETTING]. The protagonist is [CHARACTER]. Make it gripping and end on a cliffhanger.' },
      { title: 'Brainstorm Ideas', prompt: 'Brainstorm 10 creative and unique ideas for [TOPIC]. For each idea include a one-sentence description and the key benefit. Think outside the box!' },
      { title: 'Name Generator', prompt: 'Generate 15 creative name ideas for [PRODUCT/COMPANY/PROJECT]. For each name explain the meaning/reasoning and rate it 1-10 for memorability.' },
    ]
  },
];

export default function TemplatesModal({ onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  const filtered = TEMPLATES.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.prompt.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="tpl-modal" onClick={e => e.stopPropagation()}>
        <div className="tpl-header">
          <div className="tpl-title">
            <Sparkles size={16} />
            <span>Prompt Templates</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="tpl-search-row">
          <Search size={14} />
          <input
            className="tpl-search"
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="tpl-body">
          {filtered.map((cat, ci) => (
            <div key={ci} className="tpl-category">
              <button
                className={`tpl-cat-header ${activeCategory === ci ? 'open' : ''}`}
                onClick={() => setActiveCategory(activeCategory === ci ? null : ci)}
              >
                <span>{cat.category}</span>
                <ChevronRight size={14} className={`chevron ${activeCategory === ci ? 'open' : ''}`} />
              </button>
              {(activeCategory === ci || search) && (
                <div className="tpl-items">
                  {cat.items.map((item, ii) => (
                    <button key={ii} className="tpl-item" onClick={() => { onSelect(item.prompt); onClose(); }}>
                      <span className="tpl-item-title">{item.title}</span>
                      <span className="tpl-item-preview">{item.prompt.slice(0, 80)}...</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .tpl-modal {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          width: min(560px, 95vw);
          max-height: 78vh;
          display: flex; flex-direction: column;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6);
          animation: fadeUp 0.2s ease;
        }
        .tpl-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px 14px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .tpl-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 15px; font-weight: 600; color: var(--text-primary);
        }
        .modal-close-btn {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); padding: 4px; border-radius: 6px;
          display: flex; transition: all var(--transition);
        }
        .modal-close-btn:hover { color: var(--text-primary); background: var(--bg-hover); }
        .tpl-search-row {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 18px; border-bottom: 1px solid var(--border-subtle);
          color: var(--text-muted);
        }
        .tpl-search {
          flex: 1; background: none; border: none; outline: none;
          color: var(--text-primary); font-family: var(--font-sans); font-size: 13px;
        }
        .tpl-search::placeholder { color: var(--text-muted); }
        .tpl-body { overflow-y: auto; padding: 8px 10px; }
        .tpl-category { margin-bottom: 2px; }
        .tpl-cat-header {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 10px 12px; border-radius: 8px;
          background: none; border: none; cursor: pointer;
          color: var(--text-secondary); font-family: var(--font-sans);
          font-size: 13px; font-weight: 600; transition: all var(--transition);
        }
        .tpl-cat-header:hover, .tpl-cat-header.open { background: var(--bg-hover); color: var(--text-primary); }
        .chevron { transition: transform 0.2s ease; }
        .chevron.open { transform: rotate(90deg); }
        .tpl-items { padding: 4px 0 4px 12px; display: flex; flex-direction: column; gap: 2px; }
        .tpl-item {
          display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
          padding: 10px 12px; border-radius: 8px;
          background: none; border: 1px solid transparent; cursor: pointer;
          text-align: left; transition: all var(--transition);
        }
        .tpl-item:hover { background: var(--bg-elevated); border-color: var(--border); }
        .tpl-item-title { font-size: 13px; font-weight: 500; color: var(--text-primary); }
        .tpl-item-preview { font-size: 11px; color: var(--text-muted); line-height: 1.4; }
      `}</style>
    </div>
  );
}
