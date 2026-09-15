import React from 'react';
import { 
  Truck, 
  CheckCircle2, 
  AlertOctagon, 
  Coins, 
  Fuel, 
  Wrench, 
  ArrowUpRight, 
  Clock, 
  MapPin, 
  Layers, 
  AlertTriangle,
  Building,
  Calendar,
  Building2,
  ChevronRight,
  Plus
} from 'lucide-react';
import { DashboardMetrics, MaintenanceWithVehicle, Vehicle, Branch, Profile } from '../types';
import { KpiCard } from './KpiCard';

interface DashboardViewProps {
  metrics: DashboardMetrics;
  recentMaintenance: MaintenanceWithVehicle[];
  vehicles: Vehicle[];
  branches: Branch[];
  selectedBranchFilter: string; // 'all' or branch.id
  currentUser?: Profile | null;
  onSelectBranchFilter: (branchId: string) => void;
  onNavigateToBranch: (branchId: string) => void;
  onViewAllVehicles: () => void;
  onViewAllMaintenance: () => void;
  onOpenAddVehicle?: () => void;
  onOpenAddMaintenance?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  recentMaintenance,
  vehicles,
  branches,
  selectedBranchFilter,
  currentUser,
  onSelectBranchFilter,
  onNavigateToBranch,
  onViewAllVehicles,
  onViewAllMaintenance,
  onOpenAddVehicle,
  onOpenAddMaintenance,
}) => {
  // Format currency in Syrian Pounds
  const formatSyp = (amount: number) => {
    return new Intl.NumberFormat('ar-SY').format(amount) + ' ل.س';
  };

  const brokenVehicles = vehicles.filter((v) => v.status === 'متعطلة');
  const brokenPercent = metrics.totalVehicles > 0 ? Math.round((metrics.brokenCount / metrics.totalVehicles) * 100) : 0;

  const activeBranch = branches.find((b) => b.id === selectedBranchFilter);
  const isFilteredToSpecificBranch = selectedBranchFilter !== 'all';

  return (
    <div className="space-y-6">
      
      {/* Top Branch Filter & Sub-Tab Bar - Locked for branch_user */}
      {currentUser?.role === 'branch_user' || branches.length <= 1 ? (
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">لوحة مؤشرات أداء:</span>
                <span className="text-sm font-bold text-white">{activeBranch?.name || branches[0]?.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                  {activeBranch?.code || branches[0]?.code}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                تم قفل نطاق العرض على فرعك المخصص وفقاً لسياسات الأمان وقواعد Row Level Security (RLS)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateToBranch(activeBranch?.id || branches[0]?.id)}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>فتح قائمة آليات الفرع</span>
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            <div className="flex items-center gap-1.5 px-3 text-xs font-bold text-slate-400 shrink-0">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>نطاق العرض:</span>
            </div>

            {/* All Branches Button */}
            <button
              id="filter-branch-all"
              onClick={() => onSelectBranchFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedBranchFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>كل الفروع (مجمّع)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                selectedBranchFilter === 'all' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}>
                5
              </span>
            </button>

            {/* Branch Sub-Tabs */}
            {branches.map((branch) => {
              const isSelected = selectedBranchFilter === branch.id;
              const summary = metrics.branchSummaries?.find((s) => s.branch.id === branch.id);
              const count = summary ? summary.totalVehicles : 0;

              return (
                <button
                  key={branch.id}
                  id={`filter-branch-${branch.code.toLowerCase()}`}
                  onClick={() => onSelectBranchFilter(branch.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  <span>{branch.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected 
                      ? 'bg-slate-950 text-amber-400' 
                      : count > 0 
                      ? 'bg-slate-800 text-amber-300' 
                      : 'bg-slate-850 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {isFilteredToSpecificBranch && activeBranch && (
            <div className="flex items-center gap-2 shrink-0 pr-2">
              <button
                onClick={() => onNavigateToBranch(activeBranch.id)}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors flex items-center gap-1.5"
              >
                <span>فتح شاشة آليات هذا الفرع</span>
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State Banner if Filtered to an Empty Branch */}
      {isFilteredToSpecificBranch && metrics.totalVehicles === 0 && (
        <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-500">
            <Truck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              لا توجد آليات مسجلة بعد في هذا الفرع ({activeBranch?.name})
            </h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              سجلات أسطول {activeBranch?.name} خالية حالياً من أي مركبات أو معدات أو أوامر صيانة.
              يمكنك إضافة أول آلية لأسطول هذا الفرع أو استعراض فروع الشركة الأخرى.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {onOpenAddVehicle && (
              <button
                onClick={onOpenAddVehicle}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة آلية لفرع {activeBranch?.name}</span>
              </button>
            )}
            <button
              onClick={() => onSelectBranchFilter('all')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              الرجوع لمؤشرات كل الفروع
            </button>
          </div>
        </div>
      )}

      {/* 1. KPI Cards Row (5 Cards) */}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">مؤشرات الأداء الرئيسية</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            id="kpi-total-vehicles"
            title="إجمالي الآليات والمعدات"
            value={metrics.totalVehicles}
            subtitle={isFilteredToSpecificBranch ? `فرع: ${activeBranch?.name}` : "الأسطول الميداني المجمع"}
            icon={Truck}
            colorScheme="blue"
            accentBadge={isFilteredToSpecificBranch ? (activeBranch?.code || 'فرع') : "5 فروع"}
            trend={metrics.totalVehicles > 0 ? "100% مسجل" : "لا توجد آليات"}
          />

          <KpiCard
            id="kpi-operational-vehicles"
            title="الآليات التي تعمل"
            value={metrics.operationalCount}
            subtitle={`الجاهزية الفنية: ${metrics.readinessRate}%`}
            icon={CheckCircle2}
            colorScheme="emerald"
            accentBadge={`${metrics.readinessRate}% جاهزة`}
            trend="في الخدمة الميدانية"
          />

          <KpiCard
            id="kpi-broken-vehicles"
            title="الآليات المتعطلة"
            value={metrics.brokenCount}
            subtitle="تحتاج صيانة وإصلاح عاجل"
            icon={AlertOctagon}
            colorScheme="rose"
            accentBadge={`${brokenPercent}%`}
            trend="في ورشات الصيانة"
          />

          <KpiCard
            id="kpi-out-of-service"
            title="خارج الخدمة / معارة"
            value={metrics.outOfServiceCount + metrics.loanedCount}
            subtitle={`${metrics.outOfServiceCount} منسقة • ${metrics.loanedCount} معارة`}
            icon={Clock}
            colorScheme="slate"
            accentBadge="حجز ومسح"
            trend="غير نشطة"
          />

          <KpiCard
            id="kpi-total-maintenance-cost"
            title="إجمالي تكاليف الصيانة"
            value={formatSyp(metrics.totalMaintenanceCost)}
            subtitle="مجموع أوامر الصيانة المنفذة"
            icon={Coins}
            colorScheme="amber"
            accentBadge="ل.س سوري"
            trend={`${recentMaintenance.length} سجل صيانة`}
          />
        </div>
      </section>

      {/* Cross-Branch Side-by-Side Comparison (Shown ONLY to Admin when viewing "All Branches") */}
      {currentUser?.role === 'admin' && selectedBranchFilter === 'all' && metrics.branchSummaries && (
        <section 
          id="branch-comparison-section"
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">المقارنة البصرية الشاملة بين الفروع الخمسة</h3>
                <p className="text-xs text-slate-400">توزيع الآليات، معدلات الجاهزية الفنية، وتكاليف الصيانة لكل فرع</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              مقارنة متزامنة لـ 5 إدارات
            </span>
          </div>

          {/* 5 Column Side-by-Side KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {metrics.branchSummaries.map((summary) => {
              const b = summary.branch;
              const hasVehicles = summary.totalVehicles > 0;

              return (
                <div
                  key={b.id}
                  id={`branch-kpi-card-${b.code.toLowerCase()}`}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    hasVehicles
                      ? 'bg-slate-950/80 border-slate-700/80 shadow-sm hover:border-amber-500/40'
                      : 'bg-slate-950/40 border-slate-800/80 opacity-80'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-white block leading-snug truncate" title={b.name}>
                          {b.name}
                        </span>
                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                          {b.code}
                        </span>
                      </div>
                      {b.is_headquarters && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shrink-0">
                          المركز
                        </span>
                      )}
                    </div>

                    {/* Total vehicles big number */}
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
                      <span className="text-2xl font-black text-white font-mono block">
                        {summary.totalVehicles}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {summary.totalVehicles === 1 ? 'آلية واحدة' : 'آليات مسجلة'}
                      </span>
                    </div>

                    {/* Readiness progress bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">الجاهزية الفنية:</span>
                        <span className={`font-bold font-mono ${
                          summary.readinessRate >= 70 
                            ? 'text-emerald-400' 
                            : summary.readinessRate > 0 
                            ? 'text-amber-400' 
                            : 'text-slate-500'
                        }`}>
                          {hasVehicles ? `${summary.readinessRate}%` : '—'}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            summary.readinessRate >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${summary.readinessRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Status mini breakdown */}
                    <div className="grid grid-cols-3 gap-1 text-center text-[10px] pt-1">
                      <div className="p-1.5 rounded bg-emerald-950/20 border border-emerald-900/30">
                        <span className="block font-bold text-emerald-400 font-mono">{summary.operationalCount}</span>
                        <span className="text-slate-400 text-[9px]">تعمل</span>
                      </div>
                      <div className="p-1.5 rounded bg-rose-950/20 border border-rose-900/30">
                        <span className="block font-bold text-rose-400 font-mono">{summary.brokenCount}</span>
                        <span className="text-slate-400 text-[9px]">عطل</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                        <span className="block font-bold text-slate-300 font-mono">
                          {summary.outOfServiceCount + summary.loanedCount}
                        </span>
                        <span className="text-slate-400 text-[9px]">أخرى</span>
                      </div>
                    </div>

                    {/* Maintenance Cost & count */}
                    <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span>أوامر الصيانة:</span>
                        <span className="font-bold text-slate-200 font-mono">{summary.maintenanceCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>إجمالي التكلفة:</span>
                        <span className="font-bold text-amber-400 truncate max-w-[90px]" title={formatSyp(summary.totalMaintenanceCost)}>
                          {summary.totalMaintenanceCost > 0 ? formatSyp(summary.totalMaintenanceCost) : '0 ل.س'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Open branch button */}
                  <button
                    onClick={() => onNavigateToBranch(b.id)}
                    className="mt-3 w-full py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 text-[11px] font-semibold text-slate-300 hover:text-amber-300 transition-colors flex items-center justify-center gap-1"
                  >
                    <span>عرض أسطول الفرع</span>
                    <ChevronRight className="w-3 h-3 rotate-180" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. Main Multi-Column Content (3 Columns on Large Screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RIGHT/CENTER COLUMN: Recent Maintenance Operations (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Recent Maintenance Section */}
          <div 
            id="recent-maintenance-card"
            className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-sm"
          >
            <div className="p-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">آخر عمليات وسجلات الصيانة</h3>
                  <p className="text-xs text-slate-400">أحدث أوامر الإصلاح والإعمار الميكانيكي المنفذة</p>
                </div>
              </div>

              <button
                id="btn-view-all-maintenance"
                onClick={onViewAllMaintenance}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700"
              >
                <span>عرض كافة السجلات</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Maintenance Records Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                  <tr>
                    <th scope="col" className="py-3 px-4 font-bold">الآلية / الرقم</th>
                    <th scope="col" className="py-3 px-4 font-bold">تاريخ الصيانة</th>
                    <th scope="col" className="py-3 px-4 font-bold min-w-[200px]">وصف العطل والإصلاح</th>
                    <th scope="col" className="py-3 px-4 font-bold">جهة التنفيذ</th>
                    <th scope="col" className="py-3 px-4 font-bold text-left">التكلفة الإجمالية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentMaintenance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 space-y-3">
                        <Wrench className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="font-bold text-sm text-slate-300">لا توجد سجلات صيانة مسجلة حتى الآن</p>
                        <p className="text-xs text-slate-500">يمكنك تسجيل أول أمر صيانة لأي آلية في أسطول دير الزور</p>
                        {onOpenAddMaintenance && (
                          <button
                            onClick={onOpenAddMaintenance}
                            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-semibold transition-colors"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>تسجيل أمر صيانة الآن</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    recentMaintenance.slice(0, 6).map((rec) => (
                      <tr 
                        key={rec.id} 
                        className="hover:bg-slate-850/50 transition-colors group"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                            {rec.vehicle?.vehicle_number || rec.vehicle_id}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                            {rec.vehicle?.vehicle_type || 'آلية ميدانية'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{rec.maintenance_date}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-slate-300 line-clamp-2 leading-relaxed">
                            {rec.description}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] border border-slate-700/60 font-medium">
                            {rec.performed_by}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-left font-bold text-amber-400">
                          {formatSyp(rec.cost)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-950/40 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>عرض أحدث {Math.min(6, recentMaintenance.length)} عمليات صيانة من أصل {recentMaintenance.length}</span>
              <span className="text-slate-500">تم الحفظ محلياً وجاهز للترحيل إلى Supabase</span>
            </div>
          </div>

          {/* Quick Active Fleet Snapshot */}
          <div 
            id="fleet-overview-card"
            className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-base text-white">نظرة عامة سريعة على أسطول الآليات</h3>
                <p className="text-xs text-slate-400">عينة من الآليات الميدانية النشطة في قطاعات دير الزور</p>
              </div>

              <div className="flex items-center gap-2">
                {onOpenAddVehicle && (
                  <button
                    onClick={onOpenAddVehicle}
                    className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30"
                  >
                    <span>+ إضافة آلية</span>
                  </button>
                )}
                <button
                  id="btn-view-fleet-table"
                  onClick={onViewAllVehicles}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-amber-300 transition-colors"
                >
                  <span>الانتقال لجدول الآليات الكامل</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {vehicles.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-400 space-y-3">
                <Truck className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-bold text-sm text-slate-300">لا توجد آليات مسجلة في المنظومة</p>
                <p className="text-xs text-slate-500">قم بإضافة آلية جديدة أو استعادة نسخة احتياطية من البيانات</p>
                {onOpenAddVehicle && (
                  <button
                    onClick={onOpenAddVehicle}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-semibold transition-colors"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>إضافة آلية جديدة</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vehicles.slice(0, 4).map((veh) => {
                  const statusStyles = {
                    'تعمل': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                    'متعطلة': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
                    'خارج الخدمة': 'bg-slate-800 text-slate-400 border-slate-700',
                    'معارة': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                  }[veh.status];

                  return (
                    <div 
                      key={veh.id}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 text-sm">{veh.vehicle_number}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusStyles}`}>
                            {veh.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 truncate font-medium">{veh.vehicle_type}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-500/80" />
                            <span className="truncate max-w-[150px]">{veh.current_location}</span>
                          </span>
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        <span className="text-[10px] block px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-semibold border border-slate-700">
                          {veh.category}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-1">سنة {veh.manufacture_year}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* LEFT/SIDE COLUMN: Distribution by Category, Fuel & Urgent Alerts (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Distribution by Category */}
          <div 
            id="category-distribution-card"
            className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">توزيع الآليات حسب الفئة</h3>
                  <p className="text-[11px] text-slate-400">تصنيف استلام الآلية والوقود</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                {metrics.totalVehicles} آلية
              </span>
            </div>

            <div className="space-y-4 pt-1">
              {metrics.categoryStats.map((item) => {
                const colorBar = 
                  item.category === 'بنزين إرسال حديث'
                    ? 'bg-gradient-to-l from-emerald-500 to-teal-400'
                    : item.category === 'بنزين استلام قديم'
                    ? 'bg-gradient-to-l from-amber-500 to-orange-400'
                    : 'bg-gradient-to-l from-blue-500 to-indigo-400';

                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{item.category}</span>
                      <div className="flex items-center gap-2 font-mono text-slate-300">
                        <span className="font-bold text-white">{item.count} آلية</span>
                        <span className="text-slate-400">({item.percentage}%)</span>
                      </div>
                    </div>
                    {/* Progress Track */}
                    <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${colorBar}`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>منها تعمل: <span className="text-emerald-400 font-semibold">{item.operational}</span></span>
                      <span>متعطلة / أخرى: <span className="text-rose-400 font-semibold">{item.count - item.operational}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fuel Type Distribution */}
          <div 
            id="fuel-distribution-card"
            className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Fuel className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">توزيع نوع الوقود</h3>
                <p className="text-[11px] text-slate-400">استهلاك مازوت ديزل مقابل بنزين</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {metrics.fuelStats.map((fuel) => {
                const isMazut = fuel.fuel === 'مازوت';
                return (
                  <div 
                    key={fuel.fuel} 
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-300">{fuel.fuel}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${isMazut ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-white">{fuel.count}</span>
                      <span className="text-[11px] text-slate-400">آلية</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {metrics.totalVehicles > 0 ? Math.round((fuel.count / metrics.totalVehicles) * 100) : 0}% من مجمل الأسطول
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Urgent Attention: Broken Vehicles */}
          <div 
            id="urgent-broken-card"
            className="rounded-2xl bg-slate-900/80 border border-rose-500/30 p-5 shadow-sm space-y-3 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-1 h-full bg-rose-500"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="font-bold text-sm text-slate-100">تنبيهات الآليات المتعطلة</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {brokenVehicles.length} عاجلة
              </span>
            </div>

            {brokenVehicles.length > 0 ? (
              <>
                <p className="text-xs text-slate-300 leading-relaxed">
                  آليات حرجة بحاجة لمتابعة توريد قطع التبديل والإنهاء الفني من الورشات:
                </p>

                <div className="space-y-2 pt-1">
                  {brokenVehicles.map((bv) => (
                    <div 
                      key={bv.id}
                      className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/20 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-rose-300 block">{bv.vehicle_number}</span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">{bv.vehicle_type}</span>
                      </div>
                      <span className="text-[10px] text-rose-400 bg-rose-950/60 px-2 py-1 rounded border border-rose-800">
                        {bv.assigned_department}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>كافة آليات الأسطول في حالة تشغيلية ممتازة ولا توجد أعطال حرجة.</span>
              </div>
            )}
          </div>

          {/* Key Field Locations */}
          <div 
            id="departments-overview-card"
            className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">توزيع الآليات على الأقسام</h3>
            </div>

            <div className="space-y-2 text-xs">
              {metrics.departmentStats.slice(0, 5).map((dept) => (
                <div 
                  key={dept.department} 
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-850"
                >
                  <span className="text-slate-300 truncate max-w-[180px]">{dept.department}</span>
                  <span className="font-bold font-mono text-amber-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
                    {dept.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
