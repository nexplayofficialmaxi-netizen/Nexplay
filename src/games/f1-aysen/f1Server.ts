import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Express } from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import type {
  CarConfig,
  CircuitId,
  LeaderboardEntry,
  OnlineRoomPlayer,
  OnlineServerInfo,
} from './types/game.js';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'standings.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

interface StoredUser {
  id: string;
  username: string;
  email?: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
}

interface ServerRoom {
  id: string;
  name: string;
  circuitId: CircuitId;
  laps: number;
  maxPlayers: number;
  status: 'waiting' | 'countdown' | 'racing';
  hostId: string;
  hostName: string;
  persistent: boolean;
  players: Map<
    string,
    {
      id: string;
      name: string;
      carConfig: CarConfig;
      ready: boolean;
      isHost: boolean;
      ws: WebSocket;
      finished: boolean;
      finishTimeMs: number | null;
    }
  >;
  countdownTimers: NodeJS.Timeout[];
}

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'seed-1',
    driverName: 'M. Valdivia',
    teamName: 'Austral Aero Racing',
    circuitId: 'coyhaique',
    lapTimeMs: 31420,
    tireCompound: 'soft',
    mode: 'timetrial',
    points: 25,
    createdAt: '2026-11-10T14:00:00.000Z',
  },
  {
    id: 'seed-2',
    driverName: 'C. Bahamonde',
    teamName: 'Andes Scuderia',
    circuitId: 'puerto_aysen',
    lapTimeMs: 34850,
    tireCompound: 'soft',
    mode: 'career',
    points: 18,
    createdAt: '2026-11-11T16:30:00.000Z',
  },
  {
    id: 'seed-3',
    driverName: 'V. Ojeda',
    teamName: 'Fiordo Motorsport',
    circuitId: 'cerro_castillo',
    lapTimeMs: 38290,
    tireCompound: 'medium',
    mode: 'quickrace',
    points: 15,
    createdAt: '2026-11-12T11:20:00.000Z',
  },
  {
    id: 'seed-4',
    driverName: 'T. Alarcón',
    teamName: 'Coyhaique Velocity',
    circuitId: 'lago_general_carrera',
    lapTimeMs: 35610,
    tireCompound: 'soft',
    mode: 'timetrial',
    points: 12,
    createdAt: '2026-11-13T18:10:00.000Z',
  },
];

function loadJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    }
  } catch {
    // ignore
  }
  return fallback;
}

function saveJsonFile(filePath: string, data: unknown): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch {
    // ignore on read-only fs
  }
}

let leaderboard: LeaderboardEntry[] = loadJsonFile(
  DATA_FILE,
  DEFAULT_LEADERBOARD
);
if (leaderboard.length === 0) leaderboard = [...DEFAULT_LEADERBOARD];

const users: StoredUser[] = loadJsonFile(USERS_FILE, []);
const sessions = new Map<string, { id: string; username: string }>();

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

const rooms = new Map<string, ServerRoom>();

function createRoom(params: {
  id: string;
  name: string;
  circuitId: CircuitId;
  laps: number;
  maxPlayers?: number;
  hostName?: string;
  persistent?: boolean;
}): ServerRoom {
  const room: ServerRoom = {
    id: params.id,
    name: params.name,
    circuitId: params.circuitId,
    laps: params.laps,
    maxPlayers: params.maxPlayers ?? 9,
    status: 'waiting',
    hostId: '',
    hostName: params.hostName ?? 'NexPlay Oficial',
    persistent: params.persistent ?? false,
    players: new Map(),
    countdownTimers: [],
  };
  rooms.set(room.id, room);
  return room;
}

createRoom({
  id: 'aysen-patagonia-sur',
  name: 'Servidor Patagonia Sur · Coyhaique',
  circuitId: 'coyhaique',
  laps: 3,
  maxPlayers: 9,
  hostName: 'NexPlay Dedicated',
  persistent: true,
});
createRoom({
  id: 'aysen-rio-ibanez',
  name: 'Copa Puente Ibáñez · Puerto Aysén',
  circuitId: 'puerto_aysen',
  laps: 3,
  maxPlayers: 9,
  hostName: 'NexPlay Dedicated',
  persistent: true,
});
createRoom({
  id: 'aysen-carretera-austral',
  name: 'Desafío Carretera Austral · Cerro Castillo',
  circuitId: 'cerro_castillo',
  laps: 3,
  maxPlayers: 9,
  hostName: 'NexPlay Dedicated',
  persistent: true,
});

