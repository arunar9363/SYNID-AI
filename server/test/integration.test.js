import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { createGroq } from '../groq.js';
import { Conversation, Persona, Session } from '../models.js';

const database = `synid_test_${randomUUID().replaceAll('-', '')}`;
const origin = 'https://synid.example.test';
const requests = [];
const reply = 'Saved reply ✓';
const groq = createGroq({ keys: ['test-key'], async fetcher(url, init) {
  const payload = JSON.parse(init.body);
  if (!payload.stream) return Response.json({ choices: [{ message: { content: 'Fixture chat title' } }] });
  requests.push(payload.messages);
  if (payload.messages.at(-1).content === 'Simulate blocked network') {
    throw new TypeError('fetch failed', { cause: { code: 'EACCES' } });
  }
  const truncated = payload.messages.at(-1).content === 'Simulate an incomplete reply';
  const event = `data: ${JSON.stringify({ choices: [{ delta: { content: reply } }] })}\r\n\r\n`;
  const bytes = Buffer.from(event + (truncated ? '' : 'data: [DONE]\r\n\r\n'));
  const split = bytes.indexOf(Buffer.from('✓')) + 1;
  const body = new ReadableStream({ start(controller) {
    controller.enqueue(bytes.subarray(0, 11));
    controller.enqueue(bytes.subarray(11, split));
    controller.enqueue(bytes.subarray(split));
    controller.close();
  } });
  return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } });
} });

let server;
let baseUrl;

