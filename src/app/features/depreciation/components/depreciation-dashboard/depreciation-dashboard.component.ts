import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { DepreciationService } from '@core/services/depreciation.service';
import { DepreciationConfig, DepreciationStatus, DepreciationMethod } from '@shared/models';

@Component({
  selector: 'app-depreciation-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    ButtonModule,
    ChartModule,
    TableModule,
    TagModule,
    TooltipModule,
    ProgressBarModule,
    CurrencyPipe
  ],
  template: `
    <div class="depreciation-dashboard">
      <!-- Header -->
      <div class="dashboard-header">
        <div class="header-content">
          <h1>Depreciation Tracking</h1>
          <p>Monitor asset depreciation and book values</p>
        </div>
        <div class="header-actions">
          <button pButton
            label="Generate Report"
            icon="pi pi-file-export"
            class="p-button-outlined"
            [routerLink]="['/depreciation/reports']"
          ></button>
          <button pButton
            label="Configure Asset"
            icon="pi pi-plus"
            [routerLink]="['/depreciation/configure']"
          ></button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-grid">
        <p-card styleClass="summary-card">
          <div class="summary-content">
            <div class="summary-icon book-value">
              <i class="pi pi-wallet"></i>
            </div>
            <div class="summary-info">
              <span class="summary-label">Total Book Value</span>
              <span class="summary-value">{{ depreciationService.totalBookValue() | currency }}</span>
            </div>
          </div>
        </p-card>

        <p-card styleClass="summary-card">
          <div class="summary-content">
            <div class="summary-icon accumulated">
              <i class="pi pi-chart-line"></i>
            </div>
            <div class="summary-info">
              <span class="summary-label">Accumulated Depreciation</span>
              <span class="summary-value">{{ depreciationService.totalAccumulatedDepreciation() | currency }}</span>
            </div>
          </div>
        </p-card>

        <p-card styleClass="summary-card">
          <div class="summary-content">
            <div class="summary-icon monthly">
              <i class="pi pi-calendar"></i>
            </div>
            <div class="summary-info">
              <span class="summary-label">Monthly Expense</span>
              <span class="summary-value">{{ depreciationService.summary()?.depreciationExpenseThisMonth | currency }}</span>
            </div>
          </div>
        </p-card>

        <p-card styleClass="summary-card">
          <div class="summary-content">
            <div class="summary-icon ytd">
              <i class="pi pi-chart-bar"></i>
            </div>
            <div class="summary-info">
              <span class="summary-label">YTD Expense</span>
              <span class="summary-value">{{ depreciationService.summary()?.depreciationExpenseYTD | currency }}</span>
            </div>
          </div>
        </p-card>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-number">{{ depreciationService.activeConfigs().length }}</span>
          <span class="stat-label">Active Assets</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ depreciationService.fullyDepreciatedConfigs().length }}</span>
          <span class="stat-label">Fully Depreciated</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ depreciationService.summary()?.upcomingFullyDepreciated?.length || 0 }}</span>
          <span class="stat-label">Expiring in 90 Days</span>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <p-card header="Depreciation by Method" styleClass="chart-card">
          <p-chart type="doughnut" [data]="methodChartData" [options]="doughnutOptions" />
        </p-card>

        <p-card header="Book Value by Department" styleClass="chart-card">
          <p-chart type="bar" [data]="departmentChartData" [options]="barChartOptions" />
        </p-card>
      </div>

      <!-- Assets Table -->
      <p-card header="Depreciating Assets" styleClass="table-card">
        <p-table
          [value]="depreciationService.configs()"
          [paginator]="true"
          [rows]="10"
          styleClass="p-datatable-sm"
          [globalFilterFields]="['equipmentName', 'equipmentInventoryNumber']"
        >
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="equipmentName">
                Asset <p-sortIcon field="equipmentName" />
              </th>
              <th pSortableColumn="method">
                Method <p-sortIcon field="method" />
              </th>
              <th pSortableColumn="acquisitionCost" style="text-align: right">
                Cost <p-sortIcon field="acquisitionCost" />
              </th>
              <th pSortableColumn="currentBookValue" style="text-align: right">
                Book Value <p-sortIcon field="currentBookValue" />
              </th>
              <th style="width: 200px">Progress</th>
              <th pSortableColumn="status">
                Status <p-sortIcon field="status" />
              </th>
              <th style="width: 100px"></th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-config>
            <tr>
              <td>
                <div class="asset-cell">
                  <span class="asset-name">{{ config.equipmentName }}</span>
                  <span class="asset-number">{{ config.equipmentInventoryNumber }}</span>
                </div>
              </td>
              <td>
                <span class="method-badge">{{ getMethodShort(config.method) }}</span>
              </td>
              <td style="text-align: right">
                <span class="currency-value">{{ config.acquisitionCost | currency }}</span>
              </td>
              <td style="text-align: right">
                <span class="currency-value book-value">{{ config.currentBookValue | currency }}</span>
              </td>
              <td>
                <div class="progress-cell">
                  <p-progressBar
                    [value]="config.percentDepreciated"
                    [showValue]="false"
                    styleClass="depreciation-progress"
                  />
                  <span class="progress-label">{{ config.percentDepreciated | number:'1.0-1' }}%</span>
                </div>
              </td>
              <td>
                <p-tag
                  [value]="config.status"
                  [severity]="getStatusSeverity(config.status)"
                />
              </td>
              <td>
                <button pButton
                  icon="pi pi-eye"
                  class="p-button-text p-button-sm"
                  [routerLink]="['/depreciation/schedule', config.id]"
                  pTooltip="View Schedule"
                ></button>
                <button pButton
                  icon="pi pi-pencil"
                  class="p-button-text p-button-sm"
                  [routerLink]="['/depreciation/configure', config.equipmentId]"
                  pTooltip="Edit Config"
                ></button>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7" class="empty-message">
                <div class="empty-state">
                  <i class="pi pi-chart-line"></i>
                  <h3>No depreciation configured</h3>
                  <p>Configure depreciation for your equipment assets.</p>
                  <button pButton
                    label="Configure Asset"
                    icon="pi pi-plus"
                    [routerLink]="['/depreciation/configure']"
                  ></button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>
  `,
  styles: [`
    .depreciation-dashboard {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-content h1 {
      margin: 0 0 0.25rem 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .header-content p {
      margin: 0;
      color: var(--text-muted);
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    /* Summary Grid */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    @media (max-width: 1200px) {
      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .summary-grid {
        grid-template-columns: 1fr;
      }
    }

    :host ::ng-deep .summary-card {
      .p-card-body {
        padding: 1.25rem;
      }
      .p-card-content {
        padding: 0;
      }
    }

    .summary-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .summary-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .summary-icon i {
      font-size: 1.5rem;
    }

    .summary-icon.book-value {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .summary-icon.accumulated {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    .summary-icon.monthly {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .summary-icon.ytd {
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
    }

    .summary-info {
      display: flex;
      flex-direction: column;
    }

    .summary-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .summary-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    /* Stats Row */
    .stats-row {
      display: flex;
      gap: 2rem;
      padding: 1rem 1.5rem;
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
    }

    @media (max-width: 640px) {
      .stats-row {
        flex-direction: column;
        gap: 1rem;
      }
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .stat-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-600);
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    /* Charts Row */
    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    @media (max-width: 1024px) {
      .charts-row {
        grid-template-columns: 1fr;
      }
    }

    :host ::ng-deep .chart-card {
      .p-card-body {
        padding: 1.25rem;
      }
      .p-card-content {
        padding: 0;
      }
    }

    /* Table */
    :host ::ng-deep .table-card {
      .p-card-body {
        padding: 1.25rem;
      }
      .p-card-content {
        padding: 0;
      }
    }

    .asset-cell {
      display: flex;
      flex-direction: column;
    }

    .asset-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .asset-number {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .method-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .currency-value {
      font-family: var(--font-mono);
    }

    .currency-value.book-value {
      font-weight: 600;
      color: var(--primary-600);
    }

    .progress-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    :host ::ng-deep .depreciation-progress {
      flex: 1;
      height: 8px;
    }

    .progress-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      min-width: 40px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      text-align: center;
    }

    .empty-state i {
      font-size: 3rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      color: var(--text-primary);
    }

    .empty-state p {
      margin: 0 0 1.5rem 0;
      color: var(--text-muted);
    }
  `]
})
export class DepreciationDashboardComponent implements OnInit {
  depreciationService = inject(DepreciationService);

