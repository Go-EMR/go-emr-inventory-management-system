import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { MenuModule } from 'primeng/menu';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';
import { MockDataService } from '@core/services/mock-data.service';
import { TenantService } from '@core/services/tenant.service';
import { TenantSwitcherComponent } from '@features/tenant/components/tenant-switcher/tenant-switcher.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ButtonModule,
    TooltipModule,
    BadgeModule,
    MenuModule,
    RippleModule,
    AvatarModule,
    TenantSwitcherComponent
  ],
  template: `
    <div class="layout-container" [class.sidebar-collapsed]="sidebarCollapsed()">
      <!-- Sidebar -->
      <aside class="sidebar">
        <!-- Logo -->
        <div class="sidebar-header">
          @if (!sidebarCollapsed()) {
            <div class="logo" [routerLink]="['/dashboard']">
              <div class="logo-icon">
                <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="32" height="32" rx="6" fill="currentColor" fill-opacity="0.15"/>
                  <path d="M18 8V28" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                  <path d="M8 18H28" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                  <path d="M10 21C10 21 13 15 18 15C23 15 26 21 26 21" stroke="#4ADE80" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="logo-text">
                <span class="logo-title">GoEMR</span>
                <span class="logo-subtitle">Inventory</span>
              </div>
            </div>
          }
          <button
            class="collapse-btn"
            (click)="toggleSidebar()"
            [pTooltip]="sidebarCollapsed() ? 'Expand Sidebar' : 'Collapse Sidebar'"
            tooltipPosition="right"
          >
            <i [class]="sidebarCollapsed() ? 'pi pi-angle-right' : 'pi pi-angle-left'"></i>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="sidebar-nav">
          <ul class="nav-list">
            @for (item of navItems; track item.route) {
              <li class="nav-item">
                <a 
                  [routerLink]="item.route"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' || item.route === '/vendors' }"
                  class="nav-link"
                  [pTooltip]="sidebarCollapsed() ? item.label : ''"
                  tooltipPosition="right"
                  pRipple
                >
                  <span class="nav-icon">
                    <i [class]="'pi ' + item.icon"></i>
                    @if (item.badge && item.badge > 0) {
                      <span class="nav-badge">{{ item.badge > 9 ? '9+' : item.badge }}</span>
                    }
                  </span>
                  @if (!sidebarCollapsed()) {
                    <span class="nav-label">{{ item.label }}</span>
                  }
                </a>
              </li>
            }
          </ul>
        </nav>

        <!-- User Profile Section -->
        <div class="sidebar-footer">
          @if (!sidebarCollapsed()) {
            <div class="user-info">
              <p-avatar 
                [label]="userInitials()" 
                styleClass="user-avatar"
                shape="circle"
              />
              <div class="user-details">
                <span class="user-name">{{ authService.userFullName() }}</span>
                <span class="user-role">{{ authService.user()?.role }}</span>
              </div>
            </div>
          } @else {
            <p-avatar 
              [label]="userInitials()" 
              styleClass="user-avatar collapsed"
              shape="circle"
              [pTooltip]="authService.userFullName()"
              tooltipPosition="right"
            />
          }
          <button 
            class="logout-btn"
            (click)="logout()"
            [pTooltip]="sidebarCollapsed() ? 'Logout' : ''"
            tooltipPosition="right"
            pRipple
          >
            <i class="pi pi-sign-out"></i>
            @if (!sidebarCollapsed()) {
              <span>Logout</span>
            }
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="main-wrapper">
        <!-- Top Header -->
        <header class="top-header">
          <div class="header-left">
            <button class="mobile-menu-btn" (click)="toggleMobileSidebar()">
              <i class="pi pi-bars"></i>
            </button>
            <div class="search-container">
              <i class="pi pi-search"></i>
              <input 
                type="text" 
                placeholder="Search equipment, inventory, vendors..."
                class="search-input"
              />
              <kbd class="search-shortcut">⌘K</kbd>
            </div>
          </div>
          
          <div class="header-right">
            <!-- Tenant Switcher -->
            <app-tenant-switcher></app-tenant-switcher>

            <!-- Theme Toggle -->
            <button
              class="header-btn"
              (click)="toggleTheme()"
              [pTooltip]="themeService.isDarkMode() ? 'Light Mode' : 'Dark Mode'"
              tooltipPosition="bottom"
            >
              <i [class]="themeService.isDarkMode() ? 'pi pi-sun' : 'pi pi-moon'"></i>
            </button>

            <!-- Notifications -->
            <button 
              class="header-btn notification-btn"
              pTooltip="Notifications"
              tooltipPosition="bottom"
            >
              <i class="pi pi-bell"></i>
              @if (unreadAlerts() > 0) {
                <span class="notification-badge">{{ unreadAlerts() > 9 ? '9+' : unreadAlerts() }}</span>
              }
            </button>

            <!-- Help -->
            <button 
              class="header-btn"
              pTooltip="Help"
              tooltipPosition="bottom"
            >
              <i class="pi pi-question-circle"></i>
            </button>
          </div>
        </header>

        <!-- Page Content -->
        <main class="main-content">
          <router-outlet />
        </main>
      </div>

      <!-- Mobile Sidebar Overlay -->
      @if (mobileSidebarOpen()) {
        <div class="sidebar-overlay" (click)="toggleMobileSidebar()"></div>
      }
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      min-height: 100vh;
      background: var(--bg-secondary);
    }

    /* ===== SIDEBAR ===== */
    .sidebar {
      width: 260px;
      height: 100vh;
      position: fixed;
      left: 0;
      top: 0;
      background: var(--bg-card);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      z-index: var(--z-fixed);
      transition: width var(--transition-base);
    }

    .sidebar-collapsed .sidebar {
      width: 72px;
    }

    /* Sidebar Header */
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem;
      border-bottom: 1px solid var(--border-color);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      text-decoration: none;
    }

    .logo-icon {
      width: 36px;
      height: 36px;
      flex-shrink: 0;
      
      svg {
        width: 100%;
        height: 100%;
        color: var(--primary-600);
      }
    }

    .logo-text {
      display: flex;
      flex-direction: column;
      
      .logo-title {
        font-family: var(--font-display);
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.2;
      }
      
      .logo-subtitle {
        font-size: 0.6875rem;
        font-weight: 500;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    .collapse-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all var(--transition-fast);
      
      i {
        font-size: 0.875rem;
        color: var(--text-muted);
      }
      
      &:hover {
        background: var(--bg-hover);
        border-color: var(--primary-500);

        i {
          color: var(--primary-600);
        }
      }
    }

    .sidebar-collapsed .sidebar-header {
      justify-content: center;
    }

    /* Navigation */
    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.75rem;
      overflow-y: auto;
    }

    .nav-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      text-decoration: none;
      color: var(--text-secondary);
      transition: all var(--transition-fast);
      
      &:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
      }
      
      &.active {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
        color: var(--primary-600);
        
        .nav-icon i {
          color: var(--primary-600);
        }
      }
    }

    .nav-icon {
      position: relative;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      i {
        font-size: 1.125rem;
      }
    }

    .nav-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      font-size: 0.625rem;
      font-weight: 600;
      color: white;
      background: var(--alert-500);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-label {
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .sidebar-collapsed .nav-link {
      justify-content: center;
      padding: 0.75rem;
    }

    /* Sidebar Footer */
    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    :host ::ng-deep .user-avatar {
      background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
      width: 40px;
      height: 40px;
      
      &.collapsed {
        margin: 0 auto;
      }
    }

    .user-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
      
      .user-name {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .user-role {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    .logout-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
      
      i {
        font-size: 1rem;
      }
      
      &:hover {
        background: rgba(244, 63, 94, 0.1);
        border-color: var(--alert-500);
        color: var(--alert-600);
      }
    }

    .sidebar-collapsed .logout-btn {
      padding: 0.625rem;
      
      span {
        display: none;
      }
    }

    /* ===== MAIN CONTENT ===== */
    .main-wrapper {
      flex: 1;
      margin-left: 260px;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      min-width: 0;
      overflow-x: hidden;
      transition: margin-left var(--transition-base);
    }

    .sidebar-collapsed .main-wrapper {
      margin-left: 72px;
    }

    /* Top Header */
    .top-header {
      height: 64px;
      padding: 0 1.5rem;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      position: sticky;
      top: 0;
      z-index: var(--z-sticky);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .mobile-menu-btn {
      display: none;
      width: 40px;
      height: 40px;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      cursor: pointer;
      
      i {
        font-size: 1.25rem;
        color: var(--text-secondary);
      }
    }

    .search-container {
      position: relative;
      flex: 1;
      max-width: 480px;
      
      i {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
      }
    }

    .search-input {
      width: 100%;
      padding: 0.625rem 1rem 0.625rem 2.75rem;
      font-size: 0.875rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      transition: all var(--transition-fast);
      
      &::placeholder {
        color: var(--text-muted);
      }
      
      &:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
      }
    }

    .search-shortcut {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      font-family: var(--font-body);
      color: var(--text-muted);
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .header-btn {
      position: relative;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-fast);
      
      i {
        font-size: 1.125rem;
        color: var(--text-secondary);
      }
      
      &:hover {
        background: var(--bg-secondary);
        border-color: var(--border-color);
        
        i {
          color: var(--text-primary);
        }
      }
    }

    .notification-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      font-size: 0.625rem;
      font-weight: 600;
      color: white;
      background: var(--alert-500);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      padding: 1.5rem;
    }

    /* Mobile Styles */
    .sidebar-overlay {
      display: none;
    }

    @media (max-width: 1024px) {
      .sidebar {
        transform: translateX(-100%);
      }
      
      .sidebar-collapsed .sidebar {
        width: 260px;
      }
      
      .layout-container.mobile-sidebar-open .sidebar {
        transform: translateX(0);
      }
      
      .main-wrapper {
        margin-left: 0;
      }
      
      .sidebar-collapsed .main-wrapper {
        margin-left: 0;
      }
      
      .mobile-menu-btn {
        display: flex;
      }
      
      .sidebar-overlay {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: calc(var(--z-fixed) - 1);
      }
      
      .search-shortcut {
        display: none;
      }
    }

    @media (max-width: 640px) {
      .top-header {
        padding: 0 1rem;
      }
      
      .main-content {
        padding: 1rem;
      }
      
      .search-container {
        display: none;
      }
    }
  `]
})
export class MainLayoutComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  mockDataService = inject(MockDataService);
  tenantService = inject(TenantService);

  sidebarCollapsed = signal(false);
  mobileSidebarOpen = signal(false);

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'pi-home', route: '/dashboard' },
    { label: 'Help Desk', icon: 'pi-ticket', route: '/helpdesk' },
    { label: 'Depreciation', icon: 'pi-chart-line', route: '/depreciation' },
    { label: 'Equipment', icon: 'pi-box', route: '/equipment' },
    { label: 'Inventory', icon: 'pi-database', route: '/inventory' },
    { label: 'Lot Barcodes', icon: 'pi-qrcode', route: '/lot-barcodes' },
    { label: 'Discards', icon: 'pi-trash', route: '/discards' },
    { label: 'Checkouts', icon: 'pi-sign-out', route: '/checkouts' },
    { label: 'Shipments', icon: 'pi-truck', route: '/shipments' },
    { label: 'Returns', icon: 'pi-replay', route: '/returns' },
    { label: 'Pick Lists', icon: 'pi-list-check', route: '/pick-lists' },
    { label: 'Kits', icon: 'pi-objects-column', route: '/kits' },
    { label: 'Purchase Orders', icon: 'pi-shopping-cart', route: '/purchase-orders' },
    { label: 'Scanning', icon: 'pi-barcode', route: '/scanning' },
    { label: 'Labels', icon: 'pi-tag', route: '/labels' },
    { label: 'Alerts', icon: 'pi-bell', route: '/alerts' },
    { label: 'Tags', icon: 'pi-hashtag', route: '/tags' },
    { label: 'Maintenance', icon: 'pi-wrench', route: '/maintenance' },
    { label: 'Vendors', icon: 'pi-building', route: '/vendors' },
    { label: 'Vendor Performance', icon: 'pi-chart-line', route: '/vendors/performance' },
    { label: 'Import/Export', icon: 'pi-upload', route: '/import-export' },
    { label: 'Reports', icon: 'pi-chart-bar', route: '/reports' },
    { label: 'Integrations', icon: 'pi-link', route: '/integrations' },
    { label: 'Compliance', icon: 'pi-shield', route: '/compliance' },
    { label: 'Audit Trail', icon: 'pi-history', route: '/audit-trail' }
  ];

  unreadAlerts = computed(() => 
    this.mockDataService.alerts().filter(a => !a.isRead).length
  );

  userInitials = computed(() => {
    const user = this.authService.user();
    if (!user) return '';
    return `${user.firstName[0]}${user.lastName[0]}`;
  });

  // Update nav items with badges
  constructor() {
    // This would typically be done with computed properties
    const stats = this.mockDataService.dashboardStats();
    this.navItems = this.navItems.map(item => {
      if (item.route === '/maintenance') {
        return { ...item, badge: stats.overdueMaintenances };
      }
      if (item.route === '/inventory') {
        return { ...item, badge: stats.lowStockItems };
      }
      return item;
    });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update(v => !v);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.authService.logout();
  }
}
