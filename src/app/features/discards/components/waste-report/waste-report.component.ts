import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';
import { DiscardService } from '@core/services/discard.service';
import { WasteReport, WasteByReason, WasteByItem, WasteByMonth } from '@shared/models';

@Component({
  selector: 'app-waste-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    DatePickerModule,
    ChartModule,
    TableModule,
    ToastModule,
    ProgressBarModule
  ],
  providers: [MessageService],
  template: `
    <div class="waste-report">
      <div class="page-header">
        <div class="header-content">
          <button pButton icon="pi pi-arrow-left" class="p-button-text" (click)="goBack()"></button>
          <div>
            <h1>Waste Report</h1>
            <p class="subtitle">Analyze inventory waste and disposal trends</p>
          </div>
        </div>
        <div class="header-actions">
          <button pButton label="Export Report" icon="pi pi-download" class="p-button-outlined" (click)="exportReport()"></button>
        </div>
      </div>

      <!-- Date Range Selection -->
      <div class="date-range-section">
        <div class="date-inputs">
          <div class="date-field">
            <label>Start Date</label>
            <p-datepicker
              [(ngModel)]="startDate"
              [showIcon]="true"
              dateFormat="yy-mm-dd"
              [maxDate]="endDate"
              (onSelect)="loadReport()"
            ></p-datepicker>
          </div>
          <div class="date-field">
            <label>End Date</label>
            <p-datepicker
              [(ngModel)]="endDate"
              [showIcon]="true"
              dateFormat="yy-mm-dd"
              [minDate]="startDate"
              [maxDate]="today"
              (onSelect)="loadReport()"
            ></p-datepicker>
          </div>
        </div>
        <div class="quick-ranges">
          <button pButton label="Last 7 Days" class="p-button-text p-button-sm" (click)="setDateRange(7)"></button>
          <button pButton label="Last 30 Days" class="p-button-text p-button-sm" (click)="setDateRange(30)"></button>
          <button pButton label="Last 90 Days" class="p-button-text p-button-sm" (click)="setDateRange(90)"></button>
          <button pButton label="This Year" class="p-button-text p-button-sm" (click)="setYearToDate()"></button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <p-progressBar mode="indeterminate" [style]="{'height': '4px'}"></p-progressBar>
          <p>Loading report data...</p>
        </div>
      } @else if (report()) {
        <!-- Summary Cards -->
        <div class="summary-cards">
          <div class="summary-card">
            <div class="card-icon discards">
              <i class="pi pi-trash"></i>
            </div>
            <div class="card-content">
              <span class="card-value">{{ report()!.totalDiscards }}</span>
              <span class="card-label">Total Discards</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon quantity">
              <i class="pi pi-box"></i>
            </div>
            <div class="card-content">
              <span class="card-value">{{ report()!.totalQuantity | number }}</span>
              <span class="card-label">Items Discarded</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon cost">
              <i class="pi pi-dollar"></i>
            </div>
            <div class="card-content">
              <span class="card-value">{{ report()!.totalCost | currency }}</span>
              <span class="card-label">Total Waste Cost</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon average">
              <i class="pi pi-chart-line"></i>
            </div>
            <div class="card-content">
              <span class="card-value">{{ getAverageCostPerDiscard() | currency }}</span>
              <span class="card-label">Avg Cost per Discard</span>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="charts-row">
          <!-- Waste by Reason Chart -->
          <p-card header="Waste by Reason">
            <div class="chart-container">
              <p-chart type="doughnut" [data]="reasonChartData()" [options]="doughnutOptions"></p-chart>
            </div>
          </p-card>

          <!-- Monthly Trend Chart -->
          <p-card header="Monthly Trend">
            <div class="chart-container">
              <p-chart type="bar" [data]="monthlyChartData()" [options]="barOptions"></p-chart>
            </div>
          </p-card>
        </div>

        <!-- By Reason Table -->
        <p-card header="Breakdown by Reason" class="mt-3">
          <p-table [value]="report()!.byReason" [rowHover]="true">
            <ng-template pTemplate="header">
              <tr>
                <th>Reason</th>
                <th>Count</th>
                <th>Quantity</th>
                <th>Cost</th>
                <th>% of Total</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-item>
              <tr>
                <td>
                  <span class="reason-badge" [style.background]="getReasonColor(item.reasonCode)">
                    {{ item.reasonName }}
                  </span>
                </td>
                <td>{{ item.count }}</td>
                <td>{{ item.quantity | number }}</td>
                <td>{{ item.cost | currency }}</td>
                <td>
                  <div class="percentage-bar">
                    <div class="bar-fill" [style.width.%]="item.percentage" [style.background]="getReasonColor(item.reasonCode)"></div>
                    <span class="percentage-value">{{ item.percentage | number:'1.1-1' }}%</span>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>

        <!-- Top Waste Items Table -->
        <p-card header="Top Items by Waste Cost" class="mt-3">
          <p-table [value]="report()!.byItem" [rowHover]="true" [rows]="10">
            <ng-template pTemplate="header">
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Discard Count</th>
                <th>Quantity</th>
                <th>Total Cost</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-item>
              <tr>
                <td>
                  <span class="item-name">{{ item.itemName }}</span>
                </td>
                <td>
                  <span class="item-sku">{{ item.itemSku }}</span>
                </td>
                <td>{{ item.count }}</td>
                <td>{{ item.quantity | number }}</td>
                <td class="cost-cell">{{ item.cost | currency }}</td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>
      } @else {
        <div class="no-data">
          <i class="pi pi-chart-bar"></i>
          <p>No waste data available for the selected period</p>
        </div>
      }

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .waste-report {
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;

      .header-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        h1 {
          margin: 0;
          font-size: 1.5rem;
          color: var(--text-primary);
        }

        .subtitle {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
      }
    }

    .date-range-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);

      @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
      }

      .date-inputs {
        display: flex;
        gap: 1rem;

        .date-field {
          label {
            display: block;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-secondary);
          }
        }
      }

      .quick-ranges {
        display: flex;
        gap: 0.25rem;
      }
    }

    .loading-container {
      text-align: center;
      padding: 3rem;

      p {
        margin-top: 1rem;
        color: var(--text-muted);
      }
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;

      @media (max-width: 1200px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .summary-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);

      .card-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;

        i { font-size: 1.5rem; }

        &.discards {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        &.quantity {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }

        &.cost {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
        }

        &.average {
          background: rgba(139, 92, 246, 0.15);
          color: #8b5cf6;
        }
      }

      .card-content {
        display: flex;
        flex-direction: column;

        .card-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .card-label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      }
    }

    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }

      .chart-container {
        height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .reason-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 500;
      color: white;
    }

    .percentage-bar {
      position: relative;
      height: 24px;
      background: var(--bg-secondary);
      border-radius: var(--radius-sm);
      overflow: hidden;

      .bar-fill {
        height: 100%;
        transition: width var(--transition-base);
      }

      .percentage-value {
        position: absolute;
        right: 0.5rem;
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-primary);
      }
    }

    .item-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .item-sku {
      font-family: monospace;
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .cost-cell {
      font-weight: 500;
      color: #ef4444;
    }

    .no-data {
      text-align: center;
      padding: 4rem;
      color: var(--text-muted);

      i {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.3;
      }

      p {
        margin: 0;
        font-size: 1rem;
      }
    }

    .mt-3 {
      margin-top: 1rem;
    }
  `]
})
export class WasteReportComponent implements OnInit {
  private readonly discardService = inject(DiscardService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  report = signal<WasteReport | null>(null);
  loading = signal(false);

  startDate = new Date();
  endDate = new Date();
  today = new Date();

  reasonChartData = signal<any>(null);
  monthlyChartData = signal<any>(null);

  doughnutOptions = {
    plugins: {
      legend: {
        position: 'bottom'
      }
    },
    maintainAspectRatio: false
  };

  barOptions = {
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    },
    maintainAspectRatio: false
  };