function serializeRoomInfo(room: ServerRoom): OnlineServerInfo {
  return {
    id: room.id,
    name: room.name,
    circuitId: room.circuitId,
    laps: room.laps,
    maxPlayers: room.maxPlayers,
    playerCount: room.players.size,
    status: room.status,
    hostName: room.hostName,
  };
}

function serializeRoomPlayers(room: ServerRoom): OnlineRoomPlayer[] {
  return Array.from(room.players.values()).map((p) => ({
    id: p.id,
    name: p.name,
    carConfig: p.carConfig,
    ready: p.ready,
    isHost: p.isHost,
  }));
}

function broadcastToRoom(room: ServerRoom, msg: unknown, excludeId?: string) {
  const data = JSON.stringify(msg);
  for (const p of room.players.values()) {
    if (excludeId && p.id === excludeId) continue;
    if (p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(data);
    }
  }
}

function clearRoomTimers(room: ServerRoom) {
  room.countdownTimers.forEach((t) => clearTimeout(t));
  room.countdownTimers = [];
}

function removePlayerFromRoom(playerId: string, roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  const existed = room.players.delete(playerId);
  if (!existed) return;

  if (room.players.size === 0) {
    clearRoomTimers(room);
    room.status = 'waiting';
    if (!room.persistent) {
      rooms.delete(room.id);
      return;
    }
  } else if (room.hostId === playerId) {
    const nextHost = room.players.values().next().value;
    if (nextHost) {
      nextHost.isHost = true;
      room.hostId = nextHost.id;
      room.hostName = nextHost.name;
    }
  }

  broadcastToRoom(room, {
    type: 'room:state',
    room: serializeRoomInfo(room),
    players: serializeRoomPlayers(room),
  });
}

function isValidCircuitId(id: unknown): id is CircuitId {
  if (typeof id !== 'string') return false;
  if (
    id === 'coyhaique' ||
    id === 'puerto_aysen' ||
    id === 'cerro_castillo' ||
    id === 'lago_general_carrera'
  ) {
    return true;
  }
  const match = /^track-(\d+)$/.exec(id);
  if (!match) return false;
  const n = Number(match[1]);
  return n >= 5 && n <= 900;
}

