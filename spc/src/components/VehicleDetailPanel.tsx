import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  Building2, 
  Fuel, 
  Calendar, 
  Wrench, 
  Coins, 
  UserCheck, 
  Copy, 
  Check, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  FileText,
  X,
  Layers,
  ArrowUpRight,
  Plus,
  Trash2,
  Edit3,
  Gauge,
  CheckCircle2
} from 'lucide-react';
import { Vehicle, MaintenanceRecord, VehicleStatus, VehicleCategory, Profile, FuelVoucher } from '../types';
import { StorageService } from '../services/storageService';

interface VehicleDetailPanelProps {
  vehicle: Vehicle | null;
  maintenanceList: MaintenanceRecord[];
  currentUser?: Profile | null;
  onClose?: () => void;
  onOpenAddMaintenance?: (vehicleId: string) => void;
  onOpenIssueFuelVoucher?: (vehicleId: string) => void;
  onEditVehicle?: (vehicle: Vehicle) => void;
  onDeleteVehicle?: (vehicleId: string) => void;
}

export const VehicleDetailPanel: React.FC<VehicleDetailPanelProps> = ({
  vehicle,
  maintenanceList,
  currentUser,
  onClose,
  onOpenAddMaintenance,
  onOpenIssueFuelVoucher,
  onEditVehicle,
  onDeleteVehicle,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [activeSection, setActiveSection] = useState<'all' | 'maintenance' | 'fuel'>('all');

  if (!vehicle) {
    return (
      <div 
        id="vehicle-detail-empty"
        className="w-full lg:w-[380px] shrink-0 bg-slate-900/60 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-slate-400 min-h-[420px]"
      >
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-4 text-slate-500">
          <Truck className="w-8 h-8 text-amber-500/60" />
        </div>
        <h4 className="text-sm font-bold text-slate-200 mb-1">لم يتم اختيار أي آلية</h4>
        <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed">
          اختر أي آلية من القائمة على اليمين لمعاينة مواصفاتها الفنية وسجل صيانتها فوراً.
        </p>
      </div>
    );
  }

  // Filter maintenance records belonging to this vehicle
  const vehicleMaintenance = maintenanceList.filter(
    (rec) => rec.vehicle_id === vehicle.id
  ).sort(
    (a, b) => new Date(b.maintenance_date).getTime() - new Date(a.maintenance_date).getTime()
  );

  const totalVehicleMaintenanceCost = vehicleMaintenance.reduce(
    (sum, r) => sum + (Number(r.cost) || 0),
    0
  );

  // Fuel Vouchers & Quota Stats for this vehicle
  const targetMonthYear = new Date().toISOString().slice(0, 7);
  const monthlyFuelStats = StorageService.getVehicleMonthlyFuelStats(vehicle.id, targetMonthYear);
  const quotaInside = vehicle.fuel_quota_inside_city ?? 180;
  const quotaOutside = vehicle.fuel_quota_outside_city ?? 120;
  const totalMonthlyQuota = quotaInside + quotaOutside;
  const totalFuelSpent = monthlyFuelStats.totalSpent;
  const totalRemainingFuel = Math.max(0, totalMonthlyQuota - totalFuelSpent);
  const fuelConsumptionRatio = totalMonthlyQuota > 0 ? (totalFuelSpent / totalMonthlyQuota) : 0;
  const fuelConsumptionPercent = Math.min(100, Math.round(fuelConsumptionRatio * 100));
  const isOverQuota = totalFuelSpent > totalMonthlyQuota;

  const formatSyp = (amount: number) => {
    return new Intl.NumberFormat('ar-SY').format(amount) + ' ل.س';
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(vehicle.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case 'تعمل':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-xs tracking-wide">تعمل (في الخدمة الميدانية)</span>
          </div>
        );
      case 'متعطلة':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-950">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse"></span>
            <span className="font-bold text-xs tracking-wide">متعطلة (تحتاج صيانة وإصلاح)</span>
          </div>
        );
      case 'خارج الخدمة':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
            <span className="font-bold text-xs tracking-wide">خارج الخدمة (منسقة / حجز)</span>
          </div>
        );
      case 'معارة':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-bold text-xs tracking-wide">معارة لمشروع خارجي</span>
          </div>
        );
    }
  };

  const getCategoryColor = (category: VehicleCategory) => {
    switch (category) {
      case 'بنزين إرسال حديث':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-600/50';
      case 'بنزين استلام قديم':
        return 'bg-amber-950/70 text-amber-300 border-amber-600/50';
      case 'مازوت':
        return 'bg-blue-950/70 text-blue-300 border-blue-600/50';
    }
  };

  return (
    <div 
      id="vehicle-detail-panel"
      className="w-full lg:w-[380px] shrink-0 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-120px)] sticky top-20 text-right"
    >
      {/* Panel Top Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">بطاقة الآلية التفصيلية</h3>
            <p className="text-[11px] text-slate-400">سجل المعدة الميداني</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title="إغلاق اللوحة"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Main Vehicle Header Box */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xl font-black text-amber-400 tracking-wider">
              {vehicle.vehicle_number}
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getCategoryColor(vehicle.category)}`}>
              {vehicle.category}
            </span>
          </div>

          <h4 className="text-sm font-bold text-white leading-snug">
            {vehicle.vehicle_type}
          </h4>

          {/* Prominent Status Badge */}
          <div className="pt-1">
            {getStatusBadge(vehicle.status)}
          </div>
        </div>

        {/* 4-Item Quick Specs Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-850">
            <span className="text-[10px] text-slate-400 block font-medium">سنة الصنع</span>
            <span className="text-sm font-bold text-slate-100 font-mono mt-0.5 block">
              {vehicle.manufacture_year}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-850">
            <span className="text-[10px] text-slate-400 block font-medium">نوع الوقود</span>
            <div className="flex items-center gap-1 mt-0.5">
              <Fuel className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-sm font-bold text-slate-100">
                {vehicle.fuel_type}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-850">
            <span className="text-[10px] text-slate-400 block font-medium">أوامر الصيانة</span>
            <span className="text-sm font-bold text-amber-400 font-mono mt-0.5 block">
              {vehicleMaintenance.length} عملية
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-850">
            <span className="text-[10px] text-slate-400 block font-medium">تكاليف الصيانة</span>
            <span className="text-xs font-bold text-emerald-400 font-mono mt-1 block truncate" title={formatSyp(totalVehicleMaintenanceCost)}>
              {formatSyp(totalVehicleMaintenanceCost)}
            </span>
          </div>
        </div>

        {/* Fuel Quotas & Real-Time Consumption Card */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Fuel className="w-3.5 h-3.5" />
              </div>
              <h5 className="text-xs font-bold text-white">مخصصات الوقود الشهرية</h5>
            </div>
            
            {onOpenIssueFuelVoucher && (
              <button
                id="btn-issue-fuel-voucher"
                onClick={() => onOpenIssueFuelVoucher(vehicle.id)}
                className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all"
                title="إصدار قسيمة وقود فعلية لهذه الآلية"
              >
                <Plus className="w-3 h-3" />
                <span>إصدار قسيمة وقود</span>
              </button>
            )}
          </div>

          {/* Engine Capacity and Quotas Grid */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">سعة المحرك</span>
              <span className="font-mono font-bold text-slate-200 text-xs">
                {vehicle.engine_capacity || 2700} cc
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">داخل المدينة</span>
              <span className="font-mono font-bold text-amber-300 text-xs">
                {quotaInside} لتر
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">خارج المدينة</span>
              <span className="font-mono font-bold text-amber-300 text-xs">
                {quotaOutside} لتر
              </span>
            </div>
          </div>

          {/* Monthly Consumption Progress */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">المصروف الفعلي للشهر الحالي:</span>
              <span className="font-mono font-bold text-white">
                {totalFuelSpent} / {totalMonthlyQuota} لتر
                <span className={`mr-1.5 text-[10px] ${
                  isOverQuota ? 'text-red-400 font-bold' : fuelConsumptionPercent > 75 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  ({fuelConsumptionPercent}%)
                </span>
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOverQuota 
                    ? 'bg-red-500' 
                    : fuelConsumptionPercent > 80 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, fuelConsumptionPercent)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>المتبقي: <strong className={isOverQuota ? 'text-red-400' : 'text-emerald-400'}>{totalRemainingFuel} لتر</strong></span>
              <span>المصروف: داخل ({monthlyFuelStats.insideCitySpent}L) • خارج ({monthlyFuelStats.outsideCitySpent}L)</span>
            </div>
          </div>

          {/* Additional details */}
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
            <div>
              <span className="text-slate-500 block">الجهة الممولة للنفقة:</span>
              <span className="font-semibold text-slate-300 truncate block">{vehicle.fuel_expense_covered_by || 'الفرات'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">الكمية المطلوبة حالياً:</span>
              <span className="font-semibold font-mono text-slate-300">{vehicle.requested_fuel_quantity || 0} لتر</span>
            </div>
          </div>
        </div>

        {/* Location & Department */}
        <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/50 border border-slate-850 text-xs">
          <div className="flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-slate-400 block font-medium">القسم المسؤول / جهة التبعية:</span>
              <span className="font-semibold text-slate-200 block text-xs leading-relaxed">
                {vehicle.assigned_department}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-850 pt-2 flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-slate-400 block font-medium">الموقع الميداني الحالي:</span>
              <span className="font-semibold text-slate-200 block text-xs leading-relaxed">
                {vehicle.current_location}
              </span>
            </div>
          </div>
        </div>

        {/* Database ID & Metadata */}
        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-850 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span>المعرف في Supabase:</span>
            <button
              onClick={handleCopyId}
              className="flex items-center gap-1 font-mono text-amber-300 hover:text-amber-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 transition-colors"
              title="نسخ المعرف"
            >
              <span>{vehicle.id}</span>
              {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>تاريخ التسجيل:</span>
            <span className="font-mono text-slate-300">{vehicle.created_at.slice(0, 10)}</span>
          </div>
        </div>

        {/* Tab switcher: Maintenance vs Fuel Vouchers */}
        <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveSection('all')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all ${
              activeSection === 'all' 
                ? 'bg-amber-500 text-slate-950 shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            سجل الصيانة ({vehicleMaintenance.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('fuel')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all ${
              activeSection === 'fuel' 
                ? 'bg-amber-500 text-slate-950 shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            قسائم الوقود ({monthlyFuelStats.recentVouchers.length})
          </button>
        </div>

        {/* Content Section: Maintenance vs Fuel */}
        {activeSection === 'fuel' ? (
          <div className="pt-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Fuel className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-xs text-white">قسائم الوقود الصادرة للآلية</h4>
              </div>
              
              {onOpenIssueFuelVoucher && (
                <button
                  onClick={() => onOpenIssueFuelVoucher(vehicle.id)}
                  className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-colors"
                  title="إصدار قسيمة وقود لهذه الآلية"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ قسيمة</span>
                </button>
              )}
            </div>

            {monthlyFuelStats.recentVouchers.length > 0 ? (
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {monthlyFuelStats.recentVouchers.map((voucher) => (
                  <div 
                    key={voucher.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          voucher.voucher_type === 'داخل المدينة'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {voucher.voucher_type}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">{voucher.issue_date}</span>
                      </div>
                      <span className="font-bold font-mono text-amber-400 text-sm">
                        {voucher.quantity_liters} لتر
                      </span>
                    </div>

                    {voucher.notes && (
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {voucher.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-850">
                      <span>الجهة: {voucher.issued_by || 'شعبة المحروقات'}</span>
                      <span className="font-mono">#{voucher.id.slice(0, 8)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center space-y-2 text-slate-400">
                <Fuel className="w-6 h-6 text-amber-400/60 mx-auto mb-1" />
                <p className="text-xs font-semibold text-slate-300">لا توجد قسائم وقود سابقة</p>
                <p className="text-[11px] text-slate-400">
                  يمكنك إصدار أول قسيمة وقود لهذه الآلية بالضغط على زر "إصدار قسيمة".
                </p>
                {onOpenIssueFuelVoucher && (
                  <button
                    onClick={() => onOpenIssueFuelVoucher(vehicle.id)}
                    className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shadow-sm hover:bg-amber-400 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إصدار قسيمة وقود الآن</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Maintenance History Section */
          <div className="pt-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-xs text-white">سجل صيانة هذه الآلية</h4>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                  {vehicleMaintenance.length} سجل
                </span>
                {onOpenAddMaintenance && (
                  <button
                    onClick={() => onOpenAddMaintenance(vehicle.id)}
                    className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-colors"
                    title="تسجيل أمر صيانة لهذه الآلية"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ صيانة</span>
                  </button>
                )}
              </div>
            </div>

            {vehicleMaintenance.length > 0 ? (
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {vehicleMaintenance.map((rec) => (
                  <div 
                    key={rec.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-slate-400 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-amber-400/80" />
                        <span>{rec.maintenance_date}</span>
                      </div>
                      <span className="font-bold font-mono text-amber-400 text-xs">
                        {formatSyp(rec.cost)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed">
                      {rec.description}
                    </p>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-1 border-t border-slate-850">
                      <UserCheck className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{rec.performed_by}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center space-y-2 text-slate-400">
                <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto opacity-70 mb-1" />
                <p className="text-xs font-semibold text-slate-300">لا توجد أوامر صيانة مسجلة</p>
                <p className="text-[11px] text-slate-400">
                  هذه الآلية بحالة فنية ممتازة ولم تدخل ورشات الإصلاح الكبرى مؤخراً.
                </p>
                {onOpenAddMaintenance && (
                  <button
                    onClick={() => onOpenAddMaintenance(vehicle.id)}
                    className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors"
                  >
                    <Wrench className="w-3 h-3" />
                    <span>تسجيل أول صيانة للآلية</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer Info & Admin Actions */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400 gap-2">
        <span className="flex items-center gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>بيانات جدول vehicles</span>
        </span>

        {/* Edit and Delete Buttons - STRICTLY visible ONLY for Admin (Hidden completely for branch users) */}
        {currentUser?.role === 'admin' && (
          <div className="flex items-center gap-1.5">
            {onEditVehicle && (
              <button
                id="btn-edit-vehicle"
                onClick={() => onEditVehicle(vehicle)}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors text-[11px] px-2.5 py-1 rounded-lg font-medium cursor-pointer"
                title="تعديل بيانات ومواصفات الآلية (صلاحية المشرف)"
              >
                <Edit3 className="w-3 h-3" />
                <span>تعديل</span>
              </button>
            )}

            {onDeleteVehicle && (
              <button
                id="btn-delete-vehicle"
                onClick={() => {
                  if (window.confirm(`هل أنت متأكد من حذف الآلية (${vehicle.vehicle_number}) وسجلات صيانتها؟`)) {
                    onDeleteVehicle(vehicle.id);
                  }
                }}
                className="flex items-center gap-1 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors text-[11px] px-2.5 py-1 rounded-lg font-medium cursor-pointer"
                title="حذف هذه الآلية وسجلاتها (صلاحية المشرف)"
              >
                <Trash2 className="w-3 h-3" />
                <span>حذف</span>
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
