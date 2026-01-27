import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { RatingModule } from 'primeng/rating';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AvatarModule } from 'primeng/avatar';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MockDataService } from '@core/services/mock-data.service';
import { AuthService } from '@core/services/auth.service';
import { Vendor, VendorCategory, UserRole } from '@shared/models';

@Component({
  selector: 'app-vendor-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TooltipModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    RatingModule,
    IconFieldModule,
    InputIconModule,
    AvatarModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="vendor-page">
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1>Vendor Directory</h1>
            <p>Manage equipment manufacturers, suppliers, and service providers</p>
          </div>
          <div class="header-actions">
            @if (authService.hasAnyRole([UserRole.ADMIN, UserRole.MANAGER])) {
              <button pButton label="Export" icon="pi pi-download" class="p-button-outlined"></button>
              <button pButton label="Add Vendor" icon="pi pi-plus" class="p-button-primary" (click)="showAddDialog = true"></button>
            }
          </div>
        </div>

        <!-- Stats Summary -->
        <div class="stats-row">
          <div class="stat-pill">
            <span class="stat-value">{{ vendors().length }}</span>
            <span class="stat-label">Total Vendors</span>
          </div>
          <div class="stat-pill stat-pill--success">
            <span class="stat-value">{{ activeCount() }}</span>
            <span class="stat-label">Active</span>
          </div>
          <div class="stat-pill stat-pill--danger">
            <span class="stat-value">{{ inactiveCount() }}</span>
            <span class="stat-label">Inactive</span>
          </div>
          <div class="stat-pill stat-pill--info">
            <span class="stat-value">{{ expiringCount() }}</span>
            <span class="stat-label">Contracts Expiring</span>
          </div>
          <div class="stat-pill stat-pill--warning">
            <span class="stat-value">{{ averageRating().toFixed(1) }}</span>
            <span class="stat-label">Avg Rating</span>
          </div>
        </div>
      </header>

      <!-- Filters Bar -->
      <div class="filters-bar">
        <div class="filters-left">
          <p-iconfield>
            <p-inputicon styleClass="pi pi-search"></p-inputicon>
            <input 
              type="text" 
              pInputText 
              placeholder="Search vendors..." 
              [(ngModel)]="searchQuery"
              class="search-input" />
          </p-iconfield>
        </div>
        
        <div class="filters-right">
          <p-select 
            [options]="categoryOptions" 
            [(ngModel)]="selectedCategory" 
            placeholder="Category"
            [showClear]="true">
          </p-select>

          <p-select 
            [options]="statusOptions" 
            [(ngModel)]="selectedStatus" 
            placeholder="Status"
            [showClear]="true">
          </p-select>

          <button 
            pButton 
            icon="pi pi-filter-slash" 
            class="p-button-outlined p-button-secondary"
            pTooltip="Clear filters"
            (click)="clearFilters()">
          </button>
        </div>
      </div>

      <!-- Vendor Cards Grid -->
      <div class="vendor-grid">
        @for (vendor of filteredVendors(); track vendor.id) {
          <div class="vendor-card" [class.inactive]="!vendor.isActive">
            <div class="vendor-header">
              <p-avatar 
                [label]="getInitials(vendor.name)" 
                size="large" 
                [style]="{ 'background-color': getAvatarColor(vendor.category), 'color': 'white' }">
              </p-avatar>
              <div class="vendor-title">
                <h3>{{ vendor.name }}</h3>
                <p-tag [value]="vendor.category" [severity]="getCategorySeverity(vendor.category)" [rounded]="true"></p-tag>
              </div>
              <div class="vendor-status">
                @if (vendor.isActive) {
                  <span class="status-dot active"></span>
                  <span class="status-text">Active</span>
                } @else {
                  <span class="status-dot inactive"></span>
                  <span class="status-text">Inactive</span>
                }
              </div>
            </div>

            <div class="vendor-rating">
              <p-rating [(ngModel)]="vendor.rating" [readonly]="true" ></p-rating>
              <span class="rating-value">{{ vendor.rating }}</span>
            </div>

            <div class="vendor-info">
              <div class="info-row">
                <i class="pi pi-user"></i>
                <span>{{ vendor.contactPerson }}</span>
              </div>
              <div class="info-row">
                <i class="pi pi-envelope"></i>
                <a [href]="'mailto:' + vendor.email">{{ vendor.email }}</a>
              </div>
              <div class="info-row">
                <i class="pi pi-phone"></i>
                <span>{{ vendor.phone }}</span>
              </div>
              <div class="info-row">
                <i class="pi pi-map-marker"></i>
                <span>{{ vendor.city }}, {{ vendor.country }}</span>
              </div>
            </div>

            @if (vendor.contractEndDate) {
              <div class="contract-info" [class.expiring]="isContractExpiring(vendor)">
                <div class="contract-label">
                  <i class="pi pi-file"></i>
                  Contract
                </div>
                <div class="contract-dates">
                  <span>{{ formatDate(vendor.contractStartDate) }} - {{ formatDate(vendor.contractEndDate) }}</span>
                  @if (isContractExpiring(vendor)) {
                    <p-tag value="Expiring Soon" severity="warn" [rounded]="true"></p-tag>
                  }
                </div>
              </div>
            }

            @if (vendor.paymentTerms) {
              <div class="payment-terms">
                <i class="pi pi-credit-card"></i>
                <span>{{ vendor.paymentTerms }}</span>
              </div>
            }

            <div class="vendor-actions">
              <button 
                pButton 
                icon="pi pi-eye" 
                label="View"
                class="p-button-outlined p-button-sm"
                (click)="viewVendor(vendor)">
              </button>
              @if (authService.hasAnyRole([UserRole.ADMIN, UserRole.MANAGER])) {
                <button 
                  pButton 
                  icon="pi pi-pencil" 
                  label="Edit"
                  class="p-button-outlined p-button-sm"
                  (click)="editVendor(vendor)">
                </button>
              }
              @if (authService.hasRole(UserRole.ADMIN)) {
                <button 
                  pButton 
                  icon="pi pi-trash" 
                  class="p-button-outlined p-button-sm p-button-danger"
                  pTooltip="Delete"
                  (click)="confirmDelete(vendor)">
                </button>
              }
            </div>
          </div>
        }

        @if (filteredVendors().length === 0) {
          <div class="empty-state">
            <i class="pi pi-building"></i>
            <h3>No vendors found</h3>
            <p>Try adjusting your search or filter criteria</p>
            <button pButton label="Clear Filters" icon="pi pi-filter-slash" class="p-button-outlined" (click)="clearFilters()"></button>
          </div>
        }
      </div>

      <!-- Contract Expiring Alert -->
      @if (expiringVendors().length > 0) {
        <div class="alert-panel">
          <div class="alert-header">
            <i class="pi pi-clock"></i>
            <h3>Contracts Expiring Soon</h3>
            <span class="alert-count">{{ expiringVendors().length }} contracts need renewal</span>
          </div>
          <div class="alert-items">
            @for (vendor of expiringVendors(); track vendor.id) {
              <div class="alert-item">
                <div class="alert-item-info">
                  <span class="alert-item-name">{{ vendor.name }}</span>
                  <span class="alert-item-detail">{{ vendor.category }}</span>
                  <span class="alert-item-date">Expires: {{ formatDate(vendor.contractEndDate) }}</span>
                </div>
                <button pButton label="Renew Contract" icon="pi pi-refresh" class="p-button-sm p-button-outlined" (click)="renewContract(vendor)"></button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Add/Edit Dialog -->
      <p-dialog 
        [(visible)]="showAddDialog" 
        [header]="selectedVendor ? 'Edit Vendor' : 'Add Vendor'"
        [modal]="true"
        [style]="{ width: '600px' }"
        [draggable]="false"
        [resizable]="false">
        <div class="dialog-content">
          <p class="dialog-placeholder">Vendor form would include: Company Name, Contact Person, Email, Phone, Address, City, Country, Category, Rating, Contract Dates, Payment Terms, Notes, etc.</p>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="showAddDialog = false"></button>
          <button pButton label="Save" icon="pi pi-check" (click)="saveVendor()"></button>
        </ng-template>
      </p-dialog>

      <!-- View Dialog -->
      <p-dialog 
        [(visible)]="showViewDialog" 
        header="Vendor Details"
        [modal]="true"
        [style]="{ width: '700px' }"
        [draggable]="false"
        [resizable]="false">
        @if (selectedVendor) {
          <div class="view-content">
            <div class="view-header">
              <p-avatar 
                [label]="getInitials(selectedVendor.name)" 
                size="xlarge" 
                [style]="{ 'background-color': getAvatarColor(selectedVendor.category), 'color': 'white' }">
              </p-avatar>
              <div class="view-title">
                <h2>{{ selectedVendor.name }}</h2>
                <p-tag [value]="selectedVendor.category" [severity]="getCategorySeverity(selectedVendor.category)"></p-tag>
                @if (selectedVendor.isActive) {
                  <p-tag value="Active" severity="success"></p-tag>
                } @else {
                  <p-tag value="Inactive" severity="danger"></p-tag>
                }
              </div>
            </div>

            <div class="view-section">
              <h4>Contact Information</h4>
              <div class="view-grid">
                <div class="view-item">
                  <span class="view-label">Contact Person</span>
                  <span class="view-value">{{ selectedVendor.contactPerson }}</span>
                </div>
                <div class="view-item">
                  <span class="view-label">Email</span>
                  <span class="view-value">{{ selectedVendor.email }}</span>
                </div>
                <div class="view-item">
                  <span class="view-label">Phone</span>
                  <span class="view-value">{{ selectedVendor.phone }}</span>
                </div>
                <div class="view-item">
                  <span class="view-label">Address</span>
                  <span class="view-value">{{ selectedVendor.address }}</span>
                </div>
                <div class="view-item">
                  <span class="view-label">City</span>
                  <span class="view-value">{{ selectedVendor.city }}</span>
                </div>
                <div class="view-item">
                  <span class="view-label">Country</span>
                  <span class="view-value">{{ selectedVendor.country }}</span>
                </div>
              </div>
            </div>

            <div class="view-section">
              <h4>Contract Details</h4>
              <div class="view-grid">
                <div class="view-item">
                  <span class="view-label">Contract Start</span>
                  <span class="view-value">{{ formatDate(selectedVendor.contractStartDate) }}</span>
                </div>
                <div class="view-item">
                  <span class="view-label">Contract End</span>
                  <span class="view-value">{{ formatDate(selectedVendor.contractEndDate) }}</span>
                </div>
                <div class="view-item">
                  <span class="view-label">Payment Terms</span>
                  <span class="view-value">{{ selectedVendor.paymentTerms || 'Not specified' }}</span>
                </div>
                <div class="view-item">
                  <span class="view-label">Rating</span>
                  <span class="view-value">
                    <p-rating [(ngModel)]="selectedVendor.rating" [readonly]="true" ></p-rating>
                  </span>
                </div>
              </div>
            </div>

            @if (selectedVendor.notes) {
              <div class="view-section">
                <h4>Notes</h4>
                <p class="view-notes">{{ selectedVendor.notes }}</p>
              </div>
            }
          </div>
        }
        <ng-template pTemplate="footer">
          <button pButton label="Close" class="p-button-text" (click)="showViewDialog = false"></button>
          @if (authService.hasAnyRole([UserRole.ADMIN, UserRole.MANAGER])) {
            <button pButton label="Edit" icon="pi pi-pencil" (click)="editFromView()"></button>
          }
        </ng-template>
      </p-dialog>

      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
    </div>
  `,
  styles: [`
    .vendor-page {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }

    /* Page Header */
    .page-header {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-4);
      flex-wrap: wrap;
    }

    .header-text h1 {
      font-family: var(--font-display);
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 var(--space-1) 0;
    }

    .header-text p {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: var(--space-3);
    }

    /* Stats Row */
    .stats-row {
      display: flex;
      gap: var(--space-3);
      flex-wrap: wrap;
    }

    .stat-pill {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-full);
    }

    .stat-pill .stat-value {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: var(--text-lg);
      color: var(--text-primary);
    }

    .stat-pill .stat-label {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .stat-pill--success .stat-value { color: var(--primary-600); }
    .stat-pill--warning .stat-value { color: var(--warning-600); }
    .stat-pill--danger .stat-value { color: var(--alert-600); }
    .stat-pill--info .stat-value { color: var(--secondary-600); }

    /* Filters Bar */
    .filters-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-4);
      flex-wrap: wrap;
      padding: var(--space-4);
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
    }

    .filters-left {
      flex: 1;
      min-width: 250px;
      max-width: 400px;
    }

    .search-input {
      width: 100%;
    }

    .filters-right {
      display: flex;
      gap: var(--space-3);
      flex-wrap: wrap;
    }

    .filters-right :deep(.p-select) {
      min-width: 160px;
    }

    /* Vendor Grid */
    .vendor-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: var(--space-5);
    }

    /* Vendor Card */
    .vendor-card {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      padding: var(--space-5);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      transition: all var(--transition-fast);
    }

    .vendor-card:hover {
      border-color: var(--primary-300);
      box-shadow: var(--shadow-md);
    }

    .vendor-card.inactive {
      opacity: 0.7;
      border-color: var(--border-color);
    }

    .vendor-header {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
    }

    .vendor-title {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .vendor-title h3 {
      font-family: var(--font-display);
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .vendor-status {
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .status-dot.active {
      background: var(--primary-500);
    }

    .status-dot.inactive {
      background: var(--text-tertiary);
    }

    .status-text {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    /* Rating */
    .vendor-rating {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .rating-value {
      font-family: var(--font-display);
      font-weight: 600;
      font-size: var(--text-sm);
      color: var(--warning-600);
    }

    :host ::ng-deep .vendor-rating .p-rating {
      gap: 2px;
    }

    :host ::ng-deep .vendor-rating .p-rating-icon {
      font-size: 0.875rem;
    }

    /* Vendor Info */
    .vendor-info {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .info-row i {
      width: 16px;
      color: var(--text-tertiary);
    }

    .info-row a {
      color: var(--primary-600);
      text-decoration: none;
    }

    .info-row a:hover {
      text-decoration: underline;
    }

    /* Contract Info */
    .contract-info {
      padding: var(--space-3);
      background: var(--surface-ground);
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .contract-info.expiring {
      background: var(--warning-50);
      border: 1px solid var(--warning-200);
    }

    :host-context([data-theme="dark"]) .contract-info.expiring {
      background: rgba(245, 158, 11, 0.1);
      border-color: var(--warning-800);
    }

    .contract-label {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-xs);
      font-weight: 500;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .contract-dates {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--text-primary);
    }

    /* Payment Terms */
    .payment-terms {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .payment-terms i {
      color: var(--text-tertiary);
    }

    /* Vendor Actions */
    .vendor-actions {
      display: flex;
      gap: var(--space-2);
      margin-top: auto;
      padding-top: var(--space-3);
      border-top: 1px solid var(--border-color);
    }

    /* Empty State */
    .empty-state {
      grid-column: 1 / -1;
      padding: var(--space-12);
      text-align: center;
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
    }

    .empty-state i {
      font-size: 3rem;
      color: var(--text-tertiary);
      margin-bottom: var(--space-4);
    }

    .empty-state h3 {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 var(--space-2) 0;
    }

    .empty-state p {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0 0 var(--space-4) 0;
    }

    /* Alert Panel */
    .alert-panel {
      background: var(--surface-card);
      border: 1px solid var(--warning-200);
      border-left: 4px solid var(--warning-500);
      border-radius: var(--radius-xl);
      overflow: hidden;
    }

    :host-context([data-theme="dark"]) .alert-panel {
      border-color: var(--warning-900);
      border-left-color: var(--warning-500);
    }

    .alert-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--warning-50);
      border-bottom: 1px solid var(--warning-200);
    }

    :host-context([data-theme="dark"]) .alert-header {
      background: rgba(245, 158, 11, 0.1);
      border-bottom-color: var(--warning-900);
    }

    .alert-header i {
      font-size: 1.25rem;
      color: var(--warning-600);
    }

    .alert-header h3 {
      font-family: var(--font-display);
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      flex: 1;
    }

    .alert-count {
      font-size: var(--text-sm);
      color: var(--warning-600);
    }

    .alert-items {
      padding: var(--space-2);
    }

    .alert-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-3);
      border-radius: var(--radius-lg);
      transition: background var(--transition-fast);
    }

    .alert-item:hover {
      background: var(--surface-hover);
    }

    .alert-item-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .alert-item-name {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--text-primary);
    }

    .alert-item-detail {
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }

    .alert-item-date {
      font-size: var(--text-xs);
      color: var(--warning-600);
    }

    /* Dialog */
    .dialog-content {
      padding: var(--space-4) 0;
    }

    .dialog-placeholder {
      padding: var(--space-8);
      background: var(--surface-ground);
      border-radius: var(--radius-lg);
      text-align: center;
      color: var(--text-secondary);
    }

    /* View Dialog */
    .view-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }

    .view-header {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--border-color);
    }

    .view-title {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .view-title h2 {
      font-family: var(--font-display);
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .view-title :deep(.p-tag) {
      align-self: flex-start;
    }

    .view-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .view-section h4 {
      font-family: var(--font-display);
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0;
    }

    .view-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-4);
    }

    .view-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .view-label {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .view-value {
      font-size: var(--text-sm);
      color: var(--text-primary);
    }

    .view-notes {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      line-height: 1.6;
      margin: 0;
    }

    @media (max-width: 768px) {
      .filters-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .filters-left {
        max-width: none;
      }

      .filters-right {
        justify-content: flex-start;
      }

      .vendor-grid {
        grid-template-columns: 1fr;
      }

      .view-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class VendorListComponent {
  mockDataService = inject(MockDataService);
  authService = inject(AuthService);
  messageService = inject(MessageService);
  confirmationService = inject(ConfirmationService);

  // Expose enum for template use
  UserRole = UserRole;

  vendors = this.mockDataService.vendors;
  
  searchQuery = '';
  selectedCategory: VendorCategory | null = null;
  selectedStatus: boolean | null = null;
  showAddDialog = false;
  showViewDialog = false;
  selectedVendor: Vendor | null = null;

  categoryOptions = Object.values(VendorCategory).map(c => ({ label: c, value: c }));
  statusOptions = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false }
  ];

  filteredVendors = computed(() => {
    let result = this.vendors();

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(v => 
        v.name.toLowerCase().includes(query) ||
        v.contactPerson.toLowerCase().includes(query) ||
        v.email.toLowerCase().includes(query) ||
        v.city.toLowerCase().includes(query)
      );
    }

    if (this.selectedCategory) {
      result = result.filter(v => v.category === this.selectedCategory);
    }

    if (this.selectedStatus !== null) {
      result = result.filter(v => v.isActive === this.selectedStatus);
    }

    return result;
  });

  activeCount = computed(() => 
    this.vendors().filter(v => v.isActive).length
  );

  inactiveCount = computed(() => 
    this.vendors().filter(v => !v.isActive).length
  );

  expiringCount = computed(() => 
    this.vendors().filter(v => this.isContractExpiring(v)).length
  );

  averageRating = computed(() => {
    const ratings = this.vendors().map(v => v.rating);
    return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  });

  expiringVendors = computed(() => 
    this.vendors().filter(v => this.isContractExpiring(v))
  );

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = null;
    this.selectedStatus = null;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getAvatarColor(category: VendorCategory): string {
    const colors: Record<VendorCategory, string> = {
      [VendorCategory.EQUIPMENT_MANUFACTURER]: '#10b981',
      [VendorCategory.PARTS_SUPPLIER]: '#3b82f6',
      [VendorCategory.CONSUMABLES_SUPPLIER]: '#f59e0b',
      [VendorCategory.SERVICE_PROVIDER]: '#8b5cf6',
      [VendorCategory.DISTRIBUTOR]: '#ec4899'
    };
    return colors[category] || '#6b7280';
  }

  getCategorySeverity(category: VendorCategory): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<VendorCategory, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      [VendorCategory.EQUIPMENT_MANUFACTURER]: 'success',
      [VendorCategory.PARTS_SUPPLIER]: 'info',
      [VendorCategory.CONSUMABLES_SUPPLIER]: 'warn',
      [VendorCategory.SERVICE_PROVIDER]: 'secondary',
      [VendorCategory.DISTRIBUTOR]: 'info'
    };
    return map[category] || 'info';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  isContractExpiring(vendor: Vendor): boolean {
    if (!vendor.contractEndDate) return false;
    const endDate = new Date(vendor.contractEndDate);
    const today = new Date();
    const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 90;
  }

  viewVendor(vendor: Vendor): void {
    this.selectedVendor = vendor;
    this.showViewDialog = true;
  }

  editVendor(vendor: Vendor): void {
    this.selectedVendor = vendor;
    this.showAddDialog = true;
  }

  editFromView(): void {
    this.showViewDialog = false;
    this.showAddDialog = true;
  }

  confirmDelete(vendor: Vendor): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${vendor.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: `${vendor.name} has been deleted`
        });
      }
    });
  }

  renewContract(vendor: Vendor): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Contract Renewal',
      detail: `Initiating contract renewal for ${vendor.name}`
    });
  }

  saveVendor(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Saved',
      detail: 'Vendor has been saved successfully'
    });
    this.showAddDialog = false;
    this.selectedVendor = null;
  }
}
