export type VehicleStatus = 'تعمل' | 'متعطلة' | 'خارج الخدمة' | 'معارة';

export type FuelType = 'بنزين' | 'مازوت';

export type VehicleCategory = 'بنزين إرسال حديث' | 'بنزين استلام قديم' | 'مازوت';

export type UserRole = 'admin' | 'branch_user';

export interface Profile {
  id: string; // references auth.users.id
  email: string;
  full_name: string;
  role: UserRole;
  branch_id: string | null; // NULL exclusively for admin, mandatory for branch_user
  created_at: string;
}

export interface AuthSession {
  user: Profile;
  token?: string;
}

export interface SeedUser {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  branch_id: string | null;
  branch_name?: string;
  branch_code?: string;
  description: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  is_headquarters: boolean;
  created_at: string;
}

export interface Vehicle {
  id: string;
  branch_id?: string;
  vehicle_number: string;
  vehicle_type: string;
  manufacture_year: number;
  status: VehicleStatus;
  fuel_type: FuelType;
  category: VehicleCategory;
  assigned_department: string;
  current_location: string;
  chassis_number?: string;
  notes?: string;
  
  // Fuel Quotas & Real Branch Attributes
  engine_capacity?: number; // سعة المحرك، رقم (CC)
  fuel_quota_inside_city?: number; // حصة الوقود المقررة شهرياً داخل المدينة، باللتر، رقم
  fuel_quota_outside_city?: number; // حصة الوقود المقررة شهرياً خارج المدينة، باللتر، رقم
  fuel_expense_covered_by?: string; // الجهة التي تتحمل نفقة المحروقات والصيانة، نص — مثال: "الفرات"
  requested_fuel_quantity?: number | null; // كمية محروقات إضافية مطلوبة إن وُجدت، رقم، قابلة لتكون NULL أو صفر

  created_at: string;
  updated_at?: string;
}

export type VoucherType = 'داخل المدينة' | 'خارج المدينة';

export interface FuelVoucher {
  id: string;
  vehicle_id: string;
  issue_date: string; // YYYY-MM-DD
  quantity_liters: number;
  voucher_type: VoucherType;
  issued_by: string;
  notes?: string;
  created_at: string;
}

export interface FuelVoucherWithVehicle extends FuelVoucher {
  vehicle?: Vehicle;
}

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  maintenance_date: string;
  description: string;
  cost: number;
  performed_by: string;
  notes?: string;
  created_at: string;
}

export interface MaintenanceWithVehicle extends MaintenanceRecord {
  vehicle?: Vehicle;
}

export interface SystemBackupFile {
  version: string;
  exported_at: string;
  system: string;
  directorate: string;
  source: string;
  counts: {
    branches?: number;
    vehicles: number;
    maintenance_records: number;
    fuel_vouchers?: number;
  };
  data: {
    branches?: Branch[];
    vehicles: Vehicle[];
    maintenance_records: MaintenanceRecord[];
    fuel_vouchers?: FuelVoucher[];
  };
}

export type ActiveTab = 'dashboard' | 'vehicles' | 'maintenance' | 'vouchers' | 'reports' | 'backup' | 'settings';

export interface BranchMetricSummary {
  branch: Branch;
  totalVehicles: number;
  operationalCount: number;
  brokenCount: number;
  outOfServiceCount: number;
  readinessRate: number;
  totalMaintenanceCost: number;
}

export interface DashboardMetrics {
  totalVehicles: number;
  operationalCount: number;
  brokenCount: number;
  outOfServiceCount: number;
  loanedCount: number;
  readinessRate: number;
  totalMaintenanceCost: number;
  branchSummaries?: BranchMetricSummary[];
  categoryStats: {
    category: VehicleCategory;
    count: number;
    percentage: number;
    operational: number;
  }[];
  fuelStats: {
    fuel: FuelType;
    count: number;
  }[];
  departmentStats: {
    department: string;
    count: number;
  }[];
}
