<div align="center">

<img src="client/public/assets/synidailogo.png" alt="SYNID AI Logo" width="80" />

# SYNID AI

### Fast, Private, Powerful AI Chat — Powered by Groq

[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Groq](https://img.shields.io/badge/Groq-F55036?style=flat&logo=groq&logoColor=white)](https://groq.com)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)

**A full-stack AI chat application powered by Groq's ultra-fast inference API.**  
No local hardware required. No subscriptions. Your conversations stay private in your own database.

[Features](#-features) • [Quick Start](#-quick-start) • [Models](#-supported-models) • [API Docs](#-api-endpoints) • [Project Structure](#-project-structure) • [Contributing](#-contributing)

</div>

---

## 📌 What is SYNID AI?

**SYNID AI** is an open-source, self-hosted AI chat application built with the MERN stack. It uses [Groq](https://groq.com) to run state-of-the-art large language models at lightning speed — giving you a premium ChatGPT-like experience with complete control over your data and zero ongoing cost.

> 💡 Built for developers, students, and privacy-conscious users who want the power of AI without handing their data to big tech companies.

**Key differences from the original:**
- 🔥 **Groq-powered** — blazing fast inference via Groq's API (no local GPU needed)
- 🧠 **SYNID AI identity** — the AI always introduces itself as SYNID AI, not the underlying model
- 💬 **Chat only** — clean, focused chat experience with no image upload complexity
- ☁️ **Cloud-deployable** — runs on Render, Railway, or any Node.js host

---

## ✨ Features

### 💬 Chat
- **Real-time streaming** — responses appear token by token via Server-Sent Events
- **Full conversation memory** — entire chat history sent as context on every message
- **Auto-generated titles** — AI names each conversation from the first message using `llama-3.1-8b-instant`
- **Multi-model support** — switch between any available Groq model instantly
- **SYNID AI identity** — AI always presents itself as SYNID AI regardless of the underlying model
- **Markdown rendering** — headers, tables, blockquotes, and lists render beautifully
- **Syntax highlighting** — 100+ programming languages with one-click copy

### 🗂️ Conversation Management
- **Persistent chat history** — all conversations saved in MongoDB, scoped per user
- **Rename & delete** — full control over your chat history
- **Pin conversations** — keep important chats at the top
- **Search** — full-text search across all conversations and messages
- **Export** — download any chat as Markdown or JSON
- **Clear messages** — wipe a chat without deleting the conversation

### 🤖 AI Customization
- **System prompts** — set custom instructions for any conversation
- **Personas** — built-in AI personalities (Developer, Writer, Teacher, Researcher, Business, Friendly)
- **Custom personas** — create and save your own AI personalities
- **SYNID identity always active** — custom system prompts layer on top of the SYNID AI base identity

### 📝 Input
- **Prompt templates** — 20+ ready-made templates across 5 categories (Coding, Writing, Learning, Analysis, Creative)
- **Welcome screen suggestions** — 8 quick-start suggestion cards on the home screen
- **Character counter** — warns when approaching context limits (8,000 char soft limit)
- **Auto-resizing textarea** — input grows as you type, up to 220px

### ✏️ Messages
- **Edit messages** — fix any user message and replay the conversation from that point
- **Regenerate responses** — get a fresh answer with one click
- **Copy message** — copy full message or individual code blocks
- **React to messages** — thumbs up / thumbs down rating

### 🎨 UI & UX
- **SYNID branded dark theme** — deep navy palette matched to the SYNID AI logo colors
- **Mobile responsive** — works on phones and tablets with collapsible sidebar
- **Collapsible sidebar** — maximize writing space
- **Live token counter** — see estimated context window usage in real time
- **Keyboard shortcuts** — `N` new chat · `Ctrl+K` search
- **Generating indicator** — live pulsing badge while AI is thinking
- **Per-user isolation** — each browser gets a unique `userId` via localStorage, conversations are fully scoped

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite | Fast, modern UI |
| Styling | Pure CSS + CSS Variables | No heavy CSS framework |
| Markdown | react-markdown + remark-gfm | GitHub-flavored markdown |
| Syntax | react-syntax-highlighter | Beautiful code blocks |
| Icons | lucide-react | Clean, consistent icons |
| HTTP Client | Axios | API calls |
| Backend | Node.js + Express | REST API + SSE streaming |
| Database | MongoDB + Mongoose | Persistent conversation storage |
| Streaming | Server-Sent Events (SSE) | Real-time token streaming |
| AI Inference | Groq API | Ultra-fast LLM inference |

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** v18+ → [nodejs.org](https://nodejs.org)
- **MongoDB** (local or Atlas) → [mongodb.com](https://www.mongodb.com/try/download/community)
- **Groq API Key** (free) → [console.groq.com](https://console.groq.com)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/synid-ai.git
cd synid-ai
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create a `.env` file in the `server/` folder:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/synid-ai
GROQ_API_KEY=your_groq_api_key_here
DEFAULT_MODEL=llama-3.3-70b-versatile
```

Start the server:

```bash
npm run dev
```

You should see:
```
✅ MongoDB connected
🚀 Server running on port 5000
```

### 3. Set up the frontend

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

### 4. Open in browser

```
http://localhost:3000
```

🎉 **SYNID AI is live!**

---

## 🚀 One-Click Start (Windows)

Create a `start.bat` file in the project root:

```bat
@echo off
echo Starting SYNID AI...
start "Backend" cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 3
start "Frontend" cmd /k "cd /d %~dp0client && npm run dev"
timeout /t 4
start http://localhost:3000
```

Double-click it every time you want to use the app.

---

## ☁️ Deploying to Render (Free)

SYNID AI is built and deployed on [Render](https://render.com). Here's how:

### Backend (Web Service)
1. Push your `server/` folder to GitHub
2. Create a new **Web Service** on Render
3. Set build command: `npm install`
4. Set start command: `node index.js`
5. Add environment variables:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `GROQ_API_KEY` — your Groq API key
   - `PORT` — `5000`

### Frontend (Static Site)
1. Push your `client/` folder to GitHub
2. Create a new **Static Site** on Render
3. Set build command: `npm install && npm run build`
4. Set publish directory: `dist`
5. Add environment variable:
   - `VITE_API_URL` — your backend Render URL (e.g. `https://synid-ai.onrender.com`)

---

## ⚙️ Configuration

All server config lives in `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/synid-ai
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
DEFAULT_MODEL=llama-3.3-70b-versatile
```

### Use MongoDB Atlas (Cloud Database)

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/synid-ai
```

### Frontend API URL

In `client/.env` (or Render environment variables):

```env
VITE_API_URL=https://your-backend.onrender.com
```

---

## 🧠 Supported Models

All models are served via Groq's API — no local download required.

| Model | Best For |
|-------|----------|
| `llama-3.3-70b-versatile` | ⭐ Best overall — coding and everyday tasks |
| `meta-llama/llama-4-maverick-17b-128e-instruct` | 🚀 Most capable — complex reasoning and AI agents |
| `meta-llama/llama-4-scout-17b-16e-instruct` | ⚡ Fast — chat and long inputs |
| `qwen-qwq-32b` | 🧠 Reasoning — math, logic, and analysis |
| `mixtral-8x7b-32768` | 📚 Long context — large documents |
| `llama-3.1-8b-instant` | ⚡ Ultra-fast — quick answers |
| `gemma2-9b-it` | 🟢 Efficient — general use |
| `deepseek-r1-distill-llama-70b` | 🔬 Deep reasoning |

Switch between models any time from the sidebar dropdown — no restart required.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/models` | List all available Groq models |
| `GET` | `/api/conversations` | Get all conversations (scoped to user) |
| `GET` | `/api/conversations/:id` | Get single conversation with messages |
| `POST` | `/api/conversations` | Create new conversation |
| `PATCH` | `/api/conversations/:id` | Rename or update conversation |
| `DELETE` | `/api/conversations/:id` | Delete one conversation |
| `DELETE` | `/api/conversations` | Delete all conversations |
| `PATCH` | `/api/conversations/:id/pin` | Pin / unpin conversation |
| `DELETE` | `/api/conversations/:id/messages` | Clear messages in conversation |
| `GET` | `/api/conversations/:id/export` | Export as Markdown or JSON |
| `GET` | `/api/search?q=` | Full-text search across all conversations |
| `POST` | `/api/chat` | **Stream AI response (SSE)** |
| `GET` | `/api/personas` | List all personas |
| `POST` | `/api/personas` | Create new persona |
| `DELETE` | `/api/personas/:id` | Delete persona |

### Authentication

All requests are scoped to a unique `userId` sent via the `x-user-id` header. The client auto-generates and stores this ID in `localStorage` — no login required.

---

## 📁 Project Structure

```
synid-ai/
│
├── server/
│   ├── index.js              # Express server + all API routes + SYNID identity prompt
│   ├── models.js             # Mongoose schemas (Conversation, Persona)
│   ├── .env                  # Environment variables (not committed)
│   └── package.json
│
└── client/
    ├── public/
    │   └── assets/
    │       └── synidailogo.png            # SYNID AI logo
    │
    └── src/
        ├── App.jsx                        # Root component + keyboard shortcuts
        ├── main.jsx                       # React entry point
        ├── index.css                      # Global styles + SYNID color palette
        │
        ├── context/
        │   └── ChatContext.jsx            # Global state — messages, models, streaming
        │
        ├── utils/
        │   └── api.js                     # API calls + SSE streaming client
        │
        └── components/
            ├── Sidebar.jsx                # Conversation history + model selector
            ├── TopBar.jsx                 # Header bar with search, settings, actions
            ├── ChatArea.jsx               # Message display + welcome screen
            ├── Message.jsx                # Single message + markdown renderer
            ├── ChatInput.jsx              # Text input + prompt templates
            ├── SettingsModal.jsx          # System prompt + personas
            ├── SearchModal.jsx            # Search conversations
            └── TemplatesModal.jsx         # Prompt templates library
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `N` | New chat (when not typing) |
| `Ctrl + K` | Open search |
| `Enter` | Send message |
| `Shift + Enter` | New line in message |

---

## 🔒 Privacy

- **Your database** — all conversations stored in your own MongoDB instance
- **Per-user isolation** — each browser session gets its own scoped user ID
- **No tracking** — zero analytics, no third-party telemetry
- **Open source** — read every line of code yourself
- **Groq API** — only the message content is sent to Groq for inference; no conversation history is stored by Groq beyond the request

---

## 🤝 Contributing

Contributions are welcome!

```bash
# Fork the repo, then:
git clone https://github.com/yourusername/synid-ai.git
git checkout -b feature/your-feature-name
# make your changes
git commit -m "Add: your feature description"
git push origin feature/your-feature-name
# Open a Pull Request
```

### Ideas for contributions
- [ ] User authentication (JWT login/signup)
- [ ] Multiple chat folders / workspaces
- [ ] Voice input / text-to-speech output
- [ ] RAG — chat with your own PDF documents
- [ ] Web search tool integration
- [ ] Mobile app (React Native)
- [ ] Docker Compose setup
- [ ] Streaming abort / stop generation button

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 🙏 Built With

- [Groq](https://groq.com) — ultra-fast LLM inference API
- [Meta Llama](https://llama.meta.com) — open-source AI models
- [MongoDB](https://mongodb.com) — database
- [React](https://react.dev) — UI framework
- [Express](https://expressjs.com) — backend framework

---

<div align="center">

**Made with ❤️ by Arun Pratap Singh**

⭐ Star this repo if you found it useful!

</div>