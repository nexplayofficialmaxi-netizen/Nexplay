import React, { useEffect, useState } from 'react';
import {
  CarCustomization,
  CircuitSpec,
  MultiplayerRoomInfo,
  SavedPlayerData,
  StockCarSpec,
} from '../types/game';
import { CIRCUITS } from '../data/circuits';
import { CircuitMapSvg } from './CircuitMapSvg';
import {
  Users,
  Plus,
  LogIn,
  Play,
  LogOut,
  Check,
  Copy,
  UserPlus,
  Lock,
  ShieldCheck,
  Columns2,
  Link2,
  Infinity as InfinityIcon,
} from 'lucide-react';

interface MultiplayerLobbyProps {
  connected: boolean;
  clientId: string | null;
  rooms: MultiplayerRoomInfo[];
  currentRoom: MultiplayerRoomInfo | null;
  errorMsg: string | null;
  authToken: string | null;
  authUser: { username: string } | null;
  authChecking: boolean;
  initialJoinCode?: string;
  onAuthSuccess: (
    token: string,
    user: { username: string },
    savedData?: SavedPlayerData | null,
  ) => void;
  onLogout: () => void;
  carSpec: StockCarSpec;
  customization: CarCustomization;
  selectedCircuit: CircuitSpec;
  wsRef: React.MutableRefObject<WebSocket | null>;
  onStartSplitScreen: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  connected,
  clientId,
  rooms,
  currentRoom,
  errorMsg,
  authToken,
  authUser,
  authChecking,
  initialJoinCode = '',
  onAuthSuccess,
  onLogout,
  carSpec,
  customization,
  selectedCircuit,
  wsRef,
  onStartSplitScreen,
}) => {
  const [authTab, setAuthTab] = useState<'login' | 'register'>('register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const [roomName, setRoomName] = useState(`Sala ${authUser?.username || 'NexPlay'}`);
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [createFreeRoam, setCreateFreeRoam] = useState(true);

  useEffect(() => {
    if (initialJoinCode) {
      setJoinCode(initialJoinCode.toUpperCase());
    }
  }, [initialJoinCode]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanName = username.trim();
    if (cleanName.length < 3 || cleanName.length > 20) {
      setAuthError('El nombre debe tener entre 3 y 20 caracteres.');
      return;
    }
    if (password.length < 4) {
      setAuthError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (authTab === 'register' && password !== confirmPassword) {
      setAuthError('Las contraseñas no coinciden. Verifica ambos campos.');
      return;
    }

    setAuthBusy(true);
    try {
      const endpoint =
        authTab === 'register'
          ? '/api/nexracing/auth/register'
          : '/api/nexracing/auth/login';
      const body =
        authTab === 'register'
          ? { username: cleanName, password, confirmPassword }
          : { username: cleanName, password };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data?.error || 'No se pudo completar la autenticación.');
        return;
      }
      setRoomName(`Sala ${data.user.username}`);
      setPassword('');
      setConfirmPassword('');
      onAuthSuccess(data.token, data.user, data.savedData || null);
    } catch {
      setAuthError('Error de conexión con el servidor de cuentas.');
    } finally {
      setAuthBusy(false);
    }
  };

  if (authChecking) {
    return (
      <div className="bg-[#111520] border border-white/10 rounded-2xl p-10 text-center">
        <p className="font-display text-2xl font-bold text-white">
          Verificando cuenta de piloto...
        </p>
        <p className="text-sm text-slate-400 mt-1">Conectando con el servidor Aysén NASCAR Online.</p>
      </div>
    );
  }

  // Gate online multiplayer behind account creation / login
  if (!authUser || !authToken) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 bg-[#111520] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
          <div>
            <p className="text-xs font-semibold tracking-wider text-rose-400 mb-1">
              ACCESO MULTIJUGADOR ONLINE
            </p>
            <h2 className="font-display text-3xl font-extrabold text-white">
              CUENTA DE PILOTO AYSÉN NASCAR
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Para competir en salas online necesitas crear una cuenta o iniciar sesión. Los modos individuales siguen libres sin registro.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1 p-1 bg-[#0B0E17] border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setAuthTab('register');
                setAuthError(null);
              }}
              className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                authTab === 'register'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Crear Cuenta</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('login');
                setAuthError(null);
              }}
              className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                authTab === 'login' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </button>
          </div>

          {authError && (
            <div className="rounded-xl bg-red-950/60 border border-red-500/45 px-4 py-3 text-xs text-red-200">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <label className="block text-xs text-slate-400">
              Nombre de Piloto
              <input
                type="text"
                required
                minLength={3}
                maxLength={20}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: PilotoChile99"
                className="mt-1.5 w-full rounded-xl bg-[#0B0E17] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </label>

            <label className="block text-xs text-slate-400">
              Contraseña
              <input
                type="password"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                className="mt-1.5 w-full rounded-xl bg-[#0B0E17] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </label>

            {authTab === 'register' && (
              <label className="block text-xs text-slate-400">
                Repetir Contraseña
                <input
                  type="password"
                  required
                  minLength={4}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Vuelve a escribir tu contraseña"
                  className="mt-1.5 w-full rounded-xl bg-[#0B0E17] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </label>
            )}

            <button
              type="submit"
              disabled={authBusy}
              className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>
                {authBusy
                  ? 'Procesando...'
                  : authTab === 'register'
                  ? 'Crear Cuenta y Entrar Online'
                  : 'Iniciar Sesión y Entrar Online'}
              </span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-6 bg-[#111520] border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="font-display text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              <span>Salas Online Activas ({rooms.length})</span>
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Con tu cuenta Aysén NASCAR podrás crear salas con código de invitación, correr con tu auto personalizado del Garage y competir en vivo contra otros pilotos y bots NASCAR.
            </p>
            <div className="space-y-2.5 pt-2">
              <div className="rounded-xl bg-[#0B0E17] border border-white/10 p-4">
                <p className="text-xs font-semibold text-white">Identidad Única en Pista</p>
                <p className="text-xs text-slate-400 mt-1">
                  Tu nombre de cuenta aparece sobre tu Stock Car y en la tabla oficial de posiciones online.
                </p>
              </div>
              <div className="rounded-xl bg-[#0B0E17] border border-white/10 p-4">
                <p className="text-xs font-semibold text-white">Tu Auto y Pintura Guardados</p>
                <p className="text-xs text-slate-400 mt-1">
                  Auto seleccionado: #{customization.number} · {carSpec.name} ({carSpec.team})
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl bg-[#0B0E17] border border-sky-500/35 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold tracking-wider text-sky-400">
                    MULTIJUGADOR LOCAL · SIN CUENTA
                  </p>
                  <p className="font-display text-lg font-bold text-white">
                    Mitad de Pantalla (2 Jugadores)
                  </p>
                </div>
                <Columns2 className="w-6 h-6 text-sky-400 shrink-0" />
              </div>
              <p className="text-xs text-slate-400">
                P1: <strong className="text-white">W A S D + Espacio</strong> · P2:{' '}
                <strong className="text-white">Flechas + Shift Der.</strong> (misma PC)
              </p>
              <button
                type="button"
                onClick={onStartSplitScreen}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Columns2 className="w-4 h-4 shrink-0" />
                <span>Jugar Mitad de Pantalla en {selectedCircuit.name}</span>
              </button>
            </div>

            <div className="rounded-xl bg-[#0B0E17] border border-white/10 px-4 py-3 flex items-center justify-between text-xs">
              <span className="text-slate-400">Estado del servidor WebSocket</span>
              <span className={connected ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                {connected ? 'En línea' : 'Conectando...'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const buildDriverPayload = () => ({
    id: clientId || 'local',
    name: authUser.username,
    carId: carSpec.id,
    number: customization.number,
    primaryColor: customization.primaryColor,
    secondaryColor: customization.secondaryColor,
    accentColor: customization.accentColor,
    pattern: customization.pattern,
    doorStyle: customization.doorStyle,
    wheelStyle: customization.wheelStyle,
    ready: true,
    isHost: false,
  });

  const send = (obj: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(obj));
    }
  };

  const handleCreate = (autoStart = false, freeRoamFlag = false) => {
    send({
      type: 'room:create',
      token: authToken,
      roomName,
      circuitId: selectedCircuit.id,
      laps: freeRoamFlag ? 0 : selectedCircuit.defaultLaps,
      freeRoam: freeRoamFlag,
      fillWithAi: true,
      autoStart,
      driver: buildDriverPayload(),
    });
  };

  const handleJoin = (code: string) => {
    if (!code.trim()) return;
    send({
      type: 'room:join',
      token: authToken,
      code: code.toUpperCase().trim(),
      driver: buildDriverPayload(),
    });
  };

  const myDriver = currentRoom?.drivers.find((d) => d.id === clientId);
  const isHost = Boolean(myDriver?.isHost);
  const roomCircuit =
    CIRCUITS.find((c) => c.id === currentRoom?.circuitId) || CIRCUITS[0];

  if (currentRoom) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-[#111520] border border-white/10 rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div>
              <p className="text-xs text-slate-400">
                {currentRoom.freeRoam
                  ? 'Carrera Libre Online · Tiempo Infinito (Sin Vueltas)'
                  : 'Sala Online · Código de Invitación'}
              </p>
              <div className="flex flex-wrap items-center gap-2.5 mt-1">
                <h2 className="font-display text-3xl font-extrabold text-white">
                  {currentRoom.name}
                </h2>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(currentRoom.code);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="px-3 py-1 rounded-lg bg-[#090C12] border border-white/15 text-sm font-mono-tabular font-bold text-sky-400 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{currentRoom.code}</span>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/?sala=${currentRoom.code}`;
                    navigator.clipboard?.writeText(url);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 1800);
                  }}
                  className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                  <span>{linkCopied ? 'Link Copiado' : 'Invitar Amigos (Link)'}</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => send({ type: 'room:leave' })}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir de Sala</span>
            </button>
          </div>

          <div className="mt-5">
            <h3 className="text-xs font-semibold tracking-wider text-slate-400 mb-3">
              PILOTOS CONECTADOS ({currentRoom.drivers.length}/12)
            </h3>
            <div className="space-y-2">
              {currentRoom.drivers.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#0B0E17] border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-2.5 h-6 rounded-xs"
                      style={{ backgroundColor: d.primaryColor }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        #{d.number} {d.name}
                        {d.isHost && (
                          <span className="ml-2 text-xs text-amber-400">· Anfitrión</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">
                        {d.id === clientId ? 'Tu Stock Car' : 'Piloto Online'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400">
                    {d.ready ? 'Listo' : 'Esperando'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#111520] border border-white/10 rounded-2xl p-6 space-y-5">
          <div>
            <p className="text-xs text-slate-400 mb-1">Circuito de la Sala</p>
            <h3 className="font-display text-2xl font-bold text-white">
              {roomCircuit.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {roomCircuit.type} · {roomCircuit.lengthKm} km ·{' '}
              {currentRoom.freeRoam ? 'Carrera Libre (Tiempo ∞ · Sin Vueltas)' : `${currentRoom.laps} vueltas`}
            </p>
          </div>

          <div className="bg-[#0B0E17] border border-white/10 rounded-xl p-4">
            <CircuitMapSvg circuit={roomCircuit} className="w-full h-36" />
          </div>

          {isHost && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => send({ type: 'room:update', freeRoam: true })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    currentRoom.freeRoam
                      ? 'bg-sky-600/25 border-sky-400 text-sky-200'
                      : 'bg-[#0B0E17] border-white/10 text-slate-400'
                  }`}
                >
                  <InfinityIcon className="w-3.5 h-3.5" />
                  <span>Carrera Libre (∞)</span>
                </button>
                <button
                  type="button"
                  onClick={() => send({ type: 'room:update', freeRoam: false, laps: 5 })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    !currentRoom.freeRoam
                      ? 'bg-rose-600/25 border-rose-500 text-rose-200'
                      : 'bg-[#0B0E17] border-white/10 text-slate-400'
                  }`}
                >
                  <span>Por Vueltas</span>
                </button>
              </div>

              <label className="block text-xs text-slate-400">
                Cambiar Circuito
                <select
                  value={currentRoom.circuitId}
                  onChange={(e) =>
                    send({ type: 'room:update', circuitId: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl bg-[#0B0E17] border border-white/15 px-3 py-2.5 text-sm text-white"
                >
                  {CIRCUITS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </label>

              {!currentRoom.freeRoam && (
                <label className="block text-xs text-slate-400">
                  Vueltas: <span className="font-mono-tabular text-white">{currentRoom.laps}</span>
                  <input
                    type="range"
                    min={2}
                    max={15}
                    value={currentRoom.laps}
                    onChange={(e) =>
                      send({ type: 'room:update', laps: Number(e.target.value) })
                    }
                    className="mt-1.5 w-full accent-rose-600"
                  />
                </label>
              )}

              <button
                onClick={() => send({ type: 'race:start' })}
                className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>
                  {currentRoom.freeRoam
                    ? 'Iniciar Carrera Libre (Amigos pueden unirse en vivo)'
                    : 'Iniciar Carrera Online'}
                </span>
              </button>
            </div>
          )}

          {!isHost && (
            <div className="rounded-xl bg-[#0B0E17] border border-white/10 p-4 text-center text-sm text-slate-300">
              Esperando que el anfitrión inicie la carrera...
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Verified Account Bar */}
      <div className="bg-[#111520] border border-white/10 rounded-2xl px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span className="text-xs text-slate-400 block">Sesión Online Activa</span>
            <span className="font-display text-lg font-bold text-white">
              {authUser.username} · #{customization.number}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onStartSplitScreen}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Columns2 className="w-3.5 h-3.5 shrink-0" />
            <span>Jugar Mitad de Pantalla (2P)</span>
          </button>
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Create or Join */}
        <div className="lg:col-span-5 bg-[#111520] border border-white/10 rounded-2xl p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-2xl font-extrabold text-white">
                MULTIJUGADOR ONLINE
              </h2>
              <span
                className={`text-xs font-medium ${
                  connected ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {connected ? 'Servidor conectado' : 'Conectando...'}
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Compite en tiempo real con otros pilotos registrados mediante salas privadas o públicas.
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-red-950/50 border border-red-500/40 px-4 py-3 text-xs text-red-200">
              {errorMsg}
            </div>
          )}

          <div className="space-y-3 pt-2 border-t border-white/10">
            <button
              disabled={!connected}
              onClick={() => handleCreate(true, false)}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Jugar Partida Rápida Online Ahora</span>
            </button>

            <h3 className="text-xs font-semibold tracking-wider text-slate-400 pt-2">
              CREAR SALA PARA INVITAR AMIGOS
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCreateFreeRoam(true)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  createFreeRoam
                    ? 'bg-sky-600/25 border-sky-400 text-sky-200'
                    : 'bg-[#0B0E17] border-white/10 text-slate-400'
                }`}
              >
                <InfinityIcon className="w-3.5 h-3.5" />
                <span>Carrera Libre (∞)</span>
              </button>
              <button
                type="button"
                onClick={() => setCreateFreeRoam(false)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  !createFreeRoam
                    ? 'bg-rose-600/25 border-rose-500 text-rose-200'
                    : 'bg-[#0B0E17] border-white/10 text-slate-400'
                }`}
              >
                <span>Con Vueltas</span>
              </button>
            </div>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              maxLength={28}
              placeholder="Nombre de la sala"
              className="w-full rounded-xl bg-[#0B0E17] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
            />
            <button
              disabled={!connected}
              onClick={() => handleCreate(false, createFreeRoam)}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>
                {createFreeRoam
                  ? `Crear Carrera Libre en ${selectedCircuit.name}`
                  : `Crear Sala en ${selectedCircuit.name}`}
              </span>
            </button>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/10">
            <h3 className="text-xs font-semibold tracking-wider text-slate-400">
              UNIRSE CON CÓDIGO
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={4}
                placeholder="Ej: A7K2"
                className="flex-1 rounded-xl bg-[#0B0E17] border border-white/15 px-3.5 py-2.5 text-sm font-mono-tabular uppercase text-white focus:outline-none focus:border-sky-500"
              />
              <button
                disabled={!connected || joinCode.trim().length < 4}
                onClick={() => handleJoin(joinCode)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Unirse</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Public Rooms List */}
        <div className="lg:col-span-7 bg-[#111520] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              <span>Salas Activas ({rooms.length})</span>
            </h3>
          </div>

          {rooms.length === 0 ? (
            <div className="rounded-xl bg-[#0B0E17] border border-white/10 p-10 text-center">
              <p className="text-slate-300 font-medium mb-1">
                No hay salas activas en este momento
              </p>
              <p className="text-xs text-slate-500">
                Crea una sala para invitar amigos con el código o correr contra pilotos IA mientras se conectan.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map((r) => {
                const ckt = CIRCUITS.find((c) => c.id === r.circuitId) || CIRCUITS[0];
                return (
                  <div
                    key={r.code}
                    className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#0B0E17] border border-white/10"
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono-tabular text-xs font-bold text-sky-400">
                          {r.code}
                        </span>
                        <span className="font-semibold text-white">{r.name}</span>
                        {r.freeRoam && (
                          <span className="text-[11px] font-bold text-sky-400">
                            · Carrera Libre (∞)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {ckt.name} ·{' '}
                        {r.freeRoam ? 'Tiempo Infinito (Sin Vueltas)' : `${r.laps} vueltas`} ·{' '}
                        {r.drivers.length}/12 pilotos
                      </p>
                    </div>
                    <button
                      onClick={() => handleJoin(r.code)}
                      disabled={!connected || (r.status === 'racing' && !r.freeRoam)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-xs font-semibold text-white cursor-pointer"
                    >
                      {r.status === 'racing'
                        ? r.freeRoam
                          ? 'Unirse en Vivo'
                          : 'En Carrera'
                        : 'Entrar'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
