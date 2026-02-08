import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RippleModule } from 'primeng/ripple';
import { TenantService } from '@core/services/tenant.service';
import { BrandingService } from '@core/services/branding.service';
import { Tenant, TenantStatus } from '@shared/models';

@Component({
  selector: 'app-tenant-selector',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    AvatarModule,
    ProgressSpinnerModule,
    RippleModule
  ],
  template: `
    <div class="tenant-selector-container">
      <div class="tenant-selector-content">
        <div class="text-center mb-5">
          <img src="/assets/logo.svg" alt="GoEMR Inventory" class="logo mb-4" />
          <h1 class="text-3xl font-bold text-color mb-2">Welcome Back</h1>
          <p class="text-color-secondary">Select an organization to continue</p>
        </div>

        @if (loading()) {
          <div class="flex justify-content-center py-5">
            <p-progressSpinner strokeWidth="4" animationDuration="1s"></p-progressSpinner>
          </div>
        } @else {
          <div class="tenant-grid">
            @for (tenant of availableTenants(); track tenant.id) {
              <div
                class="tenant-card"
                [class.disabled]="tenant.status !== TenantStatus.ACTIVE"
                (click)="selectTenant(tenant)"
                pRipple
              >
                <div class="tenant-card-content">
                  <p-avatar
                    [label]="getTenantInitials(tenant)"
                    [style]="{ 'background-color': tenant.branding?.primaryColor || '#10b981', 'color': '#ffffff' }"
                    shape="circle"
                    size="xlarge"
                  ></p-avatar>

                  <div class="tenant-info mt-3">
                    <h3 class="text-lg font-semibold mb-1">{{ tenant.name }}</h3>
                    <p class="text-sm text-color-secondary mb-2">{{ getRoleLabel(tenant.id) }}</p>

                    @if (tenant.status !== TenantStatus.ACTIVE) {
                      <span class="status-badge" [class]="'status-' + tenant.status">
                        {{ getStatusLabel(tenant.status) }}
                      </span>
                    }
                  </div>

                  @if (tenant.branding?.logoUrl) {
                    <img
                      [src]="tenant.branding.logoUrl"
                      [alt]="tenant.name"
                      class="tenant-logo mt-3"
                    />
                  }
                </div>

                <div class="tenant-card-footer">
                  <span class="text-sm text-color-secondary">
                    {{ tenant.subscriptionPlan | titlecase }} Plan
                  </span>
                  <i class="pi pi-arrow-right"></i>
                </div>
              </div>
            }
          </div>

          @if (availableTenants().length === 0) {
            <div class="no-tenants text-center py-5">
              <i class="pi pi-building text-5xl text-color-secondary mb-3"></i>
              <h3 class="text-xl font-semibold mb-2">No Organizations Found</h3>
              <p class="text-color-secondary mb-4">
                You don't have access to any organizations yet.
              </p>
              <p-button
                label="Contact Support"
                icon="pi pi-envelope"
                (onClick)="contactSupport()"
              ></p-button>
            </div>
          }
        }

        <div class="text-center mt-5">
          <p-button
            label="Sign Out"
            icon="pi pi-sign-out"
            severity="secondary"
            [text]="true"
            (onClick)="signOut()"
          ></p-button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tenant-selector-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--surface-ground) 0%, var(--surface-section) 100%);
      padding: 2rem;
    }

    .tenant-selector-content {
      max-width: 800px;
      width: 100%;
    }

    .logo {
      height: 48px;
    }

    .tenant-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .tenant-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      overflow: hidden;

      &:hover:not(.disabled) {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        border-color: var(--primary-color);
      }

      &.disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .tenant-card-content {
      padding: 2rem;
      text-align: center;
    }

    .tenant-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: var(--surface-hover);
      border-top: 1px solid var(--surface-border);
    }

    .tenant-logo {
      max-height: 32px;
      max-width: 120px;
      object-fit: contain;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;

      &.status-suspended {
        background: var(--red-100);
        color: var(--red-700);
      }

      &.status-pending {
        background: var(--yellow-100);
        color: var(--yellow-700);
      }

      &.status-trial {
        background: var(--blue-100);
        color: var(--blue-700);
      }
    }

    .no-tenants {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 1rem;
      padding: 3rem;
    }
  `]
})
export class TenantSelectorComponent {
  private tenantService = inject(TenantService);
  private brandingService = inject(BrandingService);
  private router = inject(Router);

  loading = signal(false);
  availableTenants = this.tenantService.availableTenants;

  // Expose TenantStatus enum for template use
  readonly TenantStatus = TenantStatus;

  getTenantInitials(tenant: Tenant): string {
    return tenant.name.split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getRoleLabel(tenantId: string): string {
    const membership = this.tenantService.userMemberships()
      .find(m => m.tenantId === tenantId);

    if (!membership) return '';

    const roleLabels: Record<string, string> = {
      'super_admin': 'Super Admin',
      'tenant_admin': 'Administrator',
      'manager': 'Manager',
      'staff': 'Staff Member',
      'viewer': 'Viewer'
    };

    return roleLabels[membership.role] || membership.role;
  }

  getStatusLabel(status: TenantStatus): string {
    const labels: Record<TenantStatus, string> = {
      [TenantStatus.ACTIVE]: 'Active',
      [TenantStatus.SUSPENDED]: 'Suspended',
      [TenantStatus.PENDING]: 'Pending Approval',
      [TenantStatus.TRIAL]: 'Trial'
    };
    return labels[status] || status;
  }

  selectTenant(tenant: Tenant): void {
    if (tenant.status !== TenantStatus.ACTIVE && tenant.status !== TenantStatus.TRIAL) {
      return;
    }

    this.loading.set(true);

    this.tenantService.switchTenant(tenant.id).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Failed to select tenant:', err);
        this.loading.set(false);
      }
    });
  }

  signOut(): void {
    // Navigate to login - AuthService would handle actual logout
    this.router.navigate(['/auth/login']);
  }

  contactSupport(): void {
    window.location.href = 'mailto:support@goemr.com';
  }
}
