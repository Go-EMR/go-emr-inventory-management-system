import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { DepreciationService } from '@core/services/depreciation.service';
import {
  DepreciationConfig,
  DepreciationScheduleEntry,
  DepreciationCalculationRequest,
  DepreciationCalculationResult
} from '@shared/models';

@Component({
  selector: 'app-depreciation-schedule',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    ChartModule,
    ProgressBarModule,
    TooltipModule,
    CurrencyPipe
  ],
  template: `
    <div class="depreciation-schedule-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button pButton
            icon="pi pi-arrow-left"
            class="p-button-text p-button-secondary"
            [routerLink]="['/depreciation']"
          ></button>
          <div class="header-info">
            @if (config()) {
              <h1>{{ config()!.equipmentName }}</h1>
              <p>Depreciation Schedule</p>
            }
          </div>
        </div>
        <div class="header-actions">
          <button pButton
            label="Export"
            icon="pi pi-download"
            class="p-button-outlined"
          ></button>
          <button pButton
            label="Print"
            icon="pi pi-print"
            class="p-button-outlined"
          ></button>
        </div>
      </div>

      @if (config()) {
        <!-- Summary Cards -->
        <div class="summary-row">
          <p-card styleClass="summary-card">
            <div class="summary-item">
              <label>Acquisition Cost</label>
              <span class="value">{{ config()!.acquisitionCost | currency }}</span>
            </div>
          </p-card>
          <p-card styleClass="summary-card">
            <div class="summary-item">
              <label>Current Book Value</label>
              <span class="value highlight">{{ config()!.currentBookValue | currency }}</span>
            </div>
          </p-card>
          <p-card styleClass="summary-card">
            <div class="summary-item">
              <label>Accumulated Depreciation</label>
              <span class="value">{{ config()!.accumulatedDepreciation | currency }}</span>
            </div>
          </p-card>
          <p-card styleClass="summary-card">
            <div class="summary-item">
              <label>Salvage Value</label>
              <span class="value">{{ config()!.salvageValue | currency }}</span>
            </div>
          </p-card>
        </div>

        <!-- Progress Section -->
        <p-card styleClass="progress-card">
          <div class="progress-section">
            <div class="progress-header">
              <div>
                <span class="progress-label">Depreciation Progress</span>
                <span class="progress-value">{{ config()!.percentDepreciated | number:'1.1-1' }}%</span>
              </div>
              <div class="progress-info">
                <span>{{ config()!.method }}</span>
                <span>•</span>
                <span>{{ config()!.usefulLifeYears }} years</span>
                <span>•</span>
                <span>{{ config()!.period }}</span>
              </div>
            </div>
            <p-progressBar
              [value]="config()!.percentDepreciated"
              [showValue]="false"
              styleClass="schedule-progress"
            />
            <div class="progress-dates">
              <span>Started: {{ config()!.depreciationStartDate | date:'mediumDate' }}</span>
              <span>Expected End: {{ config()!.expectedEndDate | date:'mediumDate' }}</span>
            </div>
          </div>
        </p-card>

        <!-- Chart -->
        <p-card header="Book Value Over Time" styleClass="chart-card">
          <p-chart type="line" [data]="chartData" [options]="chartOptions" />
        </p-card>

        <!-- Schedule Table -->
        <p-card header="Depreciation Schedule" styleClass="table-card">
          <p-table
            [value]="schedule()"
            [paginator]="true"
            [rows]="12"
            [rowsPerPageOptions]="[12, 24, 48, 120]"
            styleClass="p-datatable-sm p-datatable-gridlines"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} periods"
          >
            <ng-template pTemplate="header">
              <tr>
                <th style="width: 80px">Period</th>
                <th>Period Dates</th>
                <th style="text-align: right">Beginning Value</th>
                <th style="text-align: right">Depreciation</th>
                <th style="text-align: right">Accumulated</th>
                <th style="text-align: right">Ending Value</th>
                <th style="width: 100px">Status</th>
              </tr>
            </ng-template>

            <ng-template pTemplate="body" let-entry let-rowIndex="rowIndex">
              <tr [class.current-period]="isCurrentPeriod(entry)" [class.past-period]="isPastPeriod(entry)">
                <td>
                  <span class="period-number">{{ entry.periodNumber }}</span>
                </td>
                <td>
                  <span class="period-dates">
                    {{ entry.periodStartDate | date:'MMM y' }}
                  </span>
                </td>
                <td style="text-align: right">
                  <span class="currency">{{ entry.beginningBookValue | currency }}</span>
                </td>
                <td style="text-align: right">
                  <span class="currency depreciation">{{ entry.depreciationExpense | currency }}</span>
                </td>
                <td style="text-align: right">
                  <span class="currency">{{ entry.accumulatedDepreciation | currency }}</span>
                </td>
                <td style="text-align: right">
                  <span class="currency book-value">{{ entry.endingBookValue | currency }}</span>
                </td>
                <td>
                  @if (isCurrentPeriod(entry)) {
                    <p-tag value="Current" severity="warn" />
                  } @else if (isPastPeriod(entry)) {
                    <p-tag value="Recorded" severity="success" />
                  } @else {
                    <p-tag value="Projected" severity="secondary" />
                  }
                </td>
              </tr>
            </ng-template>

            <ng-template pTemplate="footer">
              <tr class="footer-row">
                <td colspan="3"><strong>Totals</strong></td>
                <td style="text-align: right">
                  <strong>{{ getTotalDepreciation() | currency }}</strong>
                </td>
                <td></td>
                <td style="text-align: right">
                  <strong>{{ config()!.salvageValue | currency }}</strong>
                </td>
                <td></td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>
      } @else {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Loading schedule...</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .depreciation-schedule-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-left {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .header-info h1 {
      margin: 0 0 0.25rem 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .header-info p {
      margin: 0;
      color: var(--text-muted);
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
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
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      font-family: var(--font-mono);
    }

    .summary-item .value.highlight {
      color: var(--primary-600);
    }

    /* Progress Card */
    :host ::ng-deep .progress-card {
      .p-card-body {
        padding: 1.25rem;
      }
      .p-card-content {
        padding: 0;
      }
    }

    .progress-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .progress-label {
      font-weight: 600;
      color: var(--text-primary);
      margin-right: 0.5rem;
    }

    .progress-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary-600);
    }

    .progress-info {
      display: flex;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    :host ::ng-deep .schedule-progress {
      height: 12px;
    }

    .progress-dates {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* Chart Card */
    :host ::ng-deep .chart-card {
      .p-card-body {
        padding: 1.25rem;
      }
      .p-card-content {
        padding: 0;
      }
    }

    /* Table Card */
    :host ::ng-deep .table-card {
      .p-card-body {
        padding: 1.25rem;
      }
      .p-card-content {
        padding: 0;
      }
    }

    .period-number {
      font-weight: 600;
      color: var(--text-secondary);
    }

    .period-dates {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .currency {
      font-family: var(--font-mono);
      font-size: 0.875rem;
    }

    .currency.depreciation {
      color: var(--alert-500);
    }

    .currency.book-value {
      font-weight: 600;
      color: var(--primary-600);
    }

    :host ::ng-deep .current-period {
      background: rgba(245, 158, 11, 0.1) !important;
    }

    :host ::ng-deep .past-period {
      background: rgba(16, 185, 129, 0.05) !important;
    }

    .footer-row {
      background: var(--bg-secondary) !important;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: var(--text-muted);
    }

    .loading-state i {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
  `]
})
export class DepreciationScheduleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  depreciationService = inject(DepreciationService);

  config = signal<DepreciationConfig | null>(null);
  schedule = signal<DepreciationScheduleEntry[]>([]);
  calculationResult = signal<DepreciationCalculationResult | null>(null);

  chartData: any;
  chartOptions: any;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadData(id);
    }
  }

  loadData(configId: string): void {
    this.depreciationService.getConfig(configId).subscribe(config => {
      if (config) {
        this.config.set(config);
        this.generateSchedule(config);
      }
    });
  }

  generateSchedule(config: DepreciationConfig): void {
    const request: DepreciationCalculationRequest = {
      equipmentId: config.equipmentId,
      method: config.method,
      acquisitionCost: config.acquisitionCost,
      salvageValue: config.salvageValue,
      usefulLifeYears: config.usefulLifeYears,
      placedInServiceDate: config.placedInServiceDate,
      period: config.period,
      totalUnits: config.totalUnits
    };

    this.depreciationService.calculateDepreciation(request).subscribe(result => {
      this.calculationResult.set(result);
      this.schedule.set(result.schedule);
      this.setupChart(result.schedule);
    });
  }

  setupChart(schedule: DepreciationScheduleEntry[]): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-primary') || '#374151';
    const surfaceBorder = documentStyle.getPropertyValue('--border-color') || '#e5e7eb';

    // Sample every 12th period for annual view, or less if fewer periods
    const sampledSchedule = schedule.filter((_, idx) =>
      idx === 0 || idx === schedule.length - 1 || (idx + 1) % 12 === 0
    );

    this.chartData = {
      labels: sampledSchedule.map(e => `Year ${Math.ceil(e.periodNumber / 12)}`),
      datasets: [
        {
          label: 'Book Value',
          data: sampledSchedule.map(e => e.endingBookValue),
          fill: true,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4
        },
        {
          label: 'Accumulated Depreciation',
          data: sampledSchedule.map(e => e.accumulatedDepreciation),
          fill: false,
          borderColor: '#f59e0b',
          tension: 0.4
        }
      ]
    };

    this.chartOptions = {
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            usePointStyle: true
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: textColor,
            callback: (value: number) => '$' + (value / 1000).toFixed(0) + 'K'
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

  isCurrentPeriod(entry: DepreciationScheduleEntry): boolean {
    const now = new Date();
    return entry.periodStartDate <= now && entry.periodEndDate >= now;
  }

  isPastPeriod(entry: DepreciationScheduleEntry): boolean {
    return entry.periodEndDate < new Date();
  }

  getTotalDepreciation(): number {
    const result = this.calculationResult();
    return result ? result.summary.totalDepreciation : 0;
  }
}
