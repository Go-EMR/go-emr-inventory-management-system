import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { MockDataService } from '@core/services/mock-data.service';
import { AuthService } from '@core/services/auth.service';
import {
  EquipmentStatus,
  EquipmentCondition,
  MaintenanceType,
  MaintenanceStatus,
  StockStatus,
  VendorCategory,
  UserRole
} from '@shared/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    CardModule,
    ChartModule,
    TableModule,
    TabsModule,
    TagModule,
    DatePickerModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="reports-page">
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1>Reports & Analytics</h1>
            <p>Comprehensive insights into equipment, inventory, and maintenance</p>
          </div>
          <div class="header-actions">
            <p-select 
              [options]="periodOptions" 
              [(ngModel)]="selectedPeriod"
              placeholder="Time Period">
            </p-select>
            @if (authService.hasAnyRole([UserRole.ADMIN, UserRole.MANAGER])) {
              <button pButton label="Export Report" icon="pi pi-download" class="p-button-outlined"></button>
              <button pButton label="Schedule Report" icon="pi pi-calendar" class="p-button-primary"></button>
            }
          </div>
        </div>
      </header>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--primary">
            <i class="pi pi-server"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-value">{{ stats().totalEquipment }}</span>
            <span class="kpi-label">Total Equipment</span>
            <span class="kpi-change positive">
              <i class="pi pi-arrow-up"></i>
              +5 this month
            </span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--success">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-value">{{ operationalRate().toFixed(1) }}%</span>
            <span class="kpi-label">Operational Rate</span>
            <span class="kpi-change positive">
              <i class="pi pi-arrow-up"></i>
              +2.3% vs last month
            </span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--warning">
            <i class="pi pi-wrench"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-value">{{ stats().overdueMaintenances }}</span>
            <span class="kpi-label">Overdue Maintenance</span>
            <span class="kpi-change negative">
              <i class="pi pi-arrow-up"></i>
              +2 since last week
            </span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--danger">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-value">{{ stats().lowStockItems }}</span>
            <span class="kpi-label">Low Stock Items</span>
            <span class="kpi-change negative">
              <i class="pi pi-arrow-down"></i>
              -3 vs last week
            </span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon kpi-icon--info">
            <i class="pi pi-dollar"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-value">{{ formatCurrency(stats().monthlyMaintenanceCost) }}</span>
            <span class="kpi-label">Monthly Maintenance Cost</span>
            <span class="kpi-change positive">
              <i class="pi pi-arrow-down"></i>
              -8% vs last month
            </span>
          </div>
        </div>
      </div>

      <!-- Report Tabs -->
      <p-tabs [(value)]="activeTab">
        <p-tablist>
          <p-tab value="overview">
            <i class="pi pi-chart-bar"></i>
            Overview
          </p-tab>
          <p-tab value="equipment">
            <i class="pi pi-server"></i>
            Equipment
          </p-tab>
          <p-tab value="maintenance">
            <i class="pi pi-wrench"></i>
            Maintenance
          </p-tab>
          <p-tab value="inventory">
            <i class="pi pi-box"></i>
            Inventory
          </p-tab>
          <p-tab value="financial">
            <i class="pi pi-dollar"></i>
            Financial
          </p-tab>
        </p-tablist>

        <p-tabpanels>
          <!-- Overview Tab -->
          <p-tabpanel value="overview">
            <div class="charts-grid">
              <!-- Equipment Status Distribution -->
              <div class="chart-card">
                <div class="chart-header">
                  <h3>Equipment Status Distribution</h3>
                  <span class="chart-subtitle">Current status of all equipment</span>
                </div>
                <div class="chart-content">
                  <p-chart type="doughnut" [data]="equipmentStatusData" [options]="doughnutOptions"></p-chart>
                </div>
                <div class="chart-legend">
                  @for (item of equipmentStatusLegend; track item.label) {
                    <div class="legend-item">
                      <span class="legend-color" [style.background]="item.color"></span>
                      <span class="legend-label">{{ item.label }}</span>
                      <span class="legend-value">{{ item.value }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Monthly Maintenance Trend -->
              <div class="chart-card">
                <div class="chart-header">
                  <h3>Maintenance Activity Trend</h3>
                  <span class="chart-subtitle">Last 6 months</span>
                </div>
                <div class="chart-content">
                  <p-chart type="bar" [data]="maintenanceTrendData" [options]="barOptions"></p-chart>
                </div>
              </div>

              <!-- Equipment Condition -->
              <div class="chart-card">
                <div class="chart-header">
                  <h3>Equipment Condition</h3>
                  <span class="chart-subtitle">Overall equipment health</span>
                </div>
                <div class="chart-content">
                  <p-chart type="pie" [data]="conditionData" [options]="pieOptions"></p-chart>
                </div>
              </div>

              <!-- Inventory Status -->
              <div class="chart-card">
                <div class="chart-header">
                  <h3>Inventory Status</h3>
                  <span class="chart-subtitle">Stock levels overview</span>
                </div>
                <div class="chart-content">
                  <p-chart type="doughnut" [data]="inventoryStatusData" [options]="doughnutOptions"></p-chart>
                </div>
              </div>
            </div>
          </p-tabpanel>

          <!-- Equipment Tab -->
          <p-tabpanel value="equipment">
            <div class="report-section">
              <div class="charts-grid">
                <div class="chart-card wide">
                  <div class="chart-header">
                    <h3>Equipment by Department</h3>
                  </div>
                  <div class="chart-content">
                    <p-chart type="bar" [data]="equipmentByDeptData" [options]="horizontalBarOptions"></p-chart>
                  </div>
                </div>

                <div class="chart-card">
                  <div class="chart-header">
                    <h3>Equipment Age Distribution</h3>
                  </div>
                  <div class="chart-content">
                    <p-chart type="bar" [data]="equipmentAgeData" [options]="barOptions"></p-chart>
                  </div>
                </div>

                <div class="chart-card">
                  <div class="chart-header">
                    <h3>Risk Level Distribution</h3>
                  </div>
                  <div class="chart-content">
                    <p-chart type="pie" [data]="riskLevelData" [options]="pieOptions"></p-chart>
                  </div>
                </div>
              </div>

              <!-- Top Equipment Table -->
              <div class="table-card">
                <div class="table-header">
                  <h3>Equipment Performance Summary</h3>
                  <button pButton icon="pi pi-download" label="Export" class="p-button-outlined p-button-sm"></button>
                </div>
                <p-table [value]="equipmentSummary" styleClass="p-datatable-sm" responsiveLayout="scroll">
                  <ng-template pTemplate="header">
                    <tr>
                      <th>Equipment</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Uptime %</th>
                      <th>Maintenance Cost</th>
                      <th>Last Service</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-item>
                    <tr>
                      <td>
                        <div class="equipment-cell">
                          <span class="equipment-name">{{ item.name }}</span>
                          <span class="equipment-id">{{ item.id }}</span>
                        </div>
                      </td>
                      <td>{{ item.department }}</td>
                      <td>
                        <p-tag [value]="item.status" [severity]="getStatusSeverity(item.status)"></p-tag>
                      </td>
                      <td>
                        <div class="uptime-cell" [class.good]="item.uptime >= 90" [class.warning]="item.uptime >= 70 && item.uptime < 90" [class.danger]="item.uptime < 70">
                          {{ item.uptime }}%
                        </div>
                      </td>
                      <td>{{ formatCurrency(item.maintenanceCost) }}</td>
                      <td>{{ item.lastService }}</td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>
            </div>
          </p-tabpanel>

          <!-- Maintenance Tab -->
          <p-tabpanel value="maintenance">
            <div class="report-section">
              <div class="charts-grid">
                <div class="chart-card wide">
                  <div class="chart-header">
                    <h3>Maintenance Cost Trend</h3>
                    <span class="chart-subtitle">Monthly costs over time</span>
                  </div>
                  <div class="chart-content">
                    <p-chart type="line" [data]="maintenanceCostTrendData" [options]="lineOptions"></p-chart>
                  </div>
                </div>

                <div class="chart-card">
                  <div class="chart-header">
                    <h3>Maintenance by Type</h3>
                  </div>
                  <div class="chart-content">
                    <p-chart type="doughnut" [data]="maintenanceByTypeData" [options]="doughnutOptions"></p-chart>
                  </div>
                </div>

                <div class="chart-card">
                  <div class="chart-header">
                    <h3>Technician Workload</h3>
                  </div>
                  <div class="chart-content">
                    <p-chart type="bar" [data]="technicianWorkloadData" [options]="barOptions"></p-chart>
                  </div>
                </div>
              </div>

              <!-- Maintenance Summary Stats -->
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-icon">
                    <i class="pi pi-clock"></i>
                  </div>
                  <div class="stat-content">
                    <span class="stat-value">4.2 hrs</span>
                    <span class="stat-label">Avg. Response Time</span>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">
                    <i class="pi pi-check"></i>
                  </div>
                  <div class="stat-content">
                    <span class="stat-value">94%</span>
                    <span class="stat-label">First-Time Fix Rate</span>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">
                    <i class="pi pi-calendar"></i>
                  </div>
                  <div class="stat-content">
                    <span class="stat-value">28 days</span>
                    <span class="stat-label">Avg. Time Between Failures</span>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon">
                    <i class="pi pi-percentage"></i>
                  </div>
                  <div class="stat-content">
                    <span class="stat-value">85%</span>
                    <span class="stat-label">Preventive vs Corrective</span>
                  </div>
                </div>
              </div>
            </div>
          </p-tabpanel>

          <!-- Inventory Tab -->
          <p-tabpanel value="inventory">
            <div class="report-section">
              <div class="charts-grid">
                <div class="chart-card">
                  <div class="chart-header">
                    <h3>Inventory by Category</h3>
                  </div>
                  <div class="chart-content">
                    <p-chart type="pie" [data]="inventoryByCategoryData" [options]="pieOptions"></p-chart>
                  </div>
                </div>

                <div class="chart-card">
                  <div class="chart-header">
                    <h3>Stock Movement Trend</h3>
                  </div>
                  <div class="chart-content">
                    <p-chart type="line" [data]="stockMovementData" [options]="lineOptions"></p-chart>
                  </div>
                </div>

                <div class="chart-card wide">
                  <div class="chart-header">
                    <h3>Inventory Value by Category</h3>
                  </div>
                  <div class="chart-content">
                    <p-chart type="bar" [data]="inventoryValueData" [options]="horizontalBarOptions"></p-chart>
                  </div>
                </div>
              </div>

              <!-- Critical Items Table -->
              <div class="table-card">
                <div class="table-header">
                  <h3>Critical Inventory Items</h3>
                  <p-tag value="Requires Attention" severity="warn"></p-tag>
                </div>
                <p-table [value]="criticalInventory" styleClass="p-datatable-sm" responsiveLayout="scroll">
                  <ng-template pTemplate="header">
                    <tr>
                      <th>Item</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Current Stock</th>
                      <th>Reorder Level</th>
                      <th>Status</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-item>
                    <tr>
                      <td>{{ item.name }}</td>
                      <td><span class="mono">{{ item.sku }}</span></td>
                      <td>{{ item.category }}</td>
                      <td>{{ item.current }} {{ item.unit }}</td>
                      <td>{{ item.reorder }} {{ item.unit }}</td>
                      <td>
                        <p-tag [value]="item.status" [severity]="item.status === 'Out of Stock' ? 'danger' : 'warn'"></p-tag>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>
            </div>
          </p-tabpanel>

          <!-- Financial Tab -->
          <p-tabpanel value="financial">
            <div class="report-section">
              <div class="charts-grid">
                <div class="chart-card wide">
                  <div class="chart-header">
                    <h3>Cost Overview</h3>
                    <span class="chart-subtitle">Annual maintenance and repair costs</span>
                  </div>
                  <div class="chart-content">
                    <p-chart type="bar" [data]="costOverviewData" [options]="stackedBarOptions"></p-chart>
                  </div>
                </div>

                <div class="chart-card">
                  <div class="chart-header">
                    <h3>Cost Distribution</h3>
                  </div>
                  <div class="chart-content">
                    <p-chart type="doughnut" [data]="costDistributionData" [options]="doughnutOptions"></p-chart>
                  </div>
                </div>

                <div class="chart-card">
                  <div class="chart-header">
                    <h3>Budget vs Actual</h3>
                  </div>
                  <div class="chart-content">
                    <p-chart type="bar" [data]="budgetVsActualData" [options]="barOptions"></p-chart>
                  </div>
                </div>
              </div>

              <!-- Financial Summary -->
              <div class="financial-summary">
                <div class="summary-card">
                  <h4>Total Asset Value</h4>
                  <span class="summary-value">$2,450,000</span>
                  <span class="summary-change positive">+12% YoY</span>
                </div>
                <div class="summary-card">
                  <h4>Annual Depreciation</h4>
                  <span class="summary-value">$245,000</span>
                  <span class="summary-note">10% avg rate</span>
                </div>
                <div class="summary-card">
                  <h4>Maintenance ROI</h4>
                  <span class="summary-value">3.2x</span>
                  <span class="summary-change positive">+0.4 vs last year</span>
                </div>
                <div class="summary-card">
                  <h4>Total Cost of Ownership</h4>
                  <span class="summary-value">$548,000</span>
                  <span class="summary-note">YTD</span>
                </div>
              </div>
            </div>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .reports-page {
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
      align-items: center;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: var(--space-4);
    }

    @media (max-width: 1400px) {
      .kpi-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 768px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 480px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }
    }

    .kpi-card {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      padding: var(--space-4);
      display: flex;
      gap: var(--space-4);
      align-items: flex-start;
    }

    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .kpi-icon--primary {
      background: var(--primary-50);
      color: var(--primary-600);
    }

    .kpi-icon--success {
      background: rgba(16, 185, 129, 0.1);
      color: var(--primary-500);
    }

    .kpi-icon--warning {
      background: var(--warning-50);
      color: var(--warning-600);
    }

    .kpi-icon--danger {
      background: var(--alert-50);
      color: var(--alert-600);
    }

    .kpi-icon--info {
      background: var(--secondary-50);
      color: var(--secondary-600);
    }

    :host-context([data-theme="dark"]) .kpi-icon--primary { background: rgba(16, 185, 129, 0.15); }
    :host-context([data-theme="dark"]) .kpi-icon--success { background: rgba(16, 185, 129, 0.15); }
    :host-context([data-theme="dark"]) .kpi-icon--warning { background: rgba(245, 158, 11, 0.15); }
    :host-context([data-theme="dark"]) .kpi-icon--danger { background: rgba(244, 63, 94, 0.15); }
    :host-context([data-theme="dark"]) .kpi-icon--info { background: rgba(59, 130, 246, 0.15); }

    .kpi-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .kpi-value {
      font-family: var(--font-display);
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--text-primary);
    }

    .kpi-label {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .kpi-change {
      font-size: var(--text-xs);
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .kpi-change.positive {
      color: var(--primary-600);
    }

    .kpi-change.negative {
      color: var(--alert-600);
    }

    /* Charts Grid */
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-5);
    }

    @media (max-width: 1024px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }

    .chart-card {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      padding: var(--space-5);
    }

    .chart-card.wide {
      grid-column: 1 / -1;
    }

    .chart-header {
      margin-bottom: var(--space-4);
    }

    .chart-header h3 {
      font-family: var(--font-display);
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 var(--space-1) 0;
    }

    .chart-subtitle {
      font-size: var(--text-sm);
      color: var(--text-tertiary);
    }

    .chart-content {
      min-height: 250px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chart-content :deep(canvas) {
      max-height: 250px;
    }

    .chart-legend {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
      margin-top: var(--space-4);
      padding-top: var(--space-4);
      border-top: 1px solid var(--border-color);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: var(--radius-sm);
    }

    .legend-label {
      color: var(--text-secondary);
    }

    .legend-value {
      font-weight: 600;
      color: var(--text-primary);
    }

    /* Report Section */
    .report-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-4);
    }

    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }

    .stat-card {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      padding: var(--space-4);
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      background: var(--primary-50);
      color: var(--primary-600);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    :host-context([data-theme="dark"]) .stat-icon {
      background: rgba(16, 185, 129, 0.15);
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-value {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    /* Table Card */
    .table-card {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      overflow: hidden;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4);
      border-bottom: 1px solid var(--border-color);
    }

    .table-header h3 {
      font-family: var(--font-display);
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .equipment-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .equipment-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .equipment-id {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .uptime-cell {
      font-family: var(--font-mono);
      font-weight: 600;
    }

    .uptime-cell.good { color: var(--primary-600); }
    .uptime-cell.warning { color: var(--warning-600); }
    .uptime-cell.danger { color: var(--alert-600); }

    .mono {
      font-family: var(--font-mono);
    }

    /* Financial Summary */
    .financial-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-4);
    }

    @media (max-width: 1024px) {
      .financial-summary {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .summary-card {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      padding: var(--space-5);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .summary-card h4 {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--text-secondary);
      margin: 0;
    }

    .summary-value {
      font-family: var(--font-display);
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--text-primary);
    }

    .summary-change {
      font-size: var(--text-sm);
    }

    .summary-change.positive { color: var(--primary-600); }
    .summary-change.negative { color: var(--alert-600); }

    .summary-note {
      font-size: var(--text-sm);
      color: var(--text-tertiary);
    }

    @media (max-width: 768px) {
      .header-actions {
        flex-wrap: wrap;
      }
    }
  `]
})
export class ReportsComponent implements OnInit {
  mockDataService = inject(MockDataService);
  authService = inject(AuthService);
  messageService = inject(MessageService);

  // Expose enum for template use
  UserRole = UserRole;

  stats = this.mockDataService.dashboardStats;
  equipment = this.mockDataService.equipment;
  inventory = this.mockDataService.inventory;
  maintenanceRecords = this.mockDataService.maintenanceRecords;

  activeTab = 'overview';
  selectedPeriod = 'month';

  periodOptions = [
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Quarter', value: 'quarter' },
    { label: 'This Year', value: 'year' }
  ];

  // Chart options
  doughnutOptions = {
    plugins: { legend: { display: false } },
    cutout: '65%',
    responsive: true,
    maintainAspectRatio: false
  };

  pieOptions = {
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
    responsive: true,
    maintainAspectRatio: false
  };

  barOptions = {
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
    responsive: true,
    maintainAspectRatio: false
  };

  horizontalBarOptions = {
    indexAxis: 'y' as const,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true } },
    responsive: true,
    maintainAspectRatio: false
  };

  lineOptions = {
    plugins: { legend: { position: 'bottom' as const } },
    scales: { y: { beginAtZero: true } },
    responsive: true,
    maintainAspectRatio: false
  };

  stackedBarOptions = {
    plugins: { legend: { position: 'bottom' as const } },
    scales: { 
      x: { stacked: true }, 
      y: { stacked: true, beginAtZero: true } 
    },
    responsive: true,
    maintainAspectRatio: false
  };

  // Chart data
  equipmentStatusData: any;
  equipmentStatusLegend: any[] = [];
  maintenanceTrendData: any;
  conditionData: any;
  inventoryStatusData: any;
  equipmentByDeptData: any;
  equipmentAgeData: any;
  riskLevelData: any;
  maintenanceCostTrendData: any;
  maintenanceByTypeData: any;
  technicianWorkloadData: any;
  inventoryByCategoryData: any;
  stockMovementData: any;
  inventoryValueData: any;
  costOverviewData: any;
  costDistributionData: any;
  budgetVsActualData: any;

  // Summary data
  equipmentSummary = [
    { name: 'Portable X-Ray System', id: 'MED-2024-001', department: 'Radiology', status: 'In Service', uptime: 98, maintenanceCost: 2500, lastService: 'Dec 1, 2024' },
    { name: 'Patient Monitor Pro', id: 'MED-2024-002', department: 'ICU', status: 'In Service', uptime: 95, maintenanceCost: 1800, lastService: 'Nov 15, 2024' },
    { name: 'Ultrasound System', id: 'MED-2024-003', department: 'Imaging', status: 'Under Maintenance', uptime: 72, maintenanceCost: 4200, lastService: 'Oct 20, 2024' },
    { name: 'Ventilator System', id: 'MED-2024-004', department: 'ICU', status: 'In Service', uptime: 99, maintenanceCost: 950, lastService: 'Dec 10, 2024' },
    { name: 'ECG Machine', id: 'MED-2024-005', department: 'Cardiology', status: 'In Service', uptime: 91, maintenanceCost: 1200, lastService: 'Nov 28, 2024' }
  ];

  criticalInventory = [
    { name: 'Disposable Syringes 10ml', sku: 'CON-001', category: 'Consumables', current: 85, reorder: 100, unit: 'units', status: 'Low Stock' },
    { name: 'Nitrile Gloves Medium', sku: 'CON-002', category: 'Consumables', current: 0, reorder: 500, unit: 'boxes', status: 'Out of Stock' },
    { name: 'Oxygen Sensor', sku: 'SP-001', category: 'Spare Parts', current: 3, reorder: 5, unit: 'units', status: 'Low Stock' },
    { name: 'Blood Collection Tubes', sku: 'CON-003', category: 'Consumables', current: 45, reorder: 100, unit: 'boxes', status: 'Low Stock' }
  ];

  operationalRate = computed(() => {
    const total = this.stats().totalEquipment;
    const active = this.stats().activeEquipment;
    return total > 0 ? (active / total) * 100 : 0;
  });

  ngOnInit(): void {
    this.initializeChartData();
  }

  initializeChartData(): void {
    // Equipment Status
    this.equipmentStatusData = {
      labels: ['In Service', 'Under Maintenance', 'Awaiting Repair', 'Out of Service'],
      datasets: [{
        data: [7, 1, 1, 1],
        backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#f43f5e']
      }]
    };

    this.equipmentStatusLegend = [
      { label: 'In Service', value: 7, color: '#10b981' },
      { label: 'Under Maintenance', value: 1, color: '#f59e0b' },
      { label: 'Awaiting Repair', value: 1, color: '#3b82f6' },
      { label: 'Out of Service', value: 1, color: '#f43f5e' }
    ];

    // Maintenance Trend
    this.maintenanceTrendData = {
      labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Preventive',
          data: [12, 15, 10, 14, 18, 16],
          backgroundColor: '#10b981'
        },
        {
          label: 'Corrective',
          data: [5, 3, 8, 4, 6, 3],
          backgroundColor: '#f59e0b'
        },
        {
          label: 'Emergency',
          data: [1, 0, 2, 1, 0, 1],
          backgroundColor: '#f43f5e'
        }
      ]
    };

    // Equipment Condition
    this.conditionData = {
      labels: ['Excellent', 'Good', 'Fair', 'Poor'],
      datasets: [{
        data: [4, 3, 2, 1],
        backgroundColor: ['#10b981', '#22c55e', '#f59e0b', '#f43f5e']
      }]
    };

    // Inventory Status
    this.inventoryStatusData = {
      labels: ['In Stock', 'Low Stock', 'Out of Stock'],
      datasets: [{
        data: [5, 2, 1],
        backgroundColor: ['#10b981', '#f59e0b', '#f43f5e']
      }]
    };

    // Equipment by Department
    this.equipmentByDeptData = {
      labels: ['Radiology', 'ICU', 'Surgery', 'Laboratory', 'Cardiology'],
      datasets: [{
        data: [3, 4, 2, 2, 1],
        backgroundColor: '#10b981'
      }]
    };

    // Equipment Age
    this.equipmentAgeData = {
      labels: ['< 1 year', '1-3 years', '3-5 years', '5-7 years', '> 7 years'],
      datasets: [{
        data: [3, 4, 2, 1, 0],
        backgroundColor: ['#10b981', '#22c55e', '#f59e0b', '#f97316', '#f43f5e']
      }]
    };

    // Risk Level
    this.riskLevelData = {
      labels: ['Low', 'Medium', 'High'],
      datasets: [{
        data: [4, 4, 2],
        backgroundColor: ['#10b981', '#f59e0b', '#f43f5e']
      }]
    };

    // Maintenance Cost Trend
    this.maintenanceCostTrendData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        label: 'Maintenance Cost',
        data: [35000, 42000, 38000, 45000, 52000, 48000, 41000, 39000, 44000, 47000, 43000, 45750],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };

    // Maintenance by Type
    this.maintenanceByTypeData = {
      labels: ['Preventive', 'Corrective', 'Calibration', 'Safety', 'Emergency'],
      datasets: [{
        data: [45, 25, 15, 10, 5],
        backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#f43f5e']
      }]
    };

    // Technician Workload
    this.technicianWorkloadData = {
      labels: ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Wilson'],
      datasets: [{
        data: [24, 18, 21, 15],
        backgroundColor: '#10b981'
      }]
    };

    // Inventory by Category
    this.inventoryByCategoryData = {
      labels: ['Consumables', 'Spare Parts', 'Reagents', 'Tools', 'Safety'],
      datasets: [{
        data: [35, 25, 20, 12, 8],
        backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#f43f5e']
      }]
    };

    // Stock Movement
    this.stockMovementData = {
      labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Stock In',
          data: [150, 180, 160, 200, 170, 190],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true
        },
        {
          label: 'Stock Out',
          data: [120, 140, 150, 180, 160, 175],
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          fill: true
        }
      ]
    };

    // Inventory Value
    this.inventoryValueData = {
      labels: ['Consumables', 'Spare Parts', 'Reagents', 'Tools', 'Safety'],
      datasets: [{
        data: [45000, 85000, 35000, 15000, 12000],
        backgroundColor: '#3b82f6'
      }]
    };

    // Cost Overview
    this.costOverviewData = {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          label: 'Maintenance',
          data: [115000, 145000, 124000, 135000],
          backgroundColor: '#10b981'
        },
        {
          label: 'Repairs',
          data: [35000, 28000, 42000, 31000],
          backgroundColor: '#f59e0b'
        },
        {
          label: 'Parts',
          data: [22000, 18000, 25000, 21000],
          backgroundColor: '#3b82f6'
        }
      ]
    };

    // Cost Distribution
    this.costDistributionData = {
      labels: ['Labor', 'Parts', 'Services', 'Other'],
      datasets: [{
        data: [45, 30, 20, 5],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']
      }]
    };

    // Budget vs Actual
    this.budgetVsActualData = {
      labels: ['Maintenance', 'Repairs', 'Upgrades', 'Training'],
      datasets: [
        {
          label: 'Budget',
          data: [150000, 50000, 75000, 25000],
          backgroundColor: 'rgba(16, 185, 129, 0.5)'
        },
        {
          label: 'Actual',
          data: [135000, 58000, 62000, 22000],
          backgroundColor: '#10b981'
        }
      ]
    };
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'In Service': 'success',
      'Under Maintenance': 'warn',
      'Awaiting Repair': 'info',
      'Out of Service': 'danger'
    };
    return map[status] || 'info';
  }
}
