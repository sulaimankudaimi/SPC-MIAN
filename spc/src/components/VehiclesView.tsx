import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Truck, 
  MapPin, 
  Fuel, 
  Calendar, 
  Building2, 
  CheckCircle2,
  AlertOctagon,
  Clock,
  Layers,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  Filter,
  Check,
  LayoutGrid,
  ListFilter,
  Plus
} from 'lucide-react';
import { Vehicle, VehicleCategory, VehicleStatus, FuelType, MaintenanceRecord, Branch, Profile } from '../types';
import { StorageService } from '../services/storageService';
import { VehicleDetailPanel } from './VehicleDetailPanel';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  branch?: Branch;
  maintenanceRecords?: MaintenanceRecord[];
  currentUser?: Profile | null;
  onOpenAddVehicle?: () => void;
  onOpenAddMaintenance?: (vehicleId?: string) => void;
  onEditVehicle?: (vehicle: Vehicle) => void;
  onDeleteVehicle?: (vehicleId: string) => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({ 
  vehicles, 
  branch,
  maintenanceRecords,
  currentUser,
  onOpenAddVehicle,
  onOpenAddMaintenance,
  onEditVehicle,
  onDeleteVehicle,
}) => {
  // 1. Filter and Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<VehicleStatus[]>([]);
  const [selectedFuels, setSelectedFuels] = useState<FuelType[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<VehicleCategory[]>([]);
  const [groupByCategory, setGroupByCategory] = useState(false);

  // 2. Selection State (Master-Detail)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    vehicles.length > 0 ? vehicles[0].id : ''
  );

  // Ensure an active vehicle is selected if list updates
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicleId) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [vehicles, selectedVehicleId]);

  // Load maintenance records if not passed from props
  const allMaintenance = useMemo(() => {
    if (maintenanceRecords && maintenanceRecords.length > 0) {
      return maintenanceRecords;
    }
    return StorageService.getMaintenanceRecords();
  }, [maintenanceRecords]);

  // Toggle helpers for combinable multi-select chips
  const toggleStatus = (status: VehicleStatus) => {
    setSelectedStatuses((prev) => 
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const toggleFuel = (fuel: FuelType) => {
    setSelectedFuels((prev) => 
      prev.includes(fuel) ? prev.filter((f) => f !== fuel) : [...prev, fuel]
    );
  };

  const toggleCategory = (cat: VehicleCategory) => {
    setSelectedCategories((prev) => 
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedStatuses([]);
    setSelectedFuels([]);
    setSelectedCategories([]);
  };

  const hasActiveFilters = 
    searchTerm.trim() !== '' || 
    selectedStatuses.length > 0 || 
    selectedFuels.length > 0 || 
    selectedCategories.length > 0;

  // 3. Filtered Vehicles List
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((veh) => {
      // Search matching (number, type, department, location)
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        veh.vehicle_number.toLowerCase().includes(q) ||
        veh.vehicle_type.toLowerCase().includes(q) ||
        veh.assigned_department.toLowerCase().includes(q) ||
        veh.current_location.toLowerCase().includes(q);

      // Combinable filter chips matching
      const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(veh.status);

      const matchesFuel =
        selectedFuels.length === 0 || selectedFuels.includes(veh.fuel_type);

      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(veh.category);

      return matchesSearch && matchesStatus && matchesFuel && matchesCategory;
    });
  }, [vehicles, searchTerm, selectedStatuses, selectedFuels, selectedCategories]);

  // Currently selected vehicle entity
  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId) || filteredVehicles[0] || null;
  }, [vehicles, selectedVehicleId, filteredVehicles]);

  // Compute counts for filter chips
  const counts = useMemo(() => {
    return {
      status: {
        'تعمل': vehicles.filter((v) => v.status === 'تعمل').length,
        'متعطلة': vehicles.filter((v) => v.status === 'متعطلة').length,
        'خارج الخدمة': vehicles.filter((v) => v.status === 'خارج الخدمة').length,
        'معارة': vehicles.filter((v) => v.status === 'معارة').length,
      },
      fuel: {
        'بنزين': vehicles.filter((v) => v.fuel_type === 'بنزين').length,
        'مازوت': vehicles.filter((v) => v.fuel_type === 'مازوت').length,
      },
      category: {
        'بنزين إرسال حديث': vehicles.filter((v) => v.category === 'بنزين إرسال حديث').length,
        'بنزين استلام قديم': vehicles.filter((v) => v.category === 'بنزين استلام قديم').length,
        'مازوت': vehicles.filter((v) => v.category === 'مازوت').length,
      },
    };
  }, [vehicles]);

  // Grouped vehicles by category
  const groupedCategories: VehicleCategory[] = ['بنزين إرسال حديث', 'بنزين استلام قديم', 'مازوت'];

  const getStatusBadgeSmall = (status: VehicleStatus) => {
    switch (status) {
      case 'تعمل':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            تعمل
          </span>
        );
      case 'متعطلة':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            متعطلة
          </span>
        );
      case 'خارج الخدمة':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            خارج الخدمة
          </span>
        );
      case 'معارة':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            معارة
          </span>
        );
    }
  };

  const getCategoryBadgeSmall = (cat: VehicleCategory) => {
    switch (cat) {
      case 'بنزين إرسال حديث':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50';
      case 'بنزين استلام قديم':
        return 'bg-amber-950/70 text-amber-300 border-amber-700/50';
      case 'مازوت':
        return 'bg-blue-950/70 text-blue-300 border-blue-700/50';
    }
  };

  return (
    <div className="space-y-5">
      
      {/* 1. Header & Instant Search Controls */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">سجل الآليات والمعدات الميدانية</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30">
                تخطيط Master-Detail
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              استعراض فوري للأسطول مع فلاتر مدمجة وبطاقة تفصيلية جانبية متزامنة
            </p>
          </div>

          {/* Group by Category Toggle & Stats */}
          <div className="flex items-center gap-3 flex-wrap">
            {onOpenAddVehicle && (
              <button
                id="btn-open-add-vehicle"
                onClick={onOpenAddVehicle}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm shadow-amber-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ إضافة آلية جديدة</span>
              </button>
            )}

            <div className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              المعروض: <span className="font-bold text-amber-400 font-mono">{filteredVehicles.length}</span> من أصل <span className="font-mono">{vehicles.length}</span> آلية
            </div>

            {/* Toggle Grouping */}
            <button
              id="btn-toggle-grouping"
              onClick={() => setGroupByCategory(!groupByCategory)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                groupByCategory
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm shadow-amber-500/20'
                  : 'bg-slate-950 hover:bg-slate-850 text-slate-300 border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{groupByCategory ? 'إلغاء التجميع (عرض موحد)' : 'تجميع حسب الفئة'}</span>
            </button>

            {hasActiveFilters && (
              <button
                id="btn-reset-filters"
                onClick={resetAllFilters}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-semibold transition-colors"
                title="إعادة ضبط الفلاتر"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة ضبط الفلاتر</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="input-vehicle-instant-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث فوري برقم الآلية (مثل: SPC-DZ-101)، نوعها (هايلوكس، صهريج، رافعة)، القسم، أو الموقع..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-100 placeholder:text-slate-500 transition-colors"
          />
        </div>

        {/* 2. Combinable Filter Chips Row */}
        <div className="space-y-2.5 pt-1 border-t border-slate-800/80">
          
          {/* Status Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 w-24">
              الحالة التشغيلية:
            </span>
            {(['تعمل', 'متعطلة', 'خارج الخدمة', 'معارة'] as VehicleStatus[]).map((st) => {
              const isSelected = selectedStatuses.includes(st);
              const count = counts.status[st] || 0;
              return (
                <button
                  key={st}
                  onClick={() => toggleStatus(st)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-slate-950/70 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                  <span>{st}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected ? 'bg-amber-400/30 text-amber-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Fuel Type Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 w-24">
              نوع الوقود:
            </span>
            {(['بنزين', 'مازوت'] as FuelType[]).map((fuel) => {
              const isSelected = selectedFuels.includes(fuel);
              const count = counts.fuel[fuel] || 0;
              return (
                <button
                  key={fuel}
                  onClick={() => toggleFuel(fuel)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm'
                      : 'bg-slate-950/70 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-blue-400" />}
                  <Fuel className="w-3 h-3 opacity-70" />
                  <span>{fuel}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected ? 'bg-blue-400/30 text-blue-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 w-24">
              فئة الآلية:
            </span>
            {(['بنزين إرسال حديث', 'بنزين استلام قديم', 'مازوت'] as VehicleCategory[]).map((cat) => {
              const isSelected = selectedCategories.includes(cat);
              const count = counts.category[cat] || 0;
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                      : 'bg-slate-950/70 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected ? 'bg-emerald-400/30 text-emerald-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* 3. True Master-Detail Layout Structure */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        
        {/* ========================================================
            MASTER COLUMN (Larger part: flex-1 min-w-0)
            ======================================================== */}
        <div className="flex-1 min-w-0 w-full space-y-4">

          {/* If "Group by Category" is ACTIVE */}
          {groupByCategory ? (
            <div className="space-y-6">
              {groupedCategories.map((categoryName) => {
                const groupVehicles = filteredVehicles.filter(
                  (v) => v.category === categoryName
                );

                if (groupVehicles.length === 0) return null;

                const operationalInGroup = groupVehicles.filter((v) => v.status === 'تعمل').length;
                const groupRate = Math.round((operationalInGroup / groupVehicles.length) * 100);

                return (
                  <div 
                    key={categoryName}
                    className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-sm space-y-3"
                  >
                    {/* Category Header */}
                    <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">{categoryName}</h3>
                          <p className="text-[11px] text-slate-400">
                            جاهزية الفئة: <span className="text-emerald-400 font-bold">{groupRate}%</span> ({operationalInGroup} من {groupVehicles.length} تعمل)
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-amber-400 border border-slate-800">
                        {groupVehicles.length} آلية
                      </span>
                    </div>

                    {/* Group Items Grid */}
                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {groupVehicles.map((veh) => {
                        const isSelected = selectedVehicle?.id === veh.id;
                        return (
                          <div
                            key={veh.id}
                            onClick={() => setSelectedVehicleId(veh.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between gap-2 ${
                              isSelected
                                ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50'
                                : 'bg-slate-950/60 hover:bg-slate-850/60 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500 rounded-r-xl"></div>
                            )}

                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-mono font-bold text-sm text-amber-400 block">
                                  {veh.vehicle_number}
                                </span>
                                <span className="text-xs font-semibold text-slate-200 block truncate max-w-[200px]">
                                  {veh.vehicle_type}
                                </span>
                              </div>
                              {getStatusBadgeSmall(veh.status)}
                            </div>

                            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                              <span className="truncate max-w-[140px]">{veh.assigned_department}</span>
                              <span className="text-slate-500 font-mono">موديل {veh.manufacture_year}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Standard Table List View */
            <div 
              id="master-vehicles-table-card"
              className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-sm"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 text-[11px] uppercase select-none">
                    <tr>
                      <th scope="col" className="py-3.5 px-4 font-bold">الآلية / الرقم</th>
                      <th scope="col" className="py-3.5 px-4 font-bold">الموديل وسنة الصنع</th>
                      <th scope="col" className="py-3.5 px-4 font-bold">الحالة التشغيلية</th>
                      <th scope="col" className="py-3.5 px-4 font-bold">الوقود والفئة</th>
                      <th scope="col" className="py-3.5 px-4 font-bold">القسم والموقع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredVehicles.map((veh) => {
                      const isSelected = selectedVehicle?.id === veh.id;
                      return (
                        <tr
                          key={veh.id}
                          id={`vehicle-row-${veh.id}`}
                          onClick={() => setSelectedVehicleId(veh.id)}
                          className={`cursor-pointer transition-all duration-150 relative ${
                            isSelected
                              ? 'bg-amber-500/15 hover:bg-amber-500/20 text-white font-medium'
                              : 'hover:bg-slate-850/60 text-slate-300'
                          }`}
                        >
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              {isSelected && (
                                <span className="w-1.5 h-6 bg-amber-400 rounded-full shadow-sm"></span>
                              )}
                              <div>
                                <div className="font-mono font-bold text-amber-400 text-sm">
                                  {veh.vehicle_number}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {veh.id}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-200">
                              {veh.vehicle_type}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              سنة الصنع: {veh.manufacture_year}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {getStatusBadgeSmall(veh.status)}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getCategoryBadgeSmall(veh.category)}`}>
                                {veh.category}
                              </span>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Fuel className="w-3 h-3 text-slate-500" />
                                {veh.fuel_type}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate max-w-[170px]">{veh.assigned_department}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
                              <MapPin className="w-3 h-3 text-amber-500/70 shrink-0" />
                              <span className="truncate max-w-[170px]">{veh.current_location}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredVehicles.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-14 text-center text-slate-400 space-y-3">
                          <Truck className="w-10 h-10 text-slate-600 mx-auto opacity-70" />
                          <p className="font-bold text-sm text-slate-200">
                            {vehicles.length === 0 
                              ? (branch ? `لا توجد آليات مسجلة بعد في هذا الفرع (${branch.name})` : 'لا توجد آليات مسجلة بعد في هذا الفرع')
                              : 'لا توجد آليات مطابقة لمعايير البحث والفلترة'}
                          </p>
                          <p className="text-xs text-slate-400 max-w-md mx-auto">
                            {vehicles.length === 0 
                              ? `أسطول هذا الفرع فارغ حالياً. يمكنك تسجيل وإضافة آليات ومعدات جديدة مخصصة لفرع ${branch?.name || ''} في أي وقت.` 
                              : 'جرب تعديل كلمة البحث أو إزالة رقائق الفلترة المحددة'}
                          </p>
                          <div className="flex items-center justify-center gap-2 pt-2">
                            {vehicles.length === 0 && onOpenAddVehicle && (
                              <button
                                onClick={onOpenAddVehicle}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>إضافة آلية لهذا الفرع الآن</span>
                              </button>
                            )}
                            {hasActiveFilters && (
                              <button
                                onClick={resetAllFilters}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs rounded-lg transition-colors"
                              >
                                مسح كافة الفلاتر
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Master Footer Summary */}
              <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>
                  انقر على أي آلية لمعاينة بطاقتها وتاريخ صيانتها في العمود الأيسر
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  عرض {filteredVehicles.length} من {vehicles.length}
                </span>
              </div>
            </div>
          )}

        </div>

        {/* ========================================================
            DETAIL COLUMN (Fixed width ~380px, sticky on desktop)
            ======================================================== */}
        <VehicleDetailPanel
          vehicle={selectedVehicle}
          maintenanceList={allMaintenance}
          currentUser={currentUser}
          onOpenAddMaintenance={onOpenAddMaintenance}
          onEditVehicle={onEditVehicle}
          onDeleteVehicle={onDeleteVehicle}
        />

      </div>

    </div>
  );
};
