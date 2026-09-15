import { 
  Vehicle, 
  MaintenanceRecord, 
  MaintenanceWithVehicle, 
  DashboardMetrics, 
  VehicleCategory, 
  FuelType, 
  SystemBackupFile, 
  Branch, 
  BranchMetricSummary,
  FuelVoucher,
  FuelVoucherWithVehicle
} from '../types';
import { INITIAL_VEHICLES, INITIAL_MAINTENANCE, INITIAL_BRANCHES, INITIAL_FUEL_VOUCHERS } from '../data/seedData';
import { SupabaseAuthService } from './supabaseService';

const VEHICLES_STORAGE_KEY = 'spc_deir_ezzor_vehicles_v1';
const MAINTENANCE_STORAGE_KEY = 'spc_deir_ezzor_maintenance_v1';
const BRANCHES_STORAGE_KEY = 'spc_branches_v1';
const FUEL_VOUCHERS_STORAGE_KEY = 'spc_fuel_vouchers_v1';

let memoryVehicles: Vehicle[] | null = null;
let memoryMaintenance: MaintenanceRecord[] | null = null;
let memoryBranches: Branch[] | null = null;
let memoryFuelVouchers: FuelVoucher[] | null = null;

export class StorageService {
  static getRawBranches(): Branch[] {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(BRANCHES_STORAGE_KEY);
        if (stored) {
          const parsed: Branch[] = JSON.parse(stored);
          memoryBranches = parsed;
          return parsed;
        }
      } else if (memoryBranches) {
        return memoryBranches;
      }
    } catch (e) {
      console.warn('Failed to read branches from localStorage', e);
    }
    this.saveBranches(INITIAL_BRANCHES);
    return INITIAL_BRANCHES;
  }

  /**
   * Get branches with Row Level Security (RLS) enforcement:
   * - Admin sees all branches
   * - Branch User sees strictly and exclusively their own assigned branch
   */
  static getBranches(enforceRls = true): Branch[] {
    const all = this.getRawBranches();
    if (!enforceRls) return all;

    const user = SupabaseAuthService.getCurrentUser();
    if (user && user.role === 'branch_user' && user.branch_id) {
      return all.filter((b) => b.id === user.branch_id);
    }
    return all;
  }

  static saveBranches(branches: Branch[]): void {
    memoryBranches = branches;
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(branches));
      }
    } catch (e) {
      console.warn('Failed to save branches to localStorage', e);
    }
  }

  static getRawVehicles(): Vehicle[] {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(VEHICLES_STORAGE_KEY);
        if (stored) {
          const parsed: Vehicle[] = JSON.parse(stored);
          // MIGRATION: Ensure all existing vehicles have branch_id and fuel quota fields
          let migratedCount = 0;
          const migratedVehicles = parsed.map((v) => {
            let changed = false;
            let branch_id = v.branch_id;
            if (!branch_id) {
              branch_id = 'branch-dez';
              changed = true;
            }

            // Provide realistic defaults for fuel quota fields if missing from previous schema
            const seedMatch = INITIAL_VEHICLES.find(
              (iv) => iv.id === v.id || iv.vehicle_number.toUpperCase() === v.vehicle_number?.toUpperCase()
            );

            const engine_capacity = v.engine_capacity ?? seedMatch?.engine_capacity ?? 2700;
            const fuel_quota_inside_city = v.fuel_quota_inside_city ?? seedMatch?.fuel_quota_inside_city ?? 180;
            const fuel_quota_outside_city = v.fuel_quota_outside_city ?? seedMatch?.fuel_quota_outside_city ?? 120;
            const fuel_expense_covered_by = v.fuel_expense_covered_by || seedMatch?.fuel_expense_covered_by || 'الفرات';
            const requested_fuel_quantity = v.requested_fuel_quantity !== undefined ? v.requested_fuel_quantity : (seedMatch?.requested_fuel_quantity ?? 0);

            if (
              v.engine_capacity === undefined ||
              v.fuel_quota_inside_city === undefined ||
              v.fuel_quota_outside_city === undefined ||
              !v.fuel_expense_covered_by ||
              v.requested_fuel_quantity === undefined
            ) {
              changed = true;
            }

            if (changed) {
              migratedCount++;
              return {
                ...v,
                branch_id,
                engine_capacity,
                fuel_quota_inside_city,
                fuel_quota_outside_city,
                fuel_expense_covered_by,
                requested_fuel_quantity,
              };
            }
            return v;
          });

          if (migratedCount > 0) {
            this.saveVehicles(migratedVehicles);
          }

          memoryVehicles = migratedVehicles;
          return migratedVehicles;
        }
      } else if (memoryVehicles) {
        return memoryVehicles;
      }
    } catch (e) {
      console.warn('Failed to read vehicles from localStorage', e);
    }
    // Seed initial data with branch_id = 'branch-dez'
    const seeded = INITIAL_VEHICLES.map((v) => ({
      ...v,
      branch_id: v.branch_id || 'branch-dez',
    }));
    this.saveVehicles(seeded);
    return seeded;
  }

  /**
   * Get vehicles with Row Level Security (RLS) enforcement:
   * - Admin sees all vehicles
   * - Branch User sees strictly and exclusively vehicles matching their profile branch_id
   */
  static getVehicles(enforceRls = true): Vehicle[] {
    const all = this.getRawVehicles();
    if (!enforceRls) return all;

    const user = SupabaseAuthService.getCurrentUser();
    if (user && user.role === 'branch_user' && user.branch_id) {
      return all.filter((v) => v.branch_id === user.branch_id);
    }
    return all;
  }

  static saveVehicles(vehicles: Vehicle[]): void {
    memoryVehicles = vehicles;
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(vehicles));
      }
    } catch (e) {
      console.warn('Failed to save vehicles to localStorage', e);
    }
  }

  static getRawMaintenanceRecords(): MaintenanceRecord[] {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(MAINTENANCE_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          memoryMaintenance = parsed;
          return parsed;
        }
      } else if (memoryMaintenance) {
        return memoryMaintenance;
      }
    } catch (e) {
      console.warn('Failed to read maintenance records from localStorage', e);
    }
    // Seed initial data
    this.saveMaintenanceRecords(INITIAL_MAINTENANCE);
    return INITIAL_MAINTENANCE;
  }

  static getMaintenanceRecords(enforceRls = true): MaintenanceRecord[] {
    const all = this.getRawMaintenanceRecords();
    if (!enforceRls) return all;

    const user = SupabaseAuthService.getCurrentUser();
    if (user && user.role === 'branch_user' && user.branch_id) {
      const allowedVehicles = new Set(this.getVehicles(true).map((v) => v.id));
      return all.filter((m) => allowedVehicles.has(m.vehicle_id));
    }
    return all;
  }

  static saveMaintenanceRecords(records: MaintenanceRecord[]): void {
    memoryMaintenance = records;
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(records));
      }
    } catch (e) {
      console.warn('Failed to save maintenance records to localStorage', e);
    }
  }

  /**
   * Add a new vehicle.
   * RLS Check:
   * - Admin can add to any branch
   * - Branch User can ONLY add to their own branch (enforced on database/service level)
   */
  static addVehicle(
    vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'> & { 
      id?: string; 
      created_at?: string; 
      updated_at?: string;
      branch_id?: string;
    }
  ): Vehicle {
    const user = SupabaseAuthService.getCurrentUser();
    let targetBranchId = vehicleData.branch_id || 'branch-dez';

    // If branch_user, strictly force branch_id to user's assigned branch to prevent any manipulation
    if (user && user.role === 'branch_user' && user.branch_id) {
      targetBranchId = user.branch_id;
    }

    // Enforce database-level RLS rule
    SupabaseAuthService.assertInsertAllowed(targetBranchId, 'vehicles');

    const vehicles = this.getRawVehicles();
    const newVehicle: Vehicle = {
      id: vehicleData.id || `veh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      branch_id: targetBranchId,
      vehicle_number: vehicleData.vehicle_number.trim().toUpperCase(),
      vehicle_type: vehicleData.vehicle_type.trim(),
      manufacture_year: Number(vehicleData.manufacture_year) || new Date().getFullYear(),
      fuel_type: vehicleData.fuel_type,
      category: vehicleData.category,
      status: vehicleData.status,
      assigned_department: vehicleData.assigned_department.trim(),
      current_location: vehicleData.current_location.trim(),
      chassis_number: vehicleData.chassis_number?.trim() || undefined,
      notes: vehicleData.notes?.trim() || undefined,
      engine_capacity: vehicleData.engine_capacity !== undefined ? Number(vehicleData.engine_capacity) : 2700,
      fuel_quota_inside_city: vehicleData.fuel_quota_inside_city !== undefined ? Number(vehicleData.fuel_quota_inside_city) : 180,
      fuel_quota_outside_city: vehicleData.fuel_quota_outside_city !== undefined ? Number(vehicleData.fuel_quota_outside_city) : 120,
      fuel_expense_covered_by: vehicleData.fuel_expense_covered_by ? vehicleData.fuel_expense_covered_by.trim() : 'الفرات',
      requested_fuel_quantity: vehicleData.requested_fuel_quantity !== undefined && vehicleData.requested_fuel_quantity !== null ? Number(vehicleData.requested_fuel_quantity) : 0,
      created_at: vehicleData.created_at || new Date().toISOString(),
      updated_at: vehicleData.updated_at || new Date().toISOString(),
    };

    const updated = [newVehicle, ...vehicles];
    this.saveVehicles(updated);
    return newVehicle;
  }

  /**
   * Update an existing vehicle.
   * RLS Check: ONLY admin is permitted. Branch users are rejected on DB/RLS level.
   */
  static updateVehicle(vehicleId: string, updates: Partial<Vehicle>): Vehicle {
    SupabaseAuthService.assertUpdateAllowed('vehicles');

    const vehicles = this.getRawVehicles();
    const index = vehicles.findIndex((v) => v.id === vehicleId);
    if (index === -1) {
      throw new Error(`Vehicle with id ${vehicleId} not found`);
    }

    const updatedVehicle: Vehicle = {
      ...vehicles[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    vehicles[index] = updatedVehicle;
    this.saveVehicles(vehicles);
    return updatedVehicle;
  }

  // ==============================================================================
  // FUEL VOUCHERS (قسائم الوقود الفعلية) - Database & RLS Enforcement Layer
  // ==============================================================================

  static getRawFuelVouchers(): FuelVoucher[] {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(FUEL_VOUCHERS_STORAGE_KEY);
        if (stored) {
          const parsed: FuelVoucher[] = JSON.parse(stored);
          memoryFuelVouchers = parsed;
          return parsed;
        }
      } else if (memoryFuelVouchers) {
        return memoryFuelVouchers;
      }
    } catch (e) {
      console.warn('Failed to read fuel vouchers from localStorage', e);
    }
    // Seed initial fuel vouchers
    this.saveFuelVouchers(INITIAL_FUEL_VOUCHERS);
    return INITIAL_FUEL_VOUCHERS;
  }

  /**
   * Get fuel vouchers with Row Level Security (RLS) enforcement:
   * - Admin sees all vouchers across all branches
   * - Branch User sees strictly and exclusively vouchers for vehicles of their branch
   */
  static getFuelVouchers(enforceRls = true): FuelVoucher[] {
    const all = this.getRawFuelVouchers();
    if (!enforceRls) return all;

    const user = SupabaseAuthService.getCurrentUser();
    if (user && user.role === 'branch_user' && user.branch_id) {
      const allowedVehicles = new Set(this.getVehicles(true).map((v) => v.id));
      return all.filter((v) => allowedVehicles.has(v.vehicle_id));
    }
    return all;
  }

  static saveFuelVouchers(vouchers: FuelVoucher[]): void {
    memoryFuelVouchers = vouchers;
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(FUEL_VOUCHERS_STORAGE_KEY, JSON.stringify(vouchers));
      }
    } catch (e) {
      console.warn('Failed to save fuel vouchers to localStorage', e);
    }
  }

  /**
   * Add a new fuel voucher.
   * RLS Check:
   * - Admin can add to any vehicle in any branch
   * - Branch User can ONLY add to vehicles belonging to their assigned branch
   */
  static addFuelVoucher(
    voucherData: Omit<FuelVoucher, 'id' | 'created_at'> & { id?: string; created_at?: string }
  ): FuelVoucher {
    const vehicles = this.getRawVehicles();
    const targetVehicle = vehicles.find((v) => v.id === voucherData.vehicle_id);

    if (!targetVehicle) {
      throw new Error(`الآلية المحددة غير موجودة في قاعدة البيانات (ID: ${voucherData.vehicle_id})`);
    }

    // Enforce database-level RLS rule (branch_user can only insert for their assigned branch)
    SupabaseAuthService.assertInsertAllowed(targetVehicle.branch_id, 'fuel_vouchers');

    const vouchers = this.getRawFuelVouchers();
    const newVoucher: FuelVoucher = {
      id: voucherData.id || `fvc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      vehicle_id: voucherData.vehicle_id,
      issue_date: voucherData.issue_date || new Date().toISOString().slice(0, 10),
      quantity_liters: Math.max(0.5, Number(voucherData.quantity_liters) || 0),
      voucher_type: voucherData.voucher_type || 'داخل المدينة',
      issued_by: voucherData.issued_by ? voucherData.issued_by.trim() : 'شعبة المحروقات',
      notes: voucherData.notes?.trim() || undefined,
      created_at: voucherData.created_at || new Date().toISOString(),
    };

    const updated = [newVoucher, ...vouchers];
    this.saveFuelVouchers(updated);
    return newVoucher;
  }

  /**
   * Update an existing fuel voucher.
   * RLS Check: STRICTLY admin only.
   */
  static updateFuelVoucher(voucherId: string, updates: Partial<FuelVoucher>): FuelVoucher {
    SupabaseAuthService.assertUpdateAllowed('fuel_vouchers');

    const vouchers = this.getRawFuelVouchers();
    const index = vouchers.findIndex((v) => v.id === voucherId);
    if (index === -1) {
      throw new Error(`Fuel voucher with id ${voucherId} not found`);
    }

    const updatedVoucher: FuelVoucher = {
      ...vouchers[index],
      ...updates,
    };

    vouchers[index] = updatedVoucher;
    this.saveFuelVouchers(vouchers);
    return updatedVoucher;
  }

  /**
   * Delete a fuel voucher.
   * RLS Check: STRICTLY admin only.
   */
  static deleteFuelVoucher(voucherId: string): void {
    SupabaseAuthService.assertDeleteAllowed('fuel_vouchers');

    const vouchers = this.getRawFuelVouchers().filter((v) => v.id !== voucherId);
    this.saveFuelVouchers(vouchers);
  }

  /**
   * Get fuel vouchers with joined vehicle data, sorted by issue_date descending.
   */
  static getFuelVouchersWithVehicles(limit = 100, branchId?: string, monthYear?: string): FuelVoucherWithVehicle[] {
    const allVehicles = this.getVehicles();
    const vouchers = this.getFuelVouchers();
    const vehicleMap = new Map<string, Vehicle>();
    allVehicles.forEach((v) => vehicleMap.set(v.id, v));

    // Sort by date descending
    const sorted = [...vouchers].sort(
      (a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()
    );

    let filtered = sorted;
    if (branchId && branchId !== 'all') {
      filtered = filtered.filter((voucher) => {
        const veh = vehicleMap.get(voucher.vehicle_id);
        return veh && veh.branch_id === branchId;
      });
    }

    if (monthYear) {
      filtered = filtered.filter((voucher) => voucher.issue_date.startsWith(monthYear));
    }

    const sliced = limit ? filtered.slice(0, limit) : filtered;

    return sliced.map((voucher) => ({
      ...voucher,
      vehicle: vehicleMap.get(voucher.vehicle_id),
    }));
  }

  /**
   * Calculates total fuel consumed by a vehicle for a given month (YYYY-MM).
   * Defaults to current month if not specified.
   */
  static getVehicleMonthlyFuelStats(vehicleId: string, targetMonthYear?: string): {
    insideCitySpent: number;
    outsideCitySpent: number;
    totalSpent: number;
    vouchersCount: number;
    recentVouchers: FuelVoucher[];
  } {
    const monthKey = targetMonthYear || new Date().toISOString().slice(0, 7); // e.g. "2026-09"
    const allVouchers = this.getRawFuelVouchers();
    const vehicleVouchers = allVouchers.filter((v) => v.vehicle_id === vehicleId);
    const monthVouchers = vehicleVouchers.filter((v) => v.issue_date.startsWith(monthKey));

    let insideCitySpent = 0;
    let outsideCitySpent = 0;

    monthVouchers.forEach((v) => {
      const q = Number(v.quantity_liters) || 0;
      if (v.voucher_type === 'داخل المدينة') {
        insideCitySpent += q;
      } else {
        outsideCitySpent += q;
      }
    });

    const recentVouchers = [...vehicleVouchers].sort(
      (a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()
    ).slice(0, 5);

    return {
      insideCitySpent,
      outsideCitySpent,
      totalSpent: insideCitySpent + outsideCitySpent,
      vouchersCount: monthVouchers.length,
      recentVouchers,
    };
  }

  /**
   * Add a new maintenance record.
   * RLS Check:
   * - Admin can add to any vehicle
   * - Branch User can ONLY add to vehicles in their own branch
   */
  static addMaintenanceRecord(
    recordData: Omit<MaintenanceRecord, 'id' | 'created_at'> & { id?: string; created_at?: string }
  ): MaintenanceRecord {
    const vehicles = this.getRawVehicles();
    const targetVehicle = vehicles.find((v) => v.id === recordData.vehicle_id);
    
    // Enforce database-level RLS rule
    SupabaseAuthService.assertInsertAllowed(targetVehicle?.branch_id, 'maintenance_records');

    const records = this.getRawMaintenanceRecords();
    const newRecord: MaintenanceRecord = {
      id: recordData.id || `maint_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      vehicle_id: recordData.vehicle_id,
      maintenance_date: recordData.maintenance_date || new Date().toISOString().slice(0, 10),
      description: recordData.description.trim(),
      cost: Number(recordData.cost) || 0,
      performed_by: recordData.performed_by.trim(),
      notes: recordData.notes?.trim() || undefined,
      created_at: recordData.created_at || new Date().toISOString(),
    };

    const updated = [newRecord, ...records];
    this.saveMaintenanceRecords(updated);
    return newRecord;
  }

  /**
   * Delete a vehicle.
   * RLS Check: STRICTLY forbidden for branch_user. Only admin permitted.
   */
  static deleteVehicle(vehicleId: string): void {
    SupabaseAuthService.assertDeleteAllowed('vehicles');

    const vehicles = this.getRawVehicles().filter((v) => v.id !== vehicleId);
    this.saveVehicles(vehicles);

    // Cascade delete maintenance records for this vehicle
    const maintenance = this.getRawMaintenanceRecords().filter((m) => m.vehicle_id !== vehicleId);
    this.saveMaintenanceRecords(maintenance);

    // Cascade delete fuel vouchers for this vehicle
    const vouchers = this.getRawFuelVouchers().filter((v) => v.vehicle_id !== vehicleId);
    this.saveFuelVouchers(vouchers);
  }

  /**
   * Delete a maintenance record.
   * RLS Check: STRICTLY forbidden for branch_user. Only admin permitted.
   */
  static deleteMaintenanceRecord(recordId: string): void {
    SupabaseAuthService.assertDeleteAllowed('maintenance_records');

    const maintenance = this.getRawMaintenanceRecords().filter((m) => m.id !== recordId);
    this.saveMaintenanceRecords(maintenance);
  }

  static exportBackupData(): SystemBackupFile {
    const branches = this.getBranches();
    const vehicles = this.getVehicles();
    const maintenance_records = this.getMaintenanceRecords();
    const fuel_vouchers = this.getFuelVouchers();

    return {
      version: '2.0',
      exported_at: new Date().toISOString(),
      system: 'نظام إدارة آليات ومعدات الفروع الخمسة - SPC',
      directorate: 'الشركة السورية للبترول - إدارة آليات الفروع',
      source: 'Supabase Schema Compatible JSON Backup',
      counts: {
        branches: branches.length,
        vehicles: vehicles.length,
        maintenance_records: maintenance_records.length,
        fuel_vouchers: fuel_vouchers.length,
      },
      data: {
        branches,
        vehicles,
        maintenance_records,
        fuel_vouchers,
      },
    };
  }

  static restoreBackupData(fileContent: string): {
    success: boolean;
    vehiclesCount: number;
    maintenanceCount: number;
    branchesCount?: number;
    error?: string;
  } {
    try {
      const parsed = JSON.parse(fileContent);

      const branchesList = parsed?.data?.branches || parsed?.branches;
      const vehiclesList = parsed?.data?.vehicles || parsed?.vehicles;
      const maintenanceList = parsed?.data?.maintenance_records || parsed?.maintenance_records || parsed?.maintenance;

      if (!Array.isArray(vehiclesList) || !Array.isArray(maintenanceList)) {
        return {
          success: false,
          vehiclesCount: 0,
          maintenanceCount: 0,
          error: 'بنية ملف النسخ الاحتياطي غير صحيحة. يجب أن يحتوي الملف على مصفوفتي الآليات (vehicles) وسجلات الصيانة (maintenance_records).',
        };
      }

      if (vehiclesList.length > 0) {
        const firstVeh = vehiclesList[0];
        if (!firstVeh.id || !firstVeh.vehicle_number) {
          return {
            success: false,
            vehiclesCount: 0,
            maintenanceCount: 0,
            error: 'تنسيق بيانات الآليات غير مطابق لمعايير النظام (حقول id أو vehicle_number مفقودة).',
          };
        }
      }

      // If branches exist in backup and are valid, restore or merge them
      if (Array.isArray(branchesList) && branchesList.length > 0) {
        this.saveBranches(branchesList);
      } else {
        // Ensure default 5 branches exist if not present
        const currentBranches = this.getBranches();
        if (currentBranches.length === 0) {
          this.saveBranches(INITIAL_BRANCHES);
        }
      }

      // Ensure imported vehicles also have branch_id and fuel quota fields
      const sanitizedVehicles: Vehicle[] = vehiclesList.map((v) => ({
        ...v,
        branch_id: v.branch_id || 'branch-dez',
        engine_capacity: v.engine_capacity ?? 2700,
        fuel_quota_inside_city: v.fuel_quota_inside_city ?? 180,
        fuel_quota_outside_city: v.fuel_quota_outside_city ?? 120,
        fuel_expense_covered_by: v.fuel_expense_covered_by || 'الفرات',
        requested_fuel_quantity: v.requested_fuel_quantity ?? 0,
      }));

      this.saveVehicles(sanitizedVehicles);
      this.saveMaintenanceRecords(maintenanceList);

      const fuelVouchersList = parsed?.data?.fuel_vouchers || parsed?.fuel_vouchers;
      if (Array.isArray(fuelVouchersList)) {
        this.saveFuelVouchers(fuelVouchersList);
      }

      return {
        success: true,
        vehiclesCount: sanitizedVehicles.length,
        maintenanceCount: maintenanceList.length,
        branchesCount: Array.isArray(branchesList) ? branchesList.length : undefined,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        vehiclesCount: 0,
        maintenanceCount: 0,
        error: `تعذر قراءة ملف JSON: ${msg}`,
      };
    }
  }

  static resetToSeedData(): { vehicles: Vehicle[]; maintenance: MaintenanceRecord[]; fuelVouchers: FuelVoucher[] } {
    const seeded = INITIAL_VEHICLES.map((v) => ({
      ...v,
      branch_id: v.branch_id || 'branch-dez',
    }));
    this.saveVehicles(seeded);
    this.saveMaintenanceRecords(INITIAL_MAINTENANCE);
    this.saveBranches(INITIAL_BRANCHES);
    this.saveFuelVouchers(INITIAL_FUEL_VOUCHERS);
    return {
      vehicles: seeded,
      maintenance: INITIAL_MAINTENANCE,
      fuelVouchers: INITIAL_FUEL_VOUCHERS,
    };
  }

  static getMaintenanceWithVehicles(limit = 10, branchId?: string): MaintenanceWithVehicle[] {
    const allVehicles = this.getVehicles();
    const maintenance = this.getMaintenanceRecords();
    const vehicleMap = new Map<string, Vehicle>();
    allVehicles.forEach((v) => vehicleMap.set(v.id, v));

    // Sort by date descending
    const sorted = [...maintenance].sort(
      (a, b) => new Date(b.maintenance_date).getTime() - new Date(a.maintenance_date).getTime()
    );

    let filtered = sorted;
    if (branchId && branchId !== 'all') {
      filtered = sorted.filter((record) => {
        const veh = vehicleMap.get(record.vehicle_id);
        return veh && veh.branch_id === branchId;
      });
    }

    const sliced = limit ? filtered.slice(0, limit) : filtered;

    return sliced.map((record) => ({
      ...record,
      vehicle: vehicleMap.get(record.vehicle_id),
    }));
  }

  static getDashboardMetrics(branchId?: string): DashboardMetrics {
    const user = SupabaseAuthService.getCurrentUser();
    let effectiveBranchId = branchId;
    // For branch users, enforce lock to their assigned branch
    if (user && user.role === 'branch_user' && user.branch_id) {
      effectiveBranchId = user.branch_id;
    }

    const allVehicles = this.getVehicles();
    const allMaintenance = this.getMaintenanceRecords();
    const branches = this.getBranches();

    // Filter vehicles by branch if specific branch selected
    const isSingleBranch = effectiveBranchId && effectiveBranchId !== 'all';
    const vehicles = isSingleBranch
      ? allVehicles.filter((v) => v.branch_id === effectiveBranchId)
      : allVehicles;

    const vehicleIdSet = new Set(vehicles.map((v) => v.id));
    const maintenance = isSingleBranch
      ? allMaintenance.filter((m) => vehicleIdSet.has(m.vehicle_id))
      : allMaintenance;

    const totalVehicles = vehicles.length;
    const operationalCount = vehicles.filter((v) => v.status === 'تعمل').length;
    const brokenCount = vehicles.filter((v) => v.status === 'متعطلة').length;
    const outOfServiceCount = vehicles.filter((v) => v.status === 'خارج الخدمة').length;
    const loanedCount = vehicles.filter((v) => v.status === 'معارة').length;

    const readinessRate = totalVehicles > 0 ? Math.round((operationalCount / totalVehicles) * 100) : 0;
    const totalMaintenanceCost = maintenance.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

    const categories: VehicleCategory[] = ['بنزين إرسال حديث', 'بنزين استلام قديم', 'مازوت'];
    const categoryStats = categories.map((category) => {
      const matched = vehicles.filter((v) => v.category === category);
      const count = matched.length;
      const operational = matched.filter((v) => v.status === 'تعمل').length;
      const percentage = totalVehicles > 0 ? Math.round((count / totalVehicles) * 100) : 0;
      return {
        category,
        count,
        percentage,
        operational,
      };
    });

    const fuels: FuelType[] = ['بنزين', 'مازوت'];
    const fuelStats = fuels.map((fuel) => ({
      fuel,
      count: vehicles.filter((v) => v.fuel_type === fuel).length,
    }));

    const deptMap: Record<string, number> = {};
    vehicles.forEach((v) => {
      const dept = v.assigned_department || 'غير محدد';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });

    const departmentStats = Object.entries(deptMap)
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);

    // Compute branch summaries for comparison when showing all or overview
    const branchSummaries: BranchMetricSummary[] = branches.map((branch) => {
      const bVehicles = allVehicles.filter((v) => v.branch_id === branch.id);
      const bTotal = bVehicles.length;
      const bOp = bVehicles.filter((v) => v.status === 'تعمل').length;
      const bBrk = bVehicles.filter((v) => v.status === 'متعطلة').length;
      const bOut = bVehicles.filter((v) => v.status === 'خارج الخدمة').length;
      const bRate = bTotal > 0 ? Math.round((bOp / bTotal) * 100) : 0;

      const bVehIdSet = new Set(bVehicles.map((v) => v.id));
      const bCost = allMaintenance
        .filter((m) => bVehIdSet.has(m.vehicle_id))
        .reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

      return {
        branch,
        totalVehicles: bTotal,
        operationalCount: bOp,
        brokenCount: bBrk,
        outOfServiceCount: bOut,
        readinessRate: bRate,
        totalMaintenanceCost: bCost,
      };
    });

    return {
      totalVehicles,
      operationalCount,
      brokenCount,
      outOfServiceCount,
      loanedCount,
      readinessRate,
      totalMaintenanceCost,
      branchSummaries,
      categoryStats,
      fuelStats,
      departmentStats,
    };
  }
}
