import React from 'react';
import { 
  Building2, 
  RotateCcw, 
  Code2, 
  Calendar, 
  Fuel, 
  CheckCircle2, 
  Layers,
  LogOut,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import { ActiveTab, DashboardMetrics, Branch, Profile } from '../types';

interface TopHeaderProps {
  activeTab: ActiveTab;
  metrics: DashboardMetrics;
  currentBranch?: Branch;
  currentUser?: Profile | null;
  onResetSeed: () => void;
  onOpenSqlModal: () => void;
  onLogout?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  metrics,
  currentBranch,
  currentUser,
  onResetSeed,
  onOpenSqlModal,
  onLogout,
}) => {
  const isBranchView = activeTab === 'vehicles' || activeTab === 'maintenance';

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'لوحة مؤشرات الأداء والجاهزية الفنية';
      case 'vehicles':
        return currentBranch ? `سجل آليات ومعدات ${currentBranch.name}` : 'سجل الآليات والمعدات الميدانية';
      case 'maintenance':
        return currentBranch ? `أوامر وسجلات صيانة ${currentBranch.name}` : 'سجلات الصيانة والإصلاحات الدورية';
      case 'reports':
        return 'مركز التقارير الفنية وتصدير المستندات الرسمية (PDF)';
      case 'backup':
        return 'النسخ الاحتياطي واستعادة البيانات (JSON)';
      case 'settings':
        return 'إعدادات المنظومة وقاعدة بيانات Supabase';
      default:
        return 'لوحة التحكم';
    }
  };

  const todayDateFormatted = new Intl.DateTimeFormat('ar-SY', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <header 
      id="top-header"
      className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-3.5 sticky top-0 z-20"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Department Information */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-bold text-white tracking-tight">
                {isBranchView && currentBranch 
                  ? currentBranch.name 
                  : 'الشركة السورية للبترول (SPC) • منظومة آليات الفروع'}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30">
                {isBranchView && currentBranch ? currentBranch.code : '5 فروع ميدانية'}
              </span>
              {isBranchView && currentBranch?.is_headquarters && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-bold border border-blue-500/30">
                  الإدارة العامة
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="font-semibold text-slate-300">{getTabTitle()}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {todayDateFormatted}
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                قاعدة بيانات نشطة
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons & Fast Summary Stats */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Authenticated User Status Pill */}
          {currentUser && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-750 text-xs">
              <span className={`w-2 h-2 rounded-full ${
                currentUser.role === 'admin' ? 'bg-amber-400' : 'bg-blue-400'
              }`} />
              <span className="text-slate-200 font-bold">{currentUser.full_name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                currentUser.role === 'admin'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-blue-500/20 text-blue-300'
              }`}>
                {currentUser.role === 'admin' ? 'Admin' : currentUser.branch?.code || 'فرع'}
              </span>
            </div>
          )}

          {/* Quick Fleet Readiness Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
            <span className="text-slate-400">الجاهزية:</span>
            <span className="font-bold text-emerald-400">{metrics.readinessRate}%</span>
            <span className="text-slate-500">({metrics.operationalCount} / {metrics.totalVehicles})</span>
          </div>

          {/* Reset Seed Button - Available to Admin */}
          {currentUser?.role === 'admin' && (
            <button
              id="btn-reset-seed"
              onClick={onResetSeed}
              title="إعادة تعيين البيانات التجريبية الأولية"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>إعادة ضبط البيانات (Seed)</span>
            </button>
          )}

          {/* Supabase Schema Modal Button */}
          <button
            id="btn-header-supabase"
            onClick={onOpenSqlModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm shadow-amber-500/20 cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>مخطط Supabase & RLS</span>
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              id="btn-header-logout"
              onClick={onLogout}
              title="تسجيل الخروج"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/40 text-xs font-medium transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
