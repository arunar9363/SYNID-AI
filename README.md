<div align="center">

<img src="client/public/assets/synidailogo.png" alt="SYNID AI logo" width="72" />

# SYNID AI

An AI chat workspace with private browser history, custom personas, searchable conversations, and streaming replies powered by Groq.

</div>

## Run locally

Use Node.js 22.12 or later, MongoDB, and a [Groq API key](https://console.groq.com/keys). Install the dependency versions recorded in the lockfiles.

```sh
npm run install-all
```

Create `server/.env` using `server/.env.example` and fill in `MONGODB_URI` and `GROQ_API_KEY`. Existing `GROQ_API_KEY_1` through `GROQ_API_KEY_5` settings are also supported.

Run these commands in separate terminals from the repository root.

```sh
npm run dev --prefix server
npm run dev --prefix client
```

Open `http://localhost:3000` to start chatting. Vite forwards `/api` to the local API on port 5000. If you change the backend port, update the proxy target in `client/vite.config.js`.

## Chat features

- Stream replies and stop an in-progress response. Failed or stopped turns leave saved history intact.
- Rename, pin, search, delete, or export your chats as Markdown or JSON.
- Edit a message to create a new chat from that point. Retry the latest answer to replace it in the current chat.
- Save custom instructions and personas in your browser session. Prompts and recent chat context are sent to Groq for inference.

GPT-OSS 120B and GPT-OSS 20B are the default choices. Set `GROQ_CHAT_MODELS` to a comma-separated list of chat model IDs to customize the menu. Set `DEFAULT_MODEL` to a model from that list. Groq publishes availability and deprecation dates in its [model documentation](https://console.groq.com/docs/models).

## Browser sessions and saved history

Opening SYNID AI starts or resumes a browser session. A server-issued HttpOnly cookie identifies the session, and the server checks ownership for every chat and persona. Production also uses HTTPS and Secure cookies. People using the same browser profile share its history. A different browser profile or clearing the site’s cookies starts a separate history. The session lasts up to a year and renews with continued visits.

One browser with a still-valid session from the sign-in version can carry forward the account’s existing chats and personas. Records from the older browser-ID version require independently verified ownership before they can be assigned to a browser session.

## API endpoints

History, persona, and chat routes require the browser session cookie.

| Method | Path | Action |
| --- | --- | --- |
| `GET` | `/api/health` | Check MongoDB readiness |
| `POST`, `GET` | `/api/session` | Start, resume, or confirm the current browser session |
| `GET` | `/api/models` | List configured chat models |
| `GET`, `POST`, `DELETE` | `/api/conversations` | List, create, or clear chat history |
| `GET`, `PATCH`, `DELETE` | `/api/conversations/:id` | Open, update, or delete a chat |
| `PATCH` | `/api/conversations/:id/pin` | Toggle pinning |
| `DELETE` | `/api/conversations/:id/messages` | Clear messages in one chat |
| `GET` | `/api/conversations/:id/export?format=markdown` | Download Markdown or JSON |
| `GET` | `/api/search?q=…` | Search owned chat titles and messages |
| `POST` | `/api/chat` | Stream a reply and confirm when the turn is saved |
| `GET`, `POST` | `/api/personas` | List or create custom personas |
| `DELETE` | `/api/personas/:id` | Delete a custom persona |

## Deploy with one HTTPS origin

Serve the bundled React app and `/api` from one origin so that the browser can use first-party session cookies. For a Render web service, use the repository root, `npm run install-all && npm run build` as the build command, `npm start` as the start command, and `/api/health` as the health check path. Express serves `client/dist`.

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Connection string for the application database |
| `GROQ_API_KEY` | A Groq API key |
| `APP_ORIGIN` | Public HTTPS origin, such as `https://chat.example.com` |
| `TRUST_PROXY_HOPS` | Number of trusted reverse-proxy hops, when explicitly known |

Use the hosting platform’s `PORT` value. The frontend calls `/api` on the current origin, so a separate static host must forward that path on the same origin if used.

## Verify

```sh
npm test
npm run build
```

The integration tests use local MongoDB at `127.0.0.1:27017` and create a disposable database. Set `TEST_MONGODB_URI` if your local MongoDB uses another port. The tests use fake Groq replies and verify browser-session isolation across listing, reading, search, export, mutation, and chat generation.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `N` | Start a new chat when focus is outside an input |
| `Ctrl+K` or `Cmd+K` | Search chats |
| `Enter` | Send a message |
| `Shift+Enter` | Add a line break |

## License

[MIT License](LICENSE). Made by Arun Pratap Singh.
