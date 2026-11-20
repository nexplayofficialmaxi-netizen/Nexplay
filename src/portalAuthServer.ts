import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {Express} from 'express';

interface PortalUser {
  id: string;
  username: string;
  usernameLower: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'portal-users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'portal-sessions.json');

const usersByLower = new Map<string, PortalUser>();
const sessions = new Map<string, {id: string; username: string}>();

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {recursive: true});
  }
}

function loadStore() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const list = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) as PortalUser[];
      if (Array.isArray(list)) {
        for (const u of list) {
          if (u && u.usernameLower) usersByLower.set(u.usernameLower, u);
        }
      }
    }
  } catch {
    // ignore corrupt cache
  }
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const entries = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8')) as Array<
        [string, {id: string; username: string}]
      >;
      if (Array.isArray(entries)) {
        for (const [token, user] of entries) {
          if (token && user?.username) sessions.set(token, user);
        }
      }
    }
  } catch {
    // ignore corrupt cache
  }
}

function saveUsers() {
  try {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify(Array.from(usersByLower.values()), null, 2));
  } catch {
    // ignore read-only fs errors
  }
}

function saveSessions() {
  try {
    ensureDataDir();
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(Array.from(sessions.entries())));
  } catch {
    // ignore read-only fs errors
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function registerPortalAuthBackend(app: Express): void {
  loadStore();

  app.post('/api/portal/auth/register', (req, res) => {
    const {username, password, confirmPassword} = req.body ?? {};
    const cleanUser = String(username || '')
      .trim()
      .slice(0, 24);
    const cleanPass = String(password || '');
    const cleanConfirm = confirmPassword !== undefined ? String(confirmPassword) : cleanPass;

    if (cleanUser.length < 2 || cleanPass.length < 4) {
      res.status(400).json({
        error: 'Ingresa un nombre de usuario (mín. 2 caracteres) y contraseña (mín. 4 caracteres).',
      });
      return;
    }

    if (cleanPass !== cleanConfirm) {
      res.status(400).json({error: 'Las contraseñas no coinciden.'});
      return;
    }

    const lower = cleanUser.toLowerCase();
    if (usersByLower.has(lower)) {
      res.status(409).json({error: 'Ese nombre de usuario ya está registrado en NexPlay.'});
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(cleanPass, salt);
    const user: PortalUser = {
      id: `np-${crypto.randomUUID()}`,
      username: cleanUser,
      usernameLower: lower,
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    usersByLower.set(lower, user);
    saveUsers();

    const token = crypto.randomBytes(24).toString('hex');
    const sessionUser = {id: user.id, username: user.username};
    sessions.set(token, sessionUser);
    saveSessions();

    res.json({token, user: sessionUser});
  });

  app.post('/api/portal/auth/login', (req, res) => {
    const {username, password} = req.body ?? {};
    const cleanUser = String(username || '').trim();
    const cleanPass = String(password || '');

    const user = usersByLower.get(cleanUser.toLowerCase());
    if (!user) {
      res.status(401).json({error: 'Usuario o contraseña incorrectos.'});
      return;
    }

    const attempted = hashPassword(cleanPass, user.salt);
    if (attempted !== user.passwordHash) {
      res.status(401).json({error: 'Usuario o contraseña incorrectos.'});
      return;
    }

    const token = crypto.randomBytes(24).toString('hex');
    const sessionUser = {id: user.id, username: user.username};
    sessions.set(token, sessionUser);
    saveSessions();

    res.json({token, user: sessionUser});
  });

  app.get('/api/portal/auth/me', (req, res) => {
    const auth = req.headers.authorization?.replace('Bearer ', '') || '';
    const sessionUser = sessions.get(auth);
    if (!sessionUser) {
      res.status(401).json({error: 'Sesión no válida'});
      return;
    }
    res.json({user: sessionUser});
  });

  app.post('/api/portal/auth/logout', (req, res) => {
    const auth = req.headers.authorization?.replace('Bearer ', '') || '';
    if (auth && sessions.has(auth)) {
      sessions.delete(auth);
      saveSessions();
    }
    res.json({ok: true});
  });
}
