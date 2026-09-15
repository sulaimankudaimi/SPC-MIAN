import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Search, 
  Calendar, 
  Coins, 
  UserCheck, 
  Truck, 
  ArrowUpDown,
  Filter,
  Plus,
  Trash2,
  Building2
} from 'lucide-react';
import { MaintenanceWithVehicle, Branch, Profile } from '../types';

interface MaintenanceViewProps {
  maintenanceList: MaintenanceWithVehicle[];
  branch?: Branch;
  currentUser?: Profile | null;
  onOpenAddMaintenance?: (vehicleId?: string) => void;
  onDeleteMaintenance?: (recordId: string) => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ 
  maintenanceList,
  branch,
  currentUser,
  onOpenAddMaintenance,
  onDeleteMaintenance,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const isAdmin = currentUser?.role === 'admin';
  const showDeleteAction = isAdmin && Boolean(onDeleteMaintenance);

  const formatSyp = (amount: number) => {
    return new Intl.NumberFormat('ar-SY').format(amount) + ' ل.س';
  };

  const filteredRecords = useMemo(() => {
    return maintenanceList
      .filter((rec) => {
        const query = searchTerm.toLowerCase();
        return (
          rec.description.toLowerCase().includes(query) ||
          rec.performed_by.toLowerCase().includes(query) ||
          rec.vehicle?.vehicle_number.toLowerCase().includes(query) ||
          rec.vehicle?.vehicle_type.toLowerCase().includes(query) ||
          rec.maintenance_date.includes(query)
        );
      })
      .sort((a, b) => {
        const timeA = new Date(a.maintenance_date).getTime();
        const timeB = new Date(b.maintenance_date).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [maintenanceList, searchTerm, sortOrder]);

  const totalCost = filteredRecords.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Filter Card */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white">
                {branch ? `سجلات صيانة وإصلاح ${branch.name}` : 'سجلات أوامر الصيانة والإصلاح'}
              </h2>
              {branch && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-bold border border-blue-500/30">
                  {branch.code}
                </span>
              )}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30">
                {filteredRecords.length} أمر صيانة
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              توثيق شامل لجميع العمليات الميكانيكية، الهيدروليكية، والكهربائية وتكاليفها
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {onOpenAddMaintenance && (
              <button
                id="btn-open-add-maintenance"
                onClick={() => onOpenAddMaintenance()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm shadow-amber-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ تسجيل صيانة جديدة</span>
              </button>
            )}

            <div className="text-left bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block">إجمالي تكلفة المعروض:</span>
              <span className="text-sm font-bold text-amber-400 font-mono">
                {formatSyp(totalCost)}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="input-maint-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بوصف العطل، جهة الإصلاح، رقم الآلية، أو التاريخ..."
              className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-100 placeholder:text-slate-500 transition-colors"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <span>الترتيب: {sortOrder === 'desc' ? 'الأحدث أولاً' : 'الأقدم أولاً'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Maintenance Table */}
      <div 
        id="maintenance-table-container"
        className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase">
              <tr>
                <th scope="col" className="py-3.5 px-4 font-bold">رقم الآلية</th>
                <th scope="col" className="py-3.5 px-4 font-bold">تاريخ الإجراء</th>
                <th scope="col" className="py-3.5 px-4 font-bold min-w-[280px]">الوصف والتفاصيل الفنية</th>
                <th scope="col" className="py-3.5 px-4 font-bold">الجهة المنفذة</th>
                <th scope="col" className="py-3.5 px-4 font-bold text-left">التكلفة المالية</th>
                {showDeleteAction && (
                  <th scope="col" className="py-3.5 px-3 font-bold text-center w-12">إجراء</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.map((item) => (
                <tr key={item.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0 font-bold">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-mono font-bold text-white">
                          {item.vehicle?.vehicle_number || item.vehicle_id}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          {item.vehicle?.vehicle_type || 'آلية ميدانية'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{item.maintenance_date}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-slate-200 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <UserCheck className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                      <span className="font-medium text-[11px]">{item.performed_by}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-left font-bold text-amber-400 font-mono text-sm">
                    {formatSyp(item.cost)}
                  </td>
                  {showDeleteAction && (
                    <td className="py-4 px-3 text-center">
                      <button
                        onClick={() => {
                          if (window.confirm('هل أنت متأكد من حذف سجل الصيانة هذا؟')) {
                            onDeleteMaintenance!(item.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="حذف سجل الصيانة (صلاحية المشرف)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={showDeleteAction ? 6 : 5} className="py-14 text-center text-slate-400 space-y-3">
                    <Wrench className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="font-bold text-sm text-slate-300">
                      {maintenanceList.length === 0 
                        ? (branch ? `لا توجد سجلات صيانة مسجلة حتى الآن لفرع (${branch.name})` : 'لا توجد أي سجلات صيانة مسجلة حتى الآن')
                        : 'لا توجد سجلات صيانة مطابقة لمعايير البحث'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {maintenanceList.length === 0 
                        ? (branch ? `أسطول ${branch.name} لا يحتوي على أي أوامر صيانة بعد.` : 'يمكنك تسجيل أول أمر صيانة لأي آلية في الأسطول.') 
                        : 'جرب تعديل كلمة البحث أو الترتيب'}
                    </p>
                    {onOpenAddMaintenance && (
                      <div className="pt-1">
                        <button
                          onClick={() => onOpenAddMaintenance()}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>تسجيل أمر صيانة جديد الآن</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

