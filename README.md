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

**A full-stack AI chat application I built, powered by Groq's ultra-fast inference API.**  
No local hardware required. No subscriptions. Conversations stay private in my own database.

[Features](#-features) • [Quick Start](#-quick-start) • [Models](#-supported-models) • [API Docs](#-api-endpoints) • [Project Structure](#-project-structure)

</div>

---

## 📌 What is SYNID AI?

**SYNID AI** is a self-hosted AI chat application I built using the MERN stack. I integrated [Groq](https://groq.com) to run large language models at high speed — giving a premium ChatGPT-like experience with full control over data and no ongoing costs.

> 💡 I built this for myself as a developer — I wanted the power of AI without sending my data to third-party platforms.

**What makes it different from other AI chat apps:**
- 🔥 **Groq-powered** — blazing fast inference via Groq's API, no local GPU needed
- 🧠 **SYNID AI identity** — the AI always presents itself as SYNID AI, not the underlying model
- 💬 **Chat focused** — clean, distraction-free chat experience
- ☁️ **Cloud-deployable** — I have it running on Render

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
- **Rename & delete** — full control over chat history
- **Pin conversations** — keep important chats at the top
- **Search** — full-text search across all conversations and messages
- **Export** — download any chat as Markdown or JSON
- **Clear messages** — wipe a chat without deleting the conversation

### 🤖 AI Customization
- **System prompts** — set custom instructions per conversation
- **Personas** — built-in AI personalities (Developer, Writer, Teacher, Researcher, Business, Friendly)
- **Custom personas** — create and save my own AI personalities
- **SYNID identity always active** — custom system prompts layer on top of the SYNID AI base identity

### 📝 Input
- **Prompt templates** — 20+ ready-made templates across 5 categories (Coding, Writing, Learning, Analysis, Creative)
- **Welcome screen suggestions** — quick-start suggestion cards on the home screen
- **Character counter** — warns when approaching context limits
- **Auto-resizing textarea** — input grows as you type, up to 220px

### ✏️ Messages
- **Edit messages** — fix any user message and replay the conversation from that point
- **Regenerate responses** — get a fresh answer with one click
- **Copy message** — copy full message or individual code blocks
- **React to messages** — thumbs up / thumbs down rating

### 🎨 UI & UX
- **SYNID branded dark theme** — deep navy palette matched to the SYNID AI logo
- **Mobile responsive** — works on phones and tablets with collapsible sidebar
- **Live token counter** — estimated context window usage in real time
- **Keyboard shortcuts** — `N` new chat · `Ctrl+K` search
- **Per-user isolation** — each browser gets a unique `userId` via localStorage

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite | Fast, modern UI |
| Styling | Pure CSS + CSS Variables | No heavy CSS framework |
| Markdown | react-markdown + remark-gfm | GitHub-flavored markdown |
| Syntax | react-syntax-highlighter | Code blocks |
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

I use this `start.bat` file in the project root to launch everything at once:

```bat
@echo off
echo Starting SYNID AI...
start "Backend" cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 3
start "Frontend" cmd /k "cd /d %~dp0client && npm run dev"
timeout /t 4
start http://localhost:3000
```

---

## ☁️ Deploying to Render

I deployed SYNID AI on [Render](https://render.com). Here's how I set it up:

### Backend (Web Service)
1. Pushed `server/` to GitHub
2. Created a new **Web Service** on Render
3. Build command: `npm install`
4. Start command: `node index.js`
5. Environment variables:
   - `MONGODB_URI` — MongoDB Atlas connection string
   - `GROQ_API_KEY` — Groq API key
   - `PORT` — `5000`

### Frontend (Static Site)
1. Pushed `client/` to GitHub
2. Created a new **Static Site** on Render
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Environment variable:
   - `VITE_API_URL` — backend Render URL (e.g. `https://synid-ai.onrender.com`)

---

## ⚙️ Configuration

All server config lives in `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/synid-ai
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
DEFAULT_MODEL=llama-3.3-70b-versatile
```

### MongoDB Atlas (Cloud Database)

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/synid-ai
```

### Frontend API URL

In `client/.env`:

```env
VITE_API_URL=https://your-backend.onrender.com
```

---

## 🧠 Supported Models

All models run via Groq's API — no local download needed.

| Model | Best For |
|-------|----------|
| `llama-3.3-70b-versatile` | ⭐ Best overall — coding and everyday tasks |
| `meta-llama/llama-4-maverick-17b-128e-instruct` | 🚀 Most capable — complex reasoning |
| `meta-llama/llama-4-scout-17b-16e-instruct` | ⚡ Fast — chat and long inputs |
| `qwen-qwq-32b` | 🧠 Reasoning — math, logic, and analysis |
| `mixtral-8x7b-32768` | 📚 Long context — large documents |
| `llama-3.1-8b-instant` | ⚡ Ultra-fast — quick answers |
| `gemma2-9b-it` | 🟢 Efficient — general use |
| `deepseek-r1-distill-llama-70b` | 🔬 Deep reasoning |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/models` | List all available Groq models |
| `GET` | `/api/conversations` | Get all conversations |
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

- **My own database** — all conversations stored in my own MongoDB instance
- **Per-user isolation** — each browser session gets its own scoped user ID
- **No tracking** — zero analytics, no third-party telemetry
- **Groq API** — only the message content is sent to Groq for inference

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

</div>