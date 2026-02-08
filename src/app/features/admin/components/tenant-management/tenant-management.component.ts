import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ChipModule } from 'primeng/chip';
import { ProgressBarModule } from 'primeng/progressbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { TenantService } from '@core/services/tenant.service';
import { Tenant, TenantStatus, SubscriptionPlan } from '@shared/models';

@Component({
  selector: 'app-tenant-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TableModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    AvatarModule,
    MenuModule,
    ToastModule,
    ConfirmDialogModule,
    ChipModule,
    ProgressBarModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="tenant-management-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-info">
            <div class="header-icon">
              <i class="pi pi-building"></i>
            </div>
            <div class="header-text">
              <h1>Manage Organizations</h1>
              <p>Administer all organizations in the platform</p>
            </div>
          </div>
          <div class="header-actions">
            <p-button
              label="Create Organization"
              icon="pi pi-plus"
              routerLink="/admin/tenants/new"
            ></p-button>
          </div>
        </div>
      </div>

      <div class="page-content">
        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon total">
              <i class="pi pi-building"></i>
            </div>
            <div class="stat-details">
              <span class="stat-value">{{ totalTenants() }}</span>
              <span class="stat-label">Total Organizations</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon active">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="stat-details">
              <span class="stat-value">{{ activeTenants() }}</span>
              <span class="stat-label">Active</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon trial">
              <i class="pi pi-star"></i>
            </div>
            <div class="stat-details">
              <span class="stat-value">{{ trialTenants() }}</span>
              <span class="stat-label">On Trial</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon suspended">
              <i class="pi pi-ban"></i>
            </div>
            <div class="stat-details">
              <span class="stat-value">{{ suspendedTenants() }}</span>
              <span class="stat-label">Suspended</span>
            </div>
          </div>
        </div>

        <!-- Plan Distribution -->
        <div class="plans-overview">
          <div class="plan-card basic">
            <div class="plan-header">
              <span class="plan-name">Basic</span>
              <span class="plan-count">{{ getPlanCount('basic') }}</span>
            </div>
            <div class="plan-bar">
              <div class="plan-fill" [style.width.%]="getPlanPercent('basic')"></div>
            </div>
          </div>

          <div class="plan-card professional">
            <div class="plan-header">
              <span class="plan-name">Professional</span>
              <span class="plan-count">{{ getPlanCount('professional') }}</span>
            </div>
            <div class="plan-bar">
              <div class="plan-fill" [style.width.%]="getPlanPercent('professional')"></div>
            </div>
          </div>

          <div class="plan-card enterprise">
            <div class="plan-header">
              <span class="plan-name">Enterprise</span>
              <span class="plan-count">{{ getPlanCount('enterprise') }}</span>
            </div>
            <div class="plan-bar">
              <div class="plan-fill" [style.width.%]="getPlanPercent('enterprise')"></div>
            </div>
          </div>
        </div>

        <!-- Organizations Section -->
        <div class="organizations-section">
          <div class="section-header">
            <h2>All Organizations</h2>
            <div class="section-controls">
              <p-iconField iconPosition="left" class="search-field">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input
                  pInputText
                  [(ngModel)]="searchQuery"
                  placeholder="Search organizations..."
                />
              </p-iconField>

              <p-select
                [(ngModel)]="statusFilter"
                [options]="statusOptions"
                placeholder="All Statuses"
                [showClear]="true"
                styleClass="status-filter"
              ></p-select>

              <p-select
                [(ngModel)]="planFilter"
                [options]="planOptions"
                placeholder="All Plans"
                [showClear]="true"
                styleClass="plan-filter"
              ></p-select>
            </div>
          </div>

          <!-- Organization Cards -->
          <div class="org-list">
            @for (tenant of filteredTenants(); track tenant.id) {
              <div class="org-card" [class.suspended]="tenant.status === TenantStatus.SUSPENDED">
                <div class="org-main">
                  <div class="org-avatar">
                    <p-avatar
                      [label]="getTenantInitials(tenant)"
                      [style]="{ 'background-color': tenant.branding?.primaryColor || '#10b981', 'color': '#ffffff' }"
                      shape="circle"
                      size="large"
                    ></p-avatar>
                    <span class="status-indicator" [class]="'status-' + tenant.status"></span>
                  </div>
                  <div class="org-info">
                    <div class="org-name">{{ tenant.name }}</div>
                    <div class="org-slug">{{ tenant.slug }}.goemr.com</div>
                  </div>
                </div>

                <div class="org-meta">
                  <div class="meta-item plan">
                    <span class="plan-badge" [class]="'plan-' + tenant.subscriptionPlan">
                      {{ tenant.subscriptionPlan | titlecase }}
                    </span>
                  </div>
                  <div class="meta-item status">
                    <span class="status-badge" [class]="'status-' + tenant.status">
                      {{ getStatusLabel(tenant.status) }}
                    </span>
                  </div>
                  <div class="meta-item users">
                    <i class="pi pi-users"></i>
                    <span>{{ tenant.featureFlags?.maxUsers || 0 }} users</span>
                  </div>
                  <div class="meta-item location">
                    <i class="pi pi-map-marker"></i>
                    <span>{{ tenant.contact?.city || 'N/A' }}, {{ tenant.contact?.state || '' }}</span>
                  </div>
                  <div class="meta-item created">
                    <i class="pi pi-calendar"></i>
                    <span>{{ formatDate(tenant.createdAt) }}</span>
                  </div>
                </div>

                <div class="org-actions">
                  <p-button
                    icon="pi pi-sign-in"
                    [rounded]="true"
                    [text]="true"
                    severity="secondary"
                    pTooltip="Switch to this organization"
                    tooltipPosition="top"
                    (onClick)="selectedTenant = tenant; switchToTenant()"
                  ></p-button>
                  <p-button
                    icon="pi pi-ellipsis-h"
                    [rounded]="true"
                    [text]="true"
                    severity="secondary"
                    (onClick)="tenantMenu.toggle($event); selectedTenant = tenant"
                  ></p-button>
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <div class="empty-icon">
                  <i class="pi pi-building"></i>
                </div>
                <h3>No organizations found</h3>
                <p>{{ searchQuery || statusFilter || planFilter ? 'Try adjusting your filters' : 'Create your first organization to get started' }}</p>
                @if (!searchQuery && !statusFilter && !planFilter) {
                  <p-button
                    label="Create Organization"
                    icon="pi pi-plus"
                    routerLink="/admin/tenants/new"
                  ></p-button>
                }
              </div>
            }
          </div>

          <!-- List Footer -->
          @if (filteredTenants().length > 0) {
            <div class="list-footer">
              <span class="org-count">Showing {{ filteredTenants().length }} of {{ totalTenants() }} organizations</span>
            </div>
          }
        </div>
      </div>

      <!-- Tenant Action Menu -->
      <p-menu #tenantMenu [model]="tenantMenuItems" [popup]="true" [appendTo]="'body'" styleClass="org-actions-menu"></p-menu>
    </div>
  `,
  styles: [`
    .tenant-management-page {
      min-height: 100%;
      background: var(--surface-ground);
    }

    /* Page Header */
    .page-header {
      background: var(--surface-card);
      border-bottom: 1px solid var(--border-color);
      padding: 1.5rem 2rem;
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      width: 56px;
      height: 56px;
      border-radius: 1rem;
      background: linear-gradient(135deg, var(--purple-100) 0%, var(--purple-50) 100%);
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 1.5rem;
        color: var(--purple-600);
      }
    }

    .header-text {
      h1 {
        margin: 0 0 0.25rem 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.9375rem;
      }
    }

    /* Page Content */
    .page-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.5rem 2rem;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: 0.75rem;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.2s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        transform: translateY(-2px);
      }
    }

    .stat-icon {
      width: 52px;
      height: 52px;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i {
        font-size: 1.25rem;
      }

      &.total {
        background: var(--purple-50);
        i { color: var(--purple-600); }
      }

      &.active {
        background: var(--green-50);
        i { color: var(--green-600); }
      }

      &.trial {
        background: var(--blue-50);
        i { color: var(--blue-600); }
      }

      &.suspended {
        background: var(--alert-50);
        i { color: var(--alert-600); }
      }
    }

    .stat-details {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .stat-label {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      margin-top: 0.125rem;
    }

    /* Plans Overview */
    .plans-overview {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .plan-card {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: 0.75rem;
      padding: 1rem 1.25rem;

      .plan-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
      }

      .plan-name {
        font-weight: 600;
        color: var(--text-primary);
      }

      .plan-count {
        font-size: 1.25rem;
        font-weight: 700;
      }

      .plan-bar {
        height: 8px;
        background: var(--surface-200);
        border-radius: 4px;
        overflow: hidden;
      }

      .plan-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      &.basic {
        .plan-count { color: var(--gray-600); }
        .plan-fill { background: var(--gray-400); }
      }

      &.professional {
        .plan-count { color: var(--blue-600); }
        .plan-fill { background: var(--blue-500); }
      }

      &.enterprise {
        .plan-count { color: var(--purple-600); }
        .plan-fill { background: var(--purple-500); }
      }
    }

    /* Organizations Section */
    .organizations-section {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: 0.75rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      flex-wrap: wrap;
      gap: 1rem;

      h2 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .section-controls {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .search-field {
      :host ::ng-deep input {
        width: 280px;
      }
    }

    :host ::ng-deep .status-filter,
    :host ::ng-deep .plan-filter {
      width: 140px;
    }

    /* Organization List */
    .org-list {
      padding: 0.5rem;
    }

    .org-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-radius: 0.5rem;
      transition: background 0.15s;

      &:hover {
        background: var(--surface-hover);
      }

      &.suspended {
        opacity: 0.7;
      }
    }

    .org-main {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      flex: 1;
      min-width: 0;
      max-width: 280px;
    }

    .org-avatar {
      position: relative;
      flex-shrink: 0;
    }

    .status-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid var(--surface-card);

      &.status-active { background: var(--green-500); }
      &.status-trial { background: var(--blue-500); }
      &.status-pending { background: var(--warning-500); }
      &.status-suspended { background: var(--alert-500); }
    }

    .org-info {
      min-width: 0;
    }

    .org-name {
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .org-slug {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .org-meta {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex: 2;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      &.users, &.location, &.created {
        font-size: 0.8125rem;
        color: var(--text-secondary);
        min-width: 100px;

        i {
          font-size: 0.75rem;
        }
      }

      &.location {
        min-width: 140px;
      }
    }

    .plan-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;

      &.plan-basic {
        background: var(--gray-100);
        color: var(--gray-700);
      }

      &.plan-professional {
        background: var(--blue-100);
        color: var(--blue-700);
      }

      &.plan-enterprise {
        background: var(--purple-100);
        color: var(--purple-700);
      }
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;

      &.status-active {
        background: var(--green-100);
        color: var(--green-700);
      }

      &.status-trial {
        background: var(--blue-100);
        color: var(--blue-700);
      }

      &.status-pending {
        background: var(--warning-100);
        color: var(--warning-700);
      }

      &.status-suspended {
        background: var(--alert-100);
        color: var(--alert-700);
      }
    }

    .org-actions {
      flex-shrink: 0;
      display: flex;
      gap: 0.25rem;
    }

    /* Empty State */
    .empty-state {
      padding: 4rem 2rem;
      text-align: center;
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--surface-ground);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;

      i {
        font-size: 2rem;
        color: var(--text-secondary);
      }
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .empty-state p {
      margin: 0 0 1.5rem 0;
      color: var(--text-secondary);
    }

    .list-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .org-count {
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }

    /* Menu */
    :host ::ng-deep .org-actions-menu {
      min-width: 180px;

      .p-menuitem-link {
        padding: 0.75rem 1rem;
      }
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .plans-overview {
        grid-template-columns: repeat(3, 1fr);
      }

      .org-meta {
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .meta-item.location,
      .meta-item.created {
        display: none;
      }
    }

    @media (max-width: 992px) {
      .org-card {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
        position: relative;
      }

      .org-main {
        max-width: 100%;
      }

      .org-meta {
        width: 100%;
        justify-content: flex-start;
      }

      .org-actions {
        position: absolute;
        top: 1rem;
        right: 1rem;
      }

      .meta-item.location,
      .meta-item.created {
        display: flex;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .header-actions {
        width: 100%;

        :host ::ng-deep .p-button {
          width: 100%;
        }
      }

      .page-content {
        padding: 1rem;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
      }

      .stat-card {
        padding: 1rem;
      }

      .stat-icon {
        width: 44px;
        height: 44px;
      }

      .stat-value {
        font-size: 1.25rem;
      }

      .plans-overview {
        grid-template-columns: 1fr;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .section-controls {
        width: 100%;
        flex-direction: column;
      }

      .search-field {
        width: 100%;

        :host ::ng-deep input {
          width: 100%;
        }
      }

      :host ::ng-deep .status-filter,
      :host ::ng-deep .plan-filter {
        width: 100%;
      }
    }
  `]
})
export class TenantManagementComponent implements OnInit {
  private tenantService = inject(TenantService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  // Expose enum for template
  readonly TenantStatus = TenantStatus;

  tenants = signal<Tenant[]>([]);
  loading = signal(false);

  searchQuery = '';
  statusFilter: TenantStatus | null = null;
  planFilter: SubscriptionPlan | null = null;
  selectedTenant: Tenant | null = null;

  statusOptions = [
    { label: 'Active', value: TenantStatus.ACTIVE },
    { label: 'Trial', value: TenantStatus.TRIAL },
    { label: 'Pending', value: TenantStatus.PENDING },
    { label: 'Suspended', value: TenantStatus.SUSPENDED }
  ];

  planOptions = [
    { label: 'Basic', value: SubscriptionPlan.BASIC },
    { label: 'Professional', value: SubscriptionPlan.PROFESSIONAL },
    { label: 'Enterprise', value: SubscriptionPlan.ENTERPRISE }
  ];

  tenantMenuItems: MenuItem[] = [
    {
      label: 'View Details',
      icon: 'pi pi-eye',
      command: () => this.viewTenant()
    },
    {
      label: 'Edit',
      icon: 'pi pi-pencil',
      command: () => this.editTenant()
    },
    {
      label: 'Switch To',
      icon: 'pi pi-sign-in',
      command: () => this.switchToTenant()
    },
    { separator: true },
    {
      label: 'Suspend',
      icon: 'pi pi-ban',
      command: () => this.confirmSuspend()
    },
    {
      label: 'Activate',
      icon: 'pi pi-check',
      command: () => this.activateTenant()
    }
  ];

  totalTenants = computed(() => this.tenants().length);
  activeTenants = computed(() => this.tenants().filter(t => t.status === TenantStatus.ACTIVE).length);
  trialTenants = computed(() => this.tenants().filter(t => t.status === TenantStatus.TRIAL).length);
  suspendedTenants = computed(() => this.tenants().filter(t => t.status === TenantStatus.SUSPENDED).length);

  filteredTenants = computed(() => {
    let result = this.tenants();

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.slug.toLowerCase().includes(query)
      );
    }

    if (this.statusFilter) {
      result = result.filter(t => t.status === this.statusFilter);
    }

    if (this.planFilter) {
      result = result.filter(t => t.subscriptionPlan === this.planFilter);
    }

    return result;
  });

  ngOnInit(): void {
    this.loadTenants();
  }

  private loadTenants(): void {
    this.loading.set(true);
    this.tenantService.listTenants().subscribe({
      next: (tenants) => {
        this.tenants.set(tenants);
        this.loading.set(false);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load organizations'
        });
        this.loading.set(false);
      }
    });
  }

  getTenantInitials(tenant: Tenant): string {
    return tenant.name.split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getStatusLabel(status: TenantStatus): string {
    const labels: Record<TenantStatus, string> = {
      [TenantStatus.ACTIVE]: 'Active',
      [TenantStatus.SUSPENDED]: 'Suspended',
      [TenantStatus.PENDING]: 'Pending',
      [TenantStatus.TRIAL]: 'Trial'
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: TenantStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<TenantStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      [TenantStatus.ACTIVE]: 'success',
      [TenantStatus.TRIAL]: 'info',
      [TenantStatus.PENDING]: 'warn',
      [TenantStatus.SUSPENDED]: 'danger'
    };
    return severities[status] || 'secondary';
  }

  getPlanCount(plan: string): number {
    return this.tenants().filter(t => t.subscriptionPlan === plan).length;
  }

  getPlanPercent(plan: string): number {
    const total = this.tenants().length;
    if (total === 0) return 0;
    return (this.getPlanCount(plan) / total) * 100;
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  viewTenant(): void {
    if (this.selectedTenant) {
      this.router.navigate(['/admin/tenants', this.selectedTenant.id]);
    }
  }

  editTenant(): void {
    if (this.selectedTenant) {
      this.router.navigate(['/admin/tenants', this.selectedTenant.id, 'edit']);
    }
  }

  switchToTenant(): void {
    if (!this.selectedTenant) return;

    this.tenantService.switchTenant(this.selectedTenant.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Switched',
          detail: `Now viewing ${this.selectedTenant!.name}`
        });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to switch organization'
        });
      }
    });
  }

  confirmSuspend(): void {
    if (!this.selectedTenant) return;

    this.confirmationService.confirm({
      message: `Are you sure you want to suspend ${this.selectedTenant.name}? Users will lose access immediately.`,
      header: 'Suspend Organization',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.suspendTenant();
      }
    });
  }

  private suspendTenant(): void {
    if (!this.selectedTenant) return;

    this.tenantService.suspendTenant(this.selectedTenant.id, 'Admin action').subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Suspended',
          detail: `${this.selectedTenant!.name} has been suspended`
        });
        this.loadTenants();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to suspend organization'
        });
      }
    });
  }

  activateTenant(): void {
    if (!this.selectedTenant) return;

    this.tenantService.activateTenant(this.selectedTenant.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Activated',
          detail: `${this.selectedTenant!.name} has been activated`
        });
        this.loadTenants();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to activate organization'
        });
      }
    });
  }
}
