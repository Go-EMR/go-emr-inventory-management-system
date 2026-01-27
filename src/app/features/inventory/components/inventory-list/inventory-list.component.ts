import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MockDataService } from '@core/services/mock-data.service';
import { AuthService } from '@core/services/auth.service';
import {
  InventoryItem,
  InventoryCategory,
  StockStatus,
  UserRole
} from '@shared/models';

@Component({
  selector: 'app-inventory-list',
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
    ProgressBarModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="inventory-page">
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1>Inventory Management</h1>
            <p>Track consumables, spare parts, and supplies</p>
          </div>
          <div class="header-actions">
            @if (authService.hasAnyRole([UserRole.ADMIN, UserRole.MANAGER])) {
              <button pButton label="Export" icon="pi pi-download" class="p-button-outlined"></button>
              <button pButton label="Add Item" icon="pi pi-plus" class="p-button-primary" (click)="showAddDialog = true"></button>
            }
          </div>
        </div>

        <!-- Stats Summary -->
        <div class="stats-row">
          <div class="stat-pill">
            <span class="stat-value">{{ inventory().length }}</span>
            <span class="stat-label">Total Items</span>
          </div>
          <div class="stat-pill stat-pill--success">
            <span class="stat-value">{{ inStockCount() }}</span>
            <span class="stat-label">In Stock</span>
          </div>
          <div class="stat-pill stat-pill--warning">
            <span class="stat-value">{{ lowStockCount() }}</span>
            <span class="stat-label">Low Stock</span>
          </div>
          <div class="stat-pill stat-pill--danger">
            <span class="stat-value">{{ outOfStockCount() }}</span>
            <span class="stat-label">Out of Stock</span>
          </div>
          <div class="stat-pill stat-pill--info">
            <span class="stat-value">{{ formatCurrency(totalValue()) }}</span>
            <span class="stat-label">Total Value</span>
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
              placeholder="Search inventory..." 
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

      <!-- Data Table -->
      <div class="table-container">
        <p-table
          [value]="filteredInventory()"
          [rows]="10"
          [paginator]="true"
          [rowsPerPageOptions]="[10, 25, 50]"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} items"
          styleClass="p-datatable-sm"
          responsiveLayout="scroll"
          [rowHover]="true">
          
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="sku" style="min-width: 120px">
                SKU <p-sortIcon field="sku"></p-sortIcon>
              </th>
              <th pSortableColumn="name" style="min-width: 200px">
                Item <p-sortIcon field="name"></p-sortIcon>
              </th>
              <th pSortableColumn="category" style="min-width: 130px">
                Category <p-sortIcon field="category"></p-sortIcon>
              </th>
              <th style="min-width: 180px">Stock Level</th>
              <th pSortableColumn="quantity" style="min-width: 100px">
                Quantity <p-sortIcon field="quantity"></p-sortIcon>
              </th>
              <th pSortableColumn="status" style="min-width: 120px">
                Status <p-sortIcon field="status"></p-sortIcon>
              </th>
              <th pSortableColumn="unitCost" style="min-width: 100px">
                Unit Cost <p-sortIcon field="unitCost"></p-sortIcon>
              </th>
              <th style="min-width: 120px">Total Value</th>
              <th style="width: 100px; text-align: center">Actions</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-item>
            <tr [class.low-stock-row]="item.status === 'Low Stock'" [class.out-of-stock-row]="item.status === 'Out of Stock'">
              <td>
                <span class="sku-cell">{{ item.sku }}</span>
              </td>
              <td>
                <div class="item-info">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-type">{{ item.type }}</span>
                </div>
              </td>
              <td>
                <div class="category-cell">
                  <i [class]="getCategoryIcon(item.category)"></i>
                  <span>{{ item.category }}</span>
                </div>
              </td>
              <td>
                <div class="stock-level">
                  <p-progressBar 
                    [value]="getStockPercentage(item)" 
                    [showValue]="false"
                    [styleClass]="getStockClass(item)">
                  </p-progressBar>
                  <div class="stock-labels">
                    <span>{{ item.quantity }} / {{ item.maxQuantity }}</span>
                    <span class="reorder-point">Reorder: {{ item.reorderLevel }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="quantity-cell">
                  <span class="quantity-value">{{ item.quantity }}</span>
                  <span class="quantity-unit">{{ item.unitOfMeasure }}</span>
                </div>
              </td>
              <td>
                <p-tag 
                  [value]="item.status" 
                  [severity]="getStatusSeverity(item.status)">
                </p-tag>
              </td>
              <td>
                <span class="cost-cell">{{ formatCurrency(item.unitCost) }}</span>
              </td>
              <td>
                <span class="value-cell">{{ formatCurrency(item.quantity * item.unitCost) }}</span>
              </td>
              <td>
                <div class="actions-cell">
                  <button 
                    pButton 
                    icon="pi pi-eye" 
                    class="p-button-text p-button-rounded p-button-sm"
                    pTooltip="View details"
                    (click)="viewItem(item)">
                  </button>
                  @if (authService.hasAnyRole([UserRole.ADMIN, UserRole.MANAGER])) {
                    <button 
                      pButton 
                      icon="pi pi-refresh" 
                      class="p-button-text p-button-rounded p-button-sm"
                      pTooltip="Restock"
                      (click)="restockItem(item)">
                    </button>
                  }
                  @if (authService.hasRole(UserRole.ADMIN)) {
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
                  <h3>No inventory items found</h3>
                  <p>Try adjusting your search or filter criteria</p>
                  <button pButton label="Clear Filters" icon="pi pi-filter-slash" class="p-button-outlined" (click)="clearFilters()"></button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Low Stock Alert Panel -->
      @if (lowStockItems().length > 0) {
        <div class="alert-panel">
          <div class="alert-header">
            <i class="pi pi-exclamation-triangle"></i>
            <h3>Low Stock Alerts</h3>
            <span class="alert-count">{{ lowStockItems().length }} items need attention</span>
          </div>
          <div class="alert-items">
            @for (item of lowStockItems().slice(0, 5); track item.id) {
              <div class="alert-item">
                <div class="alert-item-info">
                  <span class="alert-item-name">{{ item.name }}</span>
                  <span class="alert-item-stock">{{ item.quantity }} {{ item.unitOfMeasure }} remaining</span>
                </div>
                <button pButton label="Restock" icon="pi pi-shopping-cart" class="p-button-sm p-button-outlined" (click)="restockItem(item)"></button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Add/Edit Dialog -->
      <p-dialog 
        [(visible)]="showAddDialog" 
        header="Add Inventory Item"
        [modal]="true"
        [style]="{ width: '550px' }"
        [draggable]="false"
        [resizable]="false">
        <div class="dialog-content">
          <p class="dialog-placeholder">Inventory form would include: SKU, Name, Category, Type, Quantity, Min/Max levels, Reorder point, Unit cost, Location, Supplier, Expiry date, etc.</p>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="showAddDialog = false"></button>
          <button pButton label="Save" icon="pi pi-check" (click)="saveItem()"></button>
        </ng-template>
      </p-dialog>

      <!-- Restock Dialog -->
      <p-dialog 
        [(visible)]="showRestockDialog" 
        header="Restock Item"
        [modal]="true"
        [style]="{ width: '400px' }"
        [draggable]="false"
        [resizable]="false">
        @if (selectedItem) {
          <div class="restock-content">
            <div class="restock-item-info">
              <h4>{{ selectedItem.name }}</h4>
              <p>Current stock: {{ selectedItem.quantity }} {{ selectedItem.unitOfMeasure }}</p>
            </div>
            <div class="restock-form">
              <label for="restockQty">Quantity to add</label>
              <input 
                type="number" 
                pInputText 
                id="restockQty"
                [(ngModel)]="restockQuantity"
                [min]="1" />
            </div>
            <div class="restock-summary">
              <span>New total:</span>
              <strong>{{ selectedItem.quantity + restockQuantity }} {{ selectedItem.unitOfMeasure }}</strong>
            </div>
          </div>
        }
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="showRestockDialog = false"></button>
          <button pButton label="Confirm Restock" icon="pi pi-check" (click)="confirmRestock()"></button>
        </ng-template>
      </p-dialog>

      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
    </div>
  `,
  styles: [`
    .inventory-page {
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

    /* Row Highlights */
    .low-stock-row {
      background: rgba(245, 158, 11, 0.05) !important;
    }

    .out-of-stock-row {
      background: rgba(244, 63, 94, 0.05) !important;
    }

    /* Table Cell Styles */
    .sku-cell {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      color: var(--text-secondary);
      background: var(--surface-ground);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-md);
    }

    .item-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .item-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .item-type {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
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

    .stock-level {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .stock-level :deep(.p-progressbar) {
      height: 8px;
      border-radius: var(--radius-full);
    }

    .stock-level :deep(.p-progressbar-value) {
      border-radius: var(--radius-full);
    }

    .stock-level :deep(.stock-good .p-progressbar-value) {
      background: var(--primary-500);
    }

    .stock-level :deep(.stock-low .p-progressbar-value) {
      background: var(--warning-500);
    }

    .stock-level :deep(.stock-critical .p-progressbar-value) {
      background: var(--alert-500);
    }

    .stock-labels {
      display: flex;
      justify-content: space-between;
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .reorder-point {
      color: var(--text-tertiary);
    }

    .quantity-cell {
      display: flex;
      align-items: baseline;
      gap: var(--space-1);
    }

    .quantity-value {
      font-family: var(--font-display);
      font-weight: 600;
      font-size: var(--text-base);
      color: var(--text-primary);
    }

    .quantity-unit {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .cost-cell, .value-cell {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
    }

    .cost-cell {
      color: var(--text-secondary);
    }

    .value-cell {
      font-weight: 500;
      color: var(--text-primary);
    }

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

    .alert-item-stock {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
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

    .restock-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .restock-item-info h4 {
      font-family: var(--font-display);
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 var(--space-1) 0;
    }

    .restock-item-info p {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0;
    }

    .restock-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .restock-form label {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--text-primary);
    }

    .restock-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3);
      background: var(--primary-50);
      border-radius: var(--radius-lg);
      font-size: var(--text-sm);
    }

    :host-context([data-theme="dark"]) .restock-summary {
      background: rgba(16, 185, 129, 0.1);
    }

    .restock-summary span {
      color: var(--text-secondary);
    }

    .restock-summary strong {
      color: var(--primary-600);
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
    }
  `]
})
export class InventoryListComponent {
  mockDataService = inject(MockDataService);
  authService = inject(AuthService);
  messageService = inject(MessageService);
  confirmationService = inject(ConfirmationService);

  // Expose enum for template use
  UserRole = UserRole;

  inventory = this.mockDataService.inventory;
  
  searchQuery = '';
  selectedCategory: InventoryCategory | null = null;
  selectedStatus: StockStatus | null = null;
  showAddDialog = false;
  showRestockDialog = false;
  selectedItem: InventoryItem | null = null;
  restockQuantity = 10;

  categoryOptions = Object.values(InventoryCategory).map(c => ({ label: c, value: c }));
  statusOptions = Object.values(StockStatus).map(s => ({ label: s, value: s }));

  filteredInventory = computed(() => {
    let result = this.inventory();

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(i => 
        i.name.toLowerCase().includes(query) ||
        i.sku.toLowerCase().includes(query) ||
        i.type.toLowerCase().includes(query)
      );
    }

    if (this.selectedCategory) {
      result = result.filter(i => i.category === this.selectedCategory);
    }

    if (this.selectedStatus) {
      result = result.filter(i => i.status === this.selectedStatus);
    }

    return result;
  });

  inStockCount = computed(() => 
    this.inventory().filter(i => i.status === StockStatus.IN_STOCK).length
  );

  lowStockCount = computed(() => 
    this.inventory().filter(i => i.status === StockStatus.LOW_STOCK).length
  );

  outOfStockCount = computed(() => 
    this.inventory().filter(i => i.status === StockStatus.OUT_OF_STOCK).length
  );

  totalValue = computed(() => 
    this.inventory().reduce((sum, i) => sum + (i.quantity * i.unitCost), 0)
  );

  lowStockItems = computed(() => 
    this.inventory().filter(i => i.status === StockStatus.LOW_STOCK || i.status === StockStatus.OUT_OF_STOCK)
  );

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = null;
    this.selectedStatus = null;
  }

  getStatusSeverity(status: StockStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<StockStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      [StockStatus.IN_STOCK]: 'success',
      [StockStatus.LOW_STOCK]: 'warn',
      [StockStatus.OUT_OF_STOCK]: 'danger',
      [StockStatus.EXPIRED]: 'danger',
      [StockStatus.DISCONTINUED]: 'secondary'
    };
    return map[status] || 'info';
  }

  getCategoryIcon(category: InventoryCategory): string {
    const icons: Record<InventoryCategory, string> = {
      [InventoryCategory.CONSUMABLES]: 'pi pi-box',
      [InventoryCategory.SPARE_PARTS]: 'pi pi-cog',
      [InventoryCategory.REAGENTS]: 'pi pi-filter',
      [InventoryCategory.ACCESSORIES]: 'pi pi-th-large',
      [InventoryCategory.TOOLS]: 'pi pi-wrench',
      [InventoryCategory.SAFETY_EQUIPMENT]: 'pi pi-shield'
    };
    return icons[category] || 'pi pi-box';
  }

  getStockPercentage(item: InventoryItem): number {
    if (item.maxQuantity === 0) return 0;
    return Math.round((item.quantity / item.maxQuantity) * 100);
  }

  getStockClass(item: InventoryItem): string {
    const percentage = this.getStockPercentage(item);
    if (percentage <= 20) return 'stock-critical';
    if (percentage <= 40) return 'stock-low';
    return 'stock-good';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  viewItem(item: InventoryItem): void {
    this.messageService.add({
      severity: 'info',
      summary: 'View Item',
      detail: `Viewing details for ${item.name}`
    });
  }

  restockItem(item: InventoryItem): void {
    this.selectedItem = item;
    this.restockQuantity = item.reorderLevel - item.quantity;
    if (this.restockQuantity < 1) this.restockQuantity = 10;
    this.showRestockDialog = true;
  }

  confirmRestock(): void {
    if (this.selectedItem) {
      this.messageService.add({
        severity: 'success',
        summary: 'Restocked',
        detail: `Added ${this.restockQuantity} ${this.selectedItem.unitOfMeasure} to ${this.selectedItem.name}`
      });
      this.showRestockDialog = false;
      this.selectedItem = null;
    }
  }

  confirmDelete(item: InventoryItem): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${item.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: `${item.name} has been deleted`
        });
      }
    });
  }

  saveItem(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Saved',
      detail: 'Item has been saved successfully'
    });
    this.showAddDialog = false;
  }
}
