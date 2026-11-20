import { useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Coins,
  DollarSign,
  Flag,
  Hammer,
  Lock,
  RotateCw,
  ShoppingCart,
} from 'lucide-react';
import {
  computeCarStats,
  CUSTOM_F1_BUILD_COST,
  formatMoney,
  getCarPrice,
  getCarSellValue,
  TEAM_PRESETS,
} from '../data/cars';
import {
  AeroSetup,
  BodyStyle,
  CarConfig,
  FlagStyle,
  SuspensionStyle,
  TireCompound,
  WheelSize,
} from '../types/game';
import { useI18n } from '../utils/i18n';
import ShowroomCanvas, { ShowroomPreset } from './ShowroomCanvas';

interface GarageViewProps {
  carConfig: CarConfig;
  credits: number;
  unlockedCarIds: string[];
  customCars: CarConfig[];
  onUpdateCar: (next: CarConfig) => void;
  onBuyCar: (car: CarConfig, price: number) => boolean;
  onCreateCustomCar: (car: CarConfig, buildCost: number) => boolean;
  onSellCar: (car: CarConfig) => boolean;
  onTestOnTrack: () => void;
}

type DockTab = 'team' | 'create' | 'paint' | 'setup';

const COLOR_SWATCHES = [
  '#E11D48',
  '#0284C7',
  '#059669',
  '#D97706',
  '#7C3AED',
  '#F8FAFC',
  '#0F172A',
  '#1E3A8A',
  '#FACC15',
  '#14B8A6',
];

const CAMERA_VIEWS: Array<{ id: ShowroomPreset; label: string }> = [
  { id: 'hero', label: 'General' },
  { id: 'front', label: 'Frontal' },
  { id: 'side', label: 'Lateral' },
  { id: 'rear', label: 'Trasero' },
  { id: 'halo', label: 'Halo' },
];

const WHEEL_LABELS: Record<WheelSize, string> = {
  small: 'Rueda Pequeña',
  medium: 'Rueda Normal',
  large: 'Rueda Grande',
};

const BODY_LABELS: Record<BodyStyle, string> = {
  aero: 'Aero Moderno',
  classic: 'Clásico',
  wide: 'Ancho',
  futuristic: 'Futurista',
};

const FLAG_LABELS: Record<FlagStyle, string> = {
  none: 'Sin Bandera',
  chile: 'Bandera Chile',
  aysen: 'Bandera Aysén',
};

const SUSPENSION_LABELS: Record<SuspensionStyle, string> = {
  standard: 'Estándar',
  raised: 'Alta Patagonia',
  wide_pushrod: 'Pushrod Ancha',
  active_low: 'Activa Baja',
  heavy_patagonia: 'Reforzada Pro',
};