  private reasonColors: Record<string, string> = {
    'EXPIRED': '#ef4444',
    'DAMAGED': '#f59e0b',
    'CONTAMINATED': '#dc2626',
    'RECALLED': '#6366f1',
    'QUALITY_ISSUE': '#8b5cf6',
    'OPENED_UNUSED': '#3b82f6',
    'PARTIAL_USE': '#06b6d4',
    'SPILLAGE': '#14b8a6',
    'CONTROLLED_WASTE': '#ec4899',
    'OTHER': '#6b7280'
  };

  ngOnInit(): void {
    this.setDateRange(30);
  }

  setDateRange(days: number): void {
    this.endDate = new Date();
    this.startDate = new Date();
    this.startDate.setDate(this.startDate.getDate() - days);
    this.loadReport();
  }

  setYearToDate(): void {
    this.endDate = new Date();
    this.startDate = new Date(this.endDate.getFullYear(), 0, 1);
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    this.discardService.getWasteReport(this.startDate, this.endDate).subscribe({
      next: (report) => {
        this.report.set(report);
        this.buildCharts(report);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load report' });
        this.loading.set(false);
      }
    });
  }

  buildCharts(report: WasteReport): void {
    // Reason chart
    this.reasonChartData.set({
      labels: report.byReason.map(r => r.reasonName),
      datasets: [{
        data: report.byReason.map(r => r.cost),
        backgroundColor: report.byReason.map(r => this.getReasonColor(r.reasonCode)),
        hoverBackgroundColor: report.byReason.map(r => this.getReasonColor(r.reasonCode))
      }]
    });

    // Monthly chart
    this.monthlyChartData.set({
      labels: report.byMonth.map(m => new Date(m.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })),
      datasets: [{
        label: 'Waste Cost',
        data: report.byMonth.map(m => m.cost),
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        borderWidth: 1
      }]
    });
  }

  getReasonColor(reasonCode: string): string {
    return this.reasonColors[reasonCode] || '#6b7280';
  }

  getAverageCostPerDiscard(): number {
    const r = this.report();
    if (!r || r.totalDiscards === 0) return 0;
    return r.totalCost / r.totalDiscards;
  }

  exportReport(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Export',
      detail: 'Report export functionality coming soon'
    });
  }

  goBack(): void {
    this.router.navigate(['/discards']);
  }
}