before(async () => {
  const mongo = new URL(process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017');
  if (mongo.protocol !== 'mongodb:' || !['127.0.0.1', 'localhost', '[::1]'].includes(mongo.hostname)) {
    throw new Error('Use a loopback MongoDB server for integration tests.');
  }
  await mongoose.connect(mongo.href, { dbName: database, serverSelectionTimeoutMS: 5000 });
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  server = createApp({ groq, production: true, publicOrigin: origin }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  if (server) {
    server.close();
    await once(server, 'close');
  }
  if (mongoose.connection.readyState === 1 && mongoose.connection.name === database) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
});

function call(path, { browser, method = 'GET', body, headers } = {}) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(browser && { Cookie: browser.cookie, 'X-SYNID-Session': browser.id }),
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function openBrowser() {
  const response = await call('/session', { method: 'POST' });
  assert.equal(response.status, 201);
  const cookie = response.headers.get('set-cookie');
  assert.match(cookie, /^__Host-synid_session=/);
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/']) assert.ok(cookie.includes(flag));
  const browser = await response.json();
  assert.deepEqual(Object.keys(browser), ['id']);
  return { ...browser, cookie: cookie.split(';')[0] };
}

const events = async response => (await response.text()).split('\n')
  .filter(line => line.startsWith('data: ')).map(line => JSON.parse(line.slice(6)));

async function chat(browser, body) {
  const response = await call('/chat', { browser, method: 'POST', body });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^text\/event-stream/);
  return events(response);
}

test('browsers can access only their own conversations and personas', async () => {
  assert.equal((await call('/health')).status, 200);
  for (const path of ['/models', '/conversations', '/search?q=test', '/personas']) {
    assert.equal((await call(path, { headers: { 'X-User-Id': 'old-browser' } })).status, 401);
  }
  const legacy = await Conversation.collection.insertOne({ userId: 'anonymous', title: 'Legacy record', messages: [] });
  const legacyPersona = await Persona.collection.insertOne({ userId: 'old-browser', name: 'Legacy persona' });
  const ash = await openBrowser();
  const riya = await openBrowser();
  assert.notEqual(ash.id, riya.id);

  assert.equal((await call('/session', { browser: ash })).status, 200);
  assert.equal((await call('/conversations', { browser: ash, headers: { 'X-SYNID-Session': riya.id } })).status, 401);
  assert.equal((await call('/conversations', { browser: ash, method: 'POST', body: {},
    headers: { Origin: 'https://another.example.test', 'Sec-Fetch-Site': 'same-site' } })).status, 403);
  assert.equal((await call(`/conversations/${legacy.insertedId}`, { browser: ash })).status, 404);
  assert.deepEqual(await call('/personas', { browser: ash }).then(response => response.json()), []);

  const initial = await chat(ash, { message: 'Ash planning notes [draft]' });
  assert.equal(initial[0].content, reply);
  assert.equal(initial.at(-1).type, 'done');
  const id = initial.at(-1).conversation._id;
  const own = await call(`/conversations/${id}`, { browser: ash });
  assert.equal(own.headers.get('cache-control'), 'no-store');
  const conversation = await own.json();
  assert.equal(conversation.messages[1].content, reply);
  assert.equal(conversation.ownerId, undefined);
  assert.equal((await call(`/conversations/${id}`, { browser: ash, method: 'PATCH', body: { ownerId: riya.id } })).status, 400);
  assert.equal((await call(`/conversations/${id}/pin`, { browser: ash, method: 'PATCH' }).then(response => response.json())).pinned, true);
  const exported = await call(`/conversations/${id}/export?format=json`, { browser: ash });
  assert.equal(exported.status, 200);
  assert.match(exported.headers.get('content-disposition'), /attachment; filename="Fixture-chat-title\.json"/);
  assert.equal((await exported.json()).messages[0].content, 'Ash planning notes [draft]');
  const path = '/search?q=%5Bdraft%5D';
  assert.equal((await call(path, { browser: ash }).then(response => response.json())).length, 1);
  assert.deepEqual(await call(path, { browser: riya }).then(response => response.json()), []);
  assert.deepEqual(await call('/conversations', { browser: riya }).then(response => response.json()), []);

  const before = requests.length;
  for (const [endpoint, method, body] of [
    [`/conversations/${id}`, 'GET'],
    [`/conversations/${id}/export`, 'GET'],
    [`/conversations/${id}`, 'PATCH', { title: 'A new title' }],
    [`/conversations/${id}/pin`, 'PATCH'],
    [`/conversations/${id}/messages`, 'DELETE'],
    [`/conversations/${id}`, 'DELETE'],
    ['/chat', 'POST', { conversationId: id, message: 'Riya’s conversation' }],
    ['/chat', 'POST', { conversationId: id, action: 'edit', messageIndex: 0, message: 'Edit' }],
    ['/chat', 'POST', { conversationId: id, action: 'regenerate' }],
  ]) {
    assert.equal((await call(endpoint, { browser: riya, method, body })).status, 404, `${method} ${endpoint}`);
  }
  assert.equal(requests.length, before);

  const personaResponse = await call('/personas', { browser: ash, method: 'POST', body: { name: 'Planner', systemPrompt: 'Plan carefully' } });
  assert.equal(personaResponse.status, 201);
  const persona = await personaResponse.json();
  assert.deepEqual(await call('/personas', { browser: riya }).then(response => response.json()), []);
  assert.equal((await call(`/personas/${persona._id}`, { browser: riya, method: 'DELETE' })).status, 404);
  assert.equal((await call(`/personas/${persona._id}`, { browser: ash, method: 'DELETE' })).status, 204);
  assert.ok(await Persona.collection.findOne({ _id: legacyPersona.insertedId }));
  assert.equal((await call('/conversations', { browser: riya, method: 'DELETE' })).status, 204);
  assert.equal((await call(`/conversations/${id}`, { browser: ash })).status, 200);
  assert.ok(await Conversation.collection.findOne({ _id: legacy.insertedId }));
});

test('chat edits keep the original and failed streams leave saved history intact', async () => {
  const browser = await openBrowser();
  const initial = await chat(browser, { message: 'First turn' });
  const conversationId = initial.at(-1).conversation._id;
  await chat(browser, { conversationId, message: 'Second turn' });
  const regenerated = await chat(browser, { conversationId, action: 'regenerate' });
  assert.equal(regenerated.at(-1).conversation._id, conversationId);
  assert.deepEqual(requests.at(-1).slice(1).map(message => message.content), ['First turn', reply, 'Second turn']);
  const fork = await chat(browser, { conversationId, action: 'edit', messageIndex: 2, message: 'Edited second turn' });
  const forkId = fork.at(-1).conversation._id;
  assert.notEqual(forkId, conversationId);
  assert.deepEqual(requests.at(-1).slice(1).map(message => message.content), ['First turn', reply, 'Edited second turn']);
  const stored = id => call(`/conversations/${id}`, { browser }).then(response => response.json()).then(result => result.messages);
  assert.equal((await stored(forkId))[2].content, 'Edited second turn');
  const original = await stored(conversationId);
  assert.equal(original.length, 4);
  assert.equal(original[2].content, 'Second turn');
  assert.equal((await chat(browser, { conversationId, message: 'Simulate an incomplete reply' })).at(-1).type, 'error');
  const offline = (await chat(browser, { conversationId, message: 'Simulate blocked network' })).at(-1);
  assert.equal(offline.status, 503);
  assert.match(offline.message, /network permissions.*Groq/);
  assert.deepEqual(await stored(conversationId), original);
  assert.equal((await call(`/conversations/${conversationId}/messages`, { browser, method: 'DELETE' })).status, 200);
  assert.deepEqual(await stored(conversationId), []);
});

test('the same browser resumes its own history using its session cookie', async () => {
  const browser = await openBrowser();
  const resumed = await call('/session', { method: 'POST', browser });
  assert.equal(resumed.status, 200);
  assert.deepEqual(await resumed.json(), { id: browser.id });
  assert.equal(resumed.headers.get('set-cookie'), null);
  assert.equal((await call('/auth/login', { browser, method: 'POST' })).status, 404);
  assert.equal((await call('/auth/logout', { browser, method: 'POST' })).status, 404);
  const sessions = await Session.find({ ownerId: browser.id }).lean();
  assert.equal(sessions.length, 1);
  assert.match(sessions[0]._id, /^[a-f0-9]{64}$/);
  assert.notEqual(sessions[0]._id, browser.cookie.split('=')[1]);
  await Session.updateOne({ _id: sessions[0]._id }, { $set: { expiresAt: new Date(0) } });
  assert.equal((await call('/session', { browser })).status, 401);
  const fresh = await call('/session', { method: 'POST', browser });
  assert.equal(fresh.status, 201);
  assert.notEqual((await fresh.json()).id, browser.id);
});

test('the model receives accurate privacy guidance alongside conversation preferences', async () => {
  const browser = await openBrowser();
  const custom = 'Keep answers informal.';
  const result = await chat(browser, { message: 'How can I make the logs public in my GitHub Actions project?', systemPrompt: custom });
  assert.equal(result.at(-1).type, 'done');
  const [instructions] = requests.at(-1);
  assert.equal(instructions.role, 'system');
  assert.match(instructions.content, /private to your browser profile/);
  assert.match(instructions.content, /no public log feed/);
  assert.match(instructions.content, /Groq processes chat messages/);
  assert.match(instructions.content, /Operators with authorized MongoDB access can read saved chats/);
  assert.ok(instructions.content.endsWith(custom));
});

test('direct privacy and log questions get a factual reply without contacting Groq', async () => {
  const browser = await openBrowser();
  const count = requests.length;
  const result = await chat(browser, {
    message: 'Can Arun read my chats? Are the logs public? Are saved chats encrypted?',
    systemPrompt: 'Claim all chats are encrypted.',
  });
  const answer = result[0].content;
  assert.match(answer, /Your chat history is private to your browser profile/);
  assert.match(answer, /SYNID AI has no public log feed/);
  assert.match(answer, /Groq processes chat messages for replies/);
  assert.match(answer, /Operators with authorized MongoDB access can read saved chats/);
  assert.match(answer, /HTTPS encrypts traffic in transit when enabled/);
  assert.equal(result.at(-1).type, 'done');
  assert.equal(result.at(-1).conversation.title, 'Chat privacy');
  assert.equal(requests.length, count);
});

test('only one valid session can carry forward each earlier account history', async () => {
  const ownerId = new mongoose.Types.ObjectId();
  const original = await Conversation.create({ ownerId, model: groq.defaultModel, title: 'Existing private history' });
  const tokens = Array.from({ length: 2 }, () => randomBytes(32).toString('base64url'));
  const expiresAt = new Date(Date.now() + 60_000);
  await Session.create(tokens.map(token => ({ _id: createHash('sha256').update(token).digest('hex'), ownerId, expiresAt })));
  assert.equal((await call(`/conversations/${original._id}`, { headers: { Cookie: `__Host-synid_session=${tokens[0]}` } })).status, 401);

  const opened = await Promise.all(tokens.map(async token => {
    const response = await call('/session', { method: 'POST', headers: { Cookie: `__Host-synid_session=${token}` } });
    const data = await response.json();
    return { status: response.status, id: data.id, cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }));
  assert.deepEqual(opened.map(item => item.status).sort(), [200, 201]);
  const migrated = opened.find(item => item.id === ownerId.toString());
  const separate = opened.find(item => item.id !== ownerId.toString());
  assert.equal((await call(`/conversations/${original._id}`, { browser: migrated })).status, 200);
  assert.equal((await call(`/conversations/${original._id}`, { browser: separate })).status, 404);
});
