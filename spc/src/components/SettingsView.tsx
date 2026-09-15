import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  ExternalLink, 
  Building2, 
  Flame, 
  Cpu, 
  Code2, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  HardDrive, 
  FileCode, 
  Layers, 
  Info,
  Server
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { Profile } from '../types';
import { UserCheck, LogOut, Key } from 'lucide-react';

interface SettingsViewProps {
  onOpenSqlModal: () => void;
  onShowToast: (message: string) => void;
  currentUser?: Profile | null;
  onLogout?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenSqlModal,
  onShowToast,
  currentUser,
  onLogout,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Default Supabase project reference link and endpoint
  const supabaseProjectUrl = 'https://app.supabase.com/project/spc-deir-ezzor-fleet';
  const supabaseApiEndpoint = 'https://spc-deir-ezzor-fleet.supabase.co';

  const handleCopyUrl = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
    onShowToast('تم نسخ الرابط إلى الحافظة');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Information */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">إعدادات النظام ومعلومات البنية التحتية</h2>
            <p className="text-xs text-slate-400">
              بيانات الاعتماد، معلومات الربط بقاعدة بيانات Supabase، وصلاحيات الأمان Row Level Security
            </p>
          </div>
        </div>
      </div>

      {/* Auth & Active Session Card */}
      {currentUser && (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-bold ${
                currentUser.role === 'admin'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
              }`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">جلسة المصادقة وصلاحيات المستخدم (Supabase Auth)</h3>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                    currentUser.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  }`}>
                    {currentUser.role === 'admin' ? 'مشرف عام (admin)' : 'مستخدم فرع (branch_user)'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  معرّف الحساب في جدول profiles المرتبط بـ auth.users
                </p>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-300 hover:text-rose-200 border border-slate-800 hover:border-rose-800/50 text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل الخروج</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850">
              <span className="text-[11px] text-slate-400 block">الاسم الكامل:</span>
              <span className="font-bold text-white block mt-0.5">{currentUser.full_name}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850">
              <span className="text-[11px] text-slate-400 block">نطاق الصلاحيات:</span>
              <span className="font-bold text-amber-400 block mt-0.5">
                {currentUser.role === 'admin' 
                  ? 'وصول كامل لكافة الفروع مع صلاحيات التعديل والحذف'
                  : `مقيد بفرع ${currentUser.branch?.name || ''} (قراءة وإضافة فقط)`}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850">
              <span className="text-[11px] text-slate-400 block">الفرع المخصص:</span>
              <span className="font-bold text-slate-200 block mt-0.5 font-mono">
                {currentUser.branch ? `${currentUser.branch.name} (${currentUser.branch.code})` : 'كافة الفروع (مجمّع المركز)'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Supabase Database Connection Card */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">قاعدة بيانات Supabase (PostgreSQL)</h3>
              <p className="text-xs text-slate-400">مستودع البيانات السحابي ونموذج الجداول المعتمد</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              قاعدة البيانات متصلة ومطابقة
            </span>
          </div>
        </div>

        {/* Database Endpoint and Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">رابط لوحة تحكم المشروع (Dashboard):</span>
              <button
                onClick={() => handleCopyUrl(supabaseProjectUrl)}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
                title="نسخ الرابط"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUrl ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>
            
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="font-mono text-xs text-amber-400 truncate dir-ltr select-all">
                {supabaseProjectUrl}
              </span>
              <a
                href={supabaseProjectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors shrink-0"
                title="فتح في تبويب جديد"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">نقطة نهاية الـ API السحابية:</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-800">
                PostgREST v12
              </span>
            </div>
            
            <div className="pt-1">
              <span className="font-mono text-xs text-slate-300 truncate dir-ltr block select-all">
                {supabaseApiEndpoint}
              </span>
            </div>
          </div>

        </div>

        {/* Supabase Registered Tables */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-200">الجداول المهيكلة في Supabase:</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-amber-400">public.vehicles</span>
                <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                  Primary Key: UUID
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                يخزن أسطول الآليات، رقم الآلية، الموديل، سنة الصنع، الحالة التشغيلية، فئة الوقود، القسم المسؤول، والموقع.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-amber-400">public.maintenance_records</span>
                <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                  FK: vehicle_id → vehicles(id)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                يخزن سجلات وأوامر الصيانة الدورية، تفاصيل العطل، التكلفة المالية بالليرة السورية، والجهة المنفذة.
              </p>
            </div>

          </div>
        </div>

        {/* Trigger SQL Schema Modal */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-slate-400">
            للاطلاع على كود DDL الكامل ومؤشرات الأداء وسياسات الأمان (RLS):
          </div>
          <button
            onClick={onOpenSqlModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition-colors"
          >
            <Code2 className="w-4 h-4" />
            <span>عرض مخطط Supabase ومحاكي الاستعلامات</span>
          </button>
        </div>

      </div>

      {/* 3. General Application Info Card */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">معلومات عامة عن المنظومة</h3>
            <p className="text-xs text-slate-400">المعلومات الإدارية والتنظيمية لتطبيق إدارة الأسطول</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-850">
            <div>
              <span className="text-[10px] text-slate-400 block">اسم المنظومة:</span>
              <span className="font-bold text-slate-100 block mt-0.5">
                نظام إدارة ومتابعة آليات مديرية حقول دير الزور
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">الجهة المشرفة والمالكة:</span>
              <span className="font-bold text-amber-400 block mt-0.5">
                الشركة السورية للبترول (SPC) — وزارة النفط والثروة المعدنية
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">نطاق التغطية الميدانية:</span>
              <span className="text-slate-300 block mt-0.5">
                حقل التيم، حقل الشولا، محطة غاز دير الزور، المفرزة المركزية، دائرة النقل والحركة
              </span>
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-850">
            <div>
              <span className="text-[10px] text-slate-400 block">الإصدار البرمجي:</span>
              <span className="font-mono font-bold text-slate-100 block mt-0.5">
                v1.0.4 (Enterprise Desktop Build)
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">البيئة البرمجية والواجهة:</span>
              <span className="text-slate-300 block mt-0.5">
                React 18 • TypeScript • Tailwind CSS • Lucide Icons
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">دعم اللغة والتوجيه:</span>
              <span className="text-emerald-400 font-semibold block mt-0.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                لغة عربية أصلية بالكامل (True Native RTL)
              </span>
            </div>
          </div>

        </div>

        {/* Footer Note */}
        <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-850 text-slate-400 text-[11px] flex items-center justify-between">
          <span>حقوق النظام محفوظة لمديرية حقول دير الزور - الشركة السورية للبترول © {new Date().getFullYear()}</span>
          <span className="font-mono text-slate-500">SPC-DZ-SYS</span>
        </div>

      </div>

    </div>
  );
};
