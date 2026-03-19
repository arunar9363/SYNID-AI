# 🤖 SYNID AI — Your Private ChatGPT

A full MERN stack AI chat app that runs **100% locally** on your PC using Ollama.

## Features
- 🔒 **100% Private** — no data leaves your machine
- 💬 **Real-time streaming** — responses stream token by token
- 🎨 **Premium UI** — dark theme, markdown rendering, syntax highlighting
- 🗂️ **Chat history** — all conversations saved in MongoDB
- ✏️ **Auto-titles** — chats get smart titles from first message
- 🔄 **Model switching** — switch Ollama models anytime
- 📋 **Copy buttons** — copy code blocks or full messages
- 📱 **Sidebar toggle** — collapsible sidebar

---

## Prerequisites

1. **Node.js** (v18+) — https://nodejs.org
2. **MongoDB** — https://www.mongodb.com/try/download/community
3. **Ollama** — https://ollama.com

---

## Quick Start

### Step 1 — Install & Start Ollama
```bash
# Windows: download from https://ollama.com
# Then pull a model:
ollama pull llama3.2
ollama serve
```

### Step 2 — Start MongoDB
```bash
# Windows: start MongoDB service from Services
# Or run: mongod
```

### Step 3 — Start the Backend
```bash
cd server
npm install
npm run dev
# Runs on http://localhost:5000
```

### Step 4 — Start the Frontend
```bash
cd client
npm install
npm run dev
# Opens at http://localhost:3000
```

---

## Project Structure

```
ollama-chat/
├── server/
│   ├── index.js        ← Express server + streaming API
│   ├── models.js       ← Mongoose schemas
│   ├── .env            ← Config (port, MongoDB URI, model)
│   └── package.json
│
└── client/
    ├── src/
    │   ├── App.jsx
    │   ├── context/
    │   │   └── ChatContext.jsx   ← Global state
    │   ├── components/
    │   │   ├── Sidebar.jsx       ← Chat history sidebar
    │   │   ├── ChatArea.jsx      ← Message display
    │   │   ├── Message.jsx       ← Markdown + code highlighting
    │   │   └── ChatInput.jsx     ← Input box
    │   └── utils/
    │       └── api.js            ← API calls + SSE streaming
    ├── index.html
    └── vite.config.js
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/models | List all Ollama models |
| GET | /api/conversations | All conversations |
| GET | /api/conversations/:id | Single conversation with messages |
| POST | /api/conversations | Create new conversation |
| PATCH | /api/conversations/:id | Update (rename, pin) |
| DELETE | /api/conversations/:id | Delete one conversation |
| DELETE | /api/conversations | Delete all conversations |
| POST | /api/chat | **Stream chat response** (SSE) |

---

## Recommended Models for Your System (AMD Ryzen 5, 16GB RAM)

| Model | Command | Speed |
|-------|---------|-------|
| llama3.2 (3B) | `ollama pull llama3.2` | ⚡ Fast |
| mistral (7B) | `ollama pull mistral` | 🟡 Medium |
| phi4-mini | `ollama pull phi4-mini` | ⚡ Fast |
| gemma3:2b | `ollama pull gemma3:2b` | ⚡ Fast |
| codellama | `ollama pull codellama` | 🟡 Medium |

---

## Customization

**Change default model** → Edit `server/.env`:
```
DEFAULT_MODEL=mistral
```

**Change MongoDB URI** → Edit `server/.env`:
```
MONGODB_URI=mongodb://localhost:27017/my-chat-app
```

**Add system prompt** → In `server/index.js`, add to `ollamaMessages`:
```js
const ollamaMessages = [
  { role: 'system', content: 'You are a helpful assistant.' },
  ...convo.messages.map(...)
]
```
