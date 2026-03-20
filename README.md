<div align="center">

# 🤖 SYNID AI

### Your Private AI Assistant — Runs 100% Locally

[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Ollama](https://img.shields.io/badge/Ollama-black?style=flat&logo=ollama&logoColor=white)](https://ollama.com)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)

**A full-stack ChatGPT/Claude alternative powered by Ollama.**
No API keys. No subscriptions. No data leaves your machine. Ever.

[Features](#-features) • [Demo](#-screenshots) • [Quick Start](#-quick-start) • [Tech Stack](#-tech-stack) • [API Docs](#-api-endpoints) • [Contributing](#-contributing)

</div>

---

## 📌 What is SYNID AI?

**SYNID AI** is an open-source, self-hosted AI chat application built with the MERN stack. It connects to [Ollama](https://ollama.com) to run powerful large language models directly on your own hardware — giving you a premium ChatGPT-like experience with complete privacy and zero ongoing cost.

> 💡 Built for developers, students, and privacy-conscious users who want the power of AI without giving their data to big tech companies.

---

## ✨ Features

### 💬 Chat
- **Real-time streaming** — responses appear token by token, just like ChatGPT
- **Full conversation memory** — entire chat history sent as context on every message
- **Auto-generated titles** — AI names each conversation from the first message
- **Multi-model support** — switch between any installed Ollama model instantly
- **Markdown rendering** — headers, tables, blockquotes, lists all render beautifully
- **Syntax highlighting** — 100+ programming languages with one-click copy

### 🗂️ Conversation Management
- **Persistent chat history** — all conversations saved in MongoDB
- **Rename & delete** — full control over your chat history
- **Pin conversations** — keep important chats at the top
- **Search** — full-text search across all conversations and messages
- **Export** — download any chat as Markdown or JSON
- **Clear messages** — wipe a chat without deleting it

### 🤖 AI Customization
- **System prompts** — set custom instructions for any conversation
- **Personas** — 6 built-in AI personalities (Developer, Writer, Teacher, Researcher, Business, Friendly)
- **Custom personas** — create and save your own AI personalities

### 📝 Input
- **Prompt templates** — 20+ ready-made templates across 5 categories (Coding, Writing, Learning, Analysis, Creative)
- **Image upload** — drag & drop, paste, or click to attach images (requires llava model)
- **Multimodal support** — vision AI understands images you send
- **Character counter** — warns when approaching context limits
- **Drag & drop images** — directly onto the chat window

### ✏️ Messages
- **Edit messages** — fix any user message and replay the conversation from that point
- **Regenerate responses** — get a fresh answer with one click
- **Copy message** — copy full message or individual code blocks
- **React to messages** — thumbs up / thumbs down rating

### 🎨 UI & UX
- **Premium dark theme** — deep dark design with smooth animations
- **Mobile responsive** — works on phones and tablets
- **Collapsible sidebar** — maximize writing space
- **Live token counter** — see context window usage in real time
- **Keyboard shortcuts** — `N` new chat · `Ctrl+K` search
- **Generating indicator** — live pulsing badge while AI is thinking

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + Vite | Fast, modern UI |
| Styling | Pure CSS + CSS Variables | No heavy CSS framework needed |
| Markdown | react-markdown + remark-gfm | Full GitHub-flavored markdown |
| Syntax | react-syntax-highlighter | Beautiful code blocks |
| Icons | lucide-react | Clean, consistent icons |
| HTTP | Axios | API calls |
| Backend | Node.js + Express | Lightweight REST API |
| Database | MongoDB + Mongoose | Flexible document storage |
| Streaming | Server-Sent Events (SSE) | Real-time token streaming |
| AI Engine | Ollama | Local LLM runner |

---

## ⚡ Quick Start

### Prerequisites

Make sure you have these installed:

- **Node.js** v18+ → [nodejs.org](https://nodejs.org)
- **MongoDB** → [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
- **Ollama** → [ollama.com](https://ollama.com)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/synid-ai.git
cd synid-ai
```

### 2. Pull an AI model

```bash
ollama pull llama3.2
```

> Ollama auto-starts on Windows after installation. No need to run `ollama serve` manually.

### 3. Start the backend

```bash
cd server
npm install
npm run dev
```

You should see:
```
✅ MongoDB connected
🚀 Server running on http://localhost:5000
```

### 4. Start the frontend

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

### 5. Open in browser

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

## ⚙️ Configuration

All config lives in `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/synid-ai
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_MODEL=llama3.2
```

### Switch to MongoDB Atlas (Cloud)

Replace `MONGODB_URI` with your Atlas connection string for cloud backup:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/synid-ai
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/models` | List all installed Ollama models |
| `GET` | `/api/conversations` | Get all conversations |
| `GET` | `/api/conversations/:id` | Get single conversation with messages |
| `POST` | `/api/conversations` | Create new conversation |
| `PATCH` | `/api/conversations/:id` | Rename or update conversation |
| `DELETE` | `/api/conversations/:id` | Delete one conversation |
| `DELETE` | `/api/conversations` | Delete all conversations |
| `PATCH` | `/api/conversations/:id/pin` | Pin / unpin conversation |
| `DELETE` | `/api/conversations/:id/messages` | Clear messages in conversation |
| `GET` | `/api/conversations/:id/export` | Export as markdown or JSON |
| `GET` | `/api/search?q=` | Search all conversations |
| `POST` | `/api/chat` | **Stream AI response (SSE)** |
| `GET` | `/api/personas` | List all personas |
| `POST` | `/api/personas` | Create new persona |
| `DELETE` | `/api/personas/:id` | Delete persona |

---

## 📁 Project Structure

```
synid-ai/
│
├── server/
│   ├── index.js              # Express server + all API routes
│   ├── models.js             # Mongoose schemas (Conversation, Persona)
│   ├── .env                  # Environment variables
│   └── package.json
│
└── client/
    ├── src/
    │   ├── App.jsx                        # Root component + keyboard shortcuts
    │   ├── main.jsx                       # React entry point
    │   ├── index.css                      # Global styles + CSS variables
    │   │
    │   ├── context/
    │   │   └── ChatContext.jsx            # Global state management
    │   │
    │   ├── hooks/
    │   │   └── useImageUpload.js          # Image drag/drop/paste logic
    │   │
    │   ├── utils/
    │   │   └── api.js                     # API calls + SSE streaming
    │   │
    │   └── components/
    │       ├── Sidebar.jsx                # Conversation history sidebar
    │       ├── TopBar.jsx                 # Header bar with actions
    │       ├── ChatArea.jsx               # Message display area
    │       ├── Message.jsx                # Single message + markdown
    │       ├── ChatInput.jsx              # Input + image upload + templates
    │       ├── SettingsModal.jsx          # System prompt + personas
    │       ├── SearchModal.jsx            # Search conversations
    │       └── TemplatesModal.jsx         # Prompt templates library
    │
    ├── index.html
    ├── vite.config.js                     # Dev proxy → backend
    └── package.json
```

---

## 🧠 Recommended Models

| Model | Size | Best For | Speed on 16GB RAM |
|-------|------|----------|-------------------|
| `llama3.2` | 2 GB | General chat | ⚡ Fast |
| `phi4-mini` | 2.5 GB | Smart & efficient | ⚡ Fast |
| `gemma3:2b` | 1.6 GB | Quick answers | ⚡ Fast |
| `mistral` | 4.1 GB | Better reasoning | 🟡 Medium |
| `codellama` | 3.8 GB | Coding help | 🟡 Medium |
| `llava` | 4.5 GB | Image understanding | 🟡 Medium |
| `llama3.1:8b` | 4.7 GB | Best quality | 🟡 Medium |

```bash
# Pull any model
ollama pull modelname
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `N` | New chat |
| `Ctrl + K` | Open search |
| `Enter` | Send message |
| `Shift + Enter` | New line in message |

---

## 🔒 Privacy

- **Zero telemetry** — no analytics, no tracking
- **No API keys** — never calls OpenAI, Anthropic, or any external AI service
- **Local LLMs only** — all AI processing happens on your hardware
- **Your MongoDB** — chat history stays in your own database
- **Open source** — read every line of code yourself

---

## 🤝 Contributing

Contributions are welcome! Here's how:

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
- [ ] Multiple chat folders/workspaces
- [ ] Voice input / text-to-speech output
- [ ] RAG — chat with your own PDF documents
- [ ] Plugin/tool system for web search
- [ ] Mobile app (React Native)
- [ ] Docker compose setup

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 🙏 Built With

- [Ollama](https://ollama.com) — local LLM runner
- [Meta Llama](https://llama.meta.com) — open-source AI models
- [MongoDB](https://mongodb.com) — database
- [React](https://react.dev) — UI framework
- [Express](https://expressjs.com) — backend framework

---

<div align="center">

**Made with ❤️ by Arun Pratap Singh**

⭐ Star this repo if you found it useful!

</div>