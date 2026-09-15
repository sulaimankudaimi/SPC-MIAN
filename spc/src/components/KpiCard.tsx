import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  id: string;
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  trend?: string;
  colorScheme: 'amber' | 'emerald' | 'rose' | 'blue' | 'slate';
  accentBadge?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme,
  accentBadge,
}) => {
  const colorMap = {
    amber: {
      bg: 'from-amber-500/10 to-amber-600/5',
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/15 text-amber-400',
      valueText: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    emerald: {
      bg: 'from-emerald-500/10 to-emerald-600/5',
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/15 text-emerald-400',
      valueText: 'text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    rose: {
      bg: 'from-rose-500/10 to-rose-600/5',
      border: 'border-rose-500/20 hover:border-rose-500/40',
      iconBg: 'bg-rose-500/15 text-rose-400',
      valueText: 'text-rose-400',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    blue: {
      bg: 'from-blue-500/10 to-blue-600/5',
      border: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/15 text-blue-400',
      valueText: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    slate: {
      bg: 'from-slate-800/40 to-slate-900/40',
      border: 'border-slate-800 hover:border-slate-700',
      iconBg: 'bg-slate-800 text-slate-300',
      valueText: 'text-slate-100',
      badge: 'bg-slate-800 text-slate-300 border-slate-700',
    },
  };

  const scheme = colorMap[colorScheme];

  return (
    <div
      id={id}
      className={`rounded-2xl bg-gradient-to-b ${scheme.bg} bg-slate-900/70 border ${scheme.border} p-5 transition-all duration-200 hover:-translate-y-0.5 shadow-sm relative overflow-hidden flex flex-col justify-between`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 leading-none">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl lg:text-3xl font-black tracking-tight ${scheme.valueText}`}>
              {value}
            </span>
            {accentBadge && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${scheme.badge}`}>
                {accentBadge}
              </span>
            )}
          </div>
        </div>

        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <span className="truncate">{subtitle}</span>
        {trend && (
          <span className="font-semibold text-slate-300 shrink-0 text-[11px]">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};
