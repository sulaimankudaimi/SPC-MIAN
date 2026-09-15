import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wrench, 
  Plus, 
  AlertCircle, 
  Calendar, 
  Coins, 
  UserCheck, 
  Truck, 
  FileText 
} from 'lucide-react';
import { Vehicle, MaintenanceRecord } from '../types';
import { StorageService } from '../services/storageService';

interface AddMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  defaultVehicleId?: string;
  onMaintenanceAdded: (record: MaintenanceRecord) => void;
}

const WORKSHOPS = [
  'ورشة الصيانة الميكانيكية المركزية - حقل التيم',
  'ورشة الإصلاح السريع - كراج دير الزور',
  'ورشة الكهرباء والمعدات الهيدروليكية - حقل التيم',
  'مفرزة الصيانة الميدانية - حقل الشولا',
  'دائرة صيانة الآبار والمضخات',
  'متعهد صيانة خارجي معتمد',
];

export const AddMaintenanceModal: React.FC<AddMaintenanceModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  defaultVehicleId,
  onMaintenanceAdded,
}) => {
  const [vehicleId, setVehicleId] = useState<string>(
    defaultVehicleId || (vehicles.length > 0 ? vehicles[0].id : '')
  );
  const [maintenanceDate, setMaintenanceDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState<string>('500000');
  const [performedBy, setPerformedBy] = useState(WORKSHOPS[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (defaultVehicleId) {
        setVehicleId(defaultVehicleId);
      } else if (vehicles.length > 0 && !vehicleId) {
        setVehicleId(vehicles[0].id);
      }
      setError(null);
    }
  }, [isOpen, defaultVehicleId, vehicles]);

  if (!isOpen) return null;

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!vehicleId) {
      setError('يرجى تحديد الآلية المستهدفة لأمر الصيانة');
      return;
    }

    if (!description.trim()) {
      setError('يرجى كتابة وصف العطل والإجراء الفني المنفذ');
      return;
    }

    const numericCost = Number(cost) || 0;
    if (numericCost <= 0) {
      setError('يرجى إدخال تكلفة مالية صحيحة بالليرة السورية');
      return;
    }

    const created = StorageService.addMaintenanceRecord({
      vehicle_id: vehicleId,
      maintenance_date: maintenanceDate,
      description: description.trim(),
      cost: numericCost,
      performed_by: performedBy.trim(),
      notes: notes.trim() || undefined,
    });

    onMaintenanceAdded(created);
    onClose();
  };

  const formatPreview = (val: string) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('ar-SY').format(num) + ' ل.س';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn select-text">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">تسجيل أمر صيانة وإصلاح فني</h3>
              <p className="text-xs text-slate-400">توثيق الإجراء الميكانيكي وتكاليفه لمديرية حقول دير الزور</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Target Vehicle Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 block">
              الآلية المستهدفة <span className="text-amber-400">*</span>
            </label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-100"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_number} — {v.vehicle_type} ({v.assigned_department} • {v.category})
                </option>
              ))}
            </select>
            {selectedVehicle && (
              <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                <span className="text-amber-400 font-mono font-bold">الحالة: {selectedVehicle.status}</span>
                <span>•</span>
                <span>الموقع: {selectedVehicle.current_location}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Maintenance Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 block">
                تاريخ تنفيذ الصيانة <span className="text-amber-400">*</span>
              </label>
              <input
                type="date"
                required
                value={maintenanceDate}
                onChange={(e) => setMaintenanceDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-100 font-mono"
              />
            </div>

            {/* Cost in SYP */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 block">
                التكلفة المالية (ل.س) <span className="text-amber-400">*</span>
              </label>
              <input
                type="number"
                min={0}
                step={50000}
                required
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="مثال: 850000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-100 font-mono"
              />
              <span className="text-[10px] text-amber-400 font-mono block">
                المبلغ: {formatPreview(cost)}
              </span>
            </div>

          </div>

          {/* Performed By Workshop */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 block">
              الجهة أو الورشة المنفذة <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              list="workshop-options"
              required
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-100"
            />
            <datalist id="workshop-options">
              {WORKSHOPS.map((w) => (
                <option key={w} value={w} />
              ))}
            </datalist>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 block">
              وصف العطل والإجراء الفني المنفذ <span className="text-amber-400">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: استبدال طقم فحمات فرامل أمامية وخلفية، تبديل فلاتر الوقود والزيت، وفحص منظومة الهيدروليك..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-100 leading-relaxed"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 block">
              ملاحظات إضافية (أرقام الفواتير أو الضمان)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: أمر عمل رقم WO-2024-88 مع ضمان 6 أشهر للقطع المستبدلة"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-100"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              id="btn-submit-add-maintenance"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل أمر الصيانة</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
