/**
 * Supabase Client & Authentication Service
 * Syrian Petroleum Company (SPC) - Fleet Management System
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Profile, SeedUser, UserRole } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 5 Seed accounts requested by user (1 Admin + 4 Branch Users, plus 1 HQ user)
export const SEED_USERS: SeedUser[] = [
  {
    email: 'admin@spc.sy',
    password: 'Admin@12345',
    full_name: 'المهندس فراس الأحمد',
    role: 'admin',
    branch_id: null,
    branch_name: 'الإدارة العامة - إشراف شامل',
    branch_code: 'ALL',
    description: 'مشرف عام النظام - صلاحيات كاملة، وصول لجميع الفروع وتعديل وحذف السجلات',
  },
  {
    email: 'dez@spc.sy',
    password: 'Dez@12345',
    full_name: 'م. طارق العلي',
    role: 'branch_user',
    branch_id: 'branch-dez',
    branch_name: 'إدارة حقول دير الزور',
    branch_code: 'DEZ',
    description: 'مسؤول حركة فرع دير الزور - مقيّد بفرعه فقط، إضافة واستعراض دون تعديل أو حذف',
  },
  {
    email: 'central@spc.sy',
    password: 'Central@12345',
    full_name: 'م. سمير يوسف',
    role: 'branch_user',
    branch_id: 'branch-central',
    branch_name: 'إدارة حقول المنطقة الوسطى',
    branch_code: 'CENTRAL',
    description: 'مسؤول حركة فرع المنطقة الوسطى - مقيّد بفرعه فقط، إضافة واستعراض دون تعديل أو حذف',
  },
  {
    email: 'rmeilan@spc.sy',
    password: 'Rmeilan@12345',
    full_name: 'م. خليل خضر',
    role: 'branch_user',
    branch_id: 'branch-rmeilan',
    branch_name: 'إدارة حقول رميلان',
    branch_code: 'RMEILAN',
    description: 'مسؤول حركة فرع رميلان - مقيّد بفرعه فقط، إضافة واستعراض دون تعديل أو حذف',
  },
  {
    email: 'jbissa@spc.sy',
    password: 'Jbissa@12345',
    full_name: 'م. باسل درويش',
    role: 'branch_user',
    branch_id: 'branch-jbissa',
    branch_name: 'إدارة حقول الجبسة',
    branch_code: 'JBISSA',
    description: 'مسؤول حركة فرع الجبسة - مقيّد بفرعه فقط، إضافة واستعراض دون تعديل أو حذف',
  },
  {
    email: 'hq@spc.sy',
    password: 'Hq@12345',
    full_name: 'م. نزار سليمان',
    role: 'branch_user',
    branch_id: 'branch-hq',
    branch_name: 'الإدارة العامة - آليات الشركة',
    branch_code: 'HQ',
    description: 'مسؤول آليات الإدارة العامة بدمشق - مقيّد بآليات الفرع الرئيسي',
  }
];

const AUTH_STORAGE_KEY = 'spc_auth_current_profile';

export class SupabaseAuthService {
  private static supabaseInstance: SupabaseClient | null = null;
  private static authListeners: Array<(profile: Profile | null) => void> = [];

  public static isSupabaseConfigured(): boolean {
    return Boolean(
      SUPABASE_URL && 
      SUPABASE_ANON_KEY && 
      !SUPABASE_URL.includes('your-supabase-url') &&
      !SUPABASE_ANON_KEY.includes('your-anon-key')
    );
  }

  public static getClient(): SupabaseClient | null {
    if (!this.isSupabaseConfigured()) {
      return null;
    }
    if (!this.supabaseInstance) {
      this.supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return this.supabaseInstance;
  }

  /**
   * Retrieve current authenticated user profile from storage
   */
  public static getCurrentUser(): Profile | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as Profile;
      }
    } catch {
      // Fallback
    }
    return null;
  }

  /**
   * Alias for getCurrentUser
   */
  public static getCurrentProfile(): Profile | null {
    return this.getCurrentUser();
  }

  /**
   * Register auth state change listener
   */
  public static onAuthStateChanged(callback: (profile: Profile | null) => void): () => void {
    this.authListeners.push(callback);
    return () => {
      this.authListeners = this.authListeners.filter((l) => l !== callback);
    };
  }

  private static notifyListeners(profile: Profile | null): void {
    this.authListeners.forEach((listener) => {
      try {
        listener(profile);
      } catch (err) {
        console.error('Error in auth listener:', err);
      }
    });
  }

  /**
   * Save authenticated user profile to local session storage
   */
  public static setCurrentUser(profile: Profile | null): void {
    if (profile) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    this.notifyListeners(profile);
  }

  /**
   * Authenticate user with Email & Password
   */
  public static async signInWithPassword(email: string, password: string): Promise<{
    user: Profile | null;
    error: string | null;
  }> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // 1. If real Supabase is configured, use official Supabase Auth
    const client = this.getClient();
    if (client) {
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        });

        if (error) {
          return { user: null, error: error.message };
        }

        if (data.user) {
          // Fetch profile row from public.profiles
          const { data: profileData, error: profileError } = await client
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError || !profileData) {
            // Profile fallback
            const seed = SEED_USERS.find((u) => u.email.toLowerCase() === trimmedEmail);
            const fallbackProfile: Profile = {
              id: data.user.id,
              email: trimmedEmail,
              full_name: data.user.user_metadata?.full_name || seed?.full_name || trimmedEmail.split('@')[0],
              role: (data.user.user_metadata?.role as UserRole) || seed?.role || 'branch_user',
              branch_id: seed?.branch_id || (data.user.user_metadata?.role === 'admin' ? null : 'branch-dez'),
              created_at: new Date().toISOString(),
            };
            this.setCurrentUser(fallbackProfile);
            return { user: fallbackProfile, error: null };
          }

          const profile: Profile = {
            id: profileData.id,
            email: trimmedEmail,
            full_name: profileData.full_name,
            role: profileData.role,
            branch_id: profileData.branch_id,
            created_at: profileData.created_at,
          };

          this.setCurrentUser(profile);
          return { user: profile, error: null };
        }
      } catch (err: unknown) {
        console.warn('Supabase remote auth encountered an issue, falling back to local credentials engine:', err);
      }
    }

    // 2. Local / Demo Authentication Engine (Matches Supabase Auth & RLS Rules)
    const seed = SEED_USERS.find(
      (u) => u.email.toLowerCase() === trimmedEmail && u.password === trimmedPassword
    );

    if (seed) {
      const profile: Profile = {
        id: `user-${seed.email.replace(/[@.]/g, '-')}`,
        email: seed.email,
        full_name: seed.full_name,
        role: seed.role,
        branch_id: seed.role === 'admin' ? null : seed.branch_id,
        created_at: new Date().toISOString(),
      };
      this.setCurrentUser(profile);
      return { user: profile, error: null };
    }

    return {
      user: null,
      error: 'بيانات الاعتماد غير صحيحة. يرجى التأكد من البريد الإلكتروني وكلمة المرور.',
    };
  }

  /**
   * Sign out current user
   */
  public static async signOut(): Promise<void> {
    const client = this.getClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch {
        // ignore
      }
    }
    this.setCurrentUser(null);
  }

  // ==============================================================================
  // Row Level Security (RLS) Enforcement Layer
  // ==============================================================================

  /**
   * Enforce SELECT RLS:
   * - admin sees all rows
   * - branch_user sees ONLY rows where branch_id equals their profile branch_id
   */
  public static canSelectBranch(targetBranchId?: string | null): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (!targetBranchId) return false;
    return user.branch_id === targetBranchId;
  }

  /**
   * Enforce INSERT RLS:
   * - admin can insert for any branch
   * - branch_user can ONLY insert for their own branch_id
   */
  public static assertInsertAllowed(targetBranchId?: string | null, tableName = 'vehicles'): void {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error(`PostgrestError 401: Unauthorized - Not logged in to insert into ${tableName}`);
    }
    if (user.role === 'admin') {
      return; // Permitted
    }
    if (user.role === 'branch_user') {
      if (!targetBranchId || targetBranchId !== user.branch_id) {
        throw new Error(
          `PostgrestError 42501 (Permission Denied): new row violates row-level security policy with check for table "${tableName}". مستخدم الفرع ممنوع من إدخال سجل لفرع آخر!`
        );
      }
      return; // Permitted for own branch
    }
    throw new Error(`PostgrestError 42501: Access denied for table "${tableName}"`);
  }

  /**
   * Enforce UPDATE RLS:
   * - ONLY admin is permitted
   * - branch_user is STRICTLY FORBIDDEN by database RLS
   */
  public static assertUpdateAllowed(tableName = 'vehicles'): void {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error(`PostgrestError 401: Unauthorized - Not logged in to update ${tableName}`);
    }
    if (user.role !== 'admin') {
      throw new Error(
        `PostgrestError 42501 (Permission Denied): Operation UPDATE violates row-level security policy for table "${tableName}". التعديل محصور حصراً بالمشرف العام (admin)!`
      );
    }
  }

  /**
   * Enforce DELETE RLS:
   * - ONLY admin is permitted
   * - branch_user is STRICTLY FORBIDDEN by database RLS
   */
  public static assertDeleteAllowed(tableName = 'vehicles'): void {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error(`PostgrestError 401: Unauthorized - Not logged in to delete from ${tableName}`);
    }
    if (user.role !== 'admin') {
      throw new Error(
        `PostgrestError 42501 (Permission Denied): Operation DELETE violates row-level security policy for table "${tableName}". الحذف محصور حصراً بالمشرف العام (admin)!`
      );
    }
  }
}
