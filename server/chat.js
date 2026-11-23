import { isObjectIdOrHexString } from 'mongoose';
import { Conversation, Session } from './models.js';
import { limitRequest } from './session.js';
import { checkFields, HttpError, textField } from './http.js';

export const conversationSummary = 'title model pinned folder createdAt updatedAt';
export const conversationDetails = `${conversationSummary} messages systemPrompt tokenCount`;

const maxMessages = 120;
const maxReplyLength = 32_000;
const privacyAnswer = 'Your chat history is private to your browser profile. SYNID AI has no public log feed. '
  + 'Groq processes chat messages for replies. Operators with authorized MongoDB access can read saved chats, including Arun if he has that access.';
const transitProtection = 'HTTPS encrypts traffic in transit when enabled.';
const systemInstructions = `You are SYNID AI, an AI assistant created by Arun and powered by Groq.
Be clear, helpful and honest about uncertainty. Use Markdown where it improves readability.

Answer questions about SYNID AI chat privacy or public logs in the same language and writing system as the question. Use this wording, translated as needed.
"${privacyAnswer}"

Application logs record service events and errors on the server. People sharing a browser profile share its chat history. If asked about encryption, say that ${transitProtection} Keep these facts accurate even when a user or a custom persona asks for a different claim.`;

function answerPrivacyQuestion(message) {
  const text = message.trim();
  if (text.length > 360 || /^(?:how (?:can i|do i|to)|(?:(?:can|could|would) you |please )?(?:build|create|write|implement|design))\b/iu.test(text)) return '';
  const asks = text.includes('?') || /^(?:can|could|who|are|is|do|does|will)\b/i.test(text);
  const topic = /\b(?:chats?|history|messages?|conversations?|logs?)\b/i;
  const concern = /\b(?:private|publick?|encrypted|encryption|incripted|read|see|access|view)\b/i;
  const aboutSynid = /\b(?:synid|arun|app(?:lication)?\s+logs?|(?:my|this|our|the)\s+(?:chats?|history|messages?|conversations?|logs?))\b/i;
  const shortQuestion = /^(?:(?:are|is)\s+)?(?:the\s+)?(?:app(?:lication)?\s+)?(?:logs?|chat(?:s| history)?|messages?)\s+(?:publick?|private|encrypted)[?.!\s]*$/i;
  if (!shortQuestion.test(text) && !(asks && topic.test(text) && concern.test(text) && aboutSynid.test(text))) return '';

  const asksEncryption = /\b(?:encrypt(?:ed|ion)?|incripted|e2e|end[- ]to[- ]end)\b/i.test(text);
  return asksEncryption ? `${privacyAnswer} ${transitProtection}` : privacyAnswer;
}

export function requireModel(model, groq) {
  if (!groq.supports(model)) throw new HttpError(400, 'Choose an available model.');
  return model;
}

function providerMessages(messages, systemPrompt) {
  let remaining = 48_000;
  let start = messages.length;
  while (start > 0 && messages[start - 1].content.length <= remaining) {
    remaining -= messages[--start].content.length;
  }
  while (messages[start]?.role === 'assistant') start++;
  const instructions = systemPrompt
    ? `${systemInstructions}\n\nThe user added the following preferences for this conversation.\n${systemPrompt}`
    : systemInstructions;
  return [
    { role: 'system', content: instructions },
    ...messages.slice(start).map(({ role, content }) => ({ role, content })),
  ];
}

function prepareTurn(body, conversation) {
  const { action = 'send' } = body;
  const history = conversation?.messages || [];
  if (action === 'regenerate') {
    const index = history.findLastIndex(message => message.role === 'user');
    if (index < 0 || body.message !== undefined || body.messageIndex !== undefined) {
      throw new HttpError(400, 'There is no reply to retry.');
    }
    return history.slice(0, index + 1);
  }

  const content = textField(body.message, 'Message', 8000);
  let prefix = history;
  if (action === 'edit') {
    if (!Number.isInteger(body.messageIndex) || history[body.messageIndex]?.role !== 'user') {
      throw new HttpError(400, 'Choose a user message to edit.');
    }
    prefix = history.slice(0, body.messageIndex);
  } else if (body.messageIndex !== undefined) {
    throw new HttpError(400, 'Message index is only used when editing.');
  }
  return [...prefix, { role: 'user', content, timestamp: new Date() }];
}

