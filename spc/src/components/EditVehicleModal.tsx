import React, { useState, useEffect } from 'react';
import { 
  X, 
  Truck, 
  Save, 
  AlertCircle, 
  Building2, 
  MapPin, 
  Calendar, 
  Fuel, 
  Layers, 
  Check, 
  FileText 
} from 'lucide-react';
import { Vehicle, VehicleCategory, VehicleStatus, FuelType, Branch } from '../types';
import { StorageService } from '../services/storageService';

interface EditVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onVehicleUpdated: (updatedVehicle: Vehicle) => void;
  branches: Branch[];
}

const DEPARTMENTS = [
  'قسم الإنتاج',
  'دائرة النقل والحركة',
  'قسم الصيانة الميكانيكية',
  'قسم الأمن الصناعي والسلامة',
  'دائرة صيانة الآبار والمضخات',
  'المفرزة المركزية',
  'دائرة المشاريع والإنشاءات',
];

const LOCATIONS = [
  'حقل التيم - المحطة المركزية',
  'حقل الشولا الميداني',
  'محطة غاز دير الزور',
  'كراج الإدارة المركزية - دير الزور',
  'المفرزة الميدانية - طريق دير الزور / الميادين',
  'موقع بئر تيم-14',
  'حقول رميلان - المحطة الرئيسية',
  'حقول الجبسة - معمل الغاز',
  'حقول المنطقة الوسطى - الفرقلس',
  'مرآب الإدارة العامة - دمشق',
];

export const EditVehicleModal: React.FC<EditVehicleModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  onVehicleUpdated,
  branches,
}) => {
  const [branchId, setBranchId] = useState<string>('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [manufactureYear, setManufactureYear] = useState<number>(2023);
  const [category, setCategory] = useState<VehicleCategory>('بنزين إرسال حديث');
  const [fuelType, setFuelType] = useState<FuelType>('بنزين');
  const [status, setStatus] = useState<VehicleStatus>('تعمل');
  const [assignedDepartment, setAssignedDepartment] = useState(DEPARTMENTS[0]);
  const [currentLocation, setCurrentLocation] = useState(LOCATIONS[0]);
  const [chassisNumber, setChassisNumber] = useState('');
  const [notes, setNotes] = useState('');
  // Fuel Quota fields
  const [engineCapacity, setEngineCapacity] = useState<number>(2700);
  const [fuelQuotaInsideCity, setFuelQuotaInsideCity] = useState<number>(180);
  const [fuelQuotaOutsideCity, setFuelQuotaOutsideCity] = useState<number>(120);
  const [fuelExpenseCoveredBy, setFuelExpenseCoveredBy] = useState<string>('الفرات');
  const [requestedFuelQuantity, setRequestedFuelQuantity] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vehicle && isOpen) {
      setBranchId(vehicle.branch_id || 'branch-dez');
      setVehicleNumber(vehicle.vehicle_number);
      setVehicleType(vehicle.vehicle_type);
      setManufactureYear(vehicle.manufacture_year);
      setCategory(vehicle.category);
      setFuelType(vehicle.fuel_type);
      setStatus(vehicle.status);
      setAssignedDepartment(vehicle.assigned_department);
      setCurrentLocation(vehicle.current_location);
      setChassisNumber(vehicle.chassis_number || '');
      setNotes(vehicle.notes || '');
      setEngineCapacity(vehicle.engine_capacity ?? 2700);
      setFuelQuotaInsideCity(vehicle.fuel_quota_inside_city ?? 180);
      setFuelQuotaOutsideCity(vehicle.fuel_quota_outside_city ?? 120);
      setFuelExpenseCoveredBy(vehicle.fuel_expense_covered_by || 'الفرات');
      setRequestedFuelQuantity(vehicle.requested_fuel_quantity ?? 0);
      setError(null);
    }
  }, [vehicle, isOpen]);

  if (!isOpen || !vehicle) return null;

  const handleCategoryChange = (newCategory: VehicleCategory) => {
    setCategory(newCategory);
    if (newCategory === 'مازوت') {
      setFuelType('مازوت');
    } else {
      setFuelType('بنزين');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const vNum = vehicleNumber.trim().toUpperCase();
    const vType = vehicleType.trim();

    if (!vNum) {
      setError('يرجى إدخال رقم الآلية أو اللوحة التعريفية');
      return;
    }

    if (!vType) {
      setError('يرجى تحديد نوع أو موديل الآلية');
      return;
    }

    try {
      const updated = StorageService.updateVehicle(vehicle.id, {
        branch_id: branchId,
        vehicle_number: vNum,
        vehicle_type: vType,
        manufacture_year: manufactureYear,
        fuel_type: fuelType,
        category,
        status,
        assigned_department: assignedDepartment,
        current_location: currentLocation,
        chassis_number: chassisNumber ? chassisNumber : undefined,
        notes: notes ? notes : undefined,
      });

      onVehicleUpdated(updated);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`تعذر تعديل الآلية: ${msg}`);
    }
  };

  return (
    <div 
      id="edit-vehicle-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn select-text"
      dir="rtl"
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">تعديل بيانات الآلية ({vehicle.vehicle_number})</h3>
              <p className="text-xs text-slate-400">صلاحية التعديل مقتصرة على المشرف العام (Admin RLS)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Branch Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>الفرع التابع له الآلية *</span>
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                رقم الآلية / اللوحة التعريفية *
              </label>
              <input
                type="text"
                required
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                نوع وموديل الآلية *
              </label>
              <input
                type="text"
                required
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Manufacture Year */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>سنة الصنع *</span>
              </label>
              <input
                type="number"
                min={1970}
                max={2030}
                required
                value={manufactureYear}
                onChange={(e) => setManufactureYear(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                الحالة التشغيلية الفنية *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="تعمل">تعمل (في الخدمة)</option>
                <option value="متعطلة">متعطلة (بحاجة صيانة)</option>
                <option value="خارج الخدمة">خارج الخدمة (منسقة)</option>
                <option value="معارة">معارة</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>فئة الآلية *</span>
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as VehicleCategory)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="بنزين إرسال حديث">بنزين إرسال حديث</option>
                <option value="بنزين استلام قديم">بنزين استلام قديم</option>
                <option value="مازوت">مازوت</option>
              </select>
            </div>

            {/* Fuel Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-amber-400" />
                <span>نوع الوقود *</span>
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="بنزين">بنزين</option>
                <option value="مازوت">مازوت</option>
              </select>
            </div>

            {/* Assigned Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                القسم أو الدائرة المخصصة لها *
              </label>
              <select
                value={assignedDepartment}
                onChange={(e) => setAssignedDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Location */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>الموقع الميداني الحالي *</span>
              </label>
              <input
                type="text"
                required
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Chassis Number */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                رقم الشاسيه (الهيكل) - اختياري
              </label>
              <input
                type="text"
                value={chassisNumber}
                onChange={(e) => setChassisNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ملاحظات ومواصفات إضافية
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ التعديلات</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
