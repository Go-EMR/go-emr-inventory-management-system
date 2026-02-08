import { Injectable, inject, signal, computed, Injector, runInInjectionContext } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, tap } from 'rxjs';
import {
  Tenant,
  TenantStatus,
  SubscriptionPlan,
  TenantRole,
  TenantFeatureFlags,
  TenantBranding,
  TenantContactInfo,
  TenantSettings,
  TenantBillingInfo,
  UserTenantMembership,
  TenantInvitation,
  TenantUser,
  TenantStats,
  TenantSwitchContext,
  ComplianceFramework
} from '../../shared/models';
import { environment } from '../../../environments/environment';
import { MockDataService } from './mock-data.service';

const TENANT_STORAGE_KEY = 'current_tenant_id';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private http = inject(HttpClient);
  private injector = inject(Injector);
  private baseUrl = `${environment.apiUrl}/api/v1/tenants`;

  // Lazy inject to avoid circular dependency
  private get mockDataService(): MockDataService {
    return runInInjectionContext(this.injector, () => inject(MockDataService));
  }

  // Signals for reactive state
  private tenantsSignal = signal<Tenant[]>([]);
  private currentTenantSignal = signal<Tenant | null>(null);
  private userMembershipsSignal = signal<UserTenantMembership[]>([]);
  private tenantUsersSignal = signal<TenantUser[]>([]);
  private loadingSignal = signal(false);

  readonly tenants = this.tenantsSignal.asReadonly();
  readonly currentTenant = this.currentTenantSignal.asReadonly();
  readonly userMemberships = this.userMembershipsSignal.asReadonly();
  readonly tenantUsers = this.tenantUsersSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  // Computed values
  readonly currentTenantId = computed(() => this.currentTenantSignal()?.id);

  readonly currentTenantName = computed(() => this.currentTenantSignal()?.name);

  readonly hasMultipleTenants = computed(() => this.userMembershipsSignal().length > 1);

  readonly availableTenants = computed(() => {
    const activeMemberships = this.userMembershipsSignal().filter(m => m.status === 'active');
    const tenantIds = activeMemberships.map(m => m.tenantId);
    return this.tenantsSignal().filter(t => tenantIds.includes(t.id));
  });

  readonly currentMembership = computed(() =>
    this.userMembershipsSignal().find(m => m.tenantId === this.currentTenantId())
  );

  readonly currentRole = computed(() => this.currentMembership()?.role || TenantRole.VIEWER);

  readonly isTenantAdmin = computed(() =>
    this.currentRole() === TenantRole.TENANT_ADMIN || this.currentRole() === TenantRole.SUPER_ADMIN
  );

  readonly isSuperAdmin = computed(() => this.currentRole() === TenantRole.SUPER_ADMIN);

  // Mock data for development
  private mockTenants: Tenant[] = [
    {
      id: 'tenant-1',
      name: 'City General Hospital',
      slug: 'city-general',
      status: TenantStatus.ACTIVE,
      subscriptionPlan: SubscriptionPlan.ENTERPRISE,
      featureFlags: {
        maxUsers: 100,
        maxEquipment: 5000,
        maxInventoryItems: 10000,
        advancedReporting: true,
        apiAccess: true,
        webhooksEnabled: true,
        customBranding: true,
        complianceModules: [ComplianceFramework.HIPAA],
        offlineMode: true,
        multiLocation: true,
        barcodePrinting: true,
        helpDesk: true,
        depreciation: true,
        advancedProcurement: true,
        dataExport: true
      },
      branding: {
        primaryColor: '#10b981',
        secondaryColor: '#0ea5e9',
        accentColor: '#f59e0b',
        logoUrl: '/assets/logos/city-general.png',
        companyName: 'City General Hospital'
      },
      contact: {
        address: '123 Medical Center Drive',
        city: 'Boston',
        state: 'MA',
        postalCode: '02108',
        country: 'USA',
        phone: '(617) 555-0100',
        email: 'info@citygeneral.org',
        website: 'https://citygeneral.org',
        primaryContactName: 'Dr. Emily Chen',
        primaryContactEmail: 'echen@citygeneral.org',
        primaryContactPhone: '(617) 555-0101'
      },
      settings: {
        timezone: 'America/New_York',
        dateFormat: 'MM/dd/yyyy',
        timeFormat: '12h',
        currency: 'USD',
        currencySymbol: '$',
        language: 'en',
        fiscalYearStart: '01-01',
        maintenanceReminderDays: 30,
        warrantyExpiryReminderDays: 60,
        lowStockThresholdPercent: 20,
        sessionTimeoutMinutes: 30,
        requireMfa: true
      },
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date()
    },
    {
      id: 'tenant-2',
      name: 'Sunrise Medical Center',
      slug: 'sunrise-medical',
      status: TenantStatus.ACTIVE,
      subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
      featureFlags: {
        maxUsers: 50,
        maxEquipment: 2000,
        maxInventoryItems: 5000,
        advancedReporting: true,
        apiAccess: true,
        webhooksEnabled: false,
        customBranding: false,
        complianceModules: [ComplianceFramework.HIPAA],
        offlineMode: false,
        multiLocation: true,
        barcodePrinting: true,
        helpDesk: true,
        depreciation: true,
        advancedProcurement: false,
        dataExport: true
      },
      branding: {
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        accentColor: '#ec4899',
        companyName: 'Sunrise Medical Center'
      },
      contact: {
        address: '456 Healthcare Blvd',
        city: 'San Diego',
        state: 'CA',
        postalCode: '92101',
        country: 'USA',
        phone: '(619) 555-0200',
        email: 'contact@sunrisemedical.com',
        primaryContactName: 'Sarah Johnson',
        primaryContactEmail: 'sjohnson@sunrisemedical.com',
        primaryContactPhone: '(619) 555-0201'
      },
      settings: {
        timezone: 'America/Los_Angeles',
        dateFormat: 'MM/dd/yyyy',
        timeFormat: '12h',
        currency: 'USD',
        currencySymbol: '$',
        language: 'en',
        fiscalYearStart: '07-01',
        maintenanceReminderDays: 14,
        warrantyExpiryReminderDays: 30,
        lowStockThresholdPercent: 25,
        sessionTimeoutMinutes: 60,
        requireMfa: false
      },
      createdAt: new Date('2023-06-01'),
      updatedAt: new Date()
    },
    {
      id: 'tenant-3',
      name: 'Valley Health Clinic',
      slug: 'valley-health',
      status: TenantStatus.TRIAL,
      subscriptionPlan: SubscriptionPlan.BASIC,
      featureFlags: {
        maxUsers: 10,
        maxEquipment: 500,
        maxInventoryItems: 1000,
        advancedReporting: false,
        apiAccess: false,
        webhooksEnabled: false,
        customBranding: false,
        complianceModules: [],
        offlineMode: false,
        multiLocation: false,
        barcodePrinting: true,
        helpDesk: false,
        depreciation: false,
        advancedProcurement: false,
        dataExport: false
      },
      branding: {
        primaryColor: '#10b981',
        secondaryColor: '#0ea5e9',
        accentColor: '#f59e0b',
        companyName: 'Valley Health Clinic'
      },
      contact: {
        address: '789 Valley Road',
        city: 'Denver',
        state: 'CO',
        postalCode: '80202',
        country: 'USA',
        phone: '(303) 555-0300',
        email: 'info@valleyhealth.com',
        primaryContactName: 'Mike Peters',
        primaryContactEmail: 'mpeters@valleyhealth.com',
        primaryContactPhone: '(303) 555-0301'
      },
      settings: {
        timezone: 'America/Denver',
        dateFormat: 'MM/dd/yyyy',
        timeFormat: '12h',
        currency: 'USD',
        currencySymbol: '$',
        language: 'en',
        fiscalYearStart: '01-01',
        maintenanceReminderDays: 30,
        warrantyExpiryReminderDays: 30,
        lowStockThresholdPercent: 20,
        sessionTimeoutMinutes: 30,
        requireMfa: false
      },
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date(),
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'tenant-4',
      name: 'Riverside Community Hospital',
      slug: 'riverside-community',
      status: TenantStatus.ACTIVE,
      subscriptionPlan: SubscriptionPlan.ENTERPRISE,
      featureFlags: {
        maxUsers: 150,
        maxEquipment: 8000,
        maxInventoryItems: 15000,
        advancedReporting: true,
        apiAccess: true,
        webhooksEnabled: true,
        customBranding: true,
        complianceModules: [ComplianceFramework.HIPAA, ComplianceFramework.FDA_21_CFR_PART_11],
        offlineMode: true,
        multiLocation: true,
        barcodePrinting: true,
        helpDesk: true,
        depreciation: true,
        advancedProcurement: true,
        dataExport: true
      },
      branding: {
        primaryColor: '#8b5cf6',
        secondaryColor: '#06b6d4',
        accentColor: '#f97316',
        logoUrl: '/assets/logos/riverside.png',
        companyName: 'Riverside Community Hospital'
      },
      contact: {
        address: '500 River Drive',
        city: 'Chicago',
        state: 'IL',
        postalCode: '60601',
        country: 'USA',
        phone: '(312) 555-0400',
        email: 'info@riversidehospital.org',
        website: 'https://riversidehospital.org',
        primaryContactName: 'Dr. James Mitchell',
        primaryContactEmail: 'jmitchell@riversidehospital.org',
        primaryContactPhone: '(312) 555-0401'
      },
      settings: {
        timezone: 'America/Chicago',
        dateFormat: 'MM/dd/yyyy',
        timeFormat: '12h',
        currency: 'USD',
        currencySymbol: '$',
        language: 'en',
        fiscalYearStart: '07-01',
        maintenanceReminderDays: 21,
        warrantyExpiryReminderDays: 45,
        lowStockThresholdPercent: 15,
        sessionTimeoutMinutes: 45,
        requireMfa: true
      },
      createdAt: new Date('2022-09-01'),
      updatedAt: new Date()
    }
  ];

  private mockMemberships: UserTenantMembership[] = [
    {
      id: 'member-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      tenantName: 'City General Hospital',
      tenantSlug: 'city-general',
      role: TenantRole.TENANT_ADMIN,
      isDefault: true,
      status: 'active',
      acceptedAt: new Date('2023-01-15'),
      lastAccessedAt: new Date(),
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date()
    },
    {
      id: 'member-2',
      userId: 'user-1',
      tenantId: 'tenant-2',
      tenantName: 'Sunrise Medical Center',
      tenantSlug: 'sunrise-medical',
      role: TenantRole.MANAGER,
      isDefault: false,
      status: 'active',
      acceptedAt: new Date('2023-06-01'),
      lastAccessedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date('2023-06-01'),
      updatedAt: new Date()
    },
    {
      id: 'member-3',
      userId: 'user-1',
      tenantId: 'tenant-4',
      tenantName: 'Riverside Community Hospital',
      tenantSlug: 'riverside-community',
      role: TenantRole.SUPER_ADMIN,
      isDefault: false,
      status: 'active',
      acceptedAt: new Date('2022-09-01'),
      lastAccessedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      createdAt: new Date('2022-09-01'),
      updatedAt: new Date()
    }
  ];

  private mockTenantUsers: TenantUser[] = [
    // City General Hospital (tenant-1) Users
    {
      id: 'tu-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      email: 'admin@citygeneral.org',
      firstName: 'John',
      lastName: 'Smith',
      displayName: 'John Smith',
      role: TenantRole.TENANT_ADMIN,
      status: 'active',
      department: 'Administration',
      title: 'IT Manager',
      lastLoginAt: new Date(),
      mfaEnabled: true,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date()
    },
    {
      id: 'tu-2',
      tenantId: 'tenant-1',
      userId: 'user-2',
      email: 'mjohnson@citygeneral.org',
      firstName: 'Mary',
      lastName: 'Johnson',
      displayName: 'Mary Johnson',
      role: TenantRole.MANAGER,
      status: 'active',
      department: 'Biomedical Engineering',
      title: 'Department Head',
      lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      mfaEnabled: true,
      createdAt: new Date('2023-02-01'),
      updatedAt: new Date()
    },
    {
      id: 'tu-3',
      tenantId: 'tenant-1',
      userId: 'user-3',
      email: 'rwilson@citygeneral.org',
      firstName: 'Robert',
      lastName: 'Wilson',
      displayName: 'Robert Wilson',
      role: TenantRole.STAFF,
      status: 'active',
      department: 'Biomedical Engineering',
      title: 'Technician',
      lastLoginAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      mfaEnabled: false,
      createdAt: new Date('2023-03-15'),
      updatedAt: new Date()
    },
    // Sunrise Medical Center (tenant-2) Users
    {
      id: 'tu-4',
      tenantId: 'tenant-2',
      userId: 'user-4',
      email: 'sjohnson@sunrisemedical.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      displayName: 'Sarah Johnson',
      role: TenantRole.TENANT_ADMIN,
      status: 'active',
      department: 'Administration',
      title: 'Director of Operations',
      lastLoginAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      mfaEnabled: true,
      createdAt: new Date('2023-06-01'),
      updatedAt: new Date()
    },
    {
      id: 'tu-5',
      tenantId: 'tenant-2',
      userId: 'user-5',
      email: 'dlee@sunrisemedical.com',
      firstName: 'David',
      lastName: 'Lee',
      displayName: 'David Lee',
      role: TenantRole.MANAGER,
      status: 'active',
      department: 'Biomedical Engineering',
      title: 'Equipment Manager',
      lastLoginAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      mfaEnabled: true,
      createdAt: new Date('2023-07-01'),
      updatedAt: new Date()
    },
    {
      id: 'tu-6',
      tenantId: 'tenant-2',
      userId: 'user-6',
      email: 'agarcia@sunrisemedical.com',
      firstName: 'Ana',
      lastName: 'Garcia',
      displayName: 'Ana Garcia',
      role: TenantRole.STAFF,
      status: 'active',
      department: 'Maintenance',
      title: 'Senior Technician',
      lastLoginAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      mfaEnabled: false,
      createdAt: new Date('2023-08-15'),
      updatedAt: new Date()
    },
    {
      id: 'tu-7',
      tenantId: 'tenant-2',
      userId: 'user-1',
      email: 'admin@citygeneral.org',
      firstName: 'John',
      lastName: 'Smith',
      displayName: 'John Smith',
      role: TenantRole.MANAGER,
      status: 'active',
      department: 'Consulting',
      title: 'External Consultant',
      lastLoginAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      mfaEnabled: true,
      createdAt: new Date('2023-06-01'),
      updatedAt: new Date()
    },
    // Riverside Community Hospital (tenant-4) Users
    {
      id: 'tu-8',
      tenantId: 'tenant-4',
      userId: 'user-7',
      email: 'jmitchell@riversidehospital.org',
      firstName: 'James',
      lastName: 'Mitchell',
      displayName: 'Dr. James Mitchell',
      role: TenantRole.SUPER_ADMIN,
      status: 'active',
      department: 'Administration',
      title: 'Chief Operations Officer',
      lastLoginAt: new Date(),
      mfaEnabled: true,
      createdAt: new Date('2022-09-01'),
      updatedAt: new Date()
    },
    {
      id: 'tu-9',
      tenantId: 'tenant-4',
      userId: 'user-8',
      email: 'lthompson@riversidehospital.org',
      firstName: 'Lisa',
      lastName: 'Thompson',
      displayName: 'Lisa Thompson',
      role: TenantRole.TENANT_ADMIN,
      status: 'active',
      department: 'IT',
      title: 'IT Director',
      lastLoginAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      mfaEnabled: true,
      createdAt: new Date('2022-10-01'),
      updatedAt: new Date()
    },
    {
      id: 'tu-10',
      tenantId: 'tenant-4',
      userId: 'user-9',
      email: 'mbrown@riversidehospital.org',
      firstName: 'Michael',
      lastName: 'Brown',
      displayName: 'Michael Brown',
      role: TenantRole.MANAGER,
      status: 'active',
      department: 'Biomedical Engineering',
      title: 'Department Manager',
      lastLoginAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      mfaEnabled: true,
      createdAt: new Date('2022-11-01'),
      updatedAt: new Date()
    },
    {
      id: 'tu-11',
      tenantId: 'tenant-4',
      userId: 'user-10',
      email: 'ewilliams@riversidehospital.org',
      firstName: 'Emily',
      lastName: 'Williams',
      displayName: 'Emily Williams',
      role: TenantRole.STAFF,
      status: 'active',
      department: 'Biomedical Engineering',
      title: 'Lead Technician',
      lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      mfaEnabled: false,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date()
    },
    {
      id: 'tu-12',
      tenantId: 'tenant-4',
      userId: 'user-11',
      email: 'jrodriguez@riversidehospital.org',
      firstName: 'Juan',
      lastName: 'Rodriguez',
      displayName: 'Juan Rodriguez',
      role: TenantRole.STAFF,
      status: 'active',
      department: 'Maintenance',
      title: 'Technician',
      lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      mfaEnabled: false,
      createdAt: new Date('2023-03-01'),
      updatedAt: new Date()
    },
    {
      id: 'tu-13',
      tenantId: 'tenant-4',
      userId: 'user-1',
      email: 'admin@citygeneral.org',
      firstName: 'John',
      lastName: 'Smith',
      displayName: 'John Smith',
      role: TenantRole.SUPER_ADMIN,
      status: 'active',
      department: 'Administration',
      title: 'System Administrator',
      lastLoginAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      mfaEnabled: true,
      createdAt: new Date('2022-09-01'),
      updatedAt: new Date()
    }
  ];

  constructor() {
    this.initializeTenant();
  }

  private initializeTenant(): void {
    // Load all tenants (for admin access)
    this.tenantsSignal.set(this.mockTenants);

    // Load user memberships
    this.userMembershipsSignal.set(this.mockMemberships);

    // Check for stored tenant or use default
    const storedTenantId = localStorage.getItem(TENANT_STORAGE_KEY);
    const defaultMembership = this.mockMemberships.find(m => m.isDefault);

    if (storedTenantId) {
      const membership = this.mockMemberships.find(m => m.tenantId === storedTenantId);
      if (membership) {
        this.switchTenant(storedTenantId);
        return;
      }
    }

    if (defaultMembership) {
      this.switchTenant(defaultMembership.tenantId);
    }
  }

  // ==================== Tenant Context ====================

  switchTenant(tenantId: string): Observable<Tenant> {
    const tenant = this.mockTenants.find(t => t.id === tenantId);
    if (tenant) {
      this.currentTenantSignal.set(tenant);
      localStorage.setItem(TENANT_STORAGE_KEY, tenantId);

      // Sync with MockDataService to filter data by tenant
      this.mockDataService.setCurrentTenant(tenantId);

      // Update last accessed
      const membership = this.mockMemberships.find(m => m.tenantId === tenantId);
      if (membership) {
        membership.lastAccessedAt = new Date();
      }
    }
    return of(tenant!).pipe(delay(300));
  }

  getSwitchContext(): Observable<TenantSwitchContext> {
    const current = this.currentTenantSignal();
    const membership = this.currentMembership();

    const context: TenantSwitchContext = {
      currentTenantId: current?.id || '',
      currentTenantName: current?.name || '',
      currentTenantSlug: current?.slug || '',
      currentRole: membership?.role || TenantRole.VIEWER,
      availableTenants: this.mockMemberships.filter(m => m.status === 'active')
    };

    return of(context).pipe(delay(200));
  }

  // ==================== Tenant CRUD (Super Admin) ====================

  listTenants(status?: TenantStatus): Observable<Tenant[]> {
    let tenants = [...this.mockTenants];
    if (status) {
      tenants = tenants.filter(t => t.status === status);
    }
    this.tenantsSignal.set(tenants);
    return of(tenants).pipe(delay(300));
  }

  getTenant(id: string): Observable<Tenant | undefined> {
    const tenant = this.mockTenants.find(t => t.id === id);
    return of(tenant).pipe(delay(300));
  }

  createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Observable<Tenant> {
    const newTenant: Tenant = {
      ...tenant,
      id: `tenant-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockTenants.push(newTenant);
    this.tenantsSignal.set([...this.mockTenants]);
    return of(newTenant).pipe(delay(500));
  }

  updateTenant(id: string, updates: Partial<Tenant>): Observable<Tenant> {
    const tenant = this.mockTenants.find(t => t.id === id);
    if (tenant) {
      Object.assign(tenant, updates, { updatedAt: new Date() });
      this.tenantsSignal.set([...this.mockTenants]);

      if (id === this.currentTenantId()) {
        this.currentTenantSignal.set(tenant);
      }
    }
    return of(tenant!).pipe(delay(500));
  }

  suspendTenant(id: string, reason: string): Observable<Tenant> {
    const tenant = this.mockTenants.find(t => t.id === id);
    if (tenant) {
      tenant.status = TenantStatus.SUSPENDED;
      tenant.suspendedAt = new Date();
      tenant.suspensionReason = reason;
      tenant.updatedAt = new Date();
      this.tenantsSignal.set([...this.mockTenants]);
    }
    return of(tenant!).pipe(delay(500));
  }

  activateTenant(id: string): Observable<Tenant> {
    const tenant = this.mockTenants.find(t => t.id === id);
    if (tenant) {
      tenant.status = TenantStatus.ACTIVE;
      tenant.suspendedAt = undefined;
      tenant.suspensionReason = undefined;
      tenant.updatedAt = new Date();
      this.tenantsSignal.set([...this.mockTenants]);
    }
    return of(tenant!).pipe(delay(500));
  }

  // ==================== Tenant Settings (Tenant Admin) ====================

  updateTenantSettings(settings: Partial<TenantSettings>): Observable<Tenant> {
    const tenant = this.currentTenantSignal();
    if (tenant) {
      tenant.settings = { ...tenant.settings, ...settings };
      tenant.updatedAt = new Date();
      this.currentTenantSignal.set({ ...tenant });
    }
    return of(tenant!).pipe(delay(500));
  }

  updateTenantBranding(branding: Partial<TenantBranding>): Observable<Tenant> {
    const tenant = this.currentTenantSignal();
    if (tenant) {
      tenant.branding = { ...tenant.branding, ...branding };
      tenant.updatedAt = new Date();
      this.currentTenantSignal.set({ ...tenant });
    }
    return of(tenant!).pipe(delay(500));
  }

  updateTenantContact(contact: Partial<TenantContactInfo>): Observable<Tenant> {
    const tenant = this.currentTenantSignal();
    if (tenant) {
      tenant.contact = { ...tenant.contact, ...contact };
      tenant.updatedAt = new Date();
      this.currentTenantSignal.set({ ...tenant });
    }
    return of(tenant!).pipe(delay(500));
  }

  // ==================== Tenant Users ====================

  listTenantUsers(tenantId?: string): Observable<TenantUser[]> {
    const tid = tenantId || this.currentTenantId();
    const users = this.mockTenantUsers.filter(u => u.tenantId === tid);
    this.tenantUsersSignal.set(users);
    return of(users).pipe(delay(300));
  }

  inviteUser(email: string, role: TenantRole): Observable<TenantInvitation> {
    const invitation: TenantInvitation = {
      id: `inv-${Date.now()}`,
      tenantId: this.currentTenantId()!,
      tenantName: this.currentTenantName()!,
      email,
      role,
      invitedBy: 'current-user',
      invitedByName: 'Current User',
      status: 'pending',
      token: btoa(Math.random().toString()),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    };
    return of(invitation).pipe(delay(500));
  }

  updateUserRole(userId: string, role: TenantRole): Observable<TenantUser> {
    const user = this.mockTenantUsers.find(u => u.userId === userId && u.tenantId === this.currentTenantId());
    if (user) {
      user.role = role;
      user.updatedAt = new Date();
      this.tenantUsersSignal.set([...this.mockTenantUsers]);
    }
    return of(user!).pipe(delay(500));
  }

  removeUser(userId: string): Observable<void> {
    const index = this.mockTenantUsers.findIndex(u => u.userId === userId && u.tenantId === this.currentTenantId());
    if (index > -1) {
      this.mockTenantUsers.splice(index, 1);
      this.tenantUsersSignal.set([...this.mockTenantUsers]);
    }
    return of(void 0).pipe(delay(500));
  }

  // ==================== Tenant Stats ====================

  getTenantStats(tenantId?: string): Observable<TenantStats> {
    const stats: TenantStats = {
      totalUsers: this.mockTenantUsers.filter(u => u.tenantId === (tenantId || this.currentTenantId())).length,
      activeUsers: 3,
      totalEquipment: 156,
      totalInventoryItems: 1284,
      totalValue: 2450000,
      storageUsedBytes: 1024 * 1024 * 512,
      apiCallsThisMonth: 15420,
      lastActivityAt: new Date()
    };
    return of(stats).pipe(delay(300));
  }

  // ==================== Feature Checks ====================

  hasFeature(feature: keyof TenantFeatureFlags): boolean {
    const tenant = this.currentTenantSignal();
    if (!tenant) return false;

    const value = tenant.featureFlags[feature];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    if (Array.isArray(value)) return value.length > 0;
    return false;
  }

  getFeatureLimit(feature: keyof TenantFeatureFlags): number {
    const tenant = this.currentTenantSignal();
    if (!tenant) return 0;

    const value = tenant.featureFlags[feature];
    return typeof value === 'number' ? value : 0;
  }
}