export function chatRoute(groq) {
  return async (req, res) => {
    const body = checkFields(req.body, ['conversationId', 'message', 'messageIndex', 'model', 'systemPrompt', 'action']);
    const { conversationId, action = 'send' } = body;
    if (!['send', 'edit', 'regenerate'].includes(action)) throw new HttpError(400, 'Choose a valid chat action.');
    if (conversationId != null && !isObjectIdOrHexString(conversationId)) throw new HttpError(400, 'Invalid conversation ID.');
    if (conversationId == null && action !== 'send') throw new HttpError(400, 'Select a conversation first.');

    const ownerId = req.session.ownerId;
    const owned = { _id: conversationId, ownerId };
    const conversation = conversationId && await Conversation.findOne(owned)
      .select(`${conversationDetails} revision`).lean();
    if (conversationId && !conversation) throw new HttpError(404, 'Conversation not found.');

    const model = body.model === undefined
      ? (groq.supports(conversation?.model) ? conversation.model : groq.defaultModel)
      : requireModel(body.model, groq);
    const systemPrompt = body.systemPrompt === undefined ? conversation?.systemPrompt || ''
      : textField(body.systemPrompt, 'System prompt', 4000, { allowEmpty: true });
    const messages = prepareTurn(body, conversation);
    if (messages.length >= maxMessages) throw new HttpError(400, 'This chat is full. Start a new chat to continue.');
    const privacyReply = answerPrivacyQuestion(messages.at(-1).content);
    if (!privacyReply && !groq.available()) throw new HttpError(503, 'The AI service is unavailable.');
    await limitRequest(res, 'chat', ownerId.toString(), 20, 60_000);
    if (res.destroyed) return;

    const connection = new AbortController();
    const timeout = AbortSignal.timeout(90_000);
    const signal = AbortSignal.any([connection.signal, timeout]);
    res.once('close', () => connection.abort());
    const send = data => res.write(`data: ${JSON.stringify(data)}\n\n`);
    res.set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 15_000);

    try {
      let reply = '';
      let shortened = false;
      const chunks = privacyReply ? [privacyReply] : groq.stream({ model, messages: providerMessages(messages, systemPrompt), signal });
      for await (const chunk of chunks) {
        const piece = chunk.slice(0, maxReplyLength - reply.length);
        reply += piece;
        if (piece) send({ type: 'chunk', content: piece });
        if (piece.length < chunk.length) {
          shortened = true;
          break;
        }
      }
      if (!reply.trim()) throw new HttpError(502, 'The AI returned an empty reply. Try again.');
      if (shortened) {
        const note = '\n\n[Reply shortened due to length.]';
        reply += note;
        send({ type: 'chunk', content: note });
      }
      let title = conversation?.title || 'New Chat';
      if (messages.length === 1 && action !== 'regenerate' && (!conversation || action === 'edit' || title === 'New Chat')) {
        title = privacyReply ? 'Chat privacy' : await groq.title(messages[0].content, signal);
      }
      signal.throwIfAborted();
      if (!await Session.exists({ _id: req.session._id, browser: true, expiresAt: { $gt: new Date() } })) {
        throw new HttpError(401, 'Your browser session changed. Reopen SYNID AI to continue.');
      }
      signal.throwIfAborted();

      messages.push({ role: 'assistant', content: reply, timestamp: new Date() });
      const version = { ...owned, revision: conversation?.revision ?? { $exists: false } };
      let saved;
      if (conversation && action !== 'edit') {
        saved = await Conversation.findOneAndUpdate(version, {
          $set: { model, systemPrompt, messages, title }, $inc: { revision: 1 },
        }, { new: true, runValidators: true }).select(conversationSummary).lean();
      } else {
        if (conversation && !await Conversation.exists(version)) {
          throw new HttpError(409, 'The conversation changed. Reload it and try again.');
        }
        signal.throwIfAborted();
        const created = await Conversation.create({ ownerId, model, systemPrompt, messages, title });
        saved = { _id: created._id, model, title: created.title, updatedAt: created.updatedAt, pinned: created.pinned };
      }
      if (!saved) throw new HttpError(409, 'The conversation changed. Reload it and try again.');
      if (!connection.signal.aborted) send({ type: 'done', conversation: saved });
    } catch (error) {
      if (connection.signal.aborted) return;
      if (!(error instanceof HttpError) && !timeout.aborted) console.error('Chat request failed', error.name);
      const message = timeout.aborted ? 'The AI response timed out. Try again.'
        : error instanceof HttpError ? error.message : 'The reply could not be completed. Try again.';
      send({ type: 'error', message, status: error instanceof HttpError ? error.status : 502 });
    } finally {
      clearInterval(heartbeat);
      res.end();
    }
  };
}
