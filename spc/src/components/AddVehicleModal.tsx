import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  Plus, 
  AlertCircle, 
  Building2, 
  MapPin, 
  Calendar, 
  Fuel, 
  Layers, 
  Check, 
  FileText 
} from 'lucide-react';
import { Vehicle, VehicleCategory, VehicleStatus, FuelType } from '../types';
import { StorageService } from '../services/storageService';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVehicleAdded: (newVehicle: Vehicle) => void;
  defaultBranchId?: string;
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
];

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({
  isOpen,
  onClose,
  onVehicleAdded,
  defaultBranchId = 'branch-dez',
}) => {
  const branches = StorageService.getBranches();
  const [branchId, setBranchId] = useState<string>(defaultBranchId);
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

  React.useEffect(() => {
    if (defaultBranchId) {
      setBranchId(defaultBranchId);
    }
  }, [defaultBranchId, isOpen]);

  if (!isOpen) return null;

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
      setError('يرجى إدخال رقم أو رمز الآلية (مثال: SPC-DZ-119)');
      return;
    }

    if (!vType) {
      setError('يرجى تحديد نوع أو موديل الآلية (مثال: تويوتا هايلوكس 4x4)');
      return;
    }

    // Check duplicate vehicle number
    const existing = StorageService.getVehicles();
    if (existing.some((v) => v.vehicle_number.toUpperCase() === vNum)) {
      setError(`الآلية رقم (${vNum}) مسجلة بالفعل في المنظومة. يرجى اختيار رقم مختلف.`);
      return;
    }

    const created = StorageService.addVehicle({
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
      engine_capacity: Number(engineCapacity) || 2700,
      fuel_quota_inside_city: Number(fuelQuotaInsideCity) || 180,
      fuel_quota_outside_city: Number(fuelQuotaOutsideCity) || 120,
      fuel_expense_covered_by: fuelExpenseCoveredBy.trim() || 'الفرات',
      requested_fuel_quantity: Number(requestedFuelQuantity) || 0,
    });

    onVehicleAdded(created);
    onClose();
  };

  const selectedBranchName = branches.find((b) => b.id === branchId)?.name || 'إدارة حقول دير الزور';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn select-text">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">إضافة آلية أو معدة ميدانية جديدة</h3>
              <p className="text-xs text-slate-400">تسجيل مركبة في أسطول {selectedBranchName} (SPC)</p>
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

          {/* Branch Selector */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>الفرع التابع له الآلية:</span>
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 font-semibold focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code}){b.is_headquarters ? ' • الإدارة العامة' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Vehicle Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 block">
                رقم الآلية أو اللوحة <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="مثال: SPC-DZ-119"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-100 font-mono"
              />
              <span className="text-[10px] text-slate-500">ترميز المنظومة الميداني للآلية</span>
            </div>

            {/* Vehicle Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 block">
                نوع وموديل الآلية <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                placeholder="مثال: تويوتا هايلوكس دبل كبين 4x4"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-100"
              />
              <span className="text-[10px] text-slate-500">طراز الآلية والمواصفة الأساسية</span>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 block">
                فئة الآلية والوقود
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as VehicleCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-100"
              >
                <option value="بنزين إرسال حديث">بنزين إرسال حديث (مخصصات حديثة)</option>
                <option value="بنزين استلام قديم">بنزين استلام قديم (الأسطول الميداني السابق)</option>
                <option value="مازوت">مازوت (ديزل للمعدات الثقيلة والخدمية)</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 block">
                الحالة التشغيلية الأولية
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-100"
              >
                <option value="تعمل">تعمل (جاهزة في الخدمة الميدانية)</option>
                <option value="متعطلة">متعطلة (تحتاج صيانة وإصلاح)</option>
                <option value="خارج الخدمة">خارج الخدمة (منسقة / حجز)</option>
                <option value="معارة">معارة (مؤجرة / لجهات أخرى)</option>
              </select>
            </div>

            {/* Manufacture Year */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 block">
                سنة الصنع
              </label>
              <input
                type="number"
                min={1980}
                max={2030}
                value={manufactureYear}
                onChange={(e) => setManufactureYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-100 font-mono"
              />
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 block">
                القسم الميداني المخصص له
              </label>
              <input
                type="text"
                list="dept-options"
                value={assignedDepartment}
                onChange={(e) => setAssignedDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-100"
              />
              <datalist id="dept-options">
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>

            {/* Current Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 block">
                الموقع الميداني الحالي
              </label>
              <input
                type="text"
                list="loc-options"
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-100"
              />
              <datalist id="loc-options">
                {LOCATIONS.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </div>

            {/* Chassis Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 block">
                رقم الشاسيه (اختياري)
              </label>
              <input
                type="text"
                value={chassisNumber}
                onChange={(e) => setChassisNumber(e.target.value)}
                placeholder="مثال: JTE-HZ78-984210"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-100 font-mono"
              />
            </div>

          </div>

          {/* Fuel Quotas Section */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Fuel className="w-4 h-4" />
              <span>بيانات المحرك ومخصصات الوقود الشهرية (دير الزور / الفروع)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-semibold block">سعة المحرك (cc)</label>
                <input
                  type="number"
                  min={500}
                  max={16000}
                  value={engineCapacity}
                  onChange={(e) => setEngineCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-750 text-xs font-mono text-white focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-semibold block">حصة داخل المدينة (لتر/شهر)</label>
                <input
                  type="number"
                  min={0}
                  max={5000}
                  value={fuelQuotaInsideCity}
                  onChange={(e) => setFuelQuotaInsideCity(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-750 text-xs font-mono text-amber-300 font-bold focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-semibold block">حصة خارج المدينة (لتر/شهر)</label>
                <input
                  type="number"
                  min={0}
                  max={5000}
                  value={fuelQuotaOutsideCity}
                  onChange={(e) => setFuelQuotaOutsideCity(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-750 text-xs font-mono text-amber-300 font-bold focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-semibold block">الجهة الممولة للوقود والصيانة</label>
                <input
                  type="text"
                  value={fuelExpenseCoveredBy}
                  onChange={(e) => setFuelExpenseCoveredBy(e.target.value)}
                  placeholder="الفرات"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-750 text-xs text-white focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-semibold block">الكمية المطلوبة حالياً (لتر)</label>
                <input
                  type="number"
                  min={0}
                  max={2000}
                  value={requestedFuelQuantity}
                  onChange={(e) => setRequestedFuelQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-750 text-xs font-mono text-white focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 block">
              ملاحظات فنية أو تشغيلية إضافية
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي ملاحظات حول التجهيزات الملحقة، حالة الإطارات، أو أوامر الاستلام..."
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
              id="btn-submit-add-vehicle"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>حفظ وإدراج الآلية</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
