import React, { useState, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  FileJson, 
  Calendar, 
  Truck, 
  Wrench, 
  Clock, 
  FileCode, 
  Copy, 
  Check, 
  X,
  FileCheck,
  HardDrive
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { Vehicle, MaintenanceWithVehicle } from '../types';

interface BackupViewProps {
  vehicles: Vehicle[];
  maintenanceList: MaintenanceWithVehicle[];
  onDataRestored: () => void;
  onShowToast: (message: string) => void;
}

export const BackupView: React.FC<BackupViewProps> = ({
  vehicles,
  maintenanceList,
  onDataRestored,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importedFileContent, setImportedFileContent] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<{
    version?: string;
    exported_at?: string;
    vehiclesCount: number;
    maintenanceCount: number;
    isValid: boolean;
    error?: string;
  } | null>(null);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [resetConfirmModalOpen, setResetConfirmModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate Current Backup JSON
  const currentBackup = StorageService.exportBackupData();
  const currentBackupString = JSON.stringify(currentBackup, null, 2);

  // 1. Export JSON Action
  const handleDownloadBackup = () => {
    const blob = new Blob([currentBackupString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `spc_deir_ezzor_backup_${now}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast('تم تصدير ملف النسخة الاحتياطية (JSON) بنجاح!');
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(currentBackupString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast('تم نسخ نص النسخة الاحتياطية للحافظة');
  };

  // 2. Read and Validate File
  const processFile = (file: File) => {
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      onShowToast('يرجى اختيار ملف بصيغة JSON صالحة.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportedFileContent(content);

      try {
        const parsed = JSON.parse(content);
        const vList = parsed?.data?.vehicles || parsed?.vehicles;
        const mList = parsed?.data?.maintenance_records || parsed?.maintenance_records || parsed?.maintenance;

        if (Array.isArray(vList) && Array.isArray(mList)) {
          setParsedPreview({
            version: parsed?.version || '1.0',
            exported_at: parsed?.exported_at,
            vehiclesCount: vList.length,
            maintenanceCount: mList.length,
            isValid: true,
          });
        } else {
          setParsedPreview({
            vehiclesCount: 0,
            maintenanceCount: 0,
            isValid: false,
            error: 'الملف لا يحتوي على مصفوفات صالحة للآليات أو سجلات الصيانة.',
          });
        }
      } catch (err) {
        setParsedPreview({
          vehiclesCount: 0,
          maintenanceCount: 0,
          isValid: false,
          error: 'فشل تحليل ملف JSON. تأكد من سلامة صياغة الملف.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // 3. Confirm and Execute Restore
  const handleExecuteRestore = () => {
    if (!importedFileContent) return;

    const result = StorageService.restoreBackupData(importedFileContent);
    if (result.success) {
      onDataRestored();
      setConfirmModalOpen(false);
      setImportedFileContent(null);
      setParsedPreview(null);
      onShowToast(`تمت استعادة البيانات بنجاح: (${result.vehiclesCount} آلية و ${result.maintenanceCount} سجل صيانة).`);
    } else {
      alert(`فشلت استعادة البيانات: ${result.error}`);
    }
  };

  // 4. Reset to Seed Data
  const handleExecuteReset = () => {
    StorageService.resetToSeedData();
    onDataRestored();
    setResetConfirmModalOpen(false);
    onShowToast('تمت استعادة البيانات الأولية الافتراضية بنجاح!');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Information */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">إدارة النسخ الاحتياطي واستعادة البيانات</h2>
            <p className="text-xs text-slate-400">
              تصدير واستيراد كامل قاعدة البيانات (الآليات وسجلات الصيانة) كملفات JSON متوافقة مع مخطط Supabase
            </p>
          </div>
        </div>

        {/* Current Database Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">الآليات الحالية المسجلة:</span>
              <span className="text-sm font-bold text-slate-100 font-mono">{vehicles.length} آلية</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">سجلات الصيانة الحالية:</span>
              <span className="text-sm font-bold text-slate-100 font-mono">{maintenanceList.length} سجل صيانة</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">حجم البيانات التقديري:</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                ~{(new Blob([currentBackupString]).size / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Actions (Export vs Import) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Column 1: Export Backup */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between space-y-5 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Download className="w-4 h-4" />
                <span>تصدير نسخة احتياطية كاملة (JSON)</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                JSON • v1.0
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              يقوم هذا الإجراء بحفظ نسخة احتياطية شاملة لكافة بيانات الأسطول الحالية، متضمنةً جميع خصائص الآليات، الفئات، الأقسام، والمواقع الميدانية، بالإضافة إلى سجلات وأوامر الصيانة وتكاليفها المالية بالكامل.
            </p>

            {/* Structure Highlights */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-2 text-xs text-slate-400">
              <div className="flex items-center justify-between text-[11px]">
                <span>جدول الآليات (public.vehicles):</span>
                <span className="font-mono text-amber-400 font-bold">{vehicles.length} سجل</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span>جدول الصيانة (public.maintenance_records):</span>
                <span className="font-mono text-amber-400 font-bold">{maintenanceList.length} سجل</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span>تاريخ ووقت الإنشاء:</span>
                <span className="font-mono text-slate-300 text-[10px]">{new Date().toLocaleString('ar-SY')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              id="btn-download-backup-json"
              onClick={handleDownloadBackup}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>تنزيل ملف النسخة الاحتياطية (.json)</span>
            </button>

            <button
              onClick={handleCopyJson}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="نسخ محتوى JSON للحافظة"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
            </button>
          </div>
        </div>

        {/* Column 2: Import & Restore Backup */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between space-y-5 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Upload className="w-4 h-4" />
                <span>استيراد واستعادة نسخة احتياطية</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-800/40">
                استعادة آمنة
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ارفع ملف النسخة الاحتياطية السابق لاستعادة بيانات الآليات وسجلات الصيانة فوراً. سيتم فحص ومعاينة بنية الملف قبل الكتابة فوق البيانات الحالية.
            </p>

            {/* Drag and Drop Zone or File Picker */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center space-y-2.5 ${
                isDragging
                  ? 'border-amber-500 bg-amber-500/10'
                  : parsedPreview?.isValid
                  ? 'border-emerald-500/60 bg-emerald-500/5'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-950/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center mx-auto border border-slate-700">
                <Upload className="w-5 h-5 text-amber-400" />
              </div>

              <div>
                <p className="text-xs font-bold text-slate-200">
                  اسحب ملف النسخة الاحتياطية هنا، أو <span className="text-amber-400 underline">تصفح من جهازك</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  يدعم ملفات JSON المنتجة عبر النظام
                </p>
              </div>
            </div>

            {/* Inspected File Preview Badge */}
            {parsedPreview && (
              <div className={`p-3 rounded-xl border text-xs space-y-2 ${
                parsedPreview.isValid 
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              }`}>
                {parsedPreview.isValid ? (
                  <>
                    <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>الملف صالح للاستعادة:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-400 block">الآليات المكتشفة:</span>
                        <span className="font-mono font-bold text-emerald-300">{parsedPreview.vehiclesCount} آلية</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">سجلات الصيانة:</span>
                        <span className="font-mono font-bold text-emerald-300">{parsedPreview.maintenanceCount} سجل</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 text-rose-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{parsedPreview.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <button
              id="btn-trigger-restore"
              onClick={() => setConfirmModalOpen(true)}
              disabled={!parsedPreview || !parsedPreview.isValid}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileCheck className="w-4 h-4" />
              <span>متابعة استعادة البيانات وكتابة التغييرات</span>
            </button>
          </div>
        </div>

      </div>

      {/* 3. Emergency Reset to Default Seed Data Card */}
      <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center shrink-0 border border-slate-700">
            <RotateCcw className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">إعادة تعيين البيانات الافتراضية الأولية للمديرية</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              يعيد ضبط الجداول إلى الـ 18 آلية الأساسية والـ 14 سجل صيانة المعتمدة في السيناريو التشغيلي الأولي.
            </p>
          </div>
        </div>

        <button
          onClick={() => setResetConfirmModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>إعادة ضبط البيانات الأولية</span>
        </button>
      </div>

      {/* 4. Restore Confirmation Modal (Mandatory Per User Prompt) */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-2xl p-6 shadow-2xl space-y-4 text-right">
            
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">تأكيد استبدال البيانات</h3>
                <p className="text-xs text-amber-300/90">إجراء استعادة النسخة الاحتياطية</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300 leading-relaxed">
              <p>
                ⚠️ <strong>تحذير هام:</strong> هذا الإجراء سيقوم بحذف وكتابة البيانات الحالية في النظام واستبدالها بما يحتويه الملف المرفوع:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono text-[11px] pt-1">
                <li>عدد الآليات الجديدة: {parsedPreview?.vehiclesCount} آلية</li>
                <li>عدد سجلات الصيانة الجديدة: {parsedPreview?.maintenanceCount} سجل</li>
              </ul>
              <p className="text-[11px] text-amber-400/90 pt-1">
                يرجى التأكد من رغبتك قبل المتابعة، حيث لا يمكن التراجع عن هذا الإجراء دون نسخة احتياطية أخرى.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                إلغاء الأمر
              </button>

              <button
                id="btn-confirm-overwrite-restore"
                onClick={handleExecuteRestore}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>نعم، استبدال واستعادة البيانات الآن</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. Reset Confirmation Modal */}
      {resetConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 text-right">
            
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">إعادة تعيين البيانات الأولية</h3>
                <p className="text-xs text-slate-400">استعادة 18 آلية و 14 أمر صيانة</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              هل أنت متأكد من إعادة ضبط قاعدة البيانات المحلية إلى حالتها الأولية؟ ستفقد أي تعديلات قمت بها إن لم تقم بتصدير نسخة احتياطية مسبقاً.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setResetConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                إلغاء
              </button>

              <button
                onClick={handleExecuteReset}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
              >
                تأكيد إعادة التعيين
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
