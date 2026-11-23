import { createHash, randomBytes } from 'node:crypto';
import { Types } from 'mongoose';
import { RateLimit, Session } from './models.js';
import { handle, HttpError } from './http.js';

const day = 24 * 60 * 60 * 1000;
const sessionLifetime = 365 * day;
const hash = value => createHash('sha256').update(value).digest('hex');
const invalidSession = 'Your browser session changed. Reopen SYNID AI to continue.';

export async function limitRequest(res, group, key, limit, windowMs) {
  const expires = Math.floor(Date.now() / windowMs) * windowMs + windowMs;
  const _id = hash(`${group}:${expires}:${key}`);
  const update = { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(expires) } };
  let entry;
  try {
    entry = await RateLimit.findOneAndUpdate({ _id }, update, { upsert: true, new: true }).lean();
  } catch (error) {
    if (error.code !== 11000) throw error;
    entry = await RateLimit.findOneAndUpdate({ _id }, update, { new: true }).lean();
  }
  if (!entry || entry.count > limit) {
    res.set('Retry-After', String(Math.max(1, Math.ceil((expires - Date.now()) / 1000))));
    throw new HttpError(429, 'Too many requests. Try again in a moment.');
  }
}

function activeToken(token) {
  return { _id: hash(token), expiresAt: { $gt: new Date() } };
}

async function promoteSession(session, expiresAt) {
  try {
    // A single still-valid sign-in session can carry forward each previous account's history.
    return await Session.findOneAndUpdate(
      { _id: session._id, expiresAt: { $gt: new Date() } },
      { $set: { browser: true, expiresAt } },
      { new: true },
    ).lean();
  } catch (error) {
    if (error.code === 11000) return null;
    throw error;
  }
}

export function createBrowserSessions({ secureCookies }) {
  const cookieName = secureCookies ? '__Host-synid_session' : 'synid_session';
  const cookieOptions = { httpOnly: true, secure: secureCookies, sameSite: 'lax', path: '/', maxAge: sessionLifetime };

  function readToken(req) {
    const cookies = (req.get('cookie') || '').split(';').map(cookie => cookie.trim());
    const matches = cookies.filter(cookie => cookie.startsWith(`${cookieName}=`));
    if (matches.length !== 1) return null;
    const token = matches[0].slice(cookieName.length + 1);
    return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
  }

  const open = handle(async (req, res) => {
    let token = readToken(req);
    let session = token && await Session.findOne(activeToken(token)).lean();
    const expiresAt = new Date(Date.now() + sessionLifetime);

    if (session?.ownerId && (!session.browser || session.expiresAt < new Date(Date.now() + 335 * day))) {
      session = await promoteSession(session, expiresAt);
      if (session) res.cookie(cookieName, token, cookieOptions);
    }
    if (session?.ownerId && session.browser) {
      return res.json({ id: session.ownerId.toString() });
    }

    await limitRequest(res, 'new-browser-ip', req.ip, 30, 15 * 60 * 1000);
    token = randomBytes(32).toString('base64url');
    const ownerId = new Types.ObjectId();
    await Session.create({ _id: hash(token), ownerId, browser: true, expiresAt });
    res.cookie(cookieName, token, cookieOptions).status(201).json({ id: ownerId.toString() });
  });

  const requireSession = handle(async (req, res, next) => {
    const token = readToken(req);
    const session = token && await Session.findOne({ ...activeToken(token), browser: true }).select('ownerId').lean();
    const expectedOwner = req.get('x-synid-session');
    if (!session?.ownerId || (expectedOwner !== undefined && expectedOwner !== session.ownerId.toString())) {
      throw new HttpError(401, invalidSession);
    }
    req.session = session;
    next();
  });

  return { open, requireSession };
}
