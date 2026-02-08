import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DepreciationService } from '@core/services/depreciation.service';
import { DepreciationReport, DepreciationReportAsset, DepreciationMethod, DepreciationStatus } from '@shared/models';

@Component({
  selector: 'app-depreciation-reports',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    TableModule,
    TagModule,
    TooltipModule,
    CurrencyPipe
  ],
  template: `
    <div class="depreciation-reports-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button pButton
            icon="pi pi-arrow-left"
            class="p-button-text p-button-secondary"
            [routerLink]="['/depreciation']"
          ></button>
          <h1>Depreciation Reports</h1>
        </div>
        <div class="header-actions">
          <button pButton
            label="Export PDF"
            icon="pi pi-file-pdf"
            class="p-button-outlined"
            [disabled]="!report()"
          ></button>
          <button pButton
            label="Export Excel"
            icon="pi pi-file-excel"
            class="p-button-outlined"
            [disabled]="!report()"
          ></button>
        </div>
      </div>

      <!-- Filters -->
      <p-card styleClass="filters-card">
        <div class="filters-row">
          <div class="filter-field">
            <label>Report Type</label>
            <p-select
              [options]="reportTypeOptions"
              [(ngModel)]="selectedReportType"
              styleClass="w-full"
            />
          </div>
          <div class="filter-field">
            <label>Period Start</label>
            <p-datepicker
              [(ngModel)]="startDate"
              [showIcon]="true"
              dateFormat="mm/dd/yy"
              styleClass="w-full"
            />
          </div>
          <div class="filter-field">
            <label>Period End</label>
            <p-datepicker
              [(ngModel)]="endDate"
              [showIcon]="true"
              dateFormat="mm/dd/yy"
              styleClass="w-full"
            />
          </div>
          <div class="filter-actions">
            <button pButton
              label="Generate Report"
              icon="pi pi-sync"
              (click)="generateReport()"
              [loading]="isLoading"
            ></button>
          </div>
        </div>
      </p-card>

      @if (report()) {
        <!-- Report Summary -->
        <div class="summary-row">
          <p-card styleClass="summary-card">
            <div class="summary-item">
              <label>Total Assets</label>
              <span class="value">{{ report()!.assets.length }}</span>
            </div>
          </p-card>
          <p-card styleClass="summary-card">
            <div class="summary-item">
              <label>Acquisition Cost</label>
              <span class="value">{{ report()!.totals.acquisitionCost | currency }}</span>
            </div>
          </p-card>
          <p-card styleClass="summary-card">
            <div class="summary-item">
              <label>Accumulated Depreciation</label>
              <span class="value">{{ report()!.totals.accumulatedDepreciation | currency }}</span>
            </div>
          </p-card>
          <p-card styleClass="summary-card">
            <div class="summary-item">
              <label>Total Book Value</label>
              <span class="value highlight">{{ report()!.totals.bookValue | currency }}</span>
            </div>
          </p-card>
        </div>

        <!-- Report Table -->
        <p-card styleClass="table-card">
          <ng-template pTemplate="header">
            <div class="card-header">
              <span>{{ getReportTitle() }}</span>
              <span class="report-date">Generated: {{ report()!.reportDate | date:'medium' }}</span>
            </div>
          </ng-template>

          <p-table
            [value]="report()!.assets"
            [paginator]="true"
            [rows]="20"
            styleClass="p-datatable-sm p-datatable-gridlines"
            [globalFilterFields]="['equipmentName', 'inventoryNumber', 'department']"
          >
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="equipmentName">
                  Asset <p-sortIcon field="equipmentName" />
                </th>
                <th pSortableColumn="department">
                  Department <p-sortIcon field="department" />
                </th>
                <th pSortableColumn="method">
                  Method <p-sortIcon field="method" />
                </th>
                <th pSortableColumn="acquisitionCost" style="text-align: right">
                  Cost <p-sortIcon field="acquisitionCost" />
                </th>
                <th pSortableColumn="accumulatedDepreciation" style="text-align: right">
                  Accum. Depr. <p-sortIcon field="accumulatedDepreciation" />
                </th>
                <th pSortableColumn="bookValue" style="text-align: right">
                  Book Value <p-sortIcon field="bookValue" />
                </th>
                <th pSortableColumn="periodExpense" style="text-align: right">
                  Period Exp. <p-sortIcon field="periodExpense" />
                </th>
                <th style="width: 80px">% Depr.</th>
                <th pSortableColumn="status">
                  Status <p-sortIcon field="status" />
                </th>
              </tr>
            </ng-template>

            <ng-template pTemplate="body" let-asset>
              <tr>
                <td>
                  <div class="asset-cell">
                    <span class="asset-name">{{ asset.equipmentName }}</span>
                    <span class="asset-number">{{ asset.inventoryNumber }}</span>
                  </div>
                </td>
                <td>{{ asset.department }}</td>
                <td>
                  <span class="method-badge">{{ getMethodShort(asset.method) }}</span>
                </td>
                <td style="text-align: right">
                  <span class="currency">{{ asset.acquisitionCost | currency }}</span>
                </td>
                <td style="text-align: right">
                  <span class="currency">{{ asset.accumulatedDepreciation | currency }}</span>
                </td>
                <td style="text-align: right">
                  <span class="currency book-value">{{ asset.bookValue | currency }}</span>
                </td>
                <td style="text-align: right">
                  <span class="currency expense">{{ asset.periodExpense | currency }}</span>
                </td>
                <td>
                  <div class="percent-cell">
                    <div class="percent-bar" [style.width.%]="asset.percentDepreciated"></div>
                    <span>{{ asset.percentDepreciated | number:'1.0-0' }}%</span>
                  </div>
                </td>
                <td>
                  <p-tag
                    [value]="asset.status"
                    [severity]="getStatusSeverity(asset.status)"
                  />
                </td>
              </tr>
            </ng-template>

            <ng-template pTemplate="footer">
              <tr class="totals-row">
                <td colspan="3"><strong>Totals</strong></td>
                <td style="text-align: right">
                  <strong>{{ report()!.totals.acquisitionCost | currency }}</strong>
                </td>
                <td style="text-align: right">
                  <strong>{{ report()!.totals.accumulatedDepreciation | currency }}</strong>
                </td>
                <td style="text-align: right">
                  <strong>{{ report()!.totals.bookValue | currency }}</strong>
                </td>
                <td style="text-align: right">
                  <strong>{{ report()!.totals.periodExpense | currency }}</strong>
                </td>
                <td colspan="2"></td>
              </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="9" class="empty-message">
                  <div class="empty-state">
                    <i class="pi pi-chart-line"></i>
                    <p>No assets found for the selected criteria</p>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>
      } @else {
        <div class="no-report">
          <i class="pi pi-file"></i>
          <h3>No Report Generated</h3>
          <p>Select report parameters and click "Generate Report" to view depreciation data.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .depreciation-reports-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .header-left h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    /* Filters */
    :host ::ng-deep .filters-card {
      .p-card-body {
        padding: 1.25rem;
      }
      .p-card-content {
        padding: 0;
      }
    }

    .filters-row {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .filter-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: 180px;
    }

    .filter-field label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .filter-actions {
      margin-left: auto;
    }

    /* Summary Row */
    .summary-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    @media (max-width: 1200px) {
      .summary-row {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .summary-row {
        grid-template-columns: 1fr;
      }
    }

    :host ::ng-deep .summary-card {
      .p-card-body {
        padding: 1rem;
      }
      .p-card-content {
        padding: 0;
      }
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .summary-item label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .summary-item .value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      font-family: var(--font-mono);
    }

    .summary-item .value.highlight {
      color: var(--primary-600);
    }

    /* Table Card */
    :host ::ng-deep .table-card {
      .p-card-body {
        padding: 0;
      }
      .p-card-content {
        padding: 0;
      }
      .p-card-header {
        padding: 1rem 1.25rem;
        background: var(--bg-secondary);
        border-bottom: 1px solid var(--border-color);
      }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
    }

    .report-date {
      font-size: 0.75rem;
      font-weight: 400;
      color: var(--text-muted);
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
    }

    .currency {
      font-family: var(--font-mono);
      font-size: 0.875rem;
    }

    .currency.book-value {
      font-weight: 600;
      color: var(--primary-600);
    }

    .currency.expense {
      color: var(--alert-500);
    }

    .percent-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .percent-bar {
      height: 6px;
      background: var(--primary-500);
      border-radius: var(--radius-sm);
      min-width: 4px;
      max-width: 40px;
    }

    .percent-cell span {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .totals-row {
      background: var(--bg-secondary) !important;
    }

    .no-report {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      text-align: center;
    }

    .no-report i {
      font-size: 3rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .no-report h3 {
      margin: 0 0 0.5rem 0;
      color: var(--text-primary);
    }

    .no-report p {
      margin: 0;
      color: var(--text-muted);
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted);
    }

    .empty-state i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
  `]
})
export class DepreciationReportsComponent implements OnInit {
  depreciationService = inject(DepreciationService);

  report = signal<DepreciationReport | null>(null);
  isLoading = false;

  selectedReportType: 'summary' | 'detail' | 'schedule' | 'variance' = 'summary';
  startDate: Date = new Date(new Date().getFullYear(), 0, 1);
  endDate: Date = new Date();

  reportTypeOptions = [
    { label: 'Summary Report', value: 'summary' },
    { label: 'Detail Report', value: 'detail' },
    { label: 'Schedule Report', value: 'schedule' },
    { label: 'Variance Report', value: 'variance' }
  ];

  ngOnInit(): void {
    this.generateReport();
  }

  generateReport(): void {
    this.isLoading = true;
    this.depreciationService.generateReport(
      this.selectedReportType,
      this.startDate,
      this.endDate
    ).subscribe({
      next: (report) => {
        this.report.set(report);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  getReportTitle(): string {
    switch (this.selectedReportType) {
      case 'summary': return 'Depreciation Summary Report';
      case 'detail': return 'Depreciation Detail Report';
      case 'schedule': return 'Depreciation Schedule Report';
      case 'variance': return 'Depreciation Variance Report';
      default: return 'Depreciation Report';
    }
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
