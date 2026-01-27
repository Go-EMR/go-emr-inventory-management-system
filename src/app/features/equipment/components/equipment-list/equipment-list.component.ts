import { Component, inject, computed, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MockDataService } from '@core/services/mock-data.service';
import { AuthService } from '@core/services/auth.service';
import {
  Equipment,
  EquipmentStatus,
  EquipmentCondition,
  EquipmentCategory,
  EquipmentType,
  RiskLevel,
  UserRole
} from '@shared/models';

@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    TagModule,
    TooltipModule,
    MenuModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    IconFieldModule,
    InputIconModule
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="equipment-page">
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1>Equipment Management</h1>
            <p>Manage and track all medical equipment assets</p>
          </div>
          <div class="header-actions">
            @if (authService.hasAnyRole([UserRole.ADMIN, UserRole.MANAGER])) {
              <button pButton label="Export" icon="pi pi-download" class="p-button-outlined"></button>
              <button pButton label="Add Equipment" icon="pi pi-plus" class="p-button-primary" (click)="showAddDialog = true"></button>
            }
          </div>
        </div>

        <!-- Stats Summary -->
        <div class="stats-row">
          <div class="stat-pill">
            <span class="stat-value">{{ equipment().length }}</span>
            <span class="stat-label">Total Equipment</span>
          </div>
          <div class="stat-pill stat-pill--success">
            <span class="stat-value">{{ inServiceCount() }}</span>
            <span class="stat-label">In Service</span>
          </div>
          <div class="stat-pill stat-pill--warning">
            <span class="stat-value">{{ maintenanceCount() }}</span>
            <span class="stat-label">Under Maintenance</span>
          </div>
          <div class="stat-pill stat-pill--danger">
            <span class="stat-value">{{ outOfServiceCount() }}</span>
            <span class="stat-label">Out of Service</span>
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
              placeholder="Search equipment..." 
              [(ngModel)]="searchQuery"
              (input)="onSearch($event)"
              class="search-input" />
          </p-iconfield>
        </div>
        
        <div class="filters-right">
          <p-select 
            [options]="statusOptions" 
            [(ngModel)]="selectedStatus" 
            placeholder="Status"
            [showClear]="true"
            (onChange)="applyFilters()">
          </p-select>

          <p-select 
            [options]="categoryOptions" 
            [(ngModel)]="selectedCategory" 
            placeholder="Category"
            [showClear]="true"
            (onChange)="applyFilters()">
          </p-select>

          <p-select 
            [options]="conditionOptions" 
            [(ngModel)]="selectedCondition" 
            placeholder="Condition"
            [showClear]="true"
            (onChange)="applyFilters()">
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

      <!-- Data Table -->
      <div class="table-container">
        <p-table
          #dt
          [value]="filteredEquipment()"
          [rows]="10"
          [paginator]="true"
          [rowsPerPageOptions]="[10, 25, 50]"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} equipment"
          [globalFilterFields]="['name', 'inventoryNumber', 'serialNumber', 'manufacturer', 'location', 'department']"
          styleClass="p-datatable-sm"
          responsiveLayout="scroll"
          [rowHover]="true"
          selectionMode="multiple"
          [(selection)]="selectedEquipment">
          
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 3rem">
                <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
              </th>
              <th pSortableColumn="inventoryNumber" style="min-width: 140px">
                ID <p-sortIcon field="inventoryNumber"></p-sortIcon>
              </th>
              <th pSortableColumn="name" style="min-width: 200px">
                Equipment <p-sortIcon field="name"></p-sortIcon>
              </th>
              <th pSortableColumn="category" style="min-width: 150px">
                Category <p-sortIcon field="category"></p-sortIcon>
              </th>
              <th pSortableColumn="location" style="min-width: 140px">
                Location <p-sortIcon field="location"></p-sortIcon>
              </th>
              <th pSortableColumn="status" style="min-width: 140px">
                Status <p-sortIcon field="status"></p-sortIcon>
              </th>
              <th pSortableColumn="condition" style="min-width: 120px">
                Condition <p-sortIcon field="condition"></p-sortIcon>
              </th>
              <th pSortableColumn="riskLevel" style="min-width: 100px">
                Risk <p-sortIcon field="riskLevel"></p-sortIcon>
              </th>
              <th style="width: 100px; text-align: center">Actions</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-item>
            <tr>
              <td>
                <p-tableCheckbox [value]="item"></p-tableCheckbox>
              </td>
              <td>
                <span class="inventory-number">{{ item.inventoryNumber }}</span>
              </td>
              <td>
                <div class="equipment-info">
                  <a [routerLink]="['/equipment', item.id]" class="equipment-name">{{ item.name }}</a>
                  <div class="equipment-meta">
                    <span>{{ item.manufacturer }}</span>
                    <span class="meta-separator">•</span>
                    <span>{{ item.model }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="category-cell">
                  <i [class]="getCategoryIcon(item.category)"></i>
                  <span>{{ item.category }}</span>
                </div>
              </td>
              <td>
                <div class="location-cell">
                  <span class="location-name">{{ item.location.building }}, {{ item.location.room }}</span>
                  <span class="department-name">{{ item.department }}</span>
                </div>
              </td>
              <td>
                <p-tag 
                  [value]="item.status" 
                  [severity]="getStatusSeverity(item.status)">
                </p-tag>
              </td>
              <td>
                <div class="condition-cell">
                  <span class="condition-dot" [class]="'condition-dot--' + item.condition.toLowerCase().replace(' ', '-')"></span>
                  <span>{{ item.condition }}</span>
                </div>
              </td>
              <td>
                <p-tag 
                  [value]="item.riskLevel" 
                  [severity]="getRiskSeverity(item.riskLevel)"
                  [rounded]="true">
                </p-tag>
              </td>
              <td>
                <div class="actions-cell">
                  <button 
                    pButton 
                    icon="pi pi-eye" 
                    class="p-button-text p-button-rounded p-button-sm"
                    pTooltip="View details"
                    [routerLink]="['/equipment', item.id]">
                  </button>
                  @if (authService.hasAnyRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN])) {
                    <button 
                      pButton 
                      icon="pi pi-pencil" 
                      class="p-button-text p-button-rounded p-button-sm"
                      pTooltip="Edit"
                      (click)="editEquipment(item)">
                    </button>
                  }
                  @if (authService.hasAnyRole([UserRole.ADMIN])) {
                    <button 
                      pButton 
                      icon="pi pi-trash" 
                      class="p-button-text p-button-rounded p-button-sm p-button-danger"
                      pTooltip="Delete"
                      (click)="confirmDelete(item)">
                    </button>
                  }
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="9">
                <div class="empty-state">
                  <i class="pi pi-inbox"></i>
                  <h3>No equipment found</h3>
                  <p>Try adjusting your search or filter criteria</p>
                  <button pButton label="Clear Filters" icon="pi pi-filter-slash" class="p-button-outlined" (click)="clearFilters()"></button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Bulk Actions Bar -->
      @if (selectedEquipment.length > 0) {
        <div class="bulk-actions-bar">
          <span class="selection-count">{{ selectedEquipment.length }} item(s) selected</span>
          <div class="bulk-buttons">
            <button pButton label="Export Selected" icon="pi pi-download" class="p-button-outlined p-button-sm"></button>
            <button pButton label="Update Status" icon="pi pi-refresh" class="p-button-outlined p-button-sm"></button>
            @if (authService.hasRole(UserRole.ADMIN)) {
              <button pButton label="Delete Selected" icon="pi pi-trash" class="p-button-outlined p-button-danger p-button-sm"></button>
            }
            <button pButton icon="pi pi-times" class="p-button-text p-button-sm" (click)="selectedEquipment = []"></button>
          </div>
        </div>
      }

      <!-- Add/Edit Dialog -->
      <p-dialog 
        [(visible)]="showAddDialog" 
        [header]="editingEquipment ? 'Edit Equipment' : 'Add New Equipment'"
        [modal]="true"
        [style]="{ width: '600px' }"
        [draggable]="false"
        [resizable]="false">
        <div class="dialog-content">
          <p class="dialog-placeholder">Equipment form would go here with fields for name, category, manufacturer, model, serial number, location, department, status, etc.</p>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="closeDialog()"></button>
          <button pButton label="Save" icon="pi pi-check" (click)="saveEquipment()"></button>
        </ng-template>
      </p-dialog>

      <p-confirmDialog></p-confirmDialog>
      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .equipment-page {
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
      min-width: 140px;
    }

    /* Table Container */
    .table-container {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      overflow: hidden;
    }

    .table-container :deep(.p-datatable) {
      border: none;
    }

    .table-container :deep(.p-datatable-header) {
      background: transparent;
      border: none;
      padding: var(--space-4);
    }

    .table-container :deep(.p-datatable-thead > tr > th) {
      background: var(--surface-ground);
      color: var(--text-secondary);
      font-weight: 600;
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: var(--space-3) var(--space-4);
      border-color: var(--border-color);
    }

    .table-container :deep(.p-datatable-tbody > tr > td) {
      padding: var(--space-3) var(--space-4);
      border-color: var(--border-color);
    }

    .table-container :deep(.p-datatable-tbody > tr:hover) {
      background: var(--surface-hover);
    }

    .table-container :deep(.p-paginator) {
      border: none;
      background: transparent;
      padding: var(--space-4);
    }

    /* Table Cell Styles */
    .inventory-number {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      color: var(--text-secondary);
      background: var(--surface-ground);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-md);
    }

    .equipment-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .equipment-name {
      font-weight: 600;
      color: var(--text-primary);
      text-decoration: none;
      transition: color var(--transition-fast);
    }

    .equipment-name:hover {
      color: var(--primary-600);
    }

    .equipment-meta {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .meta-separator {
      color: var(--border-color);
    }

    .category-cell {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .category-cell i {
      color: var(--text-tertiary);
    }

    .location-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .location-name {
      font-size: var(--text-sm);
      color: var(--text-primary);
    }

    .department-name {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .condition-cell {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
    }

    .condition-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .condition-dot--excellent { background: var(--primary-500); }
    .condition-dot--good { background: var(--primary-400); }
    .condition-dot--fair { background: var(--warning-500); }
    .condition-dot--poor { background: var(--alert-400); }
    .condition-dot--non-functional { background: var(--alert-600); }

    .actions-cell {
      display: flex;
      justify-content: center;
      gap: var(--space-1);
    }

    /* Empty State */
    .empty-state {
      padding: var(--space-12);
      text-align: center;
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

    /* Bulk Actions Bar */
    .bulk-actions-bar {
      position: fixed;
      bottom: var(--space-6);
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-3) var(--space-5);
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      z-index: 100;
      animation: slideUp 0.2s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateX(-50%) translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
    }

    .selection-count {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--text-primary);
      padding-right: var(--space-4);
      border-right: 1px solid var(--border-color);
    }

    .bulk-buttons {
      display: flex;
      gap: var(--space-2);
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

      .bulk-actions-bar {
        left: var(--space-4);
        right: var(--space-4);
        transform: none;
        flex-wrap: wrap;
        justify-content: center;
      }
    }
  `]
})
export class EquipmentListComponent {
  @ViewChild('dt') table!: Table;

  mockDataService = inject(MockDataService);
  authService = inject(AuthService);
  confirmationService = inject(ConfirmationService);
  messageService = inject(MessageService);

  // Expose enum for template use
  UserRole = UserRole;

  equipment = this.mockDataService.equipment;
  
  searchQuery = '';
  selectedStatus: EquipmentStatus | null = null;
  selectedCategory: EquipmentCategory | null = null;
  selectedCondition: EquipmentCondition | null = null;
  selectedEquipment: Equipment[] = [];
  showAddDialog = false;
  editingEquipment: Equipment | null = null;

  statusOptions = Object.values(EquipmentStatus).map(s => ({ label: s, value: s }));
  categoryOptions = Object.values(EquipmentCategory).map(c => ({ label: c, value: c }));
  conditionOptions = Object.values(EquipmentCondition).map(c => ({ label: c, value: c }));

  filteredEquipment = computed(() => {
    let result = this.equipment();

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(e => 
        e.name.toLowerCase().includes(query) ||
        e.inventoryNumber.toLowerCase().includes(query) ||
        e.serialNumber.toLowerCase().includes(query) ||
        e.manufacturer.toLowerCase().includes(query) ||
        e.location.building.toLowerCase().includes(query) ||
        e.location.room.toLowerCase().includes(query) ||
        e.department.toLowerCase().includes(query)
      );
    }

    if (this.selectedStatus) {
      result = result.filter(e => e.status === this.selectedStatus);
    }

    if (this.selectedCategory) {
      result = result.filter(e => e.category === this.selectedCategory);
    }

    if (this.selectedCondition) {
      result = result.filter(e => e.condition === this.selectedCondition);
    }

    return result;
  });

  inServiceCount = computed(() => 
    this.equipment().filter(e => e.status === EquipmentStatus.IN_SERVICE).length
  );

  maintenanceCount = computed(() => 
    this.equipment().filter(e => e.status === EquipmentStatus.UNDER_MAINTENANCE).length
  );

  outOfServiceCount = computed(() => 
    this.equipment().filter(e => e.status === EquipmentStatus.OUT_OF_SERVICE).length
  );

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
  }

  applyFilters(): void {
    // Filters are applied reactively via computed signal
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = null;
    this.selectedCategory = null;
    this.selectedCondition = null;
  }

  getStatusSeverity(status: EquipmentStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<EquipmentStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      [EquipmentStatus.IN_SERVICE]: 'success',
      [EquipmentStatus.OUT_OF_SERVICE]: 'danger',
      [EquipmentStatus.UNDER_MAINTENANCE]: 'warn',
      [EquipmentStatus.AWAITING_REPAIR]: 'warn',
      [EquipmentStatus.AWAITING_PARTS]: 'info',
      [EquipmentStatus.DECOMMISSIONED]: 'secondary',
      [EquipmentStatus.DISPOSED]: 'secondary'
    };
    return map[status] || 'info';
  }

  getRiskSeverity(risk: RiskLevel): 'success' | 'warn' | 'danger' {
    const map: Record<RiskLevel, 'success' | 'warn' | 'danger'> = {
      [RiskLevel.LOW]: 'success',
      [RiskLevel.MEDIUM]: 'warn',
      [RiskLevel.HIGH]: 'danger'
    };
    return map[risk];
  }

  getCategoryIcon(category: EquipmentCategory): string {
    const icons: Record<string, string> = {
      'Imaging': 'pi pi-image',
      'Diagnostic': 'pi pi-search',
      'Therapeutic': 'pi pi-heart',
      'Monitoring': 'pi pi-chart-line',
      'Laboratory': 'pi pi-filter',
      'Surgical': 'pi pi-wrench',
      'Life Support': 'pi pi-heart-fill',
      'Rehabilitation': 'pi pi-users',
      'Sterilization': 'pi pi-shield'
    };
    return icons[category] || 'pi pi-box';
  }

  editEquipment(equipment: Equipment): void {
    this.editingEquipment = { ...equipment };
    this.showAddDialog = true;
  }

  confirmDelete(equipment: Equipment): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${equipment.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: `${equipment.name} has been deleted`
        });
      }
    });
  }

  closeDialog(): void {
    this.showAddDialog = false;
    this.editingEquipment = null;
  }

  saveEquipment(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Saved',
      detail: 'Equipment has been saved successfully'
    });
    this.closeDialog();
  }
}
