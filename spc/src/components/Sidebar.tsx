import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Building2,
  ChevronDown,
  ChevronRight,
  Truck, 
  Wrench, 
  FileBarChart2, 
  Database, 
  Settings, 
  Flame, 
  Code2,
  MapPin,
  LogOut,
  ShieldCheck,
  UserCheck,
  Fuel
} from 'lucide-react';
import { ActiveTab, Branch, Profile } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedBranchId: string;
  onSelectBranch: (branchId: string) => void;
  branches: Branch[];
  branchVehicleCounts: Record<string, number>;
  branchMaintenanceCounts: Record<string, number>;
  currentUser?: Profile | null;
  onLogout?: () => void;
  onOpenSqlModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  selectedBranchId,
  onSelectBranch,
  branches,
  branchVehicleCounts,
  branchMaintenanceCounts,
  currentUser,
  onLogout,
  onOpenSqlModal,
}) => {
  const [branchesExpanded, setBranchesExpanded] = useState(true);

  const isBranchViewActive = activeTab === 'vehicles' || activeTab === 'maintenance';

  // RLS Rule: If branch_user, strictly show ONLY their branch (never show other branches)
  const visibleBranches = currentUser?.role === 'branch_user' && currentUser.branch_id
    ? branches.filter((b) => b.id === currentUser.branch_id)
    : branches;

  return (
    <aside 
      id="main-sidebar"
      className="w-72 bg-slate-950 border-l border-slate-800/80 flex flex-col justify-between shrink-0 select-none h-screen sticky top-0 z-30"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0 text-slate-950 font-black">
            <Flame className="w-6 h-6 text-slate-950 fill-slate-950" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-white">الشركة السورية للبترول</span>
            </div>
            <p className="text-xs font-semibold text-amber-400/90 truncate">SPC • إدارة آليات الفروع</p>
          </div>
        </div>

        {/* System connectivity badge */}
        <div className="mt-4 px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="text-slate-300 font-medium truncate max-w-[140px]">
            {currentUser?.role === 'branch_user' 
              ? (visibleBranches[0]?.name || 'فرع مخصص')
              : 'الأسطول الميداني المتكامل'}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {currentUser?.role === 'branch_user' ? 'مقيد بالفرع (RLS)' : '5 فروع متزامنة'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        
        {/* 1. Dashboard Link */}
        <button
          id="nav-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`w-full group flex items-center justify-between px-3.5 py-3 rounded-xl text-right transition-all duration-200 text-sm font-medium ${
            activeTab === 'dashboard'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10 font-bold'
              : 'text-slate-300 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <LayoutDashboard
              className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                activeTab === 'dashboard' ? 'text-slate-950' : 'text-amber-400/80'
              }`}
            />
            <div className="truncate text-right">
              <div className="truncate leading-snug">لوحة التحكم</div>
              <div
                className={`text-[11px] truncate ${
                  activeTab === 'dashboard' ? 'text-slate-900/80' : 'text-slate-400'
                }`}
              >
                المؤشرات والجاهزية الشاملة
              </div>
            </div>
          </div>
        </button>

        {/* 2. Collapsible Branches Section (Replacing single Vehicles item) */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-2 pb-2">
            <button
              onClick={() => setBranchesExpanded(!branchesExpanded)}
              className="flex items-center gap-2 text-[11px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider transition-colors w-full text-right"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-500" />
              <span>{currentUser?.role === 'branch_user' ? 'فرعك المخصص' : `الفروع (${visibleBranches.length})`}</span>
              {branchesExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 mr-auto text-slate-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 mr-auto text-slate-500" />
              )}
            </button>
          </div>

          {branchesExpanded && (
            <div className="space-y-1 pr-1 border-r border-slate-800/80 mr-2">
              {visibleBranches.map((branch) => {
                const isCurrentBranch = isBranchViewActive && selectedBranchId === branch.id;
                const vCount = branchVehicleCounts[branch.id] || 0;
                const mCount = branchMaintenanceCounts[branch.id] || 0;

                return (
                  <div key={branch.id} className="space-y-1">
                    {/* Branch Main Button */}
                    <button
                      id={`nav-branch-${branch.code.toLowerCase()}`}
                      onClick={() => {
                        onSelectBranch(branch.id);
                        setActiveTab('vehicles');
                      }}
                      className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-right transition-all duration-150 text-xs font-semibold ${
                        isCurrentBranch
                          ? 'bg-slate-850 text-amber-300 border border-amber-500/30 shadow-sm'
                          : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          isCurrentBranch ? 'bg-amber-400 ring-2 ring-amber-400/30' : 'bg-slate-600'
                        }`} />
                        <div className="truncate text-right">
                          <div className="truncate font-semibold">{branch.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <span>{branch.code}</span>
                            {branch.is_headquarters && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-sans">
                                المركز الرئيسي
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Vehicle count badge */}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                          vCount > 0
                            ? isCurrentBranch 
                              ? 'bg-amber-400 text-slate-950' 
                              : 'bg-slate-800 text-slate-300'
                            : 'bg-slate-900 text-slate-500 border border-slate-800'
                        }`}
                        title={`${vCount} آلية مسجلة`}
                      >
                        {vCount}
                      </span>
                    </button>

                    {/* If this branch is currently selected and active in branch view, show sub-screens switcher */}
                    {isCurrentBranch && (
                      <div className="mr-4 pr-2 border-r border-amber-500/20 space-y-0.5 py-1">
                        <button
                          onClick={() => setActiveTab('vehicles')}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-right text-[11px] transition-colors ${
                            activeTab === 'vehicles'
                              ? 'bg-amber-500/20 text-amber-200 font-bold border border-amber-500/40'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Truck className="w-3.5 h-3.5" />
                            <span>شاشة الآليات (Master-Detail)</span>
                          </div>
                          <span className="text-[10px] font-mono opacity-80">{vCount}</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('maintenance')}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-right text-[11px] transition-colors ${
                            activeTab === 'maintenance'
                              ? 'bg-amber-500/20 text-amber-200 font-bold border border-amber-500/40'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Wrench className="w-3.5 h-3.5" />
                            <span>شاشة أوامر الصيانة</span>
                          </div>
                          <span className="text-[10px] font-mono opacity-80">{mCount}</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('fuel_vouchers')}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-right text-[11px] transition-colors ${
                            activeTab === 'fuel_vouchers'
                              ? 'bg-amber-500/20 text-amber-200 font-bold border border-amber-500/40'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Fuel className="w-3.5 h-3.5" />
                            <span>قسائم وقود الفرع</span>
                          </div>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">حصة</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Non-branch general pages */}
        <div className="pt-3 border-t border-slate-800/80 space-y-1">
          <div className="px-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            العمليات والتقارير
          </div>

          {/* Fuel Vouchers (Global / Branch-filtered) */}
          <button
            id="nav-fuel-vouchers"
            onClick={() => setActiveTab('fuel_vouchers')}
            className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-right transition-all duration-200 text-sm font-medium ${
              activeTab === 'fuel_vouchers'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Fuel
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'fuel_vouchers' ? 'text-slate-950' : 'text-amber-400/80'
                }`}
              />
              <span className="truncate">قسائم الوقود والمحروقات</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'fuel_vouchers' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              جديد
            </span>
          </button>

          {/* Reports */}
          <button
            id="nav-reports"
            onClick={() => setActiveTab('reports')}
            className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-right transition-all duration-200 text-sm font-medium ${
              activeTab === 'reports'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileBarChart2
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'reports' ? 'text-slate-950' : 'text-amber-400/80'
                }`}
              />
              <span className="truncate">التقارير والإحصائيات</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'reports' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              PDF
            </span>
          </button>

          {/* Backup */}
          <button
            id="nav-backup"
            onClick={() => setActiveTab('backup')}
            className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-right transition-all duration-200 text-sm font-medium ${
              activeTab === 'backup'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Database
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'backup' ? 'text-slate-950' : 'text-amber-400/80'
                }`}
              />
              <span className="truncate">النسخ الاحتياطي</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'backup' ? 'bg-slate-950 text-amber-400' : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              JSON
            </span>
          </button>

          {/* Settings */}
          <button
            id="nav-settings"
            onClick={() => setActiveTab('settings')}
            className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-right transition-all duration-200 text-sm font-medium ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Settings
                className={`w-4 h-4 shrink-0 ${
                  activeTab === 'settings' ? 'text-slate-950' : 'text-amber-400/80'
                }`}
              />
              <span className="truncate">إعدادات النظام</span>
            </div>
          </button>
        </div>
      </div>

      {/* Supabase Schema & Database Box in Sidebar */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        <button
          id="btn-open-supabase-modal"
          onClick={onOpenSqlModal}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 text-amber-300 hover:text-amber-200 transition-colors text-xs font-semibold group"
        >
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>مخطط Supabase DDL</span>
          </div>
          <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
            5 فروع
          </span>
        </button>

        {/* User Profile Card & Sign Out */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              currentUser?.role === 'admin' 
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' 
                : 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
            }`}>
              {currentUser?.role === 'admin' ? 'ADM' : 'BRN'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-200 truncate">
                {currentUser?.full_name || 'مستخدم النظام'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                  currentUser?.role === 'admin'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-blue-500/20 text-blue-300'
                }`}>
                  {currentUser?.role === 'admin' ? 'مشرف عام' : 'مستخدم فرع'}
                </span>
                {currentUser?.branch && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {currentUser.branch.code}
                  </span>
                )}
              </div>
            </div>
          </div>

          {onLogout && (
            <button
              id="btn-sidebar-logout"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-950 hover:bg-rose-950/30 text-slate-400 hover:text-rose-300 border border-slate-850 hover:border-rose-800/40 transition-colors text-xs font-medium cursor-pointer"
              title="تسجيل الخروج والعودة لشاشة الدخول"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

