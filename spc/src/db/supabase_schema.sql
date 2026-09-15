-- ==============================================================================
-- مخطط وتحديثات قاعدة بيانات Supabase / PostgreSQL مع نظام الصلاحيات و RLS
-- نظام إدارة آليات ومعدات فروع الشركة السورية للبترول (SPC)
-- ==============================================================================

-- 1. تمكين الإضافات المطلوبة لتشفير كلمات المرور وإنشاء المعرفات
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. جدول الفروع (branches)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.branches (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    is_headquarters BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- إدراج الفروع الخمسة المعتمدة بالترتيب المطلوب
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

-- ==============================================================================
-- 3. جدول الملفات الشخصية للمستخدمين (profiles) المرتبط بـ auth.users
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'branch_user')),
    branch_id TEXT REFERENCES public.branches(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- القيد الصارم: branch_id يجب أن يكون NULL حصراً للـ admin، وإلزامياً للـ branch_user
    CONSTRAINT check_role_branch_constraint CHECK (
        (role = 'admin' AND branch_id IS NULL) OR
        (role = 'branch_user' AND branch_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_branch_id ON public.profiles (branch_id);

-- الدالة التلقائية (Trigger Function) لإنشاء الملف الشخصي فور تسجيل المستخدم في auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    user_branch_id TEXT;
    user_full_name TEXT;
BEGIN
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'branch_user');
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    
    IF user_role = 'admin' THEN
        user_branch_id := NULL;
    ELSE
        user_branch_id := NEW.raw_user_meta_data->>'branch_id';
        IF user_branch_id IS NULL THEN
            user_branch_id := 'branch-dez';
        END IF;
    END IF;

    INSERT INTO public.profiles (id, full_name, role, branch_id, created_at)
    VALUES (NEW.id, user_full_name, user_role, user_branch_id, NOW())
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        branch_id = EXCLUDED.branch_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تفعيل الـ Trigger على جدول auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. دوال مساعدة لاسترجاع صلاحيات ودور المستخدم الحالي في RLS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_branch_id()
RETURNS TEXT AS $$
    SELECT branch_id FROM public.profiles
    WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 5. جدول الآليات والمعدات (vehicles)
-- ==============================================================================
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

-- تحديث وضمان وجود عمود branch_id والأعمدة الجديدة لمخصصات الوقود
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS branch_id TEXT REFERENCES public.branches(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS engine_capacity INTEGER DEFAULT 2700,
ADD COLUMN IF NOT EXISTS fuel_quota_inside_city NUMERIC(10, 2) DEFAULT 180.00,
ADD COLUMN IF NOT EXISTS fuel_quota_outside_city NUMERIC(10, 2) DEFAULT 120.00,
ADD COLUMN IF NOT EXISTS fuel_expense_covered_by VARCHAR(150) DEFAULT 'الفرات',
ADD COLUMN IF NOT EXISTS requested_fuel_quantity NUMERIC(10, 2) DEFAULT 0.00;

UPDATE public.vehicles 
SET branch_id = 'branch-dez' 
WHERE branch_id IS NULL OR branch_id = '';

CREATE INDEX IF NOT EXISTS idx_vehicles_branch_id ON public.vehicles (branch_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles (status);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON public.vehicles (category);
CREATE INDEX IF NOT EXISTS idx_vehicles_department ON public.vehicles (assigned_department);
CREATE INDEX IF NOT EXISTS idx_vehicles_number ON public.vehicles (vehicle_number);

-- ==============================================================================
-- 6. جدول سجلات الصيانة (maintenance_records)
-- ==============================================================================
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

-- ==============================================================================
-- 7. جدول قسائم الوقود الفعلية (fuel_vouchers)
-- مخصصات الوقود الشهرية والإنفاق الفعلي داخل وخارج المدينة
-- ==============================================================================
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

-- ==============================================================================
-- 8. تفعيل أمان الصفوف (Row Level Security - RLS)
-- ==============================================================================
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_vouchers ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة لمنع التكرار
DROP POLICY IF EXISTS "branches_select_policy" ON public.branches;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "vehicles_select_policy" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_insert_policy" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_update_policy" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_delete_policy" ON public.vehicles;
DROP POLICY IF EXISTS "maintenance_select_policy" ON public.maintenance_records;
DROP POLICY IF EXISTS "maintenance_insert_policy" ON public.maintenance_records;
DROP POLICY IF EXISTS "maintenance_update_policy" ON public.maintenance_records;
DROP POLICY IF EXISTS "maintenance_delete_policy" ON public.maintenance_records;
DROP POLICY IF EXISTS "fuel_vouchers_select_policy" ON public.fuel_vouchers;
DROP POLICY IF EXISTS "fuel_vouchers_insert_policy" ON public.fuel_vouchers;
DROP POLICY IF EXISTS "fuel_vouchers_update_policy" ON public.fuel_vouchers;
DROP POLICY IF EXISTS "fuel_vouchers_delete_policy" ON public.fuel_vouchers;

-- سياسات جدول الفروع:
-- admin يرى كل الفروع، ومستخدم الفرع يرى فقط فرعه المخصص
CREATE POLICY "branches_select_policy" ON public.branches
FOR SELECT TO authenticated
USING (public.is_admin() OR id = public.get_user_branch_id());

-- سياسات جدول الملفات الشخصية (profiles):
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE TO authenticated
USING (public.is_admin());

-- سياسات جدول الآليات (vehicles):
-- SELECT: admin يرى الكل، branch_user يرى فقط فرعه
CREATE POLICY "vehicles_select_policy" ON public.vehicles
FOR SELECT TO authenticated
USING (public.is_admin() OR branch_id = public.get_user_branch_id());

-- INSERT: admin يضيف لأي فرع، branch_user يضيف فقط لفرعه
CREATE POLICY "vehicles_insert_policy" ON public.vehicles
FOR INSERT TO authenticated
WITH CHECK (public.is_admin() OR branch_id = public.get_user_branch_id());

-- UPDATE: مسموح فقط لـ admin. ممنوع تماماً على مستخدم الفرع
CREATE POLICY "vehicles_update_policy" ON public.vehicles
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- DELETE: مسموح فقط لـ admin. ممنوع تماماً على مستخدم الفرع
CREATE POLICY "vehicles_delete_policy" ON public.vehicles
FOR DELETE TO authenticated
USING (public.is_admin());

-- سياسات جدول سجلات الصيانة (maintenance_records):
-- SELECT: admin يرى الكل، branch_user يرى فقط صيانة آليات فرعه
CREATE POLICY "maintenance_select_policy" ON public.maintenance_records
FOR SELECT TO authenticated
USING (
    public.is_admin() OR EXISTS (
        SELECT 1 FROM public.vehicles v
        WHERE v.id = maintenance_records.vehicle_id
        AND v.branch_id = public.get_user_branch_id()
    )
);

-- INSERT: admin يضيف لأي آلية، branch_user يضيف فقط لآليات فرعه
CREATE POLICY "maintenance_insert_policy" ON public.maintenance_records
FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin() OR EXISTS (
        SELECT 1 FROM public.vehicles v
        WHERE v.id = maintenance_records.vehicle_id
        AND v.branch_id = public.get_user_branch_id()
    )
);

-- UPDATE: مسموح فقط لـ admin. ممنوع تماماً على مستخدم الفرع
CREATE POLICY "maintenance_update_policy" ON public.maintenance_records
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- DELETE: مسموح فقط لـ admin. ممنوع تماماً على مستخدم الفرع
CREATE POLICY "maintenance_delete_policy" ON public.maintenance_records
FOR DELETE TO authenticated
USING (public.is_admin());

-- سياسات جدول قسائم الوقود (fuel_vouchers):
-- SELECT: admin يرى قسائم كل الفروع، ومستخدم الفرع يرى فقط قسائم آليات فرعه
CREATE POLICY "fuel_vouchers_select_policy" ON public.fuel_vouchers
FOR SELECT TO authenticated
USING (
    public.is_admin() OR EXISTS (
        SELECT 1 FROM public.vehicles v
        WHERE v.id = fuel_vouchers.vehicle_id
        AND v.branch_id = public.get_user_branch_id()
    )
);

-- INSERT: admin يضيف لأي آلية، ومستخدم الفرع يضيف فقط لآليات فرعه
CREATE POLICY "fuel_vouchers_insert_policy" ON public.fuel_vouchers
FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin() OR EXISTS (
        SELECT 1 FROM public.vehicles v
        WHERE v.id = fuel_vouchers.vehicle_id
        AND v.branch_id = public.get_user_branch_id()
    )
);

-- UPDATE: مسموح فقط لـ admin. ممنوع تماماً على مستخدم الفرع
CREATE POLICY "fuel_vouchers_update_policy" ON public.fuel_vouchers
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- DELETE: مسموح فقط لـ admin. ممنوع تماماً على مستخدم الفرع
CREATE POLICY "fuel_vouchers_delete_policy" ON public.fuel_vouchers
FOR DELETE TO authenticated
USING (public.is_admin());

-- ==============================================================================
-- 9. حسابات المستخدمين التجريبية الخمسة (Seed Users)
-- كلمة المرور لجميع الحسابات موحدة أو مخصصة لكل فرع
-- ==============================================================================
DO $$
DECLARE
    admin_id UUID := '00000000-0000-0000-0000-000000000001';
    dez_id UUID   := '00000000-0000-0000-0000-000000000002';
    cen_id UUID   := '00000000-0000-0000-0000-000000000003';
    rme_id UUID   := '00000000-0000-0000-0000-000000000004';
    jbi_id UUID   := '00000000-0000-0000-0000-000000000005';
BEGIN
    -- 1. المشرف العام (admin)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (
        admin_id,
        'admin@spc.sy',
        crypt('Admin@12345', gen_salt('bf')),
        NOW(),
        '{"full_name": "المهندس فراس الأحمد", "role": "admin"}'::jsonb
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, full_name, role, branch_id)
    VALUES (admin_id, 'المهندس فراس الأحمد', 'admin', NULL)
    ON CONFLICT (id) DO UPDATE SET role = 'admin', branch_id = NULL;

    -- 2. مسؤول فرع دير الزور (branch_user - DEZ)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (
        dez_id,
        'dez@spc.sy',
        crypt('Dez@12345', gen_salt('bf')),
        NOW(),
        '{"full_name": "م. طارق العلي", "role": "branch_user", "branch_id": "branch-dez"}'::jsonb
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, full_name, role, branch_id)
    VALUES (dez_id, 'م. طارق العلي', 'branch_user', 'branch-dez')
    ON CONFLICT (id) DO UPDATE SET role = 'branch_user', branch_id = 'branch-dez';

    -- 3. مسؤول فرع المنطقة الوسطى (branch_user - CENTRAL)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (
        cen_id,
        'central@spc.sy',
        crypt('Central@12345', gen_salt('bf')),
        NOW(),
        '{"full_name": "م. سمير يوسف", "role": "branch_user", "branch_id": "branch-central"}'::jsonb
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, full_name, role, branch_id)
    VALUES (cen_id, 'م. سمير يوسف', 'branch_user', 'branch-central')
    ON CONFLICT (id) DO UPDATE SET role = 'branch_user', branch_id = 'branch-central';

    -- 4. مسؤول فرع رميلان (branch_user - RMEILAN)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (
        rme_id,
        'rmeilan@spc.sy',
        crypt('Rmeilan@12345', gen_salt('bf')),
        NOW(),
        '{"full_name": "م. خليل خضر", "role": "branch_user", "branch_id": "branch-rmeilan"}'::jsonb
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, full_name, role, branch_id)
    VALUES (rme_id, 'م. خليل خضر', 'branch_user', 'branch-rmeilan')
    ON CONFLICT (id) DO UPDATE SET role = 'branch_user', branch_id = 'branch-rmeilan';

    -- 5. مسؤول فرع الجبسة (branch_user - JBISSA)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
    VALUES (
        jbi_id,
        'jbissa@spc.sy',
        crypt('Jbissa@12345', gen_salt('bf')),
        NOW(),
        '{"full_name": "م. باسل درويش", "role": "branch_user", "branch_id": "branch-jbissa"}'::jsonb
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, full_name, role, branch_id)
    VALUES (jbi_id, 'م. باسل درويش', 'branch_user', 'branch-jbissa')
    ON CONFLICT (id) DO UPDATE SET role = 'branch_user', branch_id = 'branch-jbissa';
END $$;
