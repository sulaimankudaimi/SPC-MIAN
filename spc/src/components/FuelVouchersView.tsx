import React, { useState, useMemo } from 'react';
import { 
  Fuel, 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  FileText, 
  Download, 
  ArrowUpDown, 
  Gauge, 
  Truck, 
  TrendingUp,
  Clock,
  Trash2,
  Printer
} from 'lucide-react';
import { Vehicle, FuelVoucher, Branch, Profile, FuelVoucherWithVehicle } from '../types';
import { StorageService } from '../services/storageService';

interface FuelVouchersViewProps {
  vehicles: Vehicle[];
  branches: Branch[];
  currentUser?: Profile | null;
  selectedBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onOpenIssueVoucher: (vehicleId?: string) => void;
  onRefreshData?: () => void;
}

export const FuelVouchersView: React.FC<FuelVouchersViewProps> = ({
  vehicles,
  branches,
  currentUser,
  selectedBranchId,
  onSelectBranch,
  onSelectVehicle,
  onOpenIssueVoucher,
  onRefreshData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'quotas' | 'vouchers'>('quotas');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)); // e.g. "2026-09"
  const [fuelTypeFilter, setFuelTypeFilter] = useState<'all' | 'بنزين' | 'مازوت'>('all');
  const [quotaStatusFilter, setQuotaStatusFilter] = useState<'all' | 'overquota' | 'withinquota'>('all');
  const [voucherTypeFilter, setVoucherTypeFilter] = useState<'all' | 'داخل المدينة' | 'خارج المدينة'>('all');

  const isAdmin = currentUser?.role === 'admin';
  const isBranchUser = currentUser?.role === 'branch_user';

  // Branches list allowed to be seen
  const allowedBranches = useMemo(() => {
    if (isBranchUser && currentUser?.branch_id) {
      return branches.filter((b) => b.id === currentUser.branch_id);
    }
    return branches;
  }, [branches, isBranchUser, currentUser]);

  // Branch map for quick lookup
  const branchMap = useMemo(() => {
    const map = new Map<string, Branch>();
    branches.forEach((b) => map.set(b.id, b));
    return map;
  }, [branches]);

  // Vehicles filtered by branch selection
  const branchVehicles = useMemo(() => {
    if (selectedBranchId === 'all' || !selectedBranchId) {
      return vehicles;
    }
    return vehicles.filter((v) => v.branch_id === selectedBranchId);
  }, [vehicles, selectedBranchId]);

  // Calculate per-vehicle stats for selected month
  const vehicleFuelStatsList = useMemo(() => {
    return branchVehicles.map((v) => {
      const stats = StorageService.getVehicleMonthlyFuelStats(v.id, selectedMonth);
      const quotaInside = v.fuel_quota_inside_city ?? 180;
      const quotaOutside = v.fuel_quota_outside_city ?? 120;
      const totalQuota = quotaInside + quotaOutside;
      const totalSpent = stats.totalSpent;
      const remaining = Math.max(0, totalQuota - totalSpent);
      const percent = totalQuota > 0 ? Math.round((totalSpent / totalQuota) * 100) : 0;
      const isOverQuota = totalSpent > totalQuota;

      return {
        vehicle: v,
        stats,
        quotaInside,
        quotaOutside,
        totalQuota,
        totalSpent,
        remaining,
        percent,
        isOverQuota,
        branch: branchMap.get(v.branch_id),
      };
    });
  }, [branchVehicles, selectedMonth, branchMap]);

  // Filtered vehicles for the quota monitoring table
  const filteredVehiclesStats = useMemo(() => {
    return vehicleFuelStatsList.filter((item) => {
      const v = item.vehicle;
      const matchesSearch = 
        v.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.assigned_department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFuel = fuelTypeFilter === 'all' || v.fuel_type === fuelTypeFilter;

      let matchesStatus = true;
      if (quotaStatusFilter === 'overquota') {
        matchesStatus = item.isOverQuota;
      } else if (quotaStatusFilter === 'withinquota') {
        matchesStatus = !item.isOverQuota;
      }

      return matchesSearch && matchesFuel && matchesStatus;
    });
  }, [vehicleFuelStatsList, searchTerm, fuelTypeFilter, quotaStatusFilter]);

  // All vouchers with vehicle joined
  const allVouchersWithVehicles = useMemo(() => {
    const rawVouchers = StorageService.getFuelVouchersWithVehicles();
    return rawVouchers.filter((item) => {
      // Filter by branch
      if (selectedBranchId !== 'all' && selectedBranchId) {
        if (item.vehicle?.branch_id !== selectedBranchId) {
          return false;
        }
      }
      // Filter by month
      if (selectedMonth && !item.voucher.issue_date.startsWith(selectedMonth)) {
        return false;
      }
      // Filter by voucher type
      if (voucherTypeFilter !== 'all' && item.voucher.voucher_type !== voucherTypeFilter) {
        return false;
      }
      // Search
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const vNum = item.vehicle?.vehicle_number.toLowerCase() || '';
        const vType = item.vehicle?.vehicle_type.toLowerCase() || '';
        const issuer = item.voucher.issued_by.toLowerCase();
        const notes = (item.voucher.notes || '').toLowerCase();
        if (!vNum.includes(query) && !vType.includes(query) && !issuer.includes(query) && !notes.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [selectedBranchId, selectedMonth, voucherTypeFilter, searchTerm]);

  // Aggregate high-level summary cards for the selected branch & month
  const totalLitersSpent = useMemo(() => {
    return vehicleFuelStatsList.reduce((sum, item) => sum + item.totalSpent, 0);
  }, [vehicleFuelStatsList]);

  const totalInsideSpent = useMemo(() => {
    return vehicleFuelStatsList.reduce((sum, item) => sum + item.stats.insideCitySpent, 0);
  }, [vehicleFuelStatsList]);

  const totalOutsideSpent = useMemo(() => {
    return vehicleFuelStatsList.reduce((sum, item) => sum + item.stats.outsideCitySpent, 0);
  }, [vehicleFuelStatsList]);

  const totalVouchersCount = useMemo(() => {
    return allVouchersWithVehicles.length;
  }, [allVouchersWithVehicles]);

  const overQuotaVehiclesCount = useMemo(() => {
    return vehicleFuelStatsList.filter((item) => item.isOverQuota).length;
  }, [vehicleFuelStatsList]);

  const handleDeleteVoucher = (voucherId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك بحذف قسيمة الوقود هذه؟')) {
      return;
    }
    try {
      StorageService.deleteFuelVoucher(voucherId);
      if (onRefreshData) onRefreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`تعذر حذف القسيمة: ${msg}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="fuel-vouchers-view" className="space-y-6 text-right" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">
                إدارة قسائم الوقود ومخصصات المحروقات
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                سجل المخصصات الرسمية للشركة السورية للبترول (SPC) • رصد الحصص الشهرية والصرف الفعلي
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            title="طباعة تقرير كشف المحروقات"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>طباعة الكشف</span>
          </button>

          <button
            id="btn-new-fuel-voucher"
            onClick={() => onOpenIssueVoucher()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ إصدار قسيمة وقود جديدة</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 block">إجمالي الصرف الفعلي</span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-black text-amber-400">
              {totalLitersSpent.toLocaleString('ar-SY')}
            </span>
            <span className="text-xs text-slate-400">لتر</span>
          </div>
          <span className="text-[10px] text-slate-500 block">لشهر {selectedMonth}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 block">صرف داخل المدينة</span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xl font-bold text-blue-400">
              {totalInsideSpent.toLocaleString('ar-SY')}
            </span>
            <span className="text-xs text-slate-400">لتر</span>
          </div>
          <span className="text-[10px] text-slate-500 block">تشغيل بلدي وتنقل داخلي</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 block">صرف خارج المدينة (مهمات)</span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xl font-bold text-emerald-400">
              {totalOutsideSpent.toLocaleString('ar-SY')}
            </span>
            <span className="text-xs text-slate-400">لتر</span>
          </div>
          <span className="text-[10px] text-slate-500 block">مهمات حقول وخطوط نقل</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 block">عدد القسائم الصادرة</span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xl font-bold text-white">
              {totalVouchersCount}
            </span>
            <span className="text-xs text-slate-400">قسيمة</span>
          </div>
          <span className="text-[10px] text-slate-500 block">ضمن نطاق التصفية المحدد</span>
        </div>

        <div className={`p-4 rounded-2xl border space-y-1 ${
          overQuotaVehiclesCount > 0 
            ? 'bg-red-950/30 border-red-500/40 text-red-300' 
            : 'bg-slate-900/90 border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium block">تجاوز الحصة الشهرية</span>
            {overQuotaVehiclesCount > 0 && (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-mono text-xl font-bold ${
              overQuotaVehiclesCount > 0 ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {overQuotaVehiclesCount}
            </span>
            <span className="text-xs">آلية</span>
          </div>
          <span className="text-[10px] opacity-80 block">
            {overQuotaVehiclesCount > 0 ? 'تتطلب مراجعة شعبة المحروقات' : 'كافة الآليات ضمن الحصص'}
          </span>
        </div>
      </div>

      {/* Control Bar & Filters */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Sub-tab switcher: Quotas vs Vouchers */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
            <button
              id="subtab-quotas"
              onClick={() => setActiveSubTab('quotas')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'quotas'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gauge className="w-4 h-4" />
              <span>مراقبة مخصصات الآليات ({filteredVehiclesStats.length})</span>
            </button>

            <button
              id="subtab-vouchers"
              onClick={() => setActiveSubTab('vouchers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'vouchers'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>سجل القسائم الصادرة ({allVouchersWithVehicles.length})</span>
            </button>
          </div>

          {/* Branch & Month Selectors */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Branch Selector (For Admin) */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <select
                  value={selectedBranchId}
                  onChange={(e) => onSelectBranch(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="all">كافة الفروع (نظرة شاملة)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Month Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Secondary Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 pt-3 border-t border-slate-800/80">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث برقم الآلية، نوعها، القسم أو الملاحظات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {activeSubTab === 'quotas' ? (
            <>
              {/* Fuel Type Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">نوع الوقود:</span>
                <select
                  value={fuelTypeFilter}
                  onChange={(e) => setFuelTypeFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-750 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">الكل</option>
                  <option value="بنزين">بنزين</option>
                  <option value="مازوت">مازوت</option>
                </select>
              </div>

              {/* Quota Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">حالة الحصة:</span>
                <select
                  value={quotaStatusFilter}
                  onChange={(e) => setQuotaStatusFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-750 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">الكل</option>
                  <option value="overquota">متجاوزة الحصة ⚠️</option>
                  <option value="withinquota">ضمن الحصة المقررة</option>
                </select>
              </div>
            </>
          ) : (
            /* Voucher Type Filter */
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">نطاق القسيمة:</span>
              <select
                value={voucherTypeFilter}
                onChange={(e) => setVoucherTypeFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-750 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="all">كافة النطاقات</option>
                <option value="داخل المدينة">داخل المدينة</option>
                <option value="خارج المدينة">خارج المدينة (مهمات)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'quotas' ? (
        /* Vehicles Quotas Table */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 text-[11px] font-bold">
                  <th className="p-3.5">الآلية والنوع</th>
                  <th className="p-3.5">الفرع والجهة التابعة</th>
                  <th className="p-3.5 text-center">سعة المحرك</th>
                  <th className="p-3.5 text-center">الحصة المقررة (شهرياً)</th>
                  <th className="p-3.5 text-center">المصروف الفعلي</th>
                  <th className="p-3.5 text-center">المتبقي</th>
                  <th className="p-3.5 min-w-[140px]">مؤشر استهلاك الحصة</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredVehiclesStats.length > 0 ? (
                  filteredVehiclesStats.map((item) => {
                    const v = item.vehicle;
                    return (
                      <tr 
                        key={v.id} 
                        className={`hover:bg-slate-850/50 transition-colors ${
                          item.isOverQuota ? 'bg-red-950/15' : ''
                        }`}
                      >
                        {/* Vehicle and Type */}
                        <td className="p-3.5">
                          <button
                            onClick={() => onSelectVehicle(v)}
                            className="text-right hover:text-amber-300 transition-colors group"
                          >
                            <div className="font-mono font-bold text-amber-400 text-sm group-hover:underline">
                              {v.vehicle_number}
                            </div>
                            <div className="text-slate-200 text-xs mt-0.5">{v.vehicle_type}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700">
                                {v.fuel_type}
                              </span>
                              <span>• {v.fuel_expense_covered_by || 'الفرات'}</span>
                            </div>
                          </button>
                        </td>

                        {/* Branch & Dept */}
                        <td className="p-3.5">
                          <div className="text-slate-300 font-medium">
                            {item.branch?.name || 'الفرع'}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                            {v.assigned_department}
                          </div>
                        </td>

                        {/* Engine capacity */}
                        <td className="p-3.5 text-center font-mono">
                          <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs">
                            {v.engine_capacity || 2700} cc
                          </span>
                        </td>

                        {/* Monthly Quota */}
                        <td className="p-3.5 text-center">
                          <div className="font-mono font-bold text-white text-xs">
                            {item.totalQuota} لتر
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            داخل: {item.quotaInside}L • خارج: {item.quotaOutside}L
                          </div>
                        </td>

                        {/* Actual Spent */}
                        <td className="p-3.5 text-center">
                          <div className={`font-mono font-bold text-xs ${
                            item.isOverQuota ? 'text-red-400' : 'text-amber-400'
                          }`}>
                            {item.totalSpent} لتر
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            داخل: {item.stats.insideCitySpent}L • خارج: {item.stats.outsideCitySpent}L
                          </div>
                        </td>

                        {/* Remaining */}
                        <td className="p-3.5 text-center font-mono">
                          <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                            item.isOverQuota
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : item.remaining <= 20
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {item.remaining} لتر
                          </span>
                        </td>

                        {/* Progress Bar */}
                        <td className="p-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className={item.isOverQuota ? 'text-red-400 font-bold' : 'text-slate-400'}>
                                {item.percent}%
                              </span>
                              {item.isOverQuota && (
                                <span className="text-red-400 font-bold text-[9px] flex items-center gap-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" /> تجاوزت
                                </span>
                              )}
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  item.isOverQuota 
                                    ? 'bg-red-500' 
                                    : item.percent > 80 
                                    ? 'bg-amber-500' 
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, item.percent)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onOpenIssueVoucher(v.id)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold shadow-sm transition-colors"
                              title="إصدار قسيمة وقود لهذه الآلية"
                            >
                              + قسيمة
                            </button>
                            <button
                              onClick={() => onSelectVehicle(v)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                              title="معاينة تفاصيل الآلية"
                            >
                              تفاصيل
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      لا توجد آليات مطابقة لمعايير البحث والتصفية المحددة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Vouchers Log Table */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 text-[11px] font-bold">
                  <th className="p-3.5">رقم القسيمة وتاريخها</th>
                  <th className="p-3.5">الآلية والفرع</th>
                  <th className="p-3.5">نطاق القسيمة</th>
                  <th className="p-3.5 text-center">الكمية المصروفة</th>
                  <th className="p-3.5">الجهة المصدرة</th>
                  <th className="p-3.5">الملاحظات ومبرر الصرف</th>
                  {isAdmin && <th className="p-3.5 text-center">إجراءات</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allVouchersWithVehicles.length > 0 ? (
                  allVouchersWithVehicles.map(({ voucher, vehicle }) => (
                    <tr key={voucher.id} className="hover:bg-slate-850/50 transition-colors">
                      {/* Voucher ID & Date */}
                      <td className="p-3.5">
                        <div className="font-mono text-slate-300 text-xs">
                          {voucher.issue_date}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500">
                          #{voucher.id.slice(0, 10)}
                        </div>
                      </td>

                      {/* Vehicle & Branch */}
                      <td className="p-3.5">
                        {vehicle ? (
                          <button
                            onClick={() => onSelectVehicle(vehicle)}
                            className="text-right hover:text-amber-300 transition-colors"
                          >
                            <span className="font-mono font-bold text-amber-400 block text-xs">
                              {vehicle.vehicle_number}
                            </span>
                            <span className="text-slate-300 text-[11px] block">
                              {vehicle.vehicle_type}
                            </span>
                          </button>
                        ) : (
                          <span className="text-slate-500">آلية غير معرفة</span>
                        )}
                      </td>

                      {/* Scope Badge */}
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                          voucher.voucher_type === 'داخل المدينة'
                            ? 'bg-blue-950/70 text-blue-300 border-blue-600/40'
                            : 'bg-amber-950/70 text-amber-300 border-amber-600/40'
                        }`}>
                          {voucher.voucher_type}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="p-3.5 text-center">
                        <span className="font-mono font-bold text-sm text-white">
                          {voucher.quantity_liters}
                        </span>
                        <span className="text-slate-400 text-[11px] mr-1">لتر</span>
                      </td>

                      {/* Issued by */}
                      <td className="p-3.5 text-slate-300">
                        {voucher.issued_by || 'شعبة المحروقات'}
                      </td>

                      {/* Notes */}
                      <td className="p-3.5 text-slate-400 text-[11px] max-w-[200px] truncate">
                        {voucher.notes || '—'}
                      </td>

                      {/* Admin Actions */}
                      {isAdmin && (
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleDeleteVoucher(voucher.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="حذف القسيمة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="p-8 text-center text-slate-400">
                      لا توجد قسائم وقود مسجلة لهذا الشهر أو ضمن معايير البحث.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