  methodChartData: any;
  departmentChartData: any;
  doughnutOptions: any;
  barChartOptions: any;

  ngOnInit(): void {
    this.loadData();
    this.setupCharts();
  }

  loadData(): void {
    this.depreciationService.listConfigs().subscribe();
    this.depreciationService.getSummary().subscribe();
  }

  setupCharts(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#374151';
    const surfaceBorder = documentStyle.getPropertyValue('--border-color') || '#e5e7eb';

    // Method Chart
    this.methodChartData = {
      labels: ['Straight Line', 'Double Declining', 'Sum of Years'],
      datasets: [{
        data: [3, 1, 1],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
        hoverBackgroundColor: ['#059669', '#2563eb', '#d97706']
      }]
    };

    this.doughnutOptions = {
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            usePointStyle: true,
            padding: 16
          }
        }
      },
      maintainAspectRatio: false
    };

    // Department Chart
    this.departmentChartData = {
      labels: ['Radiology', 'ICU', 'Surgery', 'General'],
      datasets: [{
        label: 'Book Value',
        data: [1350000, 41000, 54400, 500],
        backgroundColor: '#10b981'
      }]
    };

    this.barChartOptions = {
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: textColor,
            callback: (value: number) => '$' + (value / 1000) + 'K'
          },
          grid: {
            color: surfaceBorder
          }
        },
        x: {
          ticks: {
            color: textColor
          },
          grid: {
            display: false
          }
        }
      },
      maintainAspectRatio: false
    };
  }

  getMethodShort(method: DepreciationMethod): string {
    switch (method) {
      case DepreciationMethod.STRAIGHT_LINE: return 'SL';
      case DepreciationMethod.DECLINING_BALANCE: return 'DB';
      case DepreciationMethod.DOUBLE_DECLINING_BALANCE: return 'DDB';
      case DepreciationMethod.SUM_OF_YEARS_DIGITS: return 'SYD';
      case DepreciationMethod.UNITS_OF_PRODUCTION: return 'UOP';
      default: return 'SL';
    }
  }

  getStatusSeverity(status: DepreciationStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case DepreciationStatus.ACTIVE: return 'success';
      case DepreciationStatus.FULLY_DEPRECIATED: return 'info';
      case DepreciationStatus.SUSPENDED: return 'warn';
      case DepreciationStatus.DISPOSED: return 'secondary';
      default: return 'secondary';
    }
  }
}
