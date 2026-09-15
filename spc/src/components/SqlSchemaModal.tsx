import React, { useState } from 'react';
import { X, Copy, Check, Database, Code2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SqlSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPABASE_SQL_CODE = `-- ==============================================================================
-- مخطط وتحديثات قاعدة بيانات Supabase / PostgreSQL
-- نظام إدارة آليات ومعدات فروع الشركة السورية للبترول (SPC)
-- ==============================================================================

-- 1. جدول الفروع (branches)
CREATE TABLE IF NOT EXISTS public.branches (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    is_headquarters BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- إدراج الفروع الخمسة المعتمدة بالترتيب الدقيق المطلوب
INSERT INTO public.branches (id, name, code, is_headquarters)
VALUES
('branch-dez', 'إدارة حقول دير الزور', 'DEZ', false),
('branch-central', 'إدارة حقول المنطقة الوسطى', 'CENTRAL', false),
('branch-rmeilan', 'إدارة حقول رميلان', 'RMEILAN', false),
('branch-jbissa', 'إدارة حقول الجبسة', 'JBISSA', false),
('branch-hq', 'الإدارة العامة - آليات الشركة (دمشق)', 'HQ', true)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    code = EXCLUDED.code, 
    is_headquarters = EXCLUDED.is_headquarters;

-- 2. جدول الآليات والمعدات (vehicles) متضمناً المفتاح الخارجي للفرع branch_id
CREATE TABLE IF NOT EXISTS public.vehicles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    vehicle_number VARCHAR(50) NOT NULL UNIQUE,
    vehicle_type VARCHAR(150) NOT NULL,
    manufacture_year INTEGER NOT NULL CHECK (manufacture_year >= 1970 AND manufacture_year <= 2030),
    status VARCHAR(30) NOT NULL CHECK (status IN ('تعمل', 'متعطلة', 'خارج الخدمة', 'معارة')),
    fuel_type VARCHAR(30) NOT NULL CHECK (fuel_type IN ('بنزين', 'مازوت')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('بنزين إرسال حديث', 'بنزين استلام قديم', 'مازوت')),
    assigned_department VARCHAR(150) NOT NULL,
    current_location VARCHAR(200) NOT NULL,
    chassis_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- إذا كان جدول vehicles منشأ مسبقاً، إضافة عمود branch_id وأعمدة مخصصات الوقود:
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS branch_id TEXT REFERENCES public.branches(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS engine_capacity INTEGER DEFAULT 2700,
ADD COLUMN IF NOT EXISTS fuel_quota_inside_city NUMERIC(10, 2) DEFAULT 180.00,
ADD COLUMN IF NOT EXISTS fuel_quota_outside_city NUMERIC(10, 2) DEFAULT 120.00,
ADD COLUMN IF NOT EXISTS fuel_expense_covered_by VARCHAR(150) DEFAULT 'الفرات',
ADD COLUMN IF NOT EXISTS requested_fuel_quantity NUMERIC(10, 2) DEFAULT 0.00;

-- 3. عملية الترحيل (Migration) لربط كافة البيانات الحالية بحقول دير الزور فقط:
UPDATE public.vehicles 
SET branch_id = 'branch-dez' 
WHERE branch_id IS NULL OR branch_id = '';

CREATE INDEX IF NOT EXISTS idx_vehicles_branch_id ON public.vehicles (branch_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles (status);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON public.vehicles (category);
CREATE INDEX IF NOT EXISTS idx_vehicles_department ON public.vehicles (assigned_department);
CREATE INDEX IF NOT EXISTS idx_vehicles_number ON public.vehicles (vehicle_number);

-- 4. جدول سجلات الصيانة (maintenance_records)
CREATE TABLE IF NOT EXISTS public.maintenance_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    maintenance_date DATE NOT NULL,
    description TEXT NOT NULL,
    cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (cost >= 0),
    performed_by VARCHAR(200) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON public.maintenance_records (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON public.maintenance_records (maintenance_date DESC);

-- 5. جدول قسائم الوقود الفعلية (fuel_vouchers)
CREATE TABLE IF NOT EXISTS public.fuel_vouchers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    issue_date DATE NOT NULL,
    quantity_liters NUMERIC(10, 2) NOT NULL CHECK (quantity_liters > 0),
    voucher_type VARCHAR(50) NOT NULL CHECK (voucher_type IN ('داخل المدينة', 'خارج المدينة')),
    issued_by VARCHAR(200) NOT NULL DEFAULT 'شعبة المحروقات',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fuel_vouchers_vehicle_id ON public.fuel_vouchers (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_vouchers_issue_date ON public.fuel_vouchers (issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_vouchers_type ON public.fuel_vouchers (voucher_type);

-- 6. تفعيل أمان الصفوف (Row Level Security)
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "قراءة عامة للفروع" ON public.branches FOR SELECT USING (true);
CREATE POLICY "قراءة عامة للآليات" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "قراءة عامة لسجلات الصيانة" ON public.maintenance_records FOR SELECT USING (true);
CREATE POLICY "قراءة عامة لقسائم الوقود" ON public.fuel_vouchers FOR SELECT USING (true);
CREATE POLICY "إدارة الآليات" ON public.vehicles FOR ALL USING (true);
CREATE POLICY "إدارة سجلات الصيانة" ON public.maintenance_records FOR ALL USING (true);
CREATE POLICY "إدارة قسائم الوقود" ON public.fuel_vouchers FOR ALL USING (true);

-- 4. إدراج بيانات Seed التجريبية (15+ آلية و10+ صيانة)
INSERT INTO public.vehicles (id, vehicle_number, vehicle_type, manufacture_year, status, fuel_type, category, assigned_department, current_location)
VALUES 
('veh-001', 'SPC-DZ-101', 'تويوتا هايلوكس دبل كابين 4x4', 2021, 'تعمل', 'بنزين', 'بنزين إرسال حديث', 'قسم الإنتاج - حقل التيم', 'حقل التيم - المحطة الإنتاجية الأولى'),
('veh-002', 'SPC-DZ-102', 'صهريج نقل مازوت مرسيدس أكتروس 3340', 2018, 'تعمل', 'مازوت', 'مازوت', 'قسم النقل والحركة', 'مستودعات المحروقات المركزية - دير الزور'),
('veh-003', 'SPC-DZ-103', 'رافعة هيدروليكية تادانو GT-550E (55 طن)', 2016, 'متعطلة', 'مازوت', 'مازوت', 'ورشة الصيانة الميكانيكية المركزية', 'ساحة الصيانة المركزية - المفرزة'),
('veh-004', 'SPC-DZ-104', 'نيسان باترول ستيشن دفع رباعي', 2014, 'تعمل', 'بنزين', 'بنزين استلام قديم', 'الإدارة العامة - مديرية الحقول', 'مبنى الإدارة - دير الزور'),
('veh-005', 'SPC-DZ-105', 'بلدوزر كاتربيلر D8R مجنزر', 2015, 'تعمل', 'مازوت', 'مازوت', 'قسم الحفر والاستكشاف', 'حقل الورد - قطاع الحفر الغربي'),
('veh-006', 'SPC-DZ-106', 'شاحنة مان TGS قلاب 18 م³', 2019, 'تعمل', 'مازوت', 'مازوت', 'قسم الطرق والخدمات الميدانية', 'طريق حقل الشولا - محطة التفريغ'),
('veh-007', 'SPC-DZ-107', 'سيارة إسعاف ميدانية فورد ترانزيت مجهزة', 2020, 'تعمل', 'مازوت', 'مازوت', 'قسم السلامة والصحة المهنية (HSE)', 'نقطة إسعاف حقل التيم الطبية'),
('veh-008', 'SPC-DZ-108', 'بيك آب إيسوزو ديماكس دفع رباعي', 2022, 'تعمل', 'بنزين', 'بنزين إرسال حديث', 'قسم الاتصالات والسكادا', 'محطة تجميع غاز كبيبة'),
('veh-009', 'SPC-DZ-109', 'مولدة ديزل متنقلة كاتربيلر 500 KVA', 2013, 'متعطلة', 'مازوت', 'مازوت', 'قسم الكهرباء والطاقة', 'ورشة الكهرباء المركزية'),
('veh-010', 'SPC-DZ-110', 'سيارة إطفاء ميدانية مرسيدس إنقاذ', 2017, 'تعمل', 'مازوت', 'مازوت', 'قسم الإطفاء والسلامة الصناعية', 'مركز إطفاء محطة التيم المركزية'),
('veh-011', 'SPC-DZ-111', 'ميتسوبيشي باجيرو V6 4x4', 2011, 'خارج الخدمة', 'بنزين', 'بنزين استلام قديم', 'قسم المستودعات واللوجستيات', 'مرآب الآليات المنسقة - دير الزور'),
('veh-012', 'SPC-DZ-112', 'رافعة شوكية تويوتا 5 طن ديزل', 2019, 'تعمل', 'مازوت', 'مازوت', 'قسم المستودعات واللوجستيات', 'مستودع الأنابيب وقطع التبديل المركزي'),
('veh-013', 'SPC-DZ-113', 'باص نقل عمال هيونداي كاونتي (29 راكب)', 2017, 'تعمل', 'مازوت', 'مازوت', 'قسم النقل والحركة', 'خط نقل الوردية (دير الزور - حقل التيم)'),
('veh-014', 'SPC-DZ-114', 'تويوتا لاندكروزر بيك آب شاص ستيشن', 2023, 'معارة', 'بنزين', 'بنزين إرسال حديث', 'مكتب المسح الجيولوجي والزلزالي', 'معارة لمشروع المسح السيزمي - قطاع الفرات'),
('veh-015', 'SPC-DZ-115', 'حفارة مجنزرة هيدروليكية كوماتسو PC200', 2016, 'متعطلة', 'مازوت', 'مازوت', 'قسم صيانة خطوط الأنابيب', 'موقع تسريب خط النفط الرئيسي ك 24')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.maintenance_records (id, vehicle_id, maintenance_date, description, cost, performed_by)
VALUES
('maint-001', 'veh-003', '2024-03-12', 'توضيب كامل لمنظومة الهيدروليك لذراع الرفع الرئيسي واستبدال خراطيم الضغط العالي وموانع التسرب', 14500000, 'ورشة الهيدروليك التخصصية - المفرزة المركزية'),
('maint-002', 'veh-009', '2024-03-11', 'إصلاح عطل في لوحة التحكم الإلكترونية والمولدة المساعدة وتبديل منظم الجهد AVR', 6800000, 'فريق الصيانة الكهربائية - م. هيثم العبد'),
('maint-003', 'veh-015', '2024-03-13', 'تبديل مسارات الجنزير المتآكلة وصيانة مضخة الديزل الرئيسية وحواضن المحرك', 18200000, 'ورشة الآليات الثقيلة - مفرزة دير الزور'),
('maint-004', 'veh-001', '2024-03-04', 'صيانة دورية 40,000 كم: تبديل زيت محرك أصلي، فلاتر هواء وبنزين، وفحص منظومة المكابح والعكوس', 2100000, 'الورشة الدورية السريعة - حقل التيم'),
('maint-005', 'veh-002', '2024-02-27', 'صيانة وتفريغ صهريج الوقود وإعادة معايرة صمامات الأمان وتبديل بطاريتين 200 أمبير', 5400000, 'ميكانيك الصهاريج - شركة الفرات للشاحنات'),
('maint-006', 'veh-005', '2024-02-18', 'استبدال شفرة البلدوزر السفلية وحماية كابينة السائق وفحص ضغوط الهيدروليك وتزييت المفاصل', 8900000, 'ورشة المعدات الإنشائية المركزية'),
('maint-007', 'veh-007', '2024-02-25', 'فحص منظومة الأكسجين والكهرباء الطبية بسيارة الإسعاف واستبدال طقم كوابح وفحمات أمامية وخلفية', 3200000, 'ورشة الصيانة الخفيفة - السلامة الصناعية'),
('maint-008', 'veh-006', '2024-02-12', 'إصلاح بساتم القلاب الهيدروليكية واستبدال 4 إطارات صحراوية قياس 385/65R22.5 مع الترصيص', 16500000, 'محطة الصيانة المتكاملة - دير الزور'),
('maint-009', 'veh-010', '2024-01-30', 'فحص واختبار مضخة الإطفاء العنفية ذات الضغط المرتفع وتغيير صمامات الرغوة وفوهات خراطيم الضخ', 7200000, 'فريق هندسة مكافحة الحرائق والسلامة'),
('maint-010', 'veh-013', '2024-01-18', 'عمرة جزئية للمحرك (رينغات ومسح رأس محرك)، تبديل صينية الدبرياج، وفحص أجهزة التكييف والتدفئة', 9800000, 'ورشة المحركات المركزية - ديزل')
ON CONFLICT (id) DO NOTHING;`;

export const SqlSchemaModal: React.FC<SqlSchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div 
      id="supabase-sql-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      dir="rtl"
    >
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">مخطط قاعدة بيانات Supabase الحقيقي (SQL DDL)</h3>
              <p className="text-xs text-slate-400">
                النموذج الكامل لجداولي vehicles و maintenance_records مع القيود والبيانات الأولية
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informational Banner */}
        <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-3 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            هذا هو الكود المصدري SQL الكامل المطابق لنموذج البيانات المطلوب تماماً. يمكنك نسخه وتشغيله مباشرة في <strong>Supabase SQL Editor</strong> لإنشاء الجداول وسياسات الأمان والبيانات الأولية.
          </span>
        </div>

        {/* Code Content */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-950 text-left" dir="ltr">
          <pre className="text-xs text-amber-300 font-mono leading-relaxed whitespace-pre selection:bg-amber-500 selection:text-slate-950">
            {SUPABASE_SQL_CODE}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            ملف المخطط متوفر أيضاً ضمن مسار المشروع: <code className="text-amber-400 font-mono">/src/db/supabase_schema.sql</code>
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>تم نسخ كود SQL بنجاح!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ كود SQL بالكامل</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