export function registerF1Backend(app: Express): WebSocketServer {
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'f1-simulador-aysen', activeRooms: rooms.size });
  });

  app.post('/api/auth/register', (req, res) => {
    const { username, password, confirmPassword } = req.body ?? {};
    const cleanUser = String(username || '').trim().slice(0, 24);
    const cleanPass = String(password || '');
    const cleanConfirm =
      confirmPassword !== undefined ? String(confirmPassword) : cleanPass;

    if (cleanUser.length < 2 || cleanPass.length < 4) {
      res.status(400).json({
        error: 'Ingresa un nombre de piloto (mín. 2 caracteres) y contraseña (mín. 4 caracteres).',
      });
      return;
    }

    if (cleanPass !== cleanConfirm) {
      res.status(400).json({
        error: 'Las contraseñas no coinciden.',
      });
      return;
    }

    if (users.some((u) => u.username.toLowerCase() === cleanUser.toLowerCase())) {
      res.status(409).json({ error: 'Ese nombre de piloto ya está registrado.' });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(cleanPass, salt);
    const newUser: StoredUser = {
      id: `usr-${crypto.randomUUID()}`,
      username: cleanUser,
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    saveJsonFile(USERS_FILE, users);

    const token = crypto.randomBytes(24).toString('hex');
    const sessionUser = { id: newUser.id, username: newUser.username };
    sessions.set(token, sessionUser);

    res.json({ user: { ...sessionUser, token } });
  });

  app.post('/api/auth/login', (req, res) => {
    const { username, identifier, password } = req.body ?? {};
    const idStr = String(username ?? identifier ?? '').trim().toLowerCase();
    const passStr = String(password || '');

    const user = users.find(
      (u) =>
        u.username.toLowerCase() === idStr ||
        (u.email && u.email.toLowerCase() === idStr)
    );
    if (!user) {
      res.status(401).json({ error: 'Nombre de piloto o contraseña incorrectos.' });
      return;
    }

    const attempted = hashPassword(passStr, user.salt);
    if (attempted !== user.passwordHash) {
      res.status(401).json({ error: 'Nombre de piloto o contraseña incorrectos.' });
      return;
    }

    const token = crypto.randomBytes(24).toString('hex');
    const sessionUser = { id: user.id, username: user.username };
    sessions.set(token, sessionUser);
    res.json({ user: { ...sessionUser, token } });
  });

  app.get('/api/auth/me', (req, res) => {
    const auth = req.headers.authorization?.replace('Bearer ', '') || '';
    const session = sessions.get(auth);
    if (!session) {
      res.status(401).json({ error: 'Sesión no válida' });
      return;
    }
    res.json({ user: { ...session, token: auth } });
  });

  app.get('/api/leaderboard', (req, res) => {
    const circuit = req.query.circuit as string | undefined;
    const filtered =
      circuit && circuit !== 'all'
        ? leaderboard.filter((e) => e.circuitId === circuit)
        : leaderboard;
    const sorted = [...filtered].sort((a, b) => a.lapTimeMs - b.lapTimeMs);
    res.json({ entries: sorted.slice(0, 50) });
  });

  app.post('/api/leaderboard/lap', (req, res) => {
    const { driverName, teamName, circuitId, lapTimeMs, tireCompound, mode, points } =
      req.body ?? {};
    if (
      typeof driverName !== 'string' ||
      !isValidCircuitId(circuitId) ||
      typeof lapTimeMs !== 'number' ||
      lapTimeMs < 10000 ||
      lapTimeMs > 600000
    ) {
      res.status(400).json({ error: 'Datos de vuelta inválidos' });
      return;
    }

    const entry: LeaderboardEntry = {
      id: `lap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      driverName: driverName.trim().slice(0, 24) || 'Piloto Aysén',
      teamName: String(teamName || 'NexPlay Patagonia GP').slice(0, 32),
      circuitId,
      lapTimeMs: Math.round(lapTimeMs),
      tireCompound: tireCompound || 'soft',
      mode: mode || 'quickrace',
      points: Number(points) || 0,
      createdAt: new Date().toISOString(),
    };

    leaderboard.push(entry);
    leaderboard.sort((a, b) => a.lapTimeMs - b.lapTimeMs);
    leaderboard = leaderboard.slice(0, 150);
    saveJsonFile(DATA_FILE, leaderboard);

    res.json({ ok: true, entry, entries: leaderboard.slice(0, 50) });
  });

  app.get('/api/servers', (_req, res) => {
    const list = Array.from(rooms.values()).map(serializeRoomInfo);
    res.json({ servers: list });
  });

  app.post('/api/servers', (req, res) => {
    const { name, circuitId, laps, hostName } = req.body ?? {};
    const safeCircuit = isValidCircuitId(circuitId) ? circuitId : 'coyhaique';
    const safeLaps = Math.max(1, Math.min(10, Number(laps) || 3));
    const safeName =
      typeof name === 'string' && name.trim().length > 0
        ? name.trim().slice(0, 42)
        : `Sala Aysén ${Math.floor(100 + Math.random() * 899)}`;

    const id = `srv-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    const room = createRoom({
      id,
      name: safeName,
      circuitId: safeCircuit,
      laps: safeLaps,
      hostName: String(hostName || 'Piloto Local').slice(0, 24),
      persistent: false,
    });
    res.json({ server: serializeRoomInfo(room) });
  });

  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws) => {
    let clientId = `drv-${Math.random().toString(36).slice(2, 9)}`;
    let currentRoomId: string | null = null;

    ws.on('message', (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      const type = msg.type as string;

      if (type === 'room:join') {
        const roomId = String(msg.roomId || '');
        const room = rooms.get(roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: 'room:error', message: 'Servidor no encontrado' }));
          return;
        }
        if (room.players.size >= room.maxPlayers) {
          ws.send(JSON.stringify({ type: 'room:error', message: 'Servidor lleno' }));
          return;
        }
        if (currentRoomId && currentRoomId !== roomId) {
          removePlayerFromRoom(clientId, currentRoomId);
        }

        if (typeof msg.playerId === 'string' && msg.playerId.length > 0) {
          clientId = msg.playerId;
        }

        const isHost = room.players.size === 0 || !room.hostId;
        if (isHost) {
          room.hostId = clientId;
          room.hostName = String(msg.playerName || 'Piloto').slice(0, 24);
        }

        room.players.set(clientId, {
          id: clientId,
          name: String(msg.playerName || 'Piloto').slice(0, 24),
          carConfig: msg.carConfig as CarConfig,
          ready: false,
          isHost,
          ws,
          finished: false,
          finishTimeMs: null,
        });
        currentRoomId = roomId;

        ws.send(
          JSON.stringify({
            type: 'room:joined',
            playerId: clientId,
            room: serializeRoomInfo(room),
            players: serializeRoomPlayers(room),
          })
        );

        broadcastToRoom(
          room,
          {
            type: 'room:state',
            room: serializeRoomInfo(room),
            players: serializeRoomPlayers(room),
          },
          clientId
        );
      } else if (type === 'room:leave' && currentRoomId) {
        removePlayerFromRoom(clientId, currentRoomId);
        currentRoomId = null;
      } else if (type === 'room:ready' && currentRoomId) {
        const room = rooms.get(currentRoomId);
        const player = room?.players.get(clientId);
        if (!room || !player) return;
        player.ready = Boolean(msg.ready);
        broadcastToRoom(room, {
          type: 'room:state',
          room: serializeRoomInfo(room),
          players: serializeRoomPlayers(room),
        });
      } else if (type === 'room:chat' && currentRoomId) {
        const room = rooms.get(currentRoomId);
        const player = room?.players.get(clientId);
        if (!room || !player) return;
        const text = String(msg.text || '').trim().slice(0, 140);
        if (!text) return;
        broadcastToRoom(room, {
          type: 'room:chat',
          sender: player.name,
          text,
          timestamp: Date.now(),
        });
      } else if (type === 'room:start' && currentRoomId) {
        const room = rooms.get(currentRoomId);
        const player = room?.players.get(clientId);
        if (!room || !player || room.status !== 'waiting') return;
        if (!player.isHost && room.players.size > 1) return;

        room.status = 'countdown';
        for (const p of room.players.values()) {
          p.finished = false;
          p.finishTimeMs = null;
        }
        clearRoomTimers(room);

        broadcastToRoom(room, {
          type: 'race:starting',
          room: serializeRoomInfo(room),
          players: serializeRoomPlayers(room),
        });

        for (let light = 1; light <= 5; light++) {
          const t = setTimeout(() => {
            broadcastToRoom(room, {
              type: 'race:countdown',
              lights: light,
              go: false,
            });
          }, light * 750);
          room.countdownTimers.push(t);
        }

        const goTimer = setTimeout(() => {
          room.status = 'racing';
          broadcastToRoom(room, {
            type: 'race:countdown',
            lights: 0,
            go: true,
          });
        }, 4400);
        room.countdownTimers.push(goTimer);
      } else if (type === 'player:state' && currentRoomId) {
        const room = rooms.get(currentRoomId);
        if (!room) return;
        broadcastToRoom(
          room,
          {
            type: 'player:state',
            playerId: clientId,
            state: msg.state,
          },
          clientId
        );
      } else if (type === 'player:finished' && currentRoomId) {
        const room = rooms.get(currentRoomId);
        const player = room?.players.get(clientId);
        if (!room || !player) return;
        player.finished = true;
        player.finishTimeMs = Number(msg.finishTimeMs) || 0;

        const allFinished = Array.from(room.players.values()).every(
          (p) => p.finished
        );
        if (allFinished) {
          room.status = 'waiting';
          for (const p of room.players.values()) {
            p.ready = false;
          }
          broadcastToRoom(room, {
            type: 'room:state',
            room: serializeRoomInfo(room),
            players: serializeRoomPlayers(room),
          });
        }
      }
    });

    ws.on('close', () => {
      if (currentRoomId) {
        removePlayerFromRoom(clientId, currentRoomId);
        currentRoomId = null;
      }
    });
  });

  return wss;
}
