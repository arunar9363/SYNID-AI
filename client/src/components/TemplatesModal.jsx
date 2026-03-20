import { useState } from 'react';
import { X, Sparkles, ChevronRight, Search } from 'lucide-react';

const TEMPLATES = [
  {
    category: '💻 Coding',
    items: [
      {
        title: 'Code Review',
        prompt: `Please do a thorough senior-level code review of the following code:

\`\`\`
[write your code here]
\`\`\`

Review across these dimensions:

1. **Bugs & Logic Errors** — incorrect behavior, edge cases, off-by-one errors
2. **Security Issues** — injection risks, exposed secrets, unsafe inputs, auth flaws
3. **Performance** — unnecessary loops, memory leaks, expensive re-renders, N+1 queries
4. **Readability** — naming clarity, function length, cognitive complexity
5. **Best Practices** — SOLID principles, design patterns, language conventions
6. **Error Handling** — what can throw and is not properly caught or handled
7. **Test Coverage** — what critical paths have no tests and should

For each issue found:
- Quote the exact problematic line
- Explain clearly why it is a problem
- Show the corrected version with a brief explanation

End with:
- Overall code quality score out of 10
- The single most important thing to fix first`
      },
      {
        title: 'Explain Code',
        prompt: `Explain the following code so a junior developer can fully understand it:

\`\`\`
[write your code here]
\`\`\`

Structure your explanation exactly like this:

1. **What it does** — one paragraph plain English summary
2. **Line by line walkthrough** — explain each significant block or function
3. **Key concepts used** — explain any patterns, algorithms, or language features
4. **Data flow** — how data enters, transforms, and exits the code
5. **Edge cases** — what inputs or conditions could cause unexpected behavior
6. **Visual diagram** — draw an ASCII flow diagram if it helps understanding

Rules:
- No jargon without immediately defining it in plain English
- Use analogies from real life where possible
- End with: "The single most important thing to understand here is..."`
      },
      {
        title: 'Convert Language',
        prompt: `Convert the following code to another language:

**Source language:** [write source language here — e.g. Python]
**Target language:** [write target language here — e.g. TypeScript]

**Code to convert:**
\`\`\`
[write your code here]
\`\`\`

Conversion requirements:
- Preserve 100% of the original logic and behavior
- Use idiomatic patterns of the target language — do not just translate syntax
- Add proper types if the target language supports them
- Replace language-specific libraries with the best equivalent in target language
- Follow target language naming conventions (camelCase, snake_case, PascalCase)
- Add comments where the implementation differs significantly between languages

After the converted code add:
**What changed and why** — explain key differences and any important decisions made`
      },
      {
        title: 'Write Unit Tests',
        prompt: `Write comprehensive unit tests for the following code:

\`\`\`
[write your function or module here]
\`\`\`

**Testing framework preference:** [write here — e.g. Jest, Vitest, PyTest, JUnit]

Cover all of the following:
1. **Happy path** — expected inputs producing expected outputs
2. **Edge cases** — empty input, zero, null, undefined, empty arrays, boundary values
3. **Error cases** — invalid input, wrong types, values out of range
4. **Async behavior** — if applicable, test loading, success, and failure states
5. **Side effects** — mock any external calls (API, database, filesystem)

For each test:
- Write a clear descriptive test name that reads like a sentence
- Follow Arrange → Act → Assert structure with comments
- Explain briefly why each edge case matters

End with a coverage summary — what percentage of logic is now tested and what remains untested.`
      },
      {
        title: 'Debug My Error',
        prompt: `Help me debug this error step by step.

**Language / Framework:** [write here — e.g. React, Node.js, Python]

**What I expected to happen:**
[describe expected behavior here]

**What actually happens:**
[describe the actual behavior or symptom here]

**Full error message and stack trace:**
\`\`\`
[write the full error here]
\`\`\`

**Code where the error occurs:**
\`\`\`
[write your code here]
\`\`\`

Please provide:
1. **Root cause** — the exact reason this error is happening
2. **Why it happens** — explain the underlying mechanism clearly
3. **The fix** — corrected code with comments on what changed
4. **Verification** — how to confirm the fix actually worked
5. **Prevention** — how to avoid this class of error in the future`
      },
      {
        title: 'Optimize Code',
        prompt: `Optimize the following code for performance and readability:

\`\`\`
[write your code here]
\`\`\`

**Current problem** *(optional — describe what feels slow or messy):*
[write here]

Optimize across these areas:
1. **Time complexity** — reduce Big O where possible, explain before and after
2. **Space complexity** — reduce memory usage and unnecessary allocations
3. **Readability** — simplify logic, improve naming, reduce nesting
4. **Redundancy** — remove duplicate logic, repeated calculations, dead code
5. **Modern syntax** — use language features that make code cleaner
6. **Caching opportunities** — identify values worth memoizing

Response format:
- Show the optimized code first
- Below it, a table: What changed | Why | Performance impact
- State the complexity improvement: O(n²) → O(n log n) etc
- Flag any trade-offs made (readability vs speed)`
      },
      {
        title: 'Design a Database',
        prompt: `Design a complete database schema for the following application:

**Application description:** [write what your app does here]
**Expected scale:** [write here — e.g. 10k users, 1M records]
**Database preference:** [write here — e.g. MongoDB, PostgreSQL, MySQL — or ask for recommendation]

Please provide:
1. **Schema design** — all collections or tables with every field, type, and constraint
2. **Relationships** — how entities relate (one-to-many, many-to-many etc) with diagrams
3. **Indexes** — which fields to index and exactly why
4. **Sample documents or rows** — realistic example data for each table
5. **Design decisions** — explain why you structured it this way
6. **What to avoid** — common mistakes for this type of schema

End with: the top 3 things that will cause problems at scale and how to handle them.`
      },
    ]
  },
  {
    category: '✍️ Writing',
    items: [
      {
        title: 'Improve My Writing',
        prompt: `Improve the following text while preserving my original voice and intent:

**Text to improve:**
[write your text here]

**Desired tone:** [write here — e.g. professional, casual, persuasive, academic]
**Target audience:** [write here — e.g. developers, executives, general public]

Improve it across these dimensions:
1. **Clarity** — remove ambiguity, simplify complex sentences
2. **Engagement** — stronger opening, varied sentence rhythm, compelling flow
3. **Grammar & style** — fix errors, improve word choice, remove filler words
4. **Structure** — logical flow, better paragraph breaks, stronger conclusion
5. **Tone consistency** — ensure the voice stays consistent throughout

Response format:
- Show the improved version first in full
- Then a table: Original line | Improved line | Reason for change
- Rate the original out of 10 and the improved version out of 10`
      },
      {
        title: 'Write an Email',
        prompt: `Write a professional email with the following details:

**To:** [write recipient name and role here]
**From context:** [write your name and role here]
**Purpose:** [write the main goal of the email here]
**Key points to cover:** [write each point on a new line here]
**Desired tone:** [write here — e.g. formal, friendly, firm, apologetic, persuasive]
**Any background context:** [write any relevant history or situation here]

Requirements:
- Subject line: punchy, specific, makes them want to open it
- Opening: do not start with "I hope this email finds you well"
- Body: clear, scannable, one idea per paragraph
- Call to action: one specific ask at the end — not multiple
- Length: as short as possible while covering all key points

Provide 2 versions: one concise (under 150 words) and one detailed (under 300 words).`
      },
      {
        title: 'Summarize Text',
        prompt: `Summarize the following text:

[write your text here]

Provide the summary in three formats:

1. **One sentence summary** — the single most important idea in under 25 words
2. **5 bullet point summary** — the 5 key takeaways a busy person needs to know
3. **Full summary** — comprehensive summary in 2-3 paragraphs preserving all important details

Then add:
- **Key terms** — list any important concepts or jargon with brief definitions
- **What is missing** — anything important the original text did not address
- **My take** — one honest sentence on the quality and reliability of the content`
      },
      {
        title: 'Write a Blog Post',
        prompt: `Write a detailed, high-quality blog post with the following brief:

**Topic:** [write your topic here]
**Target audience:** [write here — e.g. beginner developers, startup founders, marketers]
**Desired tone:** [write here — e.g. educational, conversational, opinionated]
**Target length:** [write here — e.g. 800 words, 1500 words]
**Main goal:** [write here — e.g. teach a concept, drive signups, build authority]

Structure:
1. **Headline** — 3 options, each using a different hook style (curiosity, benefit, controversy)
2. **Introduction** — open with a surprising fact, story, or bold claim — no generic intros
3. **Body sections** — 4 to 5 sections with subheadings, each making one clear point
4. **Examples** — at least one concrete real-world example per section
5. **Conclusion** — summarize key insight and end with a clear call to action

SEO: naturally include the main keyword 3 to 4 times without stuffing.`
      },
      {
        title: 'Write LinkedIn Post',
        prompt: `Write a high-performing LinkedIn post about the following:

**Topic:** [write your topic here]
**My background/angle:** [write your role or experience relevant to this topic]
**Key insight to share:** [write the main idea or lesson here]
**Tone:** [write here — e.g. personal story, industry insight, controversial take, achievement]

Requirements:
- **Hook** — first line must stop the scroll. No "I am excited to share"
- **Format** — short punchy paragraphs, never more than 2 lines each
- **Value** — give one concrete, actionable insight the reader can use today
- **Authenticity** — sound like a real human, not a corporate press release
- **Call to action** — end with one engaging question to drive comments
- **Length** — 150 to 250 words maximum
- **Hashtags** — 3 to 5 relevant hashtags at the end

Provide 2 versions: one personal story angle and one direct insight angle.`
      },
      {
        title: 'Write a Resume Bullet',
        prompt: `Rewrite the following resume experience into powerful, quantified bullet points:

**Job title:** [write your job title here]
**Company type:** [write here — e.g. startup, enterprise, agency]
**What you actually did:** [write your responsibilities and work in plain language here]
**Any numbers you remember:** [write here — team size, revenue, users, performance improvements etc]
**Target role applying for:** [write here — so bullets can be tailored]

Rules for each bullet:
- Start with a strong action verb (Built, Led, Reduced, Increased, Designed)
- Include a metric or outcome wherever possible
- Show impact not just activity — "Reduced load time by 60%" not "Worked on performance"
- Keep each bullet under 20 words
- Tailor language to match the target role's keywords

Provide 6 to 8 bullet points. Then rank them strongest to weakest and explain why.`
      },
    ]
  },
  {
    category: '🧠 Learning',
    items: [
      {
        title: 'Explain a Concept',
        prompt: `Explain the following concept so I can truly understand it, not just memorize it:

**Concept:** [write the concept here — e.g. recursion, compound interest, neural networks]
**My current level:** [write here — e.g. complete beginner, know the basics, intermediate]
**My background:** [write here — e.g. I am a developer, student, business person]

Explanation structure:
1. **Simple definition** — one sentence, no jargon
2. **Real world analogy** — explain it using something from everyday life
3. **How it actually works** — step by step, build complexity gradually
4. **Concrete example** — walk through a specific, realistic use case
5. **Common misconceptions** — what do most people get wrong about this
6. **Visual diagram** — ASCII diagram if the concept has structure or flow
7. **Why it matters** — when and why would someone actually use or need this

End with 3 questions I should be able to answer if I truly understand this concept.`
      },
      {
        title: 'Create Study Guide',
        prompt: `Create a comprehensive study guide for the following topic:

**Topic:** [write your topic here]
**My level:** [write here — e.g. beginner, intermediate, advanced]
**Purpose:** [write here — e.g. exam in 3 days, job interview, personal interest]
**Time available:** [write here — e.g. 2 hours, 1 week]

Study guide structure:
1. **Topic overview** — what this is and why it matters
2. **Core concepts** — every key idea with a clear definition and example
3. **Important formulas or rules** — formatted clearly for quick reference
4. **Common mistakes** — top 5 errors beginners make and how to avoid them
5. **Practice questions** — 10 questions ranging from easy to hard with full answers
6. **Quick reference sheet** — one page cheat sheet of the most critical points
7. **Study schedule** — day by day plan based on my available time

Flag which concepts are most likely to appear in exams or interviews.`
      },
      {
        title: 'Pros and Cons Analysis',
        prompt: `Give me a thorough pros and cons analysis of the following:

**Topic or decision:** [write here — e.g. switching to TypeScript, hiring a freelancer, moving to a new city]
**My context:** [write relevant background here so advice is specific to your situation]
**Main concern:** [write what you are most worried or uncertain about]

Analysis framework:
1. **Pros** — list each advantage with a brief explanation of why it matters
2. **Cons** — list each disadvantage with realistic assessment of severity
3. **Short term vs long term** — how does the picture change over time
4. **Hidden factors** — things most people overlook when making this decision
5. **Depends on** — under what conditions does this become clearly a good or bad idea
6. **Verdict** — your honest recommendation given what I have shared

Rate each pro and con: High / Medium / Low impact.
End with: the one question I should answer before making this decision.`
      },
      {
        title: 'Compare Two Options',
        prompt: `Compare the following two options in depth so I can make an informed decision:

**Option A:** [write here]
**Option B:** [write here]
**My use case:** [write what you are trying to accomplish]
**My priorities:** [write what matters most — e.g. speed, cost, simplicity, scalability]

Comparison structure:
1. **Summary table** — side by side across: performance, cost, learning curve, community, scalability, best use case
2. **Where Option A wins** — specific scenarios where it is clearly better
3. **Where Option B wins** — specific scenarios where it is clearly better
4. **Hidden trade-offs** — things the documentation and marketing do not tell you
5. **Migration cost** — how hard is it to switch later if you choose wrong
6. **Community and longevity** — which has better long-term outlook
7. **Verdict** — given my use case and priorities, which should I choose and why

Be direct. Do not give a wishy-washy "it depends" answer without a clear recommendation.`
      },
      {
        title: 'Create a Roadmap',
        prompt: `Create a detailed learning roadmap for the following goal:

**My goal:** [write here — e.g. become a full-stack developer, learn machine learning, master public speaking]
**Current skill level:** [write what you already know]
**Available time per week:** [write here — e.g. 10 hours per week]
**Timeline:** [write your target — e.g. job-ready in 6 months]
**Learning style:** [write here — e.g. I prefer videos, books, projects, structured courses]

Roadmap structure:
1. **Phase breakdown** — divide the journey into clear phases with milestones
2. **Week by week plan** — specific topics and tasks for each week
3. **Resources** — best free and paid resource for each topic (course, book, docs)
4. **Projects to build** — one hands-on project per phase to solidify learning
5. **Checkpoints** — how to know you are truly ready to move to the next phase
6. **Common traps** — mistakes most learners make on this path and how to avoid them

Be realistic about the timeline. If my goal is not achievable in the time I gave, tell me honestly.`
      },
    ]
  },
  {
    category: '📊 Analysis',
    items: [
      {
        title: 'Analyze My Data',
        prompt: `Analyze the following data and give me actionable insights:

**Data:**
[write or paste your data here — table, numbers, CSV, or description]

**Context:** [write what this data represents — e.g. monthly sales, user signups, survey results]
**Business question:** [write what decision you are trying to make with this data]

Analysis structure:
1. **Data quality check** — flag missing values, outliers, or anything that looks wrong
2. **Key trends** — what is going up, down, or staying flat and since when
3. **Notable outliers** — data points that deviate significantly and possible explanations
4. **Correlations** — what variables appear to move together
5. **Actionable insights** — specific things this data suggests I should do
6. **Recommendations** — ranked by potential impact, highest first
7. **What data is missing** — what additional data would make this analysis stronger

Be specific with numbers. "Revenue is up 23% since March" is better than "revenue is increasing".`
      },
      {
        title: 'SWOT Analysis',
        prompt: `Perform a rigorous SWOT analysis for the following:

**Subject:** [write here — e.g. my startup idea, my career, my product, my company]
**Context:** [write relevant background — industry, stage, competition, your role]
**Main goal:** [write what you are trying to achieve or decide]

For each quadrant go deep — not generic:

**Strengths** — what concrete advantages exist right now, backed by evidence
**Weaknesses** — honest assessment of real gaps, not softened or minimized
**Opportunities** — specific external trends or gaps that could be exploited
**Threats** — realistic risks that could derail progress if ignored

Then add:
- **SO Strategies** — how to use strengths to capture opportunities
- **ST Strategies** — how to use strengths to defend against threats
- **WO Strategies** — how to fix weaknesses to capture opportunities
- **WT Strategies** — damage control for weakness and threat combinations

End with: the single most urgent thing to act on based on this analysis.`
      },
      {
        title: 'Root Cause Analysis',
        prompt: `Help me find the true root cause of the following problem:

**Problem statement:** [write exactly what is going wrong here]
**When it started:** [write here]
**How often it happens:** [write here — always, sometimes, under specific conditions]
**What has already been tried:** [write any fixes that were attempted]
**Impact:** [write the business or user impact of this problem]

Use the following framework:

1. **Problem definition** — restate the problem precisely and completely
2. **5 Whys analysis** — ask why 5 times, going deeper each level
3. **Root cause identification** — the actual underlying cause, not the symptom
4. **Contributing factors** — other things making this problem worse
5. **Solutions** — one fix for each root cause, ranked by ease and impact
6. **Prevention** — what process, system, or check would stop this from recurring
7. **Monitoring** — how to detect early if this problem is returning

Distinguish clearly between symptoms (what we see) and root causes (why it is actually happening).`
      },
      {
        title: 'Business Plan Review',
        prompt: `Review and stress-test the following business idea or plan:

**Business idea:** [write your idea or plan here in as much detail as you have]
**Target market:** [write who your customer is]
**Revenue model:** [write how you plan to make money]
**Stage:** [write here — idea, MVP, early revenue, scaling]

Review it like a skeptical but fair investor:

1. **Market validation** — is there real demand, how do you know, how big is the market
2. **Competitive landscape** — who else does this and what is your actual advantage
3. **Revenue model** — is this a real business or a feature, unit economics, path to profit
4. **Biggest assumptions** — what must be true for this to work that is not yet proven
5. **Key risks** — top 3 things most likely to kill this business
6. **What I like** — genuine strengths worth building on
7. **Verdict** — would a rational investor fund this at this stage and why

Be honest. Sugarcoating a bad idea wastes everyone's time.`
      },
    ]
  },
  {
    category: '🎨 Creative',
    items: [
      {
        title: 'Write a Story',
        prompt: `Write a compelling short story with the following brief:

**Genre:** [write here — e.g. sci-fi, thriller, romance, literary fiction, horror]
**Setting:** [write here — time period, location, world details]
**Protagonist:** [write name, age, key trait, and what they want]
**Conflict:** [write the central problem or tension]
**Tone:** [write here — e.g. dark, hopeful, humorous, tense, melancholic]
**Length:** [write here — e.g. 500 words, 1000 words]

Story requirements:
- Opening line must create immediate tension or intrigue — no scene-setting warm-ups
- Show character through action and dialogue, not description
- Every scene must either reveal character or advance plot — ideally both
- Use sensory details to make the world feel real
- Build to a climax that feels both surprising and inevitable
- Ending: resonant and thought-provoking — not tied up too neatly

Literary quality standard. Write something that could appear in a literary magazine.`
      },
      {
        title: 'Brainstorm Ideas',
        prompt: `Brainstorm creative ideas for the following challenge:

**What I need ideas for:** [write here — e.g. app features, marketing campaigns, business names, gift ideas]
**Context and constraints:** [write any limitations — budget, timeline, audience, platform]
**Goal:** [write what success looks like]

Deliver exactly this:
- **15 ideas** total — ranging from safe and practical to bold and unconventional
- For each idea:
  - One clear sentence describing the idea
  - Why it could work
  - Biggest challenge or risk
  - Effort level: Low / Medium / High

Then:
- **Top 3 picks** — your recommended best ideas with detailed reasoning
- **Wild card** — one idea that is probably too ambitious but could be transformative
- **Quick wins** — 2 ideas that could be implemented this week

Think beyond the obvious. At least 5 ideas should be ones I would not have thought of myself.`
      },
      {
        title: 'Generate Names',
        prompt: `Generate creative name ideas for the following:

**What needs a name:** [write here — product, company, feature, project, brand]
**Description:** [write what it does or what it stands for]
**Target audience:** [write who will see or use this name]
**Tone and personality:** [write here — e.g. professional, playful, powerful, minimal, friendly]
**Names to avoid or similar to avoid:** [write here if any]

Provide 20 name ideas across these styles:

- **Descriptive** — clearly says what it does (5 names)
- **Invented or coined** — made-up words or creative spelling (5 names)
- **Metaphor or concept** — evokes a feeling or idea (5 names)
- **Short and punchy** — under 6 characters (5 names)

For each name provide:
- Pronunciation guide if not obvious
- The meaning or reasoning behind it
- Memorability score out of 10
- Domain availability suggestion (.com, .io, .ai)

End with your top 3 overall picks and the reason each one stands out.`
      },
      {
        title: 'Write Ad Copy',
        prompt: `Write high-converting ad copy for the following:

**Product or service:** [write what you are selling here]
**Target audience:** [write who you are targeting — demographics, pain points, desires]
**Platform:** [write here — e.g. Google Ad, Facebook Ad, Instagram, landing page headline]
**Key benefit:** [write the single most valuable thing your product does]
**Tone:** [write here — e.g. urgent, inspiring, humorous, professional, bold]

Provide copy in these formats:

1. **Headlines** — 5 options, each using a different hook (fear, curiosity, benefit, social proof, urgency)
2. **Short ad copy** — under 50 words, for social media
3. **Long ad copy** — 150 words, for landing pages or detailed ads
4. **Call to action** — 5 variations from soft to aggressive

For each piece of copy:
- Explain the psychological trigger it uses
- Rate it for likely click-through rate: High / Medium / Low

Avoid clichés like "revolutionary", "game-changing", or "best in class".`
      },
    ]
  },
  {
    category: '🚀 Career',
    items: [
      {
        title: 'Prepare for Interview',
        prompt: `Help me prepare for an upcoming job interview:

**Role I am interviewing for:** [write job title and company here]
**My background:** [write your relevant experience and skills]
**Interview type:** [write here — e.g. technical, behavioral, system design, case study, final round]
**My biggest concern:** [write what you are most nervous about]

Please provide:

1. **Top 10 questions** most likely to be asked for this specific role with ideal answers using STAR format
2. **Technical questions** — 5 role-specific technical questions with model answers
3. **Questions to ask them** — 5 smart questions that show strategic thinking
4. **Weakness answer** — help me frame a real weakness that does not disqualify me
5. **Salary negotiation** — how to handle the compensation question
6. **Red flags to avoid** — common mistakes candidates make in this type of interview
7. **30 second pitch** — a compelling answer to "tell me about yourself"

Be direct about what a strong versus weak answer looks like.`
      },
      {
        title: 'Write a Cold Message',
        prompt: `Write a cold outreach message for the following purpose:

**Platform:** [write here — e.g. LinkedIn, email, Twitter]
**Who I am reaching out to:** [write their role, company, why they are relevant]
**Who I am:** [write your background, role, or what you are looking for]
**Goal of the message:** [write here — e.g. get a referral, ask for advice, explore opportunities, collaboration]
**Any connection or context:** [write any mutual connection, their recent post, or shared interest]

Requirements:
- First line: specific to them — not generic, proves you did research
- No "I hope this message finds you well" or "I know you are busy"
- Lead with value or genuine curiosity — not with asking for something
- Be specific about what you are asking — one clear request only
- Keep it under 100 words — busy people do not read long cold messages
- Sound like a real human not a template

Provide 3 versions: direct ask, relationship-building opener, and mutual value angle.`
      },
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