export default function GarageView({
  carConfig,
  credits,
  unlockedCarIds,
  customCars,
  onUpdateCar,
  onBuyCar,
  onCreateCustomCar,
  onSellCar,
  onTestOnTrack,
}: GarageViewProps) {
  const { t } = useI18n();
  const [cameraPreset, setCameraPreset] = useState<ShowroomPreset>('hero');
  const [autoRotate, setAutoRotate] = useState(true);
  const [dockOpen, setDockOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<DockTab>('team');
  const [savedNotice, setSavedNotice] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Preview car in 3D without equipping until owned
  const [previewCar, setPreviewCar] = useState<CarConfig>(carConfig);

  // Custom F1 Creator Draft
  const [draft, setDraft] = useState<CarConfig>({
    id: 'draft',
    teamName: 'Mi Escudería Austral',
    chassisName: 'CH-01 Patagonia',
    primaryColor: '#0284C7',
    secondaryColor: '#0F172A',
    accentColor: '#F8FAFC',
    helmetColor: '#F43F5E',
    driverNumber: 10,
    tireCompound: 'soft',
    aeroSetup: 'balanced',
    wheelSize: 'large',
    bodyStyle: 'wide',
    suspensionStyle: 'raised',
    flagStyle: 'chile',
    isCustom: true,
  });

  useEffect(() => {
    setPreviewCar(carConfig);
  }, [carConfig]);

  const displayedCar = activeTab === 'create' ? draft : previewCar;
  const allCatalogCars = [...TEAM_PRESETS, ...customCars];
  const ownedCount =
    unlockedCarIds.length +
    customCars.filter((c) => !unlockedCarIds.includes(c.id)).length;

  const isPreviewUnlocked =
    unlockedCarIds.includes(previewCar.id) || Boolean(previewCar.isCustom);
  const previewPrice = getCarPrice(previewCar.id);
  const canAffordPreview = credits >= previewPrice;
  const sellValue = getCarSellValue(previewCar);
  const canSellPreview = isPreviewUnlocked && ownedCount > 1;
  const buildCost = customCars.length === 0 ? 0 : CUSTOM_F1_BUILD_COST;

  const stats = computeCarStats(displayedCar);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 2800);
  };

  const handleSave = () => {
    if (!isPreviewUnlocked) return;
    onUpdateCar(previewCar);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1800);
  };

  const handleBuyPreview = () => {
    if (isPreviewUnlocked || !canAffordPreview) return;
    if (onBuyCar(previewCar, previewPrice)) {
      showNotice(`¡${previewCar.teamName} comprado y equipado!`);
    }
  };

  const handleSellPreview = () => {
    if (!canSellPreview) return;
    if (onSellCar(previewCar)) {
      showNotice(`Vendido por +${formatMoney(sellValue)}`);
    }
  };

  const handleBuildCustom = () => {
    if (credits < buildCost) return;
    const newCar: CarConfig = {
      ...draft,
      id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      teamName: draft.teamName.trim() || 'Mi F1 Chile',
      chassisName: draft.chassisName.trim() || 'F1-Custom',
      isCustom: true,
    };
    if (onCreateCustomCar(newCar, buildCost)) {
      setPreviewCar(newCar);
      setActiveTab('team');
      showNotice(`¡${newCar.teamName} creado y listo para correr o vender!`);
    }
  };

  const handleUpdateOwnedField = (next: CarConfig) => {
    setPreviewCar(next);
    if (unlockedCarIds.includes(next.id) || next.isCustom) {
      onUpdateCar(next);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-58px)] min-h-[580px] bg-[#090D12] overflow-hidden">
      {/* Unobstructed 3D Showroom Viewport */}
      <ShowroomCanvas
        carConfig={displayedCar}
        cameraPreset={cameraPreset}
        autoRotate={autoRotate}
      />

      {/* Top-Left Vehicle Title & Telemetry Summary */}
      <div className="pointer-events-none absolute top-5 left-6 z-10 space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-sky-400">
          <span>
            {activeTab === 'create'
              ? 'Taller de Diseño F1 · Vista previa en vivo'
              : `Garaje de Escudería · #${displayedCar.driverNumber}`}
          </span>
          {activeTab !== 'create' && !isPreviewUnlocked && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
              <Lock className="w-3 h-3" />
              <span>En venta · {formatMoney(previewPrice)}</span>
            </span>
          )}
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          {displayedCar.teamName}
        </h1>
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300 tabular-nums pt-1">
          <span>Velocidad {stats.topSpeed} km/h</span>
          <span aria-hidden="true">·</span>
          <span>{WHEEL_LABELS[displayedCar.wheelSize ?? 'medium']}</span>
          <span aria-hidden="true">·</span>
          <span>{BODY_LABELS[displayedCar.bodyStyle ?? 'aero']}</span>
          <span aria-hidden="true">·</span>
          <span>
            Susp. {SUSPENSION_LABELS[displayedCar.suspensionStyle ?? 'standard']}
          </span>
          <span aria-hidden="true">·</span>
          <span>{FLAG_LABELS[displayedCar.flagStyle ?? 'none']}</span>
        </div>
      </div>

      {/* Top-Right Wallet & Garage Progress */}
      <div className="pointer-events-none absolute top-5 right-6 z-10 flex flex-col items-end gap-1.5">
        <div className="rounded-lg border border-amber-400/30 bg-[#0B1017]/92 px-3.5 py-2 flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          <div className="text-right">
            <div className="text-[10px] text-slate-400">Dinero disponible</div>
            <div className="font-mono-tabular text-sm font-bold text-amber-300">
              {formatMoney(credits)}
            </div>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-mono-tabular">
          Tus F1: {ownedCount} ({customCars.length} creados por ti)
        </div>
        {actionNotice && (
          <div className="rounded-md bg-emerald-600/95 px-3 py-1.5 text-xs font-semibold text-white">
            {actionNotice}
          </div>
        )}
      </div>

      {/* Collapsible Bottom Control Dock (Zero Center Occlusion) */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-20 flex flex-col items-center px-4">
        <button
          type="button"
          onClick={() => setDockOpen((v) => !v)}
          className="pointer-events-auto mb-2 inline-flex items-center gap-1.5 rounded-t-lg border border-b-0 border-white/15 bg-[#0B1017]/95 px-4 py-1.5 text-xs font-medium text-slate-200 hover:text-white cursor-pointer"
        >
          {dockOpen ? (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Ocultar Controles</span>
            </>
          ) : (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Mostrar Controles del Garaje</span>
            </>
          )}
        </button>

        {dockOpen && (
          <div className="pointer-events-auto w-full max-w-[1040px] rounded-xl border border-white/15 bg-[#0B1017]/95 p-4 shadow-2xl space-y-3.5">
            {/* Top row: Dock Tabs + Camera Controls + Primary Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#141B24] p-1">
                {(
                  [
                    { id: 'team', label: t.garage.teamTab },
                    { id: 'create', label: t.garage.createTab },
                    { id: 'paint', label: t.garage.paintTab },
                    { id: 'setup', label: t.garage.setupTab },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {CAMERA_VIEWS.map((cam) => (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => setCameraPreset(cam.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      cameraPreset === cam.id
                        ? 'bg-white/15 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cam.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAutoRotate((r) => !r)}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap cursor-pointer ${
                    autoRotate
                      ? 'bg-sky-500/20 text-sky-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Giro</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {activeTab === 'create' ? (
                  <button
                    type="button"
                    disabled={credits < buildCost}
                    onClick={handleBuildCustom}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                      credits >= buildCost
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer'
                        : 'border border-white/10 bg-[#141B24] text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Hammer className="w-3.5 h-3.5" />
                    <span>
                      {buildCost === 0
                        ? 'Crear Primer F1 (Gratis)'
                        : `Construir F1 (${formatMoney(buildCost)})`}
                    </span>
                  </button>
                ) : isPreviewUnlocked ? (
                  <>
                    {canSellPreview && (
                      <button
                        type="button"
                        onClick={handleSellPreview}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/25 whitespace-nowrap cursor-pointer"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Vender ({formatMoney(sellValue)})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSave}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#151D28] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1E2938] whitespace-nowrap cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{savedNotice ? t.settings.saved : t.garage.save}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onTestOnTrack}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 whitespace-nowrap cursor-pointer"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>{t.garage.testTrack}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={!canAffordPreview}
                    onClick={handleBuyPreview}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                      canAffordPreview
                        ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer'
                        : 'border border-white/10 bg-[#141B24] text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>
                      {canAffordPreview
                        ? `Comprar F1 (${formatMoney(previewPrice)})`
                        : `Faltan ${formatMoney(previewPrice - credits)}`}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Tab 1: Store & Owned/Created F1s */}
            {activeTab === 'team' && (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {allCatalogCars.map((preset) => {
                    const owned =
                      unlockedCarIds.includes(preset.id) || Boolean(preset.isCustom);
                    const equipped = carConfig.id === preset.id;
                    const previewing = previewCar.id === preset.id;
                    const price = getCarPrice(preset.id);
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setPreviewCar({ ...preset });
                          if (owned) {
                            onUpdateCar({ ...preset });
                          }
                        }}
                        className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-colors cursor-pointer ${
                          previewing
                            ? equipped
                              ? 'border-rose-500 bg-rose-500/15'
                              : 'border-amber-400 bg-amber-500/10'
                            : owned
                              ? 'border-white/15 bg-[#121822] hover:border-white/30'
                              : 'border-white/10 bg-[#0D1219] opacity-85 hover:opacity-100 hover:border-amber-400/50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <div className="flex items-center gap-1">
                            <span
                              className="w-3 h-3 rounded-sm border border-white/20"
                              style={{ backgroundColor: preset.primaryColor }}
                            />
                            <span
                              className="w-3 h-3 rounded-sm border border-white/20"
                              style={{ backgroundColor: preset.secondaryColor }}
                            />
                          </div>
                          {preset.isCustom ? (
                            <span className="text-[9px] font-bold text-sky-400">
                              TUYO
                            </span>
                          ) : !owned ? (
                            <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                          ) : null}
                        </div>
                        <div className="text-[11px] font-semibold text-white truncate w-full">
                          {preset.teamName}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate w-full">
                          {WHEEL_LABELS[preset.wheelSize ?? 'medium']} ·{' '}
                          {SUSPENSION_LABELS[preset.suspensionStyle ?? 'standard']}
                        </div>
                        <div className="text-[10px] font-mono-tabular mt-0.5 truncate w-full">
                          {equipped ? (
                            <span className="text-rose-400 font-semibold">
                              Equipado
                            </span>
                          ) : owned ? (
                            <span className="text-emerald-400">
                              En tu garaje · Venta {formatMoney(getCarSellValue(preset))}
                            </span>
                          ) : (
                            <span className="text-amber-300 font-semibold">
                              {formatMoney(price)}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: Custom F1 Creator */}
            {activeTab === 'create' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 text-xs">
                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-300">
                    Nombre de Tu Escudería F1
                  </label>
                  <input
                    type="text"
                    maxLength={24}
                    value={draft.teamName}
                    onChange={(e) =>
                      setDraft({ ...draft, teamName: e.target.value })
                    }
                    className="w-full rounded-md border border-white/15 bg-[#131A24] px-2.5 py-1.5 text-white"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={18}
                      placeholder="Chasis"
                      value={draft.chassisName}
                      onChange={(e) =>
                        setDraft({ ...draft, chassisName: e.target.value })
                      }
                      className="flex-1 rounded-md border border-white/15 bg-[#131A24] px-2 py-1 text-white"
                    />
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={draft.driverNumber}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          driverNumber: Math.max(
                            1,
                            Math.min(99, Number(e.target.value) || 1)
                          ),
                        })
                      }
                      className="w-16 rounded-md border border-white/15 bg-[#131A24] px-2 py-1 font-mono-tabular text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="font-medium text-slate-300">Tamaño de Ruedas</div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['small', 'medium', 'large'] as WheelSize[]).map((ws) => (
                      <button
                        key={ws}
                        type="button"
                        onClick={() => setDraft({ ...draft, wheelSize: ws })}
                        className={`rounded border py-1.5 font-semibold cursor-pointer ${
                          draft.wheelSize === ws
                            ? 'border-rose-500 bg-rose-500/20 text-white'
                            : 'border-white/10 bg-[#121822] text-slate-400'
                        }`}
                      >
                        {ws === 'small' ? 'Pequeña' : ws === 'medium' ? 'Normal' : 'Grande'}
                      </button>
                    ))}
                  </div>
                  <div className="font-medium text-slate-300 pt-1">Bandera en F1</div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['none', 'chile', 'aysen'] as FlagStyle[]).map((fs) => (
                      <button
                        key={fs}
                        type="button"
                        onClick={() => setDraft({ ...draft, flagStyle: fs })}
                        className={`rounded border py-1.5 font-semibold cursor-pointer ${
                          draft.flagStyle === fs
                            ? 'border-sky-400 bg-sky-500/20 text-white'
                            : 'border-white/10 bg-[#121822] text-slate-400'
                        }`}
                      >
                        {fs === 'none' ? 'No' : fs === 'chile' ? 'Chile' : 'Aysén'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="font-medium text-slate-300">
                    Chasis y Suspensión
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {(['aero', 'classic', 'wide', 'futuristic'] as BodyStyle[]).map(
                      (bs) => (
                        <button
                          key={bs}
                          type="button"
                          onClick={() => setDraft({ ...draft, bodyStyle: bs })}
                          className={`rounded border py-1 font-semibold cursor-pointer ${
                            draft.bodyStyle === bs
                              ? 'border-rose-500 bg-rose-500/20 text-white'
                              : 'border-white/10 bg-[#121822] text-slate-400'
                          }`}
                        >
                          {BODY_LABELS[bs]}
                        </button>
                      )
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-0.5">
                    {(
                      [
                        'standard',
                        'raised',
                        'wide_pushrod',
                        'active_low',
                        'heavy_patagonia',
                      ] as SuspensionStyle[]
                    ).map((ss) => (
                      <button
                        key={ss}
                        type="button"
                        onClick={() => setDraft({ ...draft, suspensionStyle: ss })}
                        className={`rounded border py-1 px-1 text-[10px] font-semibold truncate cursor-pointer ${
                          (draft.suspensionStyle ?? 'standard') === ss
                            ? 'border-amber-400 bg-amber-500/20 text-white'
                            : 'border-white/10 bg-[#121822] text-slate-400'
                        }`}
                      >
                        {SUSPENSION_LABELS[ss]}
                      </button>
                    ))}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono-tabular">
                    Valor venta: {formatMoney(getCarSellValue(draft))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="font-medium text-slate-300">Colores del Monoplaza</div>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_SWATCHES.map((hex) => (
                      <button
                        key={`d-p-${hex}`}
                        type="button"
                        onClick={() => setDraft({ ...draft, primaryColor: hex })}
                        className={`w-6 h-6 rounded border cursor-pointer ${
                          draft.primaryColor === hex
                            ? 'border-white ring-2 ring-rose-500'
                            : 'border-white/20'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {COLOR_SWATCHES.slice(0, 6).map((hex) => (
                      <button
                        key={`d-s-${hex}`}
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            secondaryColor: hex,
                            accentColor: hex === '#0F172A' ? '#F8FAFC' : hex,
                          })
                        }
                        className={`w-5 h-5 rounded border cursor-pointer ${
                          draft.secondaryColor === hex
                            ? 'border-white ring-2 ring-sky-400'
                            : 'border-white/20'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Paint & 3D Body Customization on Owned Car */}
            {activeTab === 'paint' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {!isPreviewUnlocked && (
                  <div className="md:col-span-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    Compra este monoplaza por {formatMoney(previewPrice)} para
                    personalizar su pintura y competir con él.
                  </div>
                )}
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-slate-300">
                    Color Primario y Secundario
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {COLOR_SWATCHES.map((hex) => (
                      <button
                        key={`p-${hex}`}
                        type="button"
                        disabled={!isPreviewUnlocked}
                        onClick={() =>
                          handleUpdateOwnedField({
                            ...previewCar,
                            primaryColor: hex,
                          })
                        }
                        aria-label={`Color primario ${hex}`}
                        className={`w-6 h-6 rounded border cursor-pointer disabled:opacity-40 ${
                          previewCar.primaryColor === hex
                            ? 'border-white ring-2 ring-rose-500'
                            : 'border-white/20'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-slate-300">
                    Ruedas, Suspensión y Bandera
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['small', 'medium', 'large'] as WheelSize[]).map((ws) => (
                      <button
                        key={ws}
                        type="button"
                        disabled={!isPreviewUnlocked}
                        onClick={() =>
                          handleUpdateOwnedField({ ...previewCar, wheelSize: ws })
                        }
                        className={`rounded border py-1 text-[11px] font-semibold cursor-pointer disabled:opacity-40 ${
                          (previewCar.wheelSize ?? 'medium') === ws
                            ? 'border-rose-500 bg-rose-500/20 text-white'
                            : 'border-white/10 bg-[#121822] text-slate-400'
                        }`}
                      >
                        {ws === 'small' ? 'Pequeña' : ws === 'medium' ? 'Normal' : 'Grande'}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(
                      [
                        'standard',
                        'raised',
                        'wide_pushrod',
                        'active_low',
                        'heavy_patagonia',
                      ] as SuspensionStyle[]
                    ).map((ss) => (
                      <button
                        key={ss}
                        type="button"
                        disabled={!isPreviewUnlocked}
                        onClick={() =>
                          handleUpdateOwnedField({
                            ...previewCar,
                            suspensionStyle: ss,
                          })
                        }
                        className={`rounded border py-1 px-1 text-[10px] font-semibold truncate cursor-pointer disabled:opacity-40 ${
                          (previewCar.suspensionStyle ?? 'standard') === ss
                            ? 'border-amber-400 bg-amber-500/20 text-white'
                            : 'border-white/10 bg-[#121822] text-slate-400'
                        }`}
                      >
                        {SUSPENSION_LABELS[ss]}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['none', 'chile', 'aysen'] as FlagStyle[]).map((fs) => (
                      <button
                        key={fs}
                        type="button"
                        disabled={!isPreviewUnlocked}
                        onClick={() =>
                          handleUpdateOwnedField({ ...previewCar, flagStyle: fs })
                        }
                        className={`rounded border py-1 text-[11px] font-semibold cursor-pointer disabled:opacity-40 ${
                          (previewCar.flagStyle ?? 'none') === fs
                            ? 'border-sky-400 bg-sky-500/20 text-white'
                            : 'border-white/10 bg-[#121822] text-slate-400'
                        }`}
                      >
                        {fs === 'none' ? 'Sin Band.' : fs === 'chile' ? 'Chile' : 'Aysén'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <label
                      htmlFor="driver-number"
                      className="block text-xs font-medium text-slate-300"
                    >
                      Dorsal
                    </label>
                    <input
                      id="driver-number"
                      type="number"
                      min={1}
                      max={99}
                      disabled={!isPreviewUnlocked}
                      value={previewCar.driverNumber}
                      onChange={(e) =>
                        handleUpdateOwnedField({
                          ...previewCar,
                          driverNumber: Math.max(
                            1,
                            Math.min(99, Number(e.target.value) || 1)
                          ),
                        })
                      }
                      className="w-16 rounded-md border border-white/15 bg-[#131A24] px-2 py-1.5 text-sm font-mono-tabular text-white disabled:opacity-40"
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <label
                      htmlFor="team-name-input"
                      className="block text-xs font-medium text-slate-300"
                    >
                      Nombre Escudería
                    </label>
                    <input
                      id="team-name-input"
                      type="text"
                      maxLength={26}
                      disabled={!isPreviewUnlocked}
                      value={previewCar.teamName}
                      onChange={(e) =>
                        handleUpdateOwnedField({
                          ...previewCar,
                          teamName: e.target.value,
                        })
                      }
                      className="w-full rounded-md border border-white/15 bg-[#131A24] px-2.5 py-1.5 text-xs text-white disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Tires & Aero */}
            {activeTab === 'setup' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-slate-300">
                    Compuesto de Neumáticos
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        {
                          id: 'soft',
                          label: 'Blando',
                          note: 'Máximo agarre',
                          dot: '#EF4444',
                        },
                        {
                          id: 'medium',
                          label: 'Medio',
                          note: 'Equilibrado',
                          dot: '#FACC15',
                        },
                        {
                          id: 'hard',
                          label: 'Duro',
                          note: 'Mayor punta',
                          dot: '#F1F5F9',
                        },
                      ] as Array<{
                        id: TireCompound;
                        label: string;
                        note: string;
                        dot: string;
                      }>
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        disabled={!isPreviewUnlocked}
                        onClick={() =>
                          handleUpdateOwnedField({
                            ...previewCar,
                            tireCompound: t.id,
                          })
                        }
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left cursor-pointer disabled:opacity-40 ${
                          previewCar.tireCompound === t.id
                            ? 'border-rose-500 bg-rose-500/10'
                            : 'border-white/10 bg-[#121822] hover:border-white/25'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: t.dot }}
                        />
                        <div>
                          <div className="text-xs font-semibold text-white">
                            {t.label}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {t.note}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-slate-300">
                    Configuración Aerodinámica (Alerones)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        {
                          id: 'low_drag',
                          label: 'Baja Carga',
                          note: '+Velocidad recta',
                        },
                        {
                          id: 'balanced',
                          label: 'Balanceado',
                          note: 'Todo terreno',
                        },
                        {
                          id: 'high_downforce',
                          label: 'Alta Carga',
                          note: '+Agarre en curva',
                        },
                      ] as Array<{
                        id: AeroSetup;
                        label: string;
                        note: string;
                      }>
                    ).map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        disabled={!isPreviewUnlocked}
                        onClick={() =>
                          handleUpdateOwnedField({
                            ...previewCar,
                            aeroSetup: a.id,
                          })
                        }
                        className={`rounded-lg border px-3 py-2 text-left cursor-pointer disabled:opacity-40 ${
                          previewCar.aeroSetup === a.id
                            ? 'border-sky-400 bg-sky-500/10'
                            : 'border-white/10 bg-[#121822] hover:border-white/25'
                        }`}
                      >
                        <div className="text-xs font-semibold text-white">
                          {a.label}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {a.note}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
