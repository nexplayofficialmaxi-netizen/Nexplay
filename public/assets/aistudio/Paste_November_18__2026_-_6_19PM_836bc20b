import { useEffect, useState } from 'react';
import {
  Gamepad2,
  Keyboard,
  RotateCcw,
  Check,
  Ticket,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Play,
  Globe,
} from 'lucide-react';
import { DEFAULT_CONTROL_SETTINGS, formatKeyCode } from '../data/cars';
import { audioEngine } from '../engine/audio';
import {
  AudioSettings,
  ControlSettings,
  GamepadBindings,
  KeyBindings,
  LanguageCode,
} from '../types/game';
import { LANGUAGES, useI18n } from '../utils/i18n';

interface SettingsViewProps {
  controls: ControlSettings;
  redeemedCodes: string[];
  onUpdateControls: (next: ControlSettings) => void;
  onRedeemCode: (code: string) => { ok: boolean; message: string };
}

const KEYBOARD_ACTIONS: Array<{ key: keyof KeyBindings; label: string; hint: string }> = [
  { key: 'accelerate', label: 'Acelerar', hint: 'Gas a fondo' },
  { key: 'brake', label: 'Frenar / Reversa', hint: 'Frenada y marcha atrás' },
  { key: 'steerLeft', label: 'Girar Izquierda', hint: 'Dirección izquierda' },
  { key: 'steerRight', label: 'Girar Derecha', hint: 'Dirección derecha' },
  { key: 'handbrake', label: 'Freno de Mano (Derrape)', hint: 'Bloqueo trasero para derrapar' },
  { key: 'drs', label: 'Activar DRS', hint: 'Alerón trasero abierto' },
  { key: 'camera', label: 'Cambiar Cámara', hint: 'Conductor / Capot / Piso / Persecución' },
  { key: 'reset', label: 'Reposicionar en Pista', hint: 'Volver al asfalto' },
  { key: 'pause', label: 'Pausa', hint: 'Menú de carrera' },
];

const GAMEPAD_ACTIONS: Array<{
  key: keyof Pick<
    GamepadBindings,
    | 'accelerateButton'
    | 'brakeButton'
    | 'handbrakeButton'
    | 'drsButton'
    | 'cameraButton'
    | 'resetButton'
  >;
  label: string;
}> = [
  { key: 'accelerateButton', label: 'Acelerar (ej. RT / R2)' },
  { key: 'brakeButton', label: 'Frenar / Reversa (ej. LT / L2)' },
  { key: 'handbrakeButton', label: 'Freno de Mano / Derrape (ej. A / X)' },
  { key: 'drsButton', label: 'Activar DRS (ej. X / Cuadrado)' },
  { key: 'cameraButton', label: 'Cambiar Cámara (ej. Y / Triángulo)' },
  { key: 'resetButton', label: 'Reposicionar (ej. B / Círculo)' },
];

