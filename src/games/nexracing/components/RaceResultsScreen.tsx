import React from 'react';
import { Trophy, RotateCcw, ArrowRight, Home, Award } from 'lucide-react';
import { RaceResult } from '../types/game';
import { formatLapTime } from './RaceViewport';

interface RaceResultsScreenProps {
  result: RaceResult;
  hasNextChampRound?: boolean;
  onRetry: () => void;
  onNextChampRound?: () => void;
  onBackToMenu: () => void;
}

export const RaceResultsScreen: React.FC<RaceResultsScreenProps> = ({
  result,
  hasNextChampRound = false,
  onRetry,
  onNextChampRound,
  onBackToMenu,
}) => {
  const modeLabels: Record<RaceResult['mode'], string> = {
    quick: 'Carrera Rápida',
    championship: 'Campeonato Aysén NASCAR',
    timetrial: 'Contrarreloj',
    freeroam: 'Carrera Libre (Tiempo Infinito)',
    multiplayer: 'Multijugador Online',
    splitscreen: 'Mitad de Pantalla (2 Jugadores)',
  };

  return (
    <div className="min-h-screen bg-[#090B10] text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-[#111520] border border-white/10 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <p className="text-xs font-semibold tracking-wider text-rose-400 mb-1">
              {modeLabels[result.mode]} · {result.circuitName}
            </p>
            <h1 className="font-display text-4xl font-extrabold text-white">
              {result.mode === 'timetrial'
                ? 'SESIÓN COMPLETADA'
                : result.playerPosition === 1
                ? 'VICTORIA EN LA PISTA'
                : `FINALIZASTE EN POSICIÓN #${result.playerPosition}`}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs text-slate-400 block">Mejor Vuelta</span>
              <span className="font-mono-tabular text-xl font-bold text-emerald-400">
                {formatLapTime(result.playerBestLapMs)}
              </span>
            </div>
            {result.mode === 'championship' && (
              <div>
                <span className="text-xs text-slate-400 block">Puntos Copa</span>
                <span className="font-mono-tabular text-xl font-bold text-amber-400">
                  +{result.pointsEarned} PTS
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Podium Cards for Multi-car races */}
        {result.mode !== 'timetrial' && result.standings.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            {result.standings.slice(0, 3).map((drv, idx) => (
              <div
                key={drv.id}
                className={`rounded-xl p-4 border ${
                  drv.isPlayer
                    ? 'bg-rose-950/35 border-rose-500/40'
                    : 'bg-[#0C1018] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-2xl font-extrabold text-white font-mono-tabular">
                    {idx + 1}° LUGAR
                  </span>
                  {idx === 0 ? (
                    <Trophy className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Award className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2.5 h-6 rounded-xs shrink-0"
                    style={{ backgroundColor: drv.color }}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">
                      #{drv.number} {drv.name}
                    </p>
                    <p className="text-xs text-slate-400 font-mono-tabular">
                      Mejor: {formatLapTime(drv.bestLapMs)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full Classification Table */}
        <div className="overflow-x-auto border border-white/10 rounded-xl bg-[#0C1018] mb-6">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs text-slate-400">
              <tr>
                <th className="py-3 px-4">POS</th>
                <th className="py-3 px-4">PILOTO</th>
                <th className="py-3 px-4">VUELTAS</th>
                <th className="py-3 px-4">MEJOR VUELTA</th>
                <th className="py-3 px-4 text-right">TIEMPO / DIF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {result.standings.map((row) => (
                <tr
                  key={row.id}
                  className={row.isPlayer ? 'bg-rose-600/15 text-white font-semibold' : 'text-slate-300'}
                >
                  <td className="py-2.5 px-4 font-mono-tabular">{row.position}</td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-4 rounded-xs shrink-0"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="font-mono-tabular text-slate-400">#{row.number}</span>
                      <span>{row.name}</span>
                      {row.isPlayer && (
                        <span className="text-xs text-rose-400 font-semibold">· TÚ</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-mono-tabular">
                    {row.lap}/{result.totalLaps}
                  </td>
                  <td className="py-2.5 px-4 font-mono-tabular text-emerald-400">
                    {formatLapTime(row.bestLapMs)}
                  </td>
                  <td className="py-2.5 px-4 font-mono-tabular text-right">
                    {row.position === 1
                      ? formatLapTime(row.totalTimeMs)
                      : `+${row.gapSeconds.toFixed(2)}s`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            onClick={onBackToMenu}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Home className="w-4 h-4" />
            <span>Menú Principal</span>
          </button>
          <button
            onClick={onRetry}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reiniciar Partida</span>
          </button>
          {hasNextChampRound && onNextChampRound && (
            <button
              onClick={onNextChampRound}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>Siguiente Ronda</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
