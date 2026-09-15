import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  KeyRound,
  Database,
  UserCheck
} from 'lucide-react';
import { SupabaseAuthService, SEED_USERS } from '../services/supabaseService';
import { Profile, SeedUser } from '../types';

interface LoginViewProps {
  onLoginSuccess: (profile: Profile) => void;
  onOpenSqlModal: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onOpenSqlModal }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedSeedEmail, setSelectedSeedEmail] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await SupabaseAuthService.signInWithPassword(email, password);
      if (result.error || !result.user) {
        setErrorMessage(result.error || 'فشل تسجيل الدخول. تأكد من صحة البيانات المدخلة.');
      } else {
        onLoginSuccess(result.user);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`حدث خطأ أثناء الاتصال بمزود الهوية: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSeedUser = (seed: SeedUser) => {
    setEmail(seed.email);
    setPassword(seed.password);
    setSelectedSeedEmail(seed.email);
    setErrorMessage(null);
  };

  return (
    <div 
      id="spc-login-view"
      className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 selection:bg-amber-500 selection:text-slate-950" 
      dir="rtl"
    >
      {/* Background radial highlight */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[800px] h-[500px] bg-amber-500/5 rounded-full blur-3xl -translate-y-24" />
        <div className="w-[600px] h-[400px] bg-blue-600/5 rounded-full blur-3xl translate-y-32" />
      </div>

      <div className="w-full max-w-5xl z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch my-auto">
        
        {/* Left Column (Main Login Card - 7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col justify-between">
          <div>
            {/* Logo and Brand Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20 shrink-0">
                SPC
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>بوابة المصادقة المركزية • Supabase Auth</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  الشركة السورية للبترول (SPC)
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  منظومة إدارة آليات ومعدات الفروع الميدانية
                </p>
              </div>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div 
                id="login-error-alert"
                className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs animate-shake"
              >
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed font-medium">
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  البريد الإلكتروني المؤسسي
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@spc.sy"
                    className="w-full pl-4 pr-11 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    كلمة المرور
                  </label>
                  <span className="text-[11px] text-slate-500 font-normal">
                    مطابقة لمعايير أمان Supabase
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-11 pr-11 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono text-left"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>جارٍ التحقق والمصادقة...</span>
                  </>
                ) : (
                  <>
                    <span>تسجيل الدخول إلى المنظومة</span>
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Security & RLS notice in footer */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>أمان الصفوف RLS مفعّل على مستوى قاعدة البيانات PostgreSQL</span>
            </div>
            <button
              type="button"
              onClick={onOpenSqlModal}
              className="text-amber-400 hover:text-amber-300 underline underline-offset-4 flex items-center gap-1 font-medium transition-colors"
            >
              <Database className="w-3 h-3" />
              <span>مخطط Supabase و RLS</span>
            </button>
          </div>
        </div>

        {/* Right Column (Seed Accounts & Role Overview - 5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-2">
              <KeyRound className="w-4 h-4" />
              <span>الحسابات التجريبية المعتمدة (5 أدوار)</span>
            </div>
            <h2 className="text-base font-bold text-white mb-2">
              اختبر نظام الصلاحيات الفعلي (RLS)
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              انقر على أي حساب أدناه ليتم تعبئة بياناته فوراً واختبار واجهة وصلاحيات الدور بدقة:
            </p>

            {/* Seed Users List */}
            <div className="space-y-2.5">
              {SEED_USERS.map((seed) => {
                const isSelected = selectedSeedEmail === seed.email;
                const isAdmin = seed.role === 'admin';

                return (
                  <button
                    key={seed.email}
                    type="button"
                    onClick={() => handleSelectSeedUser(seed)}
                    className={`w-full text-right p-3 rounded-2xl border transition-all flex flex-col gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-xs text-white truncate">
                          {seed.full_name}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
                            isAdmin
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {isAdmin ? 'المشرف العام (Admin)' : seed.branch_code}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {seed.branch_name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono text-slate-300">{seed.email}</span>
                      <span className="font-mono text-amber-400/90 font-medium">كلمة المرور: {seed.password}</span>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                      {seed.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="mt-6 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-slate-300 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>فروقات الصلاحيات الميدانية:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400 pr-1">
              <li><strong>المشرف العام:</strong> يرى كل الفروع الخمسة، يملك صلاحية التعديل والحذف.</li>
              <li><strong>مستخدم الفرع:</strong> يرى فرعه فقط تماماً، مقفلة عليه لوحة التحكم، وأزرار التعديل والحذف مخفية وممنوعة بـ RLS.</li>
            </ul>
          </div>

        </div>

      </div>

      {/* Footer Branding */}
      <div className="mt-8 text-center text-xs text-slate-400">
        الجمهورية العربية السورية • وزارة النفط والثروة المعدنية • الشركة السورية للبترول (SPC)
      </div>
    </div>
  );
};
