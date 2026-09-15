import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Fuel, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Building2, 
  Gauge, 
  AlertTriangle,
  FileText,
  UserCheck
} from 'lucide-react';
import { Vehicle, VoucherType, FuelVoucher } from '../types';
import { StorageService } from '../services/storageService';

interface IssueFuelVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  defaultVehicleId?: string;
  onVoucherCreated?: (newVoucher: FuelVoucher) => void;
}

export const IssueFuelVoucherModal: React.FC<IssueFuelVoucherModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  defaultVehicleId,
  onVoucherCreated,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(defaultVehicleId || (vehicles[0]?.id || ''));
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [voucherType, setVoucherType] = useState<VoucherType>('داخل المدينة');
  const [quantityLiters, setQuantityLiters] = useState<number | string>(40);
  const [issuedBy, setIssuedBy] = useState<string>('شعبة المحروقات');
  const [notes, setNotes] = useState<string>('');
  
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync selectedVehicleId with defaultVehicleId when opened
  useEffect(() => {
    if (defaultVehicleId) {
      setSelectedVehicleId(defaultVehicleId);
    } else if (vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [defaultVehicleId, vehicles]);

  // Current selected vehicle
  const currentVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId);
  }, [vehicles, selectedVehicleId]);

  // Monthly stats for this vehicle in the selected voucher month
  const targetMonthYear = issueDate.slice(0, 7); // e.g. "2026-09"
  const monthlyStats = useMemo(() => {
    if (!selectedVehicleId) {
      return { insideCitySpent: 0, outsideCitySpent: 0, totalSpent: 0, vouchersCount: 0 };
    }
    return StorageService.getVehicleMonthlyFuelStats(selectedVehicleId, targetMonthYear);
  }, [selectedVehicleId, targetMonthYear]);

  // Quota evaluations
  const quotaInside = currentVehicle?.fuel_quota_inside_city ?? 180;
  const quotaOutside = currentVehicle?.fuel_quota_outside_city ?? 120;
  const currentRelevantQuota = voucherType === 'داخل المدينة' ? quotaInside : quotaOutside;
  const currentSpent = voucherType === 'داخل المدينة' ? monthlyStats.insideCitySpent : monthlyStats.outsideCitySpent;
  const currentRemaining = Math.max(0, currentRelevantQuota - currentSpent);

  const numericQty = Number(quantityLiters) || 0;
  const simulatedTotalSpent = currentSpent + numericQty;
  const simulatedRemaining = currentRelevantQuota - simulatedTotalSpent;
  const isOverQuota = simulatedTotalSpent > currentRelevantQuota;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!selectedVehicleId) {
      setError('يرجى تحديد الآلية المراد صرف الوقود لها');
      return;
    }

    if (numericQty <= 0) {
      setError('يرجى تحديد كمية وقود صالحة (أكبر من 0 لتر)');
      return;
    }

    if (!issueDate) {
      setError('يرجى تحديد تاريخ إصدار القسيمة');
      return;
    }

    setIsSubmitting(true);

    try {
      const newVoucher = StorageService.addFuelVoucher({
        vehicle_id: selectedVehicleId,
        issue_date: issueDate,
        quantity_liters: numericQty,
        voucher_type: voucherType,
        issued_by: issuedBy,
        notes: notes.trim() || undefined,
      });

      setSuccessMsg(`تم إصدار قسيمة الوقود بنجاح برقم (${newVoucher.id.slice(0, 10)}) بمقدار ${numericQty} لتر`);
      if (onVoucherCreated) {
        onVoucherCreated(newVoucher);
      }

      // Reset form or close after short delay
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      dir="rtl"
    >
      <div 
        id="issue-fuel-voucher-modal"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-right my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">إصدار قسيمة وقود فعلية جديدة</h2>
              <p className="text-xs text-slate-400">شعبة المحروقات • الشركة السورية للبترول</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">خطأ في إصدار القسيمة (قيود الصلاحيات):</span>
                <p className="leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <p className="font-semibold">{successMsg}</p>
            </div>
          )}

          {/* Vehicle Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              الآلية المستفيدة من القسيمة <span className="text-amber-400">*</span>
            </label>
            <select
              id="voucher-vehicle-select"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              required
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_number} — {v.vehicle_type} ({v.fuel_type}) - {v.assigned_department}
                </option>
              ))}
            </select>
          </div>

          {/* Current Vehicle Fuel Quota Context Card */}
          {currentVehicle && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-white font-bold">{currentVehicle.vehicle_number}</span>
                  <span className="text-slate-500">•</span>
                  <span>{currentVehicle.vehicle_type}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono text-[11px] border border-amber-500/20">
                  سعة المحرك: {currentVehicle.engine_capacity || 2700} cc
                </span>
              </div>

              {/* Quotas grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className={`p-3 rounded-lg border transition-all ${
                  voucherType === 'داخل المدينة' 
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' 
                    : 'bg-slate-900/50 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">حصة داخل المدينة:</span>
                    <span className="font-mono font-bold text-white">{quotaInside} لتر/شهر</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span>المصروف للشهر الحالي:</span>
                    <span className="font-mono text-amber-400">{monthlyStats.insideCitySpent} لتر</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/50 mt-1">
                    <span>المتبقي:</span>
                    <span className="font-mono font-bold text-emerald-400">{Math.max(0, quotaInside - monthlyStats.insideCitySpent)} لتر</span>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border transition-all ${
                  voucherType === 'خارج المدينة' 
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' 
                    : 'bg-slate-900/50 border-slate-800 text-slate-400'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">حصة خارج المدينة (مهمات):</span>
                    <span className="font-mono font-bold text-white">{quotaOutside} لتر/شهر</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span>المصروف للشهر الحالي:</span>
                    <span className="font-mono text-amber-400">{monthlyStats.outsideCitySpent} لتر</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/50 mt-1">
                    <span>المتبقي:</span>
                    <span className="font-mono font-bold text-emerald-400">{Math.max(0, quotaOutside - monthlyStats.outsideCitySpent)} لتر</span>
                  </div>
                </div>
              </div>

              {/* Expense covered by */}
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>الجهة الممولة لنفقة الوقود والصيانة:</span>
                <span className="text-slate-200 font-bold">{currentVehicle.fuel_expense_covered_by || 'الفرات'}</span>
              </div>
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Voucher Type */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                نوع القسيمة النطاقي <span className="text-amber-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVoucherType('داخل المدينة')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    voucherType === 'داخل المدينة'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  داخل المدينة
                </button>
                <button
                  type="button"
                  onClick={() => setVoucherType('خارج المدينة')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    voucherType === 'خارج المدينة'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  خارج المدينة (مهمات)
                </button>
              </div>
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                تاريخ الإصدار <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {/* Quantity in Liters & Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                الكمية المصروفة (باللتر) <span className="text-amber-400">*</span>
              </label>
              <span className="text-xs text-slate-400 font-mono">
                نوع الوقود: {currentVehicle?.fuel_type || 'بنزين'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="voucher-quantity-input"
                type="number"
                step="1"
                min="1"
                max="5000"
                value={quantityLiters}
                onChange={(e) => setQuantityLiters(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-left"
                placeholder="40"
                required
              />
              <span className="text-sm font-bold text-slate-400 shrink-0">لتر</span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-slate-400">خيارات سريعة:</span>
              {[20, 40, 60, 80, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQuantityLiters(preset)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-mono border transition-all ${
                    numericQty === preset
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {preset}L
                </button>
              ))}
            </div>
          </div>

          {/* Live Quota Overdraft Warning */}
          {isOverQuota && (
            <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-2.5 animate-pulse">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">تنبيه تجاوز الحصة الشهرية المقررة:</span>
                <p className="mt-0.5 leading-relaxed">
                  الحصة المقررة لهذه الفئة هي <strong>{currentRelevantQuota} لتر</strong>.
                  مع هذه القسيمة سيصبح الإجمالي <strong>{simulatedTotalSpent} لتر</strong>، متجاوزاً الحصة بمقدار 
                  <strong className="text-red-300 font-mono"> {simulatedTotalSpent - currentRelevantQuota} لتر</strong>.
                  (سيتم تسجيل القسيمة مع إشعار بالزيادة في تقارير شعبة المحروقات).
                </p>
              </div>
            </div>
          )}

          {/* Issuer & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                الجهة المصدرة / المنفذة
              </label>
              <input
                type="text"
                value={issuedBy}
                onChange={(e) => setIssuedBy(e.target.value)}
                placeholder="شعبة المحروقات"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                ملاحظات أو مبرر المهمة
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: مهمة حقل التيم / صهريج خط النقل"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
            <button
              id="submit-fuel-voucher-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
            >
              <Fuel className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري التسجيل...' : 'تأكيد وإصدار القسيمة'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
