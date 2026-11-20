import { useEffect, useState } from 'react';
import { FEATURED_CIRCUITS, getCircuitById } from '../data/circuits';
import { CircuitId, LeaderboardEntry } from '../types/game';
import { formatLapTime } from '../utils/formatters';
import { useI18n } from '../utils/i18n';

const TIRE_LABEL: Record<string, string> = {
  soft: 'Blando',
  medium: 'Medio',
  hard: 'Duro',
};

const MODE_LABEL: Record<string, string> = {
  career: 'Carrera',
  online: 'Online',
  timetrial: 'Contrarreloj',
  quickrace: 'Rápida',
};

export default function LeaderboardView() {
  const { t } = useI18n();
  const [filterCircuit, setFilterCircuit] = useState<'all' | CircuitId>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/leaderboard?circuit=${filterCircuit}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setEntries(data.entries ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filterCircuit]);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            {t.leaderboard.title}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {t.leaderboard.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#121822] p-1 border border-white/10">
          <button
            type="button"
            onClick={() => setFilterCircuit('all')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
              filterCircuit === 'all'
                ? 'bg-rose-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {t.leaderboard.all}
          </button>
          {FEATURED_CIRCUITS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilterCircuit(c.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
                filterCircuit === c.id
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {c.shortName}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0F141C] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">
            {t.leaderboard.loading}
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            {t.leaderboard.empty}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-[#0B1017] text-xs text-slate-400">
                  <th className="py-3.5 px-5 font-medium">{t.leaderboard.pos}</th>
                  <th className="py-3.5 px-4 font-medium">{t.leaderboard.driver}</th>
                  <th className="py-3.5 px-4 font-medium">{t.leaderboard.team}</th>
                  <th className="py-3.5 px-4 font-medium">{t.leaderboard.circuit}</th>
                  <th className="py-3.5 px-4 font-medium">{t.leaderboard.tire}</th>
                  <th className="py-3.5 px-4 font-medium">{t.leaderboard.mode}</th>
                  <th className="py-3.5 px-5 font-medium text-right">
                    {t.leaderboard.bestLap}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {entries.map((row, idx) => (
                  <tr
                    key={row.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-5 font-mono-tabular font-bold text-slate-300">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {row.driverName}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{row.teamName}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {getCircuitById(row.circuitId).shortName}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-300">
                      {TIRE_LABEL[row.tireCompound] ?? row.tireCompound}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {MODE_LABEL[row.mode] ?? row.mode}
                    </td>
                    <td className="py-3 px-5 text-right font-mono-tabular font-bold text-amber-400">
                      {formatLapTime(row.lapTimeMs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
