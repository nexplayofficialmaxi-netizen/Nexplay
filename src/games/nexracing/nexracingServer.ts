import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Express } from 'express';
import { WebSocketServer, WebSocket } from 'ws';

interface StoredUser {
  username: string;
  usernameLower: string;
  salt: string;
  hash: string;
  createdAt: number;
}

interface DriverInfo {
  id: string;
  name: string;
  carId: string;
  number: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  pattern: string;
  doorStyle?: string;
  wheelStyle?: string;
  ready: boolean;
  isHost: boolean;
}

interface Room {
  code: string;
  name: string;
  circuitId: string;
  laps: number;
  freeRoam: boolean;
  fillWithAi: boolean;
  status: 'lobby' | 'racing';
  drivers: Map<string, DriverInfo>;
  sockets: Map<string, WebSocket>;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'nexracing-users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'nexracing-sessions.json');
const USERDATA_FILE = path.join(DATA_DIR, 'nexracing-userdata.json');

const usersByLower = new Map<string, StoredUser>();
const sessions = new Map<string, string>();
const userDataByLower = new Map<string, Record<string, unknown>>();
const rooms = new Map<string, Room>();

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const list = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) as StoredUser[];
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
      const entries = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8')) as Array<[string, string]>;
      if (Array.isArray(entries)) {
        for (const [tok, uname] of entries) {
          if (tok && uname) sessions.set(tok, uname);
        }
      }
    }
  } catch {
    // ignore corrupt cache
  }
  try {
    if (fs.existsSync(USERDATA_FILE)) {
      const obj = JSON.parse(fs.readFileSync(USERDATA_FILE, 'utf8')) as Record<
        string,
        Record<string, unknown>
      >;
      if (obj && typeof obj === 'object') {
        for (const [k, v] of Object.entries(obj)) {
          if (v && typeof v === 'object') userDataByLower.set(k, v);
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

function saveUserData() {
  try {
    ensureDataDir();
    const out: Record<string, Record<string, unknown>> = {};
    for (const [k, v] of userDataByLower.entries()) {
      out[k] = v;
    }
    fs.writeFileSync(USERDATA_FILE, JSON.stringify(out));
  } catch {
    // ignore read-only fs errors
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, user: StoredUser): boolean {
  const derived = crypto.scryptSync(password, user.salt, 64);
  const stored = Buffer.from(user.hash, 'hex');
  if (derived.length !== stored.length) return false;
  return crypto.timingSafeEqual(derived, stored);
}

loadUsers();

function makeCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? makeCode() : code;
}

function serializeRoom(room: Room) {
  return {
    code: room.code,
    name: room.name,
    circuitId: room.circuitId,
    laps: room.laps,
    freeRoam: room.freeRoam,
    fillWithAi: room.fillWithAi,
    status: room.status,
    drivers: Array.from(room.drivers.values()),
  };
}

function broadcastRoom(room: Room, payload: unknown, excludeId?: string) {
  const msg = JSON.stringify(payload);
  for (const [id, ws] of room.sockets.entries()) {
    if (id !== excludeId && ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

function broadcastRoomList(wss: WebSocketServer) {
  const publicRooms = Array.from(rooms.values()).map(serializeRoom);
  const msg = JSON.stringify({ type: 'rooms:list', rooms: publicRooms });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

export function registerNexRacingBackend(app: Express): WebSocketServer {
  app.post('/api/nexracing/auth/register', (req, res) => {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    const confirmPassword = String(req.body?.confirmPassword || '');

    if (username.length < 3 || username.length > 20) {
      res.status(400).json({ error: 'El nombre debe tener entre 3 y 20 caracteres.' });
      return;
    }
    if (password.length < 4) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres.' });
      return;
    }
    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Las contraseñas no coinciden.' });
      return;
    }

    const lower = username.toLowerCase();
    if (usersByLower.has(lower)) {
      res.status(409).json({ error: 'Ese nombre de piloto ya existe. Inicia sesión o elige otro.' });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(password, salt);
    const user: StoredUser = {
      username,
      usernameLower: lower,
      salt,
      hash,
      createdAt: Date.now(),
    };
    usersByLower.set(lower, user);
    saveUsers();

    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, user.username);
    saveSessions();
    res.json({ token, user: { username: user.username } });
  });

  app.post('/api/nexracing/auth/login', (req, res) => {
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');

    const user = usersByLower.get(username.toLowerCase());
    if (!user || !verifyPassword(password, user)) {
      res.status(401).json({ error: 'Nombre de usuario o contraseña incorrectos.' });
      return;
    }

    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, user.username);
    saveSessions();
    res.json({
      token,
      user: { username: user.username },
      savedData: userDataByLower.get(user.usernameLower) || null,
    });
  });

  app.get('/api/nexracing/auth/me', (req, res) => {
    const auth = String(req.headers.authorization || '');
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    const username = token ? sessions.get(token) : undefined;
    if (!username) {
      res.status(401).json({ error: 'Sesión no válida o expirada.' });
      return;
    }
    res.json({
      user: { username },
      savedData: userDataByLower.get(username.toLowerCase()) || null,
    });
  });

  app.get('/api/nexracing/user/data', (req, res) => {
    const auth = String(req.headers.authorization || '');
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    const username = token ? sessions.get(token) : undefined;
    if (!username) {
      res.status(401).json({ error: 'Sesión no válida.' });
      return;
    }
    res.json({ data: userDataByLower.get(username.toLowerCase()) || null });
  });

  app.put('/api/nexracing/user/data', (req, res) => {
    const auth = String(req.headers.authorization || '');
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    const username = token ? sessions.get(token) : undefined;
    if (!username) {
      res.status(401).json({ error: 'Debes iniciar sesión para guardar en la nube.' });
      return;
    }
    const payload = req.body && typeof req.body === 'object' ? { ...req.body } : {};
    const updatedAt = Date.now();
    payload.updatedAt = updatedAt;
    userDataByLower.set(username.toLowerCase(), payload);
    saveUserData();
    res.json({ ok: true, updatedAt });
  });

  app.post('/api/nexracing/auth/logout', (req, res) => {
    const auth = String(req.headers.authorization || '');
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (token) {
      sessions.delete(token);
      saveSessions();
    }
    res.json({ ok: true });
  });

  app.get('/api/nexracing/rooms', (_req, res) => {
    res.json({ rooms: Array.from(rooms.values()).map(serializeRoom) });
  });

  app.get('/api/nexracing/proxy-image', async (req, res) => {
    const rawUrl = String(req.query.url || '').trim();
    if (!rawUrl || (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://'))) {
      res.status(400).json({ error: 'URL inválida' });
      return;
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      const upstream = await fetch(rawUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 NexRacing-TextureLoader' },
      });
      clearTimeout(timer);
      if (!upstream.ok) {
        res.status(502).json({ error: 'No se pudo descargar la imagen' });
        return;
      }
      const ctype = upstream.headers.get('content-type') || 'image/jpeg';
      if (!ctype.startsWith('image/')) {
        res.status(400).json({ error: 'El enlace no apunta a una imagen' });
        return;
      }
      const buf = Buffer.from(await upstream.arrayBuffer());
      if (buf.byteLength > 5 * 1024 * 1024) {
        res.status(413).json({ error: 'Imagen demasiado pesada (máx 5MB)' });
        return;
      }
      res.setHeader('Content-Type', ctype);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(buf);
    } catch {
      res.status(502).json({ error: 'Error al obtener la imagen' });
    }
  });

  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws) => {
    const clientId = `drv-${Math.random().toString(36).slice(2, 9)}`;
    let currentRoomCode: string | null = null;
    let authedUsername: string | null = null;

    ws.send(
      JSON.stringify({
        type: 'connected',
        clientId,
        rooms: Array.from(rooms.values()).map(serializeRoom),
      }),
    );

    const leaveCurrentRoom = () => {
      if (!currentRoomCode) return;
      const room = rooms.get(currentRoomCode);
      if (!room) {
        currentRoomCode = null;
        return;
      }
      room.drivers.delete(clientId);
      room.sockets.delete(clientId);

      if (room.drivers.size === 0) {
        rooms.delete(currentRoomCode);
      } else {
        const remaining = Array.from(room.drivers.values());
        if (!remaining.some((d) => d.isHost) && remaining[0]) {
          remaining[0].isHost = true;
        }
        broadcastRoom(room, { type: 'room:state', room: serializeRoom(room) });
      }
      currentRoomCode = null;
      broadcastRoomList(wss);
    };

    ws.on('message', (raw) => {
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(String(raw));
      } catch {
        return;
      }

      const type = String(data.type || '');

      if (type === 'auth:verify') {
        const token = String(data.token || '');
        const user = sessions.get(token);
        if (user) {
          authedUsername = user;
          ws.send(JSON.stringify({ type: 'auth:ok', username: user }));
        } else {
          authedUsername = null;
          ws.send(JSON.stringify({ type: 'room:error', message: 'Debes iniciar sesión para jugar online.' }));
        }
        return;
      }

      if (type === 'room:create') {
        const token = String(data.token || '');
        const tokenUser = token ? sessions.get(token) : undefined;
        const verifiedName = authedUsername || tokenUser;
        if (!verifiedName) {
          ws.send(JSON.stringify({ type: 'room:error', message: 'Debes iniciar sesión con tu cuenta para crear una sala online.' }));
          return;
        }
        authedUsername = verifiedName;
        leaveCurrentRoom();
        const code = makeCode();
        const driver = data.driver as DriverInfo;
        const isFreeRoam = Boolean(data.freeRoam);
        const room: Room = {
          code,
          name: String(data.roomName || (isFreeRoam ? `Libre ${code}` : `Sala ${code}`)).slice(0, 28),
          circuitId: String(data.circuitId || 'daytona-superspeedway'),
          laps: isFreeRoam ? 0 : Math.max(2, Math.min(20, Number(data.laps || 5))),
          freeRoam: isFreeRoam,
          fillWithAi: Boolean(data.fillWithAi ?? true),
          status: 'lobby',
          drivers: new Map(),
          sockets: new Map(),
        };
        const cleanDriver: DriverInfo = {
          ...driver,
          id: clientId,
          name: verifiedName,
          ready: true,
          isHost: true,
        };
        room.drivers.set(clientId, cleanDriver);
        room.sockets.set(clientId, ws);
        rooms.set(code, room);
        currentRoomCode = code;

        if (data.autoStart) {
          room.status = 'racing';
          ws.send(JSON.stringify({ type: 'room:joined', room: serializeRoom(room), clientId }));
          ws.send(
            JSON.stringify({
              type: 'race:started',
              room: serializeRoom(room),
              startAt: Date.now() + 300,
            }),
          );
        } else {
          ws.send(JSON.stringify({ type: 'room:joined', room: serializeRoom(room), clientId }));
        }
        broadcastRoomList(wss);
      } else if (type === 'room:join') {
        const token = String(data.token || '');
        const tokenUser = token ? sessions.get(token) : undefined;
        const verifiedName = authedUsername || tokenUser;
        if (!verifiedName) {
          ws.send(JSON.stringify({ type: 'room:error', message: 'Debes iniciar sesión con tu cuenta para unirte a una sala online.' }));
          return;
        }
        authedUsername = verifiedName;

        const code = String(data.code || '').toUpperCase().trim();
        const room = rooms.get(code);
        if (!room) {
          ws.send(JSON.stringify({ type: 'room:error', message: 'Sala no encontrada.' }));
          return;
        }
        if (room.drivers.size >= 12) {
          ws.send(JSON.stringify({ type: 'room:error', message: 'La sala está llena.' }));
          return;
        }
        if (room.status === 'racing' && !room.freeRoam) {
          ws.send(JSON.stringify({ type: 'room:error', message: 'La carrera ya comenzó. Prueba una sala en Carrera Libre.' }));
          return;
        }
        leaveCurrentRoom();
        const driver = data.driver as DriverInfo;
        const cleanDriver: DriverInfo = {
          ...driver,
          id: clientId,
          name: verifiedName,
          ready: true,
          isHost: false,
        };
        room.drivers.set(clientId, cleanDriver);
        room.sockets.set(clientId, ws);
        currentRoomCode = code;

        ws.send(JSON.stringify({ type: 'room:joined', room: serializeRoom(room), clientId }));
        if (room.status === 'racing' && room.freeRoam) {
          ws.send(
            JSON.stringify({
              type: 'race:started',
              room: serializeRoom(room),
              startAt: Date.now() + 200,
            }),
          );
        }
        broadcastRoom(room, { type: 'room:state', room: serializeRoom(room) }, clientId);
        broadcastRoomList(wss);
      } else if (type === 'room:leave') {
        leaveCurrentRoom();
        ws.send(JSON.stringify({ type: 'room:left' }));
      } else if (type === 'room:update') {
        if (!currentRoomCode) return;
        const room = rooms.get(currentRoomCode);
        if (!room) return;
        const me = room.drivers.get(clientId);
        if (!me || !me.isHost) return;
        if (data.circuitId) room.circuitId = String(data.circuitId);
        if (typeof data.freeRoam === 'boolean') {
          room.freeRoam = data.freeRoam;
          room.laps = room.freeRoam ? 0 : Math.max(2, Math.min(20, Number(data.laps || room.laps || 5)));
        } else if (data.laps && !room.freeRoam) {
          room.laps = Math.max(2, Math.min(20, Number(data.laps)));
        }
        if (typeof data.fillWithAi === 'boolean') room.fillWithAi = data.fillWithAi;
        broadcastRoom(room, { type: 'room:state', room: serializeRoom(room) });
        broadcastRoomList(wss);
      } else if (type === 'room:ready') {
        if (!currentRoomCode) return;
        const room = rooms.get(currentRoomCode);
        if (!room) return;
        const me = room.drivers.get(clientId);
        if (!me) return;
        me.ready = Boolean(data.ready);
        broadcastRoom(room, { type: 'room:state', room: serializeRoom(room) });
      } else if (type === 'race:start') {
        if (!currentRoomCode) return;
        const room = rooms.get(currentRoomCode);
        if (!room) return;
        const me = room.drivers.get(clientId);
        if (!me || !me.isHost) return;
        room.status = 'racing';
        broadcastRoom(room, {
          type: 'race:started',
          room: serializeRoom(room),
          startAt: Date.now() + 500,
        });
        broadcastRoomList(wss);
      } else if (type === 'race:telemetry') {
        if (!currentRoomCode) return;
        const room = rooms.get(currentRoomCode);
        if (!room) return;
        broadcastRoom(
          room,
          {
            type: 'race:car',
            packet: {
              ...(data.packet as Record<string, unknown>),
              id: clientId,
            },
          },
          clientId,
        );
      } else if (type === 'race:end') {
        if (!currentRoomCode) return;
        const room = rooms.get(currentRoomCode);
        if (!room) return;
        room.status = 'lobby';
        broadcastRoom(room, { type: 'room:state', room: serializeRoom(room) });
        broadcastRoomList(wss);
      }
    });

    ws.on('close', () => {
      leaveCurrentRoom();
    });
  });

  return wss;
}
