import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Globe,
  Lock,
  LogOut,
  Play,
  Plus,
  RefreshCw,
  Send,
  UserCheck,
  Users,
} from 'lucide-react';
import { CIRCUITS, getCircuitById } from '../data/circuits';
import { useI18n } from '../utils/i18n';
import {
  CarConfig,
  CircuitId,
  OnlineRoomPlayer,
  OnlineServerInfo,
  RaceSessionConfig,
  UserAccount,
} from '../types/game';

interface OnlineLobbyViewProps {
  playerId: string;
  carConfig: CarConfig;
  authUser: UserAccount | null;
  onAuthSuccess: (user: UserAccount) => void;
  onAuthLogout: () => void;
  onStartOnlineRace: (
    session: RaceSessionConfig,
    ws: WebSocket,
    initialCountdown: { lights: number; go: boolean } | null
  ) => void;
}

interface ChatMessage {
  sender: string;
  text: string;
  timestamp: number;
}

export default function OnlineLobbyView({
  playerId,
  carConfig,
  authUser,
  onAuthSuccess,
  onAuthLogout,
  onStartOnlineRace,
}: OnlineLobbyViewProps) {
  const { t } = useI18n();
  // Optional Online Auth state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [servers, setServers] = useState<OnlineServerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('Copa Patagonia Libre');
  const [newCircuit, setNewCircuit] = useState<CircuitId>('coyhaique');
  const [circuitSearch, setCircuitSearch] = useState('');

  const [joinedRoom, setJoinedRoom] = useState<OnlineServerInfo | null>(null);
  const [roomPlayers, setRoomPlayers] = useState<OnlineRoomPlayer[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const handedOffToRaceRef = useRef(false);

  const fetchServers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/servers');
      if (!res.ok) throw new Error('Error cargando servidores');
      const data = await res.json();
      setServers(data.servers ?? []);
    } catch {
      setError('No se pudo conectar con la lista de servidores online.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authUser) {
      fetchServers();
    }
  }, [authUser, fetchServers]);

  useEffect(() => {
    return () => {
      if (!handedOffToRaceRef.current && wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (authMode === 'register' && passwordInput !== confirmPasswordInput) {
      setAuthError('Las contraseñas no coinciden.');
      return;
    }

    setAuthLoading(true);
    try {
      const endpoint =
        authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body =
        authMode === 'login'
          ? { username: usernameInput, password: passwordInput }
          : {
              username: usernameInput,
              password: passwordInput,
              confirmPassword: confirmPasswordInput,
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.user) {
        setAuthError(data.error || 'No se pudo iniciar sesión.');
        return;
      }
      onAuthSuccess(data.user as UserAccount);
    } catch {
      setAuthError('Error de conexión con el servidor de cuentas.');
    } finally {
      setAuthLoading(false);
    }
  };

  const connectAndJoin = (serverId: string) => {
    if (!authUser) return;
    setError(null);
    if (wsRef.current) {
      wsRef.current.close();
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
    wsRef.current = ws;
    handedOffToRaceRef.current = false;

    ws.onopen = () => {
      setWsConnected(true);
      ws.send(
        JSON.stringify({
          type: 'room:join',
          roomId: serverId,
          playerId,
          playerName: authUser.username,
          carConfig,
        })
      );
    };

    ws.onmessage = (event) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === 'room:joined' || msg.type === 'room:state') {
        setJoinedRoom(msg.room as OnlineServerInfo);
        const players = (msg.players as OnlineRoomPlayer[]) ?? [];
        setRoomPlayers(players);
        const me = players.find((p) => p.id === playerId);
        if (me) setIsReady(me.ready);
      } else if (msg.type === 'room:error') {
        setError(String(msg.message || 'Error en la sala'));
      } else if (msg.type === 'room:chat') {
        setChatLog((prev) => [
          ...prev.slice(-30),
          {
            sender: String(msg.sender),
            text: String(msg.text),
            timestamp: Number(msg.timestamp) || Date.now(),
          },
        ]);
      } else if (msg.type === 'race:starting') {
        const room = msg.room as OnlineServerInfo;
        const players = (msg.players as OnlineRoomPlayer[]) ?? [];
        handedOffToRaceRef.current = true;
        onStartOnlineRace(
          {
            mode: 'online',
            circuitId: room.circuitId,
            laps: room.laps,
            difficulty: 'pro',
            roomId: room.id,
            isOnlineHost: players.some((p) => p.id === playerId && p.isHost),
            onlinePlayers: players,
          },
          ws,
          null
        );
      }
    };

    ws.onerror = () => {
      setError('Error de conexión WebSocket con el servidor.');
    };

    ws.onclose = () => {
      setWsConnected(false);
    };
  };

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    try {
      const res = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          circuitId: newCircuit,
          laps: 3, // Official 3-lap format
          hostName: authUser.username,
        }),
      });
      const data = await res.json();
      if (data.server) {
        setShowCreate(false);
        await fetchServers();
        connectAndJoin(data.server.id);
      }
    } catch {
      setError('No se pudo crear el servidor.');
    }
  };

  const handleLeaveRoom = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'room:leave' }));
      wsRef.current.close();
    }
    wsRef.current = null;
    setJoinedRoom(null);
    setRoomPlayers([]);
    setChatLog([]);
    fetchServers();
  };

  const handleToggleReady = () => {
    const next = !isReady;
    setIsReady(next);
    wsRef.current?.send(JSON.stringify({ type: 'room:ready', ready: next }));
  };

  const handleStartRace = () => {
    wsRef.current?.send(JSON.stringify({ type: 'room:start' }));
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: 'room:chat', text }));
    setChatInput('');
  };

  // Optional Login Gate — required ONLY for Online Mode
  if (!authUser) {
    return (
      <div className="mx-auto max-w-[1440px] px-6 py-12 flex justify-center">
        <div className="w-full max-w-md rounded-xl border border-white/15 bg-[#0F141C] p-7 space-y-6">
          <div className="space-y-2 text-center">
            <div className="mx-auto w-11 h-11 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-sky-400" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">
              {t.online.loginTitle}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Puedes jugar Carrera Rápida, Modo Carrera, Contrarreloj y Garaje
              sin iniciar sesión. Para competir en servidores multijugador
              online, inicia sesión o crea tu licencia de piloto.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#080B10] p-1 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthError(null);
              }}
              className={`rounded-md py-2 text-xs font-semibold cursor-pointer ${
                authMode === 'login'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.online.loginTab}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setAuthError(null);
              }}
              className={`rounded-md py-2 text-xs font-semibold cursor-pointer ${
                authMode === 'register'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.online.registerTab}
            </button>
          </div>

          {authError && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-200">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                {t.online.username}
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={24}
                placeholder="Ej. MaxiPatagonia"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-[#080B10] px-3.5 py-2.5 text-sm text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                {t.online.password}
              </label>
              <input
                type="password"
                required
                minLength={4}
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-[#080B10] px-3.5 py-2.5 text-sm text-white"
              />
            </div>

            {authMode === 'register' && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  {t.online.repeatPassword}
                </label>
                <input
                  type="password"
                  required
                  minLength={4}
                  placeholder="••••••••"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-[#080B10] px-3.5 py-2.5 text-sm text-white"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-lg bg-rose-600 py-3 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {authLoading
                ? '...'
                : authMode === 'login'
                  ? t.online.loginBtn
                  : t.online.registerBtn}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredCircuitsForCreate = CIRCUITS.filter((c) => {
    const q = circuitSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      `#${c.index}`.includes(q)
    );
  }).slice(0, 40);

  const amIHost = roomPlayers.some((p) => p.id === playerId && p.isHost);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Servidores Multijugador Online
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Salas en tiempo real (3 vueltas · hasta 9 pilotos) · Sesión
            iniciada como{' '}
            <span className="text-sky-400 font-semibold">
              {authUser.username}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
            <UserCheck className="w-4 h-4" />
            <span>{authUser.username}</span>
          </div>

          {!joinedRoom && (
            <>
              <button
                type="button"
                onClick={onAuthLogout}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cerrar Sesión
              </button>
              <button
                type="button"
                onClick={fetchServers}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#0F141C] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-[#17202D] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Actualizar</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCreate((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Servidor</span>
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
          {error}
        </div>
      )}

      {showCreate && !joinedRoom && (
        <form
          onSubmit={handleCreateServer}
          className="rounded-xl border border-white/15 bg-[#0F141C] p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
        >
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">
              Nombre del Servidor
            </label>
            <input
              type="text"
              required
              maxLength={38}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#080B10] px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">
              Buscar entre 900 Pistas
            </label>
            <input
              type="text"
              placeholder="Filtrar circuito..."
              value={circuitSearch}
              onChange={(e) => setCircuitSearch(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#080B10] px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">
              Circuito (3 Vueltas)
            </label>
            <select
              value={newCircuit}
              onChange={(e) => setNewCircuit(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#080B10] px-3 py-2 text-sm text-white"
            >
              {filteredCircuitsForCreate.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.index} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 cursor-pointer"
            >
              Abrir Sala
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {!joinedRoom ? (
        <div className="rounded-xl border border-white/10 bg-[#0F141C] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Buscando servidores activos...
            </div>
          ) : servers.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No hay servidores disponibles. Crea uno nuevo para iniciar.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {servers.map((srv) => {
                const circuit = getCircuitById(srv.circuitId);
                return (
                  <div
                    key={srv.id}
                    className="flex flex-wrap items-center justify-between gap-4 p-5 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <Globe className="w-4 h-4 text-sky-400" />
                        <span className="font-display text-lg font-bold text-white">
                          {srv.name}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2.5">
                        <span>{circuit.name}</span>
                        <span aria-hidden="true">·</span>
                        <span>{srv.laps} vueltas</span>
                        <span aria-hidden="true">·</span>
                        <span>Anfitrión: {srv.hostName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-300">
                          {srv.status === 'waiting'
                            ? 'En espera'
                            : srv.status === 'countdown'
                              ? 'Semáforo activo'
                              : 'En carrera'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="flex items-center gap-1.5 text-xs font-mono-tabular text-slate-200">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>
                          {srv.playerCount}/{srv.maxPlayers}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={srv.playerCount >= srv.maxPlayers}
                        onClick={() => connectAndJoin(srv.id)}
                        className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-40 cursor-pointer whitespace-nowrap"
                      >
                        Unirse a Sala
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 rounded-xl border border-white/10 bg-[#0F141C] p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="text-xs text-sky-400 font-medium">
                  {wsConnected ? 'Conectado en tiempo real' : 'Conectando...'} ·{' '}
                  {getCircuitById(joinedRoom.circuitId).name} ·{' '}
                  {joinedRoom.laps} vueltas
                </div>
                <h2 className="font-display text-2xl font-bold text-white mt-0.5">
                  {joinedRoom.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={handleLeaveRoom}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="text-xs font-medium text-slate-400">
                Pilotos en Parrilla ({roomPlayers.length}/{joinedRoom.maxPlayers})
              </div>
              <div className="space-y-2">
                {roomPlayers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-[#080B10] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3.5 h-3.5 rounded-sm border border-white/20"
                        style={{ backgroundColor: p.carConfig.primaryColor }}
                      />
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {p.name}{' '}
                          {p.id === playerId && (
                            <span className="text-xs font-normal text-sky-400">
                              (Tú)
                            </span>
                          )}
                          {p.isHost && (
                            <span className="ml-2 text-xs font-normal text-amber-400">
                              Anfitrión
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          {p.carConfig.teamName} · #{p.carConfig.driverNumber}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`text-xs font-semibold ${
                        p.ready ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {p.ready ? 'Listo en parrilla' : 'Esperando'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleToggleReady}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                  isReady
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'border border-white/15 bg-[#151D29] text-white hover:bg-[#1D2736]'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{isReady ? 'Listo Confirmado' : 'Marcar Listo'}</span>
              </button>

              {(amIHost || roomPlayers.length === 1) && (
                <button
                  type="button"
                  onClick={handleStartRace}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-rose-500 transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>Iniciar Carrera Online</span>
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-xl border border-white/10 bg-[#0F141C] p-5 flex flex-col h-[380px]">
            <div className="text-sm font-semibold text-white border-b border-white/10 pb-3">
              Radio de Paddock (Chat en vivo)
            </div>
            <div className="flex-1 overflow-y-auto py-3 space-y-2 text-xs">
              {chatLog.length === 0 ? (
                <div className="text-slate-500">
                  Comparte estrategia o coordina la largada con otros pilotos.
                </div>
              ) : (
                chatLog.map((c, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <span className="font-semibold text-sky-400">
                      {c.sender}:{' '}
                    </span>
                    <span className="text-slate-200">{c.text}</span>
                  </div>
                ))
              )}
            </div>
            <form
              onSubmit={handleSendChat}
              className="flex items-center gap-2 pt-3 border-t border-white/10"
            >
              <input
                type="text"
                maxLength={140}
                placeholder="Escribe un mensaje a la sala..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 rounded-lg border border-white/15 bg-[#080B10] px-3 py-2 text-xs text-white"
              />
              <button
                type="submit"
                aria-label="Enviar mensaje"
                className="rounded-lg bg-sky-600 p-2 text-white hover:bg-sky-500 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