export default function SettingsView({
  controls,
  redeemedCodes,
  onUpdateControls,
  onRedeemCode,
}: SettingsViewProps) {
  const [listeningKey, setListeningKey] = useState<keyof KeyBindings | null>(null);
  const [listeningPad, setListeningPad] = useState<
    (typeof GAMEPAD_ACTIONS)[number]['key'] | null
  >(null);
  const [connectedPad, setConnectedPad] = useState<{
    id: string;
    buttons: boolean[];
    axes: number[];
  } | null>(null);
  const [savedToast, setSavedToast] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeFeedback, setCodeFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  // Keyboard rebind listener
  useEffect(() => {
    if (!listeningKey) return;
    const handleKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const updated: ControlSettings = {
        ...controls,
        keyboard: {
          ...controls.keyboard,
          [listeningKey]: e.code,
        },
      };
      onUpdateControls(updated);
      setListeningKey(null);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1400);
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [listeningKey, controls, onUpdateControls]);

  // Gamepad polling (detect connection + live monitor + button rebinding)
  useEffect(() => {
    let raf = 0;
    const poll = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const pad = pads[0] || pads[1] || pads[2] || pads[3];

      if (pad && pad.connected) {
        const btnStates = pad.buttons.map((b) => b.pressed || b.value > 0.4);
        setConnectedPad({
          id: pad.id,
          buttons: btnStates,
          axes: [...pad.axes],
        });

        if (listeningPad) {
          const pressedIdx = btnStates.findIndex((pressed) => pressed);
          if (pressedIdx !== -1) {
            onUpdateControls({
              ...controls,
              gamepad: {
                ...controls.gamepad,
                [listeningPad]: pressedIdx,
              },
            });
            setListeningPad(null);
            setSavedToast(true);
            setTimeout(() => setSavedToast(false), 1400);
          }
        }
      } else {
        setConnectedPad(null);
      }

      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [listeningPad, controls, onUpdateControls]);

  const { t } = useI18n();

  const updateAudio = (patch: Partial<AudioSettings>) => {
    const nextAudio: AudioSettings = {
      ...controls.audio,
      ...patch,
    };
    audioEngine.applyAudioSettings(nextAudio);
    onUpdateControls({
      ...controls,
      audio: nextAudio,
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1400);
  };

  const handleSelectLanguage = (lang: LanguageCode) => {
    onUpdateControls({
      ...controls,
      language: lang,
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1400);
  };

  const handleResetDefaults = () => {
    audioEngine.applyAudioSettings(DEFAULT_CONTROL_SETTINGS.audio);
    onUpdateControls(DEFAULT_CONTROL_SETTINGS);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1400);
  };

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            {t.settings.title}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {t.settings.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedToast && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Check className="w-4 h-4" />
              <span>{t.settings.saved}</span>
            </span>
          )}
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#0F141C] px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-[#17202E] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.settings.resetDefaults}</span>
          </button>
        </div>
      </div>

      {/* Language Selector (12 Languages) */}
      <section className="rounded-xl border border-white/10 bg-[#0F141C] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                {t.settings.languageTitle}
              </h2>
              <p className="text-xs text-slate-400">
                {t.settings.languageDesc}
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold text-sky-300">
            {t.settings.activeLang}:{' '}
            {LANGUAGES.find((l) => l.code === controls.language)?.nativeName ??
              'Español'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {LANGUAGES.map((lang) => {
            const active = controls.language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelectLanguage(lang.code)}
                className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors cursor-pointer ${
                  active
                    ? 'border-sky-400 bg-sky-500/15 text-white'
                    : 'border-white/10 bg-[#080B10] text-slate-300 hover:border-white/25 hover:text-white'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                    <span>{lang.flag}</span>
                    <span className="truncate">{lang.nativeName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {lang.spanishName}
                  </div>
                </div>
                {active && (
                  <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Sound & Volume Panel */}
      <section className="rounded-xl border border-white/10 bg-[#0F141C] p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            {controls.audio.muted ? (
              <VolumeX className="w-5 h-5 text-rose-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-emerald-400" />
            )}
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                {t.settings.soundTitle}
              </h2>
              <p className="text-xs text-slate-400">
                {t.settings.soundDesc}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => updateAudio({ muted: !controls.audio.muted })}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              controls.audio.muted
                ? 'border border-rose-500/50 bg-rose-600/20 text-rose-200 hover:bg-rose-600/35'
                : 'border border-emerald-500/40 bg-emerald-600/20 text-emerald-200 hover:bg-emerald-600/35'
            }`}
          >
            {controls.audio.muted ? (
              <>
                <VolumeX className="w-4 h-4" />
                <span>{t.settings.soundOff}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>{t.settings.soundOn}</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Master Volume */}
          <div className="rounded-lg border border-white/10 bg-[#080B10] p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">{t.settings.masterVol}</span>
              <span className="font-mono-tabular font-bold text-emerald-300">
                {controls.audio.muted ? '0%' : `${controls.audio.masterVolume}%`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              aria-label={t.settings.masterVol}
              value={controls.audio.masterVolume}
              onChange={(e) =>
                updateAudio({
                  masterVolume: Number(e.target.value),
                  muted: Number(e.target.value) === 0 ? true : false,
                })
              }
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="text-[11px] text-slate-400">
              {t.settings.masterVolDesc}
            </div>
          </div>

          {/* Engine Volume */}
          <div className="rounded-lg border border-white/10 bg-[#080B10] p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">{t.settings.engineVol}</span>
              <span className="font-mono-tabular font-bold text-rose-300">
                {controls.audio.engineVolume}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              aria-label={t.settings.engineVol}
              value={controls.audio.engineVolume}
              onChange={(e) =>
                updateAudio({ engineVolume: Number(e.target.value) })
              }
              className="w-full accent-rose-500 cursor-pointer"
            />
            <button
              type="button"
              disabled={controls.audio.muted}
              onClick={() => audioEngine.playTestSound('engine')}
              className="inline-flex items-center gap-1.5 rounded border border-white/15 bg-[#121822] px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-rose-400/60 disabled:opacity-40 cursor-pointer"
            >
              <Play className="w-3 h-3 text-rose-400" />
              <span>{t.settings.testEngine}</span>
            </button>
          </div>

          {/* Tires & Drift Volume */}
          <div className="rounded-lg border border-white/10 bg-[#080B10] p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">{t.settings.tiresVol}</span>
              <span className="font-mono-tabular font-bold text-sky-300">
                {controls.audio.tiresVolume}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              aria-label={t.settings.tiresVol}
              value={controls.audio.tiresVolume}
              onChange={(e) =>
                updateAudio({ tiresVolume: Number(e.target.value) })
              }
              className="w-full accent-sky-400 cursor-pointer"
            />
            <button
              type="button"
              disabled={controls.audio.muted}
              onClick={() => audioEngine.playTestSound('drift')}
              className="inline-flex items-center gap-1.5 rounded border border-white/15 bg-[#121822] px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-sky-400/60 disabled:opacity-40 cursor-pointer"
            >
              <Play className="w-3 h-3 text-sky-400" />
              <span>{t.settings.testDrift}</span>
            </button>
          </div>

          {/* Effects Volume */}
          <div className="rounded-lg border border-white/10 bg-[#080B10] p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">
                {t.settings.effectsVol}
              </span>
              <span className="font-mono-tabular font-bold text-amber-300">
                {controls.audio.effectsVolume}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              aria-label={t.settings.effectsVol}
              value={controls.audio.effectsVolume}
              onChange={(e) =>
                updateAudio({ effectsVolume: Number(e.target.value) })
              }
              className="w-full accent-amber-400 cursor-pointer"
            />
            <button
              type="button"
              disabled={controls.audio.muted}
              onClick={() => audioEngine.playTestSound('effects')}
              className="inline-flex items-center gap-1.5 rounded border border-white/15 bg-[#121822] px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-amber-400/60 disabled:opacity-40 cursor-pointer"
            >
              <Play className="w-3 h-3 text-amber-400" />
              <span>{t.settings.testEffects}</span>
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Keyboard Mapping */}
        <section className="lg:col-span-6 rounded-xl border border-white/10 bg-[#0F141C] p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <Keyboard className="w-5 h-5 text-rose-500" />
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                {t.settings.keyboardTitle}
              </h2>
              <p className="text-xs text-slate-400">
                {t.settings.keyboardDesc}
              </p>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {KEYBOARD_ACTIONS.map((item) => {
              const isListening = listeningKey === item.key;
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {item.label}
                    </div>
                    <div className="text-xs text-slate-400">{item.hint}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setListeningPad(null);
                      setListeningKey(isListening ? null : item.key);
                    }}
                    className={`min-w-[116px] rounded-lg border px-3.5 py-2 text-xs font-mono-tabular font-bold transition-colors cursor-pointer ${
                      isListening
                        ? 'border-rose-500 bg-rose-600 text-white'
                        : 'border-white/15 bg-[#080B10] text-slate-100 hover:border-rose-500/60'
                    }`}
                  >
                    {isListening
                      ? t.settings.pressKey
                      : formatKeyCode(controls.keyboard[item.key])}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Gamepad / Controller Setup */}
        <section className="lg:col-span-6 space-y-6">
          <div className="rounded-xl border border-white/10 bg-[#0F141C] p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Gamepad2 className="w-5 h-5 text-sky-400" />
                <div>
                  <h2 className="font-display text-xl font-bold text-white">
                    {t.settings.gamepadTitle}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {t.settings.gamepadDesc}
                  </p>
                </div>
              </div>
              <div
                className={`text-xs font-semibold ${
                  connectedPad ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {connectedPad
                  ? t.settings.padConnected
                  : t.settings.padDisconnected}
              </div>
            </div>

            {connectedPad ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-2">
                <div className="text-xs font-medium text-emerald-300 truncate">
                  Dispositivo: {connectedPad.id}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <span>Dirección (Eje {controls.gamepad.steerAxis}):</span>
                  <div className="flex-1 h-2 rounded-full bg-[#080B10] overflow-hidden relative">
                    <div
                      className="absolute top-0 bottom-0 w-3 bg-sky-400 rounded-full"
                      style={{
                        left: `${Math.min(
                          95,
                          Math.max(
                            0,
                            ((connectedPad.axes[controls.gamepad.steerAxis] ?? 0) +
                              1) *
                              50
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 bg-[#080B10] p-3.5 text-xs text-slate-400">
                Conecta tu mando al computador por USB o Bluetooth y presiona
                cualquier botón para activarlo en el navegador.
              </div>
            )}

            <div className="divide-y divide-white/5">
              {GAMEPAD_ACTIONS.map((item) => {
                const isListening = listeningPad === item.key;
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-4 py-2.5"
                  >
                    <span className="text-sm font-medium text-slate-200">
                      {item.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setListeningKey(null);
                        setListeningPad(isListening ? null : item.key);
                      }}
                      className={`min-w-[120px] rounded-lg border px-3 py-1.5 text-xs font-mono-tabular font-bold cursor-pointer ${
                        isListening
                          ? 'border-sky-400 bg-sky-600 text-white'
                          : 'border-white/15 bg-[#080B10] text-slate-100 hover:border-sky-400/60'
                      }`}
                    >
                      {isListening
                        ? 'Pulsa botón...'
                        : `Botón ${controls.gamepad[item.key]}`}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/10">
              <div className="space-y-1">
                <label className="flex justify-between text-xs text-slate-300">
                  <span>Zona Muerta Stick</span>
                  <span className="font-mono-tabular">
                    {Math.round(controls.gamepad.deadzone * 100)}%
                  </span>
                </label>
                <input
                  type="range"
                  min={0.02}
                  max={0.35}
                  step={0.02}
                  value={controls.gamepad.deadzone}
                  onChange={(e) =>
                    onUpdateControls({
                      ...controls,
                      gamepad: {
                        ...controls.gamepad,
                        deadzone: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-sky-400"
                />
              </div>

              <div className="space-y-1">
                <label className="flex justify-between text-xs text-slate-300">
                  <span>Sensibilidad Giro</span>
                  <span className="font-mono-tabular">
                    {controls.gamepad.sensitivity.toFixed(1)}x
                  </span>
                </label>
                <input
                  type="range"
                  min={0.6}
                  max={1.6}
                  step={0.1}
                  value={controls.gamepad.sensitivity}
                  onChange={(e) =>
                    onUpdateControls({
                      ...controls,
                      gamepad: {
                        ...controls.gamepad,
                        sensitivity: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-sky-400"
                />
              </div>
            </div>
          </div>

          {/* F1 Promo / Redeem Codes Panel */}
          <div className="rounded-xl border border-white/10 bg-[#0F141C] p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
              <Ticket className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="font-display text-xl font-bold text-white">
                  {t.settings.codesTitle}
                </h2>
                <p className="text-xs text-slate-400">
                  {t.settings.codesDesc}
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const res = onRedeemCode(codeInput);
                setCodeFeedback(res);
                if (res.ok) {
                  setCodeInput('');
                }
              }}
              className="flex flex-col sm:flex-row gap-2.5"
            >
              <input
                type="text"
                maxLength={32}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="EJ: F1-AYSEN-..."
                aria-label="Código F1"
                className="flex-1 rounded-lg border border-white/15 bg-[#080B10] px-3.5 py-2.5 text-sm font-mono-tabular text-white uppercase placeholder:text-slate-600 focus:border-amber-400 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 cursor-pointer whitespace-nowrap"
              >
                {t.settings.redeemBtn}
              </button>
            </form>

            {codeFeedback && (
              <div
                className={`rounded-lg border px-3.5 py-2 text-xs font-medium ${
                  codeFeedback.ok
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                }`}
              >
                {codeFeedback.message}
              </div>
            )}

            {redeemedCodes.length > 0 && (
              <div className="text-xs text-slate-400 pt-1">
                Códigos canjeados:{' '}
                <span className="font-mono-tabular text-emerald-300">
                  {redeemedCodes.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* F1 On-Track HUD Toggle */}
          <div className="rounded-xl border border-white/10 bg-[#0F141C] p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                {controls.showTrackHud ? (
                  <Eye className="w-5 h-5 text-emerald-400" />
                ) : (
                  <EyeOff className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <h2 className="font-display text-xl font-bold text-white">
                    {t.settings.trackHudTitle}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {t.settings.trackHudDesc}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/10 bg-[#080B10] p-4">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-white">
                  {controls.showTrackHud ? t.settings.hudOn : t.settings.hudOff}
                </div>
                <div className="text-xs text-slate-400">
                  {t.settings.trackHudDesc}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onUpdateControls({
                    ...controls,
                    showTrackHud: !controls.showTrackHud,
                  });
                  setSavedToast(true);
                  setTimeout(() => setSavedToast(false), 1400);
                }}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  controls.showTrackHud
                    ? 'border border-rose-500/40 bg-rose-600/20 text-rose-200 hover:bg-rose-600/35'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                {controls.showTrackHud ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span>{t.settings.hudTurnOff}</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>{t.settings.hudTurnOn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
