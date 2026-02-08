import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { PopoverModule } from 'primeng/popover';
import { DividerModule } from 'primeng/divider';
import { TenantService } from '@core/services/tenant.service';
import { BrandingService } from '@core/services/branding.service';
import { Tenant } from '@shared/models';

@Component({
  selector: 'app-tenant-switcher',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    AvatarModule,
    BadgeModule,
    TooltipModule,
    RippleModule,
    PopoverModule,
    DividerModule
  ],
  template: `
    <div class="tenant-switcher">
      <button
        pButton
        pRipple
        type="button"
        class="p-button-text tenant-button"
        (click)="op.toggle($event)"
        [pTooltip]="currentTenant()?.name || 'Select Organization'"
        tooltipPosition="bottom"
      >
        <p-avatar
          [label]="tenantInitials()"
          [style]="{ 'background-color': currentTenant()?.branding?.primaryColor || '#10b981', 'color': '#ffffff' }"
          shape="circle"
          size="normal"
        ></p-avatar>
        <span class="tenant-name ml-2 hidden md:inline">{{ currentTenant()?.name || 'Select Organization' }}</span>
        <i class="pi pi-chevron-down ml-2 text-sm"></i>
      </button>

      <p-popover #op styleClass="tenant-overlay-panel">
        <div class="tenant-panel">
          <!-- Tenant List -->
          @if (hasMultipleTenants()) {
            <div class="panel-section">
              <div class="section-header">Switch Organization</div>
              @for (tenant of availableTenants(); track tenant.id) {
                <div class="tenant-item"
                     [class.active]="tenant.id === currentTenant()?.id"
                     (click)="switchToTenant(tenant.id); op.hide()">
                  <p-avatar
                    [label]="getTenantInitials(tenant)"
                    [style]="{ 'background-color': tenant.branding?.primaryColor || '#10b981', 'color': '#ffffff' }"
                    shape="circle"
                    size="normal"
                  ></p-avatar>
                  <div class="tenant-info">
                    <div class="tenant-label">{{ tenant.name }}</div>
                    <div class="tenant-role">{{ getTenantRole(tenant.id) }}</div>
                  </div>
                  @if (tenant.id === currentTenant()?.id) {
                    <i class="pi pi-check check-icon"></i>
                  }
                </div>
              }
            </div>
            <p-divider></p-divider>
          }

          <!-- Settings Links -->
          @if (isTenantAdmin()) {
            <div class="panel-section">
              <a class="menu-link" routerLink="/tenant/settings" (click)="op.hide()">
                <i class="pi pi-cog"></i>
                <span>Organization Settings</span>
              </a>
              <a class="menu-link" routerLink="/tenant/users" (click)="op.hide()">
                <i class="pi pi-users"></i>
                <span>User Management</span>
              </a>
            </div>
          }

          <!-- Super Admin Links -->
          @if (isSuperAdmin()) {
            <p-divider></p-divider>
            <div class="panel-section">
              <a class="menu-link" routerLink="/admin/tenants" (click)="op.hide()">
                <i class="pi pi-building"></i>
                <span>Manage All Organizations</span>
              </a>
            </div>
          }
        </div>
      </p-popover>
    </div>
  `,
  styles: [`
    .tenant-switcher {
      display: flex;
      align-items: center;
    }

    .tenant-button {
      display: flex;
      align-items: center;
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      background: transparent;
      border: 1px solid var(--border-color);
      transition: all 0.2s;

      &:hover {
        background: var(--surface-hover);
        border-color: var(--primary-500);
      }
    }

    .tenant-name {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 500;
    }

    :host ::ng-deep .tenant-overlay-panel {
      min-width: 280px;
      max-width: 320px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);

      .p-overlaypanel-content {
        padding: 0;
        background: var(--bg-card);
      }
    }

    .tenant-panel {
      padding: 0.5rem 0;
    }

    .panel-section {
      padding: 0.25rem 0;
    }

    .section-header {
      padding: 0.5rem 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }

    .tenant-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: var(--bg-hover);
      }

      &.active {
        background: rgba(16, 185, 129, 0.15);
      }
    }

    .tenant-info {
      flex: 1;
      min-width: 0;
    }

    .tenant-label {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-primary);
    }

    .tenant-role {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .check-icon {
      color: var(--primary-500);
      font-size: 0.875rem;
    }

    .menu-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: var(--text-primary);
      text-decoration: none;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: var(--bg-hover);
      }

      i {
        font-size: 1rem;
        color: var(--text-muted);
      }
    }

    :host ::ng-deep p-divider {
      .p-divider {
        margin: 0.25rem 0;
      }
    }
  `]
})
export class TenantSwitcherComponent {
  private tenantService = inject(TenantService);
  private brandingService = inject(BrandingService);
  private router = inject(Router);

  currentTenant = this.tenantService.currentTenant;
  availableTenants = this.tenantService.availableTenants;
  hasMultipleTenants = this.tenantService.hasMultipleTenants;
  isTenantAdmin = this.tenantService.isTenantAdmin;
  isSuperAdmin = this.tenantService.isSuperAdmin;

  tenantInitials = computed(() => {
    const name = this.currentTenant()?.name || 'O';
    return name.split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  });

  getTenantInitials(tenant: Tenant): string {
    return tenant.name.split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getTenantRole(tenantId: string): string {
    const membership = this.tenantService.userMemberships()
      .find(m => m.tenantId === tenantId);

    if (!membership) return '';

    const roleLabels: Record<string, string> = {
      'super_admin': 'Super Admin',
      'tenant_admin': 'Admin',
      'manager': 'Manager',
      'staff': 'Staff',
      'viewer': 'Viewer'
    };

    return roleLabels[membership.role] || membership.role;
  }

  switchToTenant(tenantId: string): void {
    if (tenantId === this.currentTenant()?.id) {
      return;
    }

    this.tenantService.switchTenant(tenantId).subscribe({
      next: () => {
        // Reload current route to refresh data with new tenant context
        const currentUrl = this.router.url;
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigateByUrl(currentUrl);
        });
      },
      error: (err) => {
        console.error('Failed to switch tenant:', err);
      }
    });
  }
}
