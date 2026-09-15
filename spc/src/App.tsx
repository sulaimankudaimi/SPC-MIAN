/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ActiveTab, Vehicle, MaintenanceWithVehicle, DashboardMetrics, Branch, Profile } from './types';
import { StorageService } from './services/storageService';
import { SupabaseAuthService } from './services/supabaseService';
import { LoginView } from './components/LoginView';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './components/DashboardView';
import { VehiclesView } from './components/VehiclesView';
import { MaintenanceView } from './components/MaintenanceView';
import { ReportsView } from './components/ReportsView';
import { BackupView } from './components/BackupView';
import { SettingsView } from './components/SettingsView';
import { SqlSchemaModal } from './components/SqlSchemaModal';
import { AddVehicleModal } from './components/AddVehicleModal';
import { EditVehicleModal } from './components/EditVehicleModal';
import { AddMaintenanceModal } from './components/AddMaintenanceModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('branch-dez');
  const [dashboardBranchFilter, setDashboardBranchFilter] = useState<string>('all');
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [recentMaintenance, setRecentMaintenance] = useState<MaintenanceWithVehicle[]>([]);
  const [allMaintenance, setAllMaintenance] = useState<MaintenanceWithVehicle[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [sqlModalOpen, setSqlModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals for CRUD operations
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isEditVehicleOpen, setIsEditVehicleOpen] = useState(false);
  const [isAddMaintenanceOpen, setIsAddMaintenanceOpen] = useState(false);
  const [selectedVehicleForMaintenance, setSelectedVehicleForMaintenance] = useState<string | undefined>(undefined);

  // Check auth session on startup
  useEffect(() => {
    const profile = SupabaseAuthService.getCurrentProfile();
    setCurrentUser(profile);
    setIsAuthLoading(false);

    if (profile?.role === 'branch_user' && profile.branch_id) {
      setSelectedBranchId(profile.branch_id);
      setDashboardBranchFilter(profile.branch_id);
    } else {
      setDashboardBranchFilter('all');
    }

    const unsubscribe = SupabaseAuthService.onAuthStateChanged((updatedProfile) => {
      setCurrentUser(updatedProfile);
      if (updatedProfile?.role === 'branch_user' && updatedProfile.branch_id) {
        setSelectedBranchId(updatedProfile.branch_id);
        setDashboardBranchFilter(updatedProfile.branch_id);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadData = useCallback(() => {
    const loadedBranches = StorageService.getBranches();
    const loadedVehicles = StorageService.getVehicles();
    const effectiveBranchFilter = currentUser?.role === 'branch_user' && currentUser.branch_id
      ? currentUser.branch_id
      : dashboardBranchFilter;

    const recent = StorageService.getMaintenanceWithVehicles(10, effectiveBranchFilter);
    const all = StorageService.getMaintenanceWithVehicles(0);
    const computedMetrics = StorageService.getDashboardMetrics(effectiveBranchFilter);

    setBranches(loadedBranches);
    setVehicles(loadedVehicles);
    setRecentMaintenance(recent);
    setAllMaintenance(all);
    setMetrics(computedMetrics);
  }, [dashboardBranchFilter, currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [loadData, currentUser]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleLogout = async () => {
    await SupabaseAuthService.signOut();
    setCurrentUser(null);
    showToast('تم تسجيل الخروج بنجاح');
  };

  const handleOpenAddMaintenance = (vehicleId?: string) => {
    setSelectedVehicleForMaintenance(vehicleId);
    setIsAddMaintenanceOpen(true);
  };

  const handleOpenEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsEditVehicleOpen(true);
  };

  const handleVehicleUpdated = (updatedVehicle: Vehicle) => {
    loadData();
    setIsEditVehicleOpen(false);
    setEditingVehicle(null);
    showToast(`تم تعديل بيانات الآلية (${updatedVehicle.vehicle_number}) بنجاح`);
  };

  const handleVehicleAdded = (newVehicle: Vehicle) => {
    loadData();
    showToast(`تمت إضافة الآلية (${newVehicle.vehicle_number}) بنجاح`);
  };

  const handleMaintenanceAdded = (newRecord: any) => {
    loadData();
    showToast('تم تسجيل أمر الصيانة وحفظه بنجاح');
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    StorageService.deleteVehicle(vehicleId);
    loadData();
    showToast('تم حذف الآلية وسجلاتها بنجاح');
  };

  const handleDeleteMaintenance = (recordId: string) => {
    StorageService.deleteMaintenanceRecord(recordId);
    loadData();
    showToast('تم حذف أمر الصيانة بنجاح');
  };

  const handleResetSeed = () => {
    if (window.confirm('هل تريد إعادة تعيين كافة البيانات التجريبية الأولية (5 فروع، 18 آلية، و14 سجل صيانة)؟')) {
      StorageService.resetToSeedData();
      loadData();
      showToast('تمت إعادة ضبط البيانات التجريبية الأولية بنجاح!');
    }
  };

  // Branch statistics mapping for sidebar
  const branchVehicleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    branches.forEach((b) => {
      counts[b.id] = vehicles.filter((v) => v.branch_id === b.id).length;
    });
    return counts;
  }, [branches, vehicles]);

  const branchMaintenanceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    branches.forEach((b) => {
      counts[b.id] = allMaintenance.filter((m) => m.vehicle?.branch_id === b.id).length;
    });
    return counts;
  }, [branches, allMaintenance]);

  const currentBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  // Vehicles and maintenance filtered for the active branch in Vehicles/Maintenance views
  const currentBranchVehicles = useMemo(() => {
    return vehicles.filter((v) => v.branch_id === selectedBranchId);
  }, [vehicles, selectedBranchId]);

  const currentBranchMaintenance = useMemo(() => {
    return allMaintenance.filter((m) => m.vehicle?.branch_id === selectedBranchId);
  }, [allMaintenance, selectedBranchId]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300 font-['Cairo',sans-serif]">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
          <span className="text-sm font-bold">جاري التحقق من جلسة المصادقة...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <LoginView 
          onLoginSuccess={(profile) => {
            setCurrentUser(profile);
            if (profile.role === 'branch_user' && profile.branch_id) {
              setSelectedBranchId(profile.branch_id);
              setDashboardBranchFilter(profile.branch_id);
            } else {
              setDashboardBranchFilter('all');
            }
            loadData();
            showToast(`أهلاً بك يا ${profile.full_name} (${profile.role === 'admin' ? 'مشرف عام' : 'مستخدم فرع'})`);
          }}
          onOpenSqlModal={() => setSqlModalOpen(true)}
        />
        <SqlSchemaModal
          isOpen={sqlModalOpen}
          onClose={() => setSqlModalOpen(false)}
        />
      </>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300 font-['Cairo',sans-serif]">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
          <span>جاري تحميل نظام إدارة الآليات...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-row overflow-x-hidden font-['Cairo',sans-serif]" dir="rtl">
      
      {/* 1. Fixed Professional Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedBranchId={selectedBranchId}
        onSelectBranch={(branchId) => {
          setSelectedBranchId(branchId);
          if (activeTab !== 'vehicles' && activeTab !== 'maintenance') {
            setActiveTab('vehicles');
          }
        }}
        branches={branches}
        branchVehicleCounts={branchVehicleCounts}
        branchMaintenanceCounts={branchMaintenanceCounts}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenSqlModal={() => setSqlModalOpen(true)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        
        {/* Sticky Top Header */}
        <TopHeader
          activeTab={activeTab}
          metrics={metrics}
          currentBranch={currentBranch}
          currentUser={currentUser}
          onResetSeed={handleResetSeed}
          onOpenSqlModal={() => setSqlModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              recentMaintenance={recentMaintenance}
              vehicles={dashboardBranchFilter === 'all' ? vehicles : currentBranchVehicles}
              branches={branches}
              selectedBranchFilter={dashboardBranchFilter}
              currentUser={currentUser}
              onSelectBranchFilter={(bId) => {
                if (currentUser.role === 'branch_user') return;
                setDashboardBranchFilter(bId);
              }}
              onNavigateToBranch={(bId) => {
                setSelectedBranchId(bId);
                setActiveTab('vehicles');
              }}
              onViewAllVehicles={() => {
                if (dashboardBranchFilter !== 'all') {
                  setSelectedBranchId(dashboardBranchFilter);
                }
                setActiveTab('vehicles');
              }}
              onViewAllMaintenance={() => {
                if (dashboardBranchFilter !== 'all') {
                  setSelectedBranchId(dashboardBranchFilter);
                }
                setActiveTab('maintenance');
              }}
              onOpenAddVehicle={() => setIsAddVehicleOpen(true)}
              onOpenAddMaintenance={() => handleOpenAddMaintenance()}
            />
          )}

          {activeTab === 'vehicles' && (
            <VehiclesView 
              vehicles={currentBranchVehicles} 
              branch={currentBranch}
              maintenanceRecords={allMaintenance} 
              currentUser={currentUser}
              onEditVehicle={handleOpenEditVehicle}
              onOpenAddVehicle={() => setIsAddVehicleOpen(true)}
              onOpenAddMaintenance={handleOpenAddMaintenance}
              onDeleteVehicle={handleDeleteVehicle}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceView 
              maintenanceList={currentBranchMaintenance} 
              branch={currentBranch}
              currentUser={currentUser}
              onOpenAddMaintenance={handleOpenAddMaintenance}
              onDeleteMaintenance={handleDeleteMaintenance}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView 
              maintenanceList={allMaintenance} 
              vehicles={vehicles} 
            />
          )}

          {activeTab === 'backup' && (
            <BackupView
              vehicles={vehicles}
              maintenanceList={allMaintenance}
              onDataRestored={loadData}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              onLogout={handleLogout}
              onOpenSqlModal={() => setSqlModalOpen(true)}
              onShowToast={showToast}
            />
          )}
        </main>

        {/* Sub-footer note */}
        <footer className="px-6 py-4 border-t border-slate-800/60 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto">
          <div>
            الشركة السورية للبترول (SPC) • منظومة إدارة آليات ومعدات الفروع الخمسة
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span>النسخة 2.0 (نظام المصادقة وصلاحيات RLS المطبقة)</span>
            <span>•</span>
            <button
              onClick={() => setSqlModalOpen(true)}
              className="hover:text-amber-400 underline transition-colors"
            >
              عرض سياسات الأمان ومخطط Supabase
            </button>
          </div>
        </footer>
      </div>

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={isAddVehicleOpen}
        defaultBranchId={selectedBranchId}
        onClose={() => setIsAddVehicleOpen(false)}
        onVehicleAdded={handleVehicleAdded}
      />

      {/* Edit Vehicle Modal (Admin Only) */}
      <EditVehicleModal
        isOpen={isEditVehicleOpen}
        vehicle={editingVehicle}
        branches={branches}
        onClose={() => {
          setIsEditVehicleOpen(false);
          setEditingVehicle(null);
        }}
        onVehicleUpdated={handleVehicleUpdated}
      />

      {/* Add Maintenance Modal */}
      <AddMaintenanceModal
        isOpen={isAddMaintenanceOpen}
        vehicles={currentBranchVehicles.length > 0 ? currentBranchVehicles : vehicles}
        defaultVehicleId={selectedVehicleForMaintenance}
        onClose={() => {
          setIsAddMaintenanceOpen(false);
          setSelectedVehicleForMaintenance(undefined);
        }}
        onMaintenanceAdded={handleMaintenanceAdded}
      />

      {/* Supabase Schema Modal */}
      <SqlSchemaModal
        isOpen={sqlModalOpen}
        onClose={() => setSqlModalOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div 
          id="system-toast"
          className="fixed bottom-6 left-6 z-50 bg-amber-500 text-slate-950 px-4 py-3 rounded-xl shadow-xl font-bold text-xs flex items-center gap-2 border border-amber-400 animate-bounce"
        >
          <CheckCircle2 className="w-4 h-4 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
