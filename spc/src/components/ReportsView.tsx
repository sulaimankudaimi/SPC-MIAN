import React, { useState, useMemo, useRef } from 'react';
import { 
  FileBarChart2, 
  Download, 
  Printer, 
  Calendar, 
  Building2, 
  Layers, 
  Coins, 
  Wrench, 
  Filter, 
  RotateCcw, 
  CheckCircle2, 
  Flame, 
  ShieldCheck, 
  ExternalLink,
  Loader2,
  FileText,
  Clock,
  Truck,
  Eye
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { MaintenanceWithVehicle, VehicleCategory, Vehicle } from '../types';

interface ReportsViewProps {
  maintenanceList: MaintenanceWithVehicle[];
  vehicles: Vehicle[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  maintenanceList,
  vehicles,
}) => {
  // 1. Filter States
  const [datePreset, setDatePreset] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [lastGeneratedBlobUrl, setLastGeneratedBlobUrl] = useState<string | null>(null);

  // Hidden/Visible printable document ref
  const reportPrintRef = useRef<HTMLDivElement>(null);

  // Departments list extracted from vehicles
  const departments = useMemo(() => {
    const set = new Set<string>();
    vehicles.forEach((v) => {
      if (v.assigned_department) set.add(v.assigned_department);
    });
    return Array.from(set).sort();
  }, [vehicles]);

  // Handle Preset Changes
  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'q1-2024') {
      setStartDate('2024-01-01');
      setEndDate('2024-03-31');
    } else if (preset === 'march-2024') {
      setStartDate('2024-03-01');
      setEndDate('2024-03-31');
    } else if (preset === 'feb-2024') {
      setStartDate('2024-02-01');
      setEndDate('2024-02-29');
    } else if (preset === 'last-30') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setSelectedDepartment('all');
    setSelectedCategory('all');
  };

  // 2. Filtered Maintenance Records
  const filteredRecords = useMemo(() => {
    return maintenanceList.filter((rec) => {
      // Date Filter
      const recDate = rec.maintenance_date;
      if (startDate && recDate < startDate) return false;
      if (endDate && recDate > endDate) return false;

      // Department Filter
      if (selectedDepartment !== 'all') {
        const dept = rec.vehicle?.assigned_department;
        if (dept !== selectedDepartment) return false;
      }

      // Category Filter
      if (selectedCategory !== 'all') {
        const cat = rec.vehicle?.category;
        if (cat !== selectedCategory) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.maintenance_date).getTime() - new Date(a.maintenance_date).getTime());
  }, [maintenanceList, startDate, endDate, selectedDepartment, selectedCategory]);

  // 3. Computed Aggregates
  const totalCost = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);
  }, [filteredRecords]);

  const averageCost = useMemo(() => {
    return filteredRecords.length > 0 ? Math.round(totalCost / filteredRecords.length) : 0;
  }, [filteredRecords, totalCost]);

  // Cost by Category
  const categoryCostSummary = useMemo<Record<VehicleCategory, { count: number; cost: number }>>(() => {
    const summary: Record<VehicleCategory, { count: number; cost: number }> = {
      'بنزين إرسال حديث': { count: 0, cost: 0 },
      'بنزين استلام قديم': { count: 0, cost: 0 },
      'مازوت': { count: 0, cost: 0 },
    };

    filteredRecords.forEach((rec) => {
      const cat = (rec.vehicle?.category || 'مازوت') as VehicleCategory;
      if (summary[cat]) {
        summary[cat].count += 1;
        summary[cat].cost += Number(rec.cost) || 0;
      }
    });

    return summary;
  }, [filteredRecords]);

  const formatSyp = (amount: number) => {
    return new Intl.NumberFormat('ar-SY').format(amount) + ' ل.س';
  };

  const currentDateFormatted = new Intl.DateTimeFormat('ar-SY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  // 4. REAL PDF EXPORT ENGINE (html2canvas + jsPDF with 100% True Native RTL Arabic)
  const handleExportPdf = async () => {
    if (!reportPrintRef.current) return;

    try {
      setIsExporting(true);
      setExportSuccess(false);

      const element = reportPrintRef.current;

      // Render high-DPI canvas capturing browser's native Arabic OpenType ligature shaping
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution for crisp printing
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200, // Fixed width for consistent A4 formatting
      });

      const imgData = canvas.toDataURL('image/png');

      // Standard A4 dimensions in mm (Landscape for rich enterprise data tables)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth - 16; // 8mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 8; // Top margin

      // First Page
      pdf.addImage(imgData, 'PNG', 8, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= (pageHeight - 16);

      // Handle multi-page if records are extensive
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 8;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 8, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= (pageHeight - 16);
      }

      // Generate Blob URL for optional in-browser previewing
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      setLastGeneratedBlobUrl(blobUrl);

      // Trigger automatic download
      const fileName = `تقرير_صيانة_حقول_دير_الزور_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 6000);
    } catch (error) {
      console.error('فشل تصدير ملف PDF:', error);
      alert('حدث خطأ أثناء إنشاء ملف PDF. يرجى المحاولة مجدداً.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Quick Actions */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <FileBarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">مركز التقارير الفنية وتكاليف الصيانة</h2>
                <p className="text-xs text-slate-400">
                  تقرير تحليلي قابل للتصفية مع دعم تصدير ملفات PDF الرسمية باللغة العربية (RTL)
                </p>
              </div>
            </div>
          </div>

          {/* Main PDF Export & Print Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {lastGeneratedBlobUrl && (
              <a
                href={lastGeneratedBlobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 border border-slate-700 text-xs font-semibold transition-colors"
                title="معاينة الملف الذي تم تصديره في تبويب منفصل"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>معاينة آخر PDF تم تنزيله</span>
              </a>
            )}

            <button
              onClick={handleNativePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-colors"
              title="طباعة عبر الطابعة المباشرة أو حفظ كـ PDF عبر المتصفح"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>طباعة المستند</span>
            </button>

            <button
              id="btn-export-pdf"
              onClick={handleExportPdf}
              disabled={isExporting || filteredRecords.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>جاري معالجة وتصدير PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>تصدير PDF رسمي (RTL)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {exportSuccess && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                تم بنجاح تنزيل ملف PDF الفعلي مع معالجة النصوص العربية والحروف المتصلة بالكامل!
              </span>
            </div>
            {lastGeneratedBlobUrl && (
              <a
                href={lastGeneratedBlobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold text-emerald-200 flex items-center gap-1"
              >
                <span>فتح الملف مباشرة</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* 2. Comprehensive Filter Bar */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>معايير تصفية التقرير:</span>
            </span>

            {(datePreset !== 'all' || selectedDepartment !== 'all' || selectedCategory !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إلغاء التصفية وإعادة ضبط</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Filter 1: Quick Date Presets */}
            <div>
              <label htmlFor="select-date-preset" className="block text-[11px] font-medium text-slate-400 mb-1">
                الفترة الزمنية المحددة:
              </label>
              <select
                id="select-date-preset"
                value={datePreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs text-slate-200"
              >
                <option value="all">كافة السجلات التاريخية</option>
                <option value="q1-2024">الربع الأول 2024 (يناير - مارس)</option>
                <option value="march-2024">شهر آذار (مارس) 2024</option>
                <option value="feb-2024">شهر شباط (فبراير) 2024</option>
                <option value="last-30">آخر 30 يوماً</option>
                <option value="custom">نطاق تاريخ مخصص...</option>
              </select>
            </div>

            {/* Filter 2: Custom Date Range Inputs */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                من تاريخ - إلى تاريخ:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-200 focus:border-amber-500"
                  title="تاريخ البداية"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDatePreset('custom');
                  }}
                  className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-200 focus:border-amber-500"
                  title="تاريخ النهاية"
                />
              </div>
            </div>

            {/* Filter 3: Department */}
            <div>
              <label htmlFor="select-report-dept" className="block text-[11px] font-medium text-slate-400 mb-1">
                القسم / جهة التبعية:
              </label>
              <select
                id="select-report-dept"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs text-slate-200"
              >
                <option value="all">كافة الأقسام والمواقع ({departments.length})</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 4: Category */}
            <div>
              <label htmlFor="select-report-category" className="block text-[11px] font-medium text-slate-400 mb-1">
                فئة استلام الآلية:
              </label>
              <select
                id="select-report-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-xs text-slate-200"
              >
                <option value="all">كافة الفئات</option>
                <option value="بنزين إرسال حديث">بنزين إرسال حديث</option>
                <option value="بنزين استلام قديم">بنزين استلام قديم</option>
                <option value="مازوت">مازوت (ديزل)</option>
              </select>
            </div>

          </div>
        </div>
      </div>

      {/* 3. Aggregate KPI Stats Cards for Current Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">أوامر الصيانة المطابقة</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">
              {filteredRecords.length}
            </span>
            <span className="text-[10px] text-slate-500">من إجمالي {maintenanceList.length} أمر مسجل</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 bg-amber-500/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-300/80 block">إجمالي تكاليف الصيانة</span>
            <span className="text-xl font-black text-amber-400 font-mono mt-1 block">
              {formatSyp(totalCost)}
            </span>
            <span className="text-[10px] text-slate-400">حسب الفترة المحددة</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">متوسط تكلفة الإصلاح</span>
            <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">
              {formatSyp(averageCost)}
            </span>
            <span className="text-[10px] text-slate-500">لكل أمر عمل منفذ</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs text-slate-400 block mb-1">توزيع التكلفة حسب الفئة:</span>
          <div className="space-y-1 text-[11px]">
            {(Object.entries(categoryCostSummary) as [VehicleCategory, { count: number; cost: number }][]).map(([cat, val]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-slate-300 truncate max-w-[110px]">{cat}:</span>
                <span className="font-mono text-amber-400 font-bold">{formatSyp(val.cost)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Document Live Preview Card (What goes into PDF) */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-white">معاينة المستند الرسمي المعتمد قبل التصدير</h3>
          </div>
          <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
            تنسيق A4 رسمي • لغة عربية سليمة (RTL) • شعار الشركة السورية للبترول
          </span>
        </div>

        {/* =========================================================================
            ACTUAL OFFICIAL PRINTABLE REPORT CONTAINER
            This exact element is captured by html2canvas + jsPDF with 100% Arabic fidelity
           ========================================================================= */}
        <div className="overflow-x-auto p-2 bg-slate-950 rounded-xl border border-slate-800/80">
          <div
            ref={reportPrintRef}
            id="official-spc-report"
            dir="rtl"
            className="w-[1100px] mx-auto bg-white text-slate-900 p-8 shadow-2xl rounded-sm font-['Cairo',sans-serif] select-text"
            style={{ minHeight: '650px' }}
          >
            {/* Top Official Letterhead Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-5">
              <div className="flex items-start justify-between">
                
                {/* Right Header (Ministry & Company) */}
                <div className="text-right space-y-1 text-xs text-slate-800">
                  <p className="font-bold text-sm text-slate-950">الجمهورية العربية السورية</p>
                  <p className="font-bold text-xs text-slate-900">وزارة النفط والثروة المعدنية</p>
                  <p className="font-black text-sm text-amber-800">الشركة السورية للبترول (SPC)</p>
                  <p className="text-xs font-semibold text-slate-700">مديرية حقول دير الزور</p>
                  <p className="text-[11px] text-slate-600">دائرة الآليات وحركة النقل الميداني</p>
                </div>

                {/* Center Emblem / Official SPC Emblem Badge */}
                <div className="text-center space-y-1.5 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md font-black">
                    <Flame className="w-9 h-9 fill-white text-white" />
                  </div>
                  <span className="font-black text-xs tracking-widest text-slate-900">SPC • DEIR EZ-ZOR</span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300 font-semibold">
                    تقرير دوري فني رسمي
                  </span>
                </div>

                {/* Left Header (Document Reference & Date) */}
                <div className="text-left space-y-1 text-xs text-slate-800" dir="ltr">
                  <p className="font-mono text-xs font-bold text-slate-900">REF: SPC-DZ-RPT-{new Date().getFullYear()}-042</p>
                  <p className="text-xs text-slate-700">Date: {new Date().toISOString().slice(0, 10)}</p>
                  <p className="text-xs text-slate-700 font-semibold" dir="rtl">التاريخ: {currentDateFormatted}</p>
                  <p className="text-[11px] text-slate-600" dir="rtl">الوردية: الأولى (العمليات المركزية)</p>
                </div>

              </div>

              {/* Main Report Title */}
              <div className="text-center mt-4 pt-3 border-t border-slate-200">
                <h1 className="text-xl font-black text-slate-950 tracking-wide">
                  جدول تقرير الصيانة والإصلاحات الفنية وتكاليف الأسطول
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  حقول النفط والغاز - مديرية دير الزور والبادية الشرقية
                </p>
              </div>
            </div>

            {/* Filter Conditions Box in Printed Document */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-5 grid grid-cols-4 gap-3 text-xs text-slate-800">
              <div>
                <span className="font-bold text-slate-600 block text-[10px]">الفترة المغطاة:</span>
                <span className="font-semibold text-slate-900">
                  {startDate && endDate ? `${startDate} إلى ${endDate}` : 'كافة السجلات التاريخية المتاحة'}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block text-[10px]">القسم المسؤول:</span>
                <span className="font-semibold text-slate-900">
                  {selectedDepartment === 'all' ? 'كافة الأقسام والمحطات' : selectedDepartment}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block text-[10px]">فئة المحروقات:</span>
                <span className="font-semibold text-slate-900">
                  {selectedCategory === 'all' ? 'جميع الفئات (بنزين ومازوت)' : selectedCategory}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block text-[10px]">إجمالي التكلفة المعتمدة:</span>
                <span className="font-black text-amber-700 font-mono text-sm">
                  {formatSyp(totalCost)}
                </span>
              </div>
            </div>

            {/* Official Printable Maintenance Table */}
            <div className="mb-6">
              <table className="w-full border-collapse text-xs text-right">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold border border-slate-800 text-[11px]">
                    <th className="p-2 border border-slate-700 text-center w-10">#</th>
                    <th className="p-2 border border-slate-700 whitespace-nowrap">رقم الآلية</th>
                    <th className="p-2 border border-slate-700 min-w-[140px]">نوع وموديل الآلية</th>
                    <th className="p-2 border border-slate-700 whitespace-nowrap">تاريخ الإجراء</th>
                    <th className="p-2 border border-slate-700 min-w-[260px]">وصف العطل والإجراء الفني المنفذ</th>
                    <th className="p-2 border border-slate-700 min-w-[140px]">الجهة / الورشة المنفذة</th>
                    <th className="p-2 border border-slate-700 whitespace-nowrap text-left">التكلفة (ل.س)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                    >
                      <td className="p-2 border border-slate-200 text-center font-mono text-[11px] text-slate-600">
                        {idx + 1}
                      </td>
                      <td className="p-2 border border-slate-200 font-bold font-mono text-slate-950 whitespace-nowrap">
                        {item.vehicle?.vehicle_number || item.vehicle_id}
                      </td>
                      <td className="p-2 border border-slate-200 font-semibold text-slate-800">
                        <div>{item.vehicle?.vehicle_type || 'آلية ميدانية'}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{item.vehicle?.category}</div>
                      </td>
                      <td className="p-2 border border-slate-200 font-mono whitespace-nowrap text-slate-700">
                        {item.maintenance_date}
                      </td>
                      <td className="p-2 border border-slate-200 text-slate-800 leading-relaxed">
                        {item.description}
                      </td>
                      <td className="p-2 border border-slate-200 text-slate-700 text-[11px]">
                        {item.performed_by}
                      </td>
                      <td className="p-2 border border-slate-200 text-left font-mono font-black text-amber-800 whitespace-nowrap">
                        {formatSyp(item.cost)}
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500 border border-slate-200">
                        لا توجد سجلات صيانة تطابق المعايير المحددة في التقرير
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black border-2 border-slate-800 text-xs">
                    <td colSpan={4} className="p-2.5 border border-slate-300 text-slate-900 font-bold">
                      المجموع العام المالي لكافة أوامر الصيانة المنفذة:
                    </td>
                    <td colSpan={2} className="p-2.5 border border-slate-300 text-slate-700 text-[11px] font-medium">
                      عدد الأوامر: {filteredRecords.length} عملية
                    </td>
                    <td className="p-2.5 border border-slate-300 text-left font-mono text-amber-900 text-sm whitespace-nowrap">
                      {formatSyp(totalCost)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Official Signatures & Verification Footer */}
            <div className="mt-8 pt-6 border-t-2 border-slate-300 grid grid-cols-3 gap-6 text-center text-xs text-slate-800">
              <div className="space-y-8">
                <p className="font-bold text-slate-950">رئيس ورشة الصيانة الميكانيكية</p>
                <div className="h-8 border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                <p className="text-[11px] text-slate-600">التوقيع والخاتم</p>
              </div>

              <div className="space-y-8">
                <p className="font-bold text-slate-950">رئيس دائرة الحركة ونقل الآليات</p>
                <div className="h-8 border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                <p className="text-[11px] text-slate-600">التوقيع والخاتم</p>
              </div>

              <div className="space-y-8">
                <p className="font-bold text-slate-950">مدير حقول دير الزور - SPC</p>
                <div className="h-8 border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                <p className="text-[11px] text-slate-600">اعتماد وتصديق المديرية</p>
              </div>
            </div>

            {/* Security Bottom Bar */}
            <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
              <span>نظام إدارة آليات مديرية حقول دير الزور • الشركة السورية للبترول</span>
              <span className="font-mono">Document Security Code: SPC-DZ-SEC-{Math.floor(Math.random() * 90000 + 10000)}</span>
              <span>صفحة 1 من 1</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
