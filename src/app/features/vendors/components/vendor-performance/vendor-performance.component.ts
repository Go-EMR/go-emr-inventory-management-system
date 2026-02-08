import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { TabsModule } from 'primeng/tabs';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { VendorPerformanceService } from '../../../../core/services/vendor-performance.service';
import {
  VendorPerformanceSummary,
  VendorScorecard,
  VendorComparison,
  VendorPerformanceIssue,
  SupplierPerformanceTier,
  VendorCategory,
  PerformanceIssueStatus,
  PerformanceIssueSeverity,
  Vendor
} from '../../../../shared/models';

@Component({
  selector: 'app-vendor-performance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
    SelectModule,
    ChartModule,
    ProgressBarModule,
    BadgeModule,
    TabsModule,
    DividerModule,
    DialogModule,
    MultiSelectModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <div class="vendor-performance-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h2>Vendor Performance Dashboard</h2>
          <p class="text-secondary">Monitor and analyze supplier performance metrics</p>
        </div>
        <div class="header-actions">
          <p-select
            [options]="periodOptions"
            [(ngModel)]="selectedPeriod"
            (onChange)="onPeriodChange()"
            styleClass="period-dropdown" />
          <p-button
            label="Compare"
            icon="pi pi-chart-bar"
            severity="secondary"
            (onClick)="openCompareDialog()" />
          <p-button
            label="Export"
            icon="pi pi-download"
            severity="secondary"
            (onClick)="exportReport()" />
        </div>
      </div>

      <!-- Tier + KPI Row -->
      <div class="summary-section">
        <div class="summary-row">
          @for (tier of tierCards(); track tier.tier) {
            <div class="tier-card" (click)="filterByTier(tier.tier)"
                 [class.selected]="selectedTier === tier.tier">
              <div class="tier-badge" [style.background-color]="getTierColor(tier.tier)">
                <i [class]="tier.icon"></i>
              </div>
              <div class="tier-content">
                <span class="tier-count">{{ tier.count }}</span>
                <span class="tier-label">{{ tier.label }}</span>
              </div>
            </div>
          }
          <div class="kpi-divider"></div>
          <div class="kpi-card">
            <div class="kpi-label"><i class="pi pi-truck"></i> On-Time</div>
            <div class="kpi-value">{{ summary()?.averageOnTimeRate || 0 }}%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label"><i class="pi pi-check-circle"></i> Quality</div>
            <div class="kpi-value">{{ summary()?.averageQualityRate || 0 }}%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label"><i class="pi pi-dollar"></i> Spend</div>
            <div class="kpi-value">{{ summary()?.totalSpendPeriod | currency:'USD':'symbol':'1.0-0' }}</div>
          </div>
          <div class="kpi-card" [class.has-issues]="(summary()?.openQualityIssues || 0) > 0">
            <div class="kpi-label"><i class="pi pi-exclamation-triangle"></i> Issues</div>
            <div class="kpi-value">{{ (summary()?.openQualityIssues || 0) + (summary()?.lateDeliveriesThisMonth || 0) }}</div>
          </div>
        </div>
      </div>

      <!-- Scorecards Table -->
      <p-card styleClass="scorecards-card">
        <div class="table-toolbar">
          <h3>Vendor Scorecards</h3>
          <div class="table-filters">
            <p-select
              [options]="categoryOptions"
              [(ngModel)]="selectedCategory"
              placeholder="All Categories"
              [showClear]="true"
              (onChange)="loadScorecards()"
              styleClass="filter-dropdown" />
            <p-select
              [options]="sortOptions"
              [(ngModel)]="selectedSort"
              (onChange)="loadScorecards()"
              styleClass="filter-dropdown" />
          </div>
        </div>

        <p-table
          [value]="scorecards()"
          [paginator]="true"
          [rows]="10"
          [rowHover]="true"
          [scrollable]="true"
          styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th style="min-width:180px">Vendor</th>
              <th style="min-width:80px">Tier</th>
              <th style="min-width:110px">Score</th>
              <th style="min-width:60px">Del</th>
              <th style="min-width:60px">Qual</th>
              <th style="min-width:60px">Price</th>
              <th style="min-width:70px">Trend</th>
              <th style="min-width:60px"></th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-scorecard>
            <tr [class.at-risk]="scorecard.tier === 'at_risk'" [class.has-issues]="scorecard.hasActiveIssues">
              <td>
                <div class="vendor-info">
                  <span class="vendor-name">{{ scorecard.supplierName }}</span>
                  <span class="vendor-meta">{{ getCategoryLabel(scorecard.category) }} &middot; {{ scorecard.totalOrders }} orders &middot; {{ scorecard.totalSpend | currency:'USD':'symbol':'1.0-0' }}</span>
                </div>
              </td>
              <td>
                <p-tag
                  [value]="getTierLabel(scorecard.tier)"
                  [style]="{ 'background-color': getTierColor(scorecard.tier), 'color': getTierTextColor(scorecard.tier), 'font-size': '0.75rem' }" />
              </td>
              <td>
                <div class="score-cell">
                  <span class="score-value">{{ scorecard.overallScore }}</span>
                  <p-progressBar [value]="scorecard.overallScore" [showValue]="false" styleClass="score-bar" />
                </div>
              </td>
              <td>
                <span class="metric-value" [class.low]="scorecard.deliveryScore < 70">{{ scorecard.deliveryScore }}</span>
              </td>
              <td>
                <span class="metric-value" [class.low]="scorecard.qualityScore < 70">{{ scorecard.qualityScore }}</span>
              </td>
              <td>
                <span class="metric-value" [class.low]="scorecard.pricingScore < 70">{{ scorecard.pricingScore }}</span>
              </td>
              <td>
                <span class="trend" [class.positive]="scorecard.scoreChange > 0" [class.negative]="scorecard.scoreChange < 0">
                  <i [class]="scorecard.scoreChange > 0 ? 'pi pi-arrow-up' : scorecard.scoreChange < 0 ? 'pi pi-arrow-down' : 'pi pi-minus'"></i>
                  {{ scorecard.scoreChange > 0 ? '+' : '' }}{{ scorecard.scoreChange }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <p-button
                    icon="pi pi-eye"
                    [rounded]="true"
                    [text]="true"
                    size="small"
                    pTooltip="View Details"
                    [routerLink]="['/vendors/performance', scorecard.supplierId]" />
                  @if (scorecard.hasActiveIssues) {
                    <p-button
                      icon="pi pi-exclamation-circle"
                      [rounded]="true"
                      [text]="true"
                      size="small"
                      severity="danger"
                      pTooltip="View Issues"
                      (onClick)="viewVendorIssues(scorecard)" />
                  }
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <!-- Bottom Row: Chart + Performers + Issues -->
      <div class="bottom-grid">
        <!-- Performance Distribution Chart -->
        <p-card header="Score Distribution" styleClass="chart-card">
          <p-chart type="doughnut" [data]="tierChartData()" [options]="tierChartOptions" height="220px" />
        </p-card>

        <!-- Top & Bottom Performers -->
        <p-card styleClass="performers-card">
          <p-tabs value="0">
            <p-tablist>
              <p-tab value="0">Top Performers</p-tab>
              <p-tab value="1">Needs Attention</p-tab>
            </p-tablist>
            <p-tabpanels>
              <p-tabpanel value="0">
                <div class="performers-list">
                  @for (vendor of summary()?.topPerformers || []; track vendor.supplierId) {
                    <div class="performer-item">
                      <span class="rank-badge" [style.background-color]="getTierColor(vendor.tier)">
                        {{ $index + 1 }}
                      </span>
                      <div class="performer-info">
                        <span class="name">{{ vendor.supplierName }}</span>
                        <span class="category">{{ getCategoryLabel(vendor.category) }}</span>
                      </div>
                      <div class="performer-score">
                        <span class="score">{{ vendor.overallScore }}</span>
                        <span class="trend positive" *ngIf="vendor.scoreChange > 0">
                          <i class="pi pi-arrow-up"></i> +{{ vendor.scoreChange }}
                        </span>
                      </div>
                    </div>
                  }
                </div>
              </p-tabpanel>
              <p-tabpanel value="1">
                <div class="performers-list">
                  @for (vendor of summary()?.needsAttention || []; track vendor.supplierId) {
                    <div class="performer-item at-risk">
                      <i class="pi pi-exclamation-triangle" style="color: var(--red-500); flex-shrink: 0;"></i>
                      <div class="performer-info">
                        <span class="name">{{ vendor.supplierName }}</span>
                        <div class="alerts">
                          @if (vendor.hasActiveIssues) {
                            <p-tag value="Issues" severity="danger" />
                          }
                          @if (vendor.contractExpiringSoon) {
                            <p-tag value="Expiring" severity="warn" />
                          }
                        </div>
                      </div>
                      <div class="performer-score">
                        <span class="score low">{{ vendor.overallScore }}</span>
                      </div>
                    </div>
                  }
                </div>
              </p-tabpanel>
            </p-tabpanels>
          </p-tabs>
        </p-card>

        <!-- Recent Issues -->
        <p-card header="Recent Issues" styleClass="issues-card">
          @if (recentIssues().length > 0) {
            <div class="issues-list">
              @for (issue of recentIssues().slice(0, 5); track issue.id) {
                <div class="issue-item" [class]="issue.severity">
                  <div class="issue-icon">
                    <i [class]="getIssueIcon(issue.issueType)"></i>
                  </div>
                  <div class="issue-content">
                    <div class="issue-header">
                      <span class="issue-title">{{ issue.title }}</span>
                      <p-tag [value]="getSeverityLabel(issue.severity)" [severity]="getSeveritySeverity(issue.severity)" />
                    </div>
                    <div class="issue-meta">
                      <span>{{ issue.supplierName }}</span>
                      <span>{{ issue.createdAt | date:'shortDate' }}</span>
                      <p-tag [value]="getStatusLabel(issue.status)" [severity]="getStatusSeverity(issue.status)" />
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state">
              <i class="pi pi-check-circle" style="font-size: 2rem; color: var(--green-500);"></i>
              <p>No open issues</p>
            </div>
          }
        </p-card>
      </div>
    </div>

    <!-- Compare Dialog -->
    <p-dialog
      header="Compare Vendors"
      [(visible)]="compareDialogVisible"
      [modal]="true"
      [style]="{ width: '90vw', maxWidth: '900px' }"
      [draggable]="false">
      <div class="compare-form">
        <div class="form-field">
          <label>Select Vendors to Compare</label>
          <p-multiSelect
            [options]="vendorOptions"
            [(ngModel)]="selectedVendorsToCompare"
            optionLabel="name"
            optionValue="id"
            placeholder="Select 2-5 vendors"
            [maxSelectedLabels]="5"
            styleClass="w-full" />
        </div>
      </div>

      @if (comparisonData()) {
        <p-divider />
        <div class="comparison-chart">
          <p-chart type="radar" [data]="comparisonChartData()" [options]="comparisonChartOptions" height="300px" />
        </div>

        <p-divider />
        <p-table [value]="comparisonData()!.vendors" [scrollable]="true" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Vendor</th>
              <th>Overall</th>
              <th>Delivery</th>
              <th>Quality</th>
              <th>Pricing</th>
              <th>Resp.</th>
              <th>Orders</th>
              <th>Spend</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-vendor>
            <tr>
              <td><strong>{{ vendor.supplierName }}</strong></td>
              <td>{{ vendor.overallScore }}</td>
              <td>{{ vendor.deliveryScore }}</td>
              <td>{{ vendor.qualityScore }}</td>
              <td>{{ vendor.pricingScore }}</td>
              <td>{{ vendor.responsivenessScore }}</td>
              <td>{{ vendor.totalOrders }}</td>
              <td>{{ vendor.totalSpend | currency }}</td>
            </tr>
          </ng-template>
        </p-table>
      }

      <ng-template pTemplate="footer">
        <p-button label="Close" severity="secondary" (onClick)="compareDialogVisible = false" />
        <p-button
          label="Compare"
          icon="pi pi-chart-bar"
          [disabled]="selectedVendorsToCompare.length < 2"
          (onClick)="runComparison()" />
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      overflow: hidden;
    }

    .vendor-performance-page {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* ===== HEADER ===== */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .header-content h2 {
      margin: 0 0 0.125rem 0;
      font-size: 1.25rem;
    }

    .header-content .text-secondary {
      margin: 0;
      font-size: 0.8125rem;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }

    :host ::ng-deep .period-dropdown {
      min-width: 140px;
    }

    /* ===== SUMMARY ROW: tiers + kpis in one horizontal strip ===== */
    .summary-section {
      overflow-x: auto;
    }

    .summary-row {
      display: flex;
      gap: 0.5rem;
      align-items: stretch;
    }

    .tier-card {
      flex: 1 1 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--surface-card);
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      border: 2px solid transparent;
      white-space: nowrap;
    }

    .tier-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .tier-card.selected {
      border-color: var(--primary-color);
    }

    .tier-badge {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
      font-size: 0.8125rem;
    }

    .tier-content {
      display: flex;
      flex-direction: column;
    }

    .tier-count {
      font-size: 1.125rem;
      font-weight: 700;
      line-height: 1.2;
    }

    .tier-label {
      font-size: 0.6875rem;
      color: var(--text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .kpi-divider {
      width: 1px;
      background: var(--surface-border);
      margin: 0 0.25rem;
      flex-shrink: 0;
    }

    .kpi-card {
      flex: 1 1 0;
      background: var(--surface-card);
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      white-space: nowrap;
    }

    .kpi-card.has-issues {
      border-left: 3px solid var(--red-500);
    }

    .kpi-label {
      font-size: 0.6875rem;
      color: var(--text-color-secondary);
      display: flex;
      align-items: center;
      gap: 0.25rem;

      i { font-size: 0.75rem; }
    }

    .kpi-value {
      font-size: 1.125rem;
      font-weight: 700;
      line-height: 1.3;
    }

    /* ===== SCORECARDS TABLE ===== */
    :host ::ng-deep .scorecards-card {
      overflow: hidden;
    }

    .table-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;

      h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
      }
    }

    .table-filters {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    :host ::ng-deep .filter-dropdown {
      min-width: 140px;
    }

    .vendor-info {
      display: flex;
      flex-direction: column;
    }

    .vendor-name {
      font-weight: 600;
      font-size: 0.875rem;
    }

    .vendor-meta {
      font-size: 0.6875rem;
      color: var(--text-color-secondary);
    }

    .score-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .score-value {
      font-weight: 700;
    }

    :host ::ng-deep .score-bar {
      height: 4px;
      width: 50px;
    }

    .metric-value {
      font-weight: 500;
      font-size: 0.875rem;
    }

    .metric-value.low {
      color: var(--red-600);
    }

    .trend {
      display: inline-flex;
      align-items: center;
      gap: 0.125rem;
      font-size: 0.8125rem;
    }

    .trend.positive { color: var(--green-600); }
    .trend.negative { color: var(--red-600); }

    .action-buttons {
      display: flex;
      gap: 0;
    }

    tr.at-risk {
      background: var(--red-50);
    }

    tr.has-issues td:first-child {
      border-left: 3px solid var(--orange-500);
    }

    /* ===== BOTTOM GRID: chart + performers + issues ===== */
    .bottom-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    /* Performers List */
    .performers-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .performer-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: var(--surface-ground);
      border-radius: 6px;
    }

    .performer-item.at-risk {
      background: var(--red-50);
    }

    .rank-badge {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .performer-info {
      flex: 1;
      min-width: 0;
    }

    .performer-info .name {
      display: block;
      font-weight: 500;
      font-size: 0.8125rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .performer-info .category {
      font-size: 0.6875rem;
      color: var(--text-color-secondary);
    }

    .performer-info .alerts {
      display: flex;
      gap: 0.25rem;
      margin-top: 0.125rem;
    }

    .performer-score {
      text-align: right;
      flex-shrink: 0;
    }

    .performer-score .score {
      display: block;
      font-size: 1rem;
      font-weight: 700;
    }

    .performer-score .score.low {
      color: var(--red-600);
    }

    /* Issues List */
    .issues-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .issue-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.5rem;
      background: var(--surface-ground);
      border-radius: 6px;
      border-left: 3px solid var(--gray-400);
    }

    .issue-item.critical { border-left-color: var(--red-500); }
    .issue-item.high { border-left-color: var(--orange-500); }
    .issue-item.medium { border-left-color: var(--yellow-500); }

    .issue-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--surface-100);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 0.8125rem;
    }

    .issue-content {
      flex: 1;
      min-width: 0;
    }

    .issue-header {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      flex-wrap: wrap;
    }

    .issue-title {
      font-weight: 500;
      font-size: 0.8125rem;
    }

    .issue-meta {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      font-size: 0.6875rem;
      color: var(--text-color-secondary);
      margin-top: 0.125rem;
      flex-wrap: wrap;
    }

    .empty-state {
      padding: 2rem;
      text-align: center;
      color: var(--text-color-secondary);
    }

    /* Compare Dialog */
    .compare-form {
      padding: 0.75rem 0;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field label {
      font-weight: 500;
    }

    .comparison-chart {
      padding: 0.75rem 0;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 1200px) {
      .bottom-grid {
        grid-template-columns: 1fr 1fr;
      }

      :host ::ng-deep .issues-card {
        grid-column: span 2;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
      }

      .bottom-grid {
        grid-template-columns: 1fr;
      }

      :host ::ng-deep .issues-card {
        grid-column: 1;
      }
    }
  `]
})
export class VendorPerformanceComponent implements OnInit {
  private performanceService = inject(VendorPerformanceService);
  private messageService = inject(MessageService);

  // State
  summary = signal<VendorPerformanceSummary | null>(null);
  scorecards = signal<VendorScorecard[]>([]);
  recentIssues = signal<VendorPerformanceIssue[]>([]);
  comparisonData = signal<VendorComparison | null>(null);

  // Filters
  selectedPeriod = '90d';
  selectedCategory: VendorCategory | null = null;
  selectedSort = 'score_desc';
  selectedTier: SupplierPerformanceTier | null = null;

  // Compare
  compareDialogVisible = false;
  selectedVendorsToCompare: string[] = [];
  vendorOptions: { id: string; name: string }[] = [];

  periodOptions = [
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
    { label: 'Last 6 Months', value: '6m' },
    { label: 'Last Year', value: '1y' },
    { label: 'Year to Date', value: 'ytd' }
  ];

  categoryOptions = [
    { label: 'Equipment Manufacturer', value: VendorCategory.EQUIPMENT_MANUFACTURER },
    { label: 'Parts Supplier', value: VendorCategory.PARTS_SUPPLIER },
    { label: 'Consumables Supplier', value: VendorCategory.CONSUMABLES_SUPPLIER },
    { label: 'Service Provider', value: VendorCategory.SERVICE_PROVIDER },
    { label: 'Distributor', value: VendorCategory.DISTRIBUTOR }
  ];

  sortOptions = [
    { label: 'Score (High to Low)', value: 'score_desc' },
    { label: 'Score (Low to High)', value: 'score_asc' },
    { label: 'Spend (High to Low)', value: 'spend_desc' },
    { label: 'Orders (High to Low)', value: 'orders_desc' }
  ];

  tierCards = computed(() => [
    { tier: SupplierPerformanceTier.PLATINUM, label: 'Platinum', count: this.summary()?.platinumTierCount || 0, icon: 'pi pi-star-fill' },
    { tier: SupplierPerformanceTier.GOLD, label: 'Gold', count: this.summary()?.goldTierCount || 0, icon: 'pi pi-star' },
    { tier: SupplierPerformanceTier.SILVER, label: 'Silver', count: this.summary()?.silverTierCount || 0, icon: 'pi pi-circle' },
    { tier: SupplierPerformanceTier.BRONZE, label: 'Bronze', count: this.summary()?.bronzeTierCount || 0, icon: 'pi pi-circle-off' },
    { tier: SupplierPerformanceTier.AT_RISK, label: 'At Risk', count: this.summary()?.atRiskCount || 0, icon: 'pi pi-exclamation-triangle' }
  ]);

  tierChartData = computed(() => ({
    labels: ['Platinum', 'Gold', 'Silver', 'Bronze', 'At Risk'],
    datasets: [{
      data: [
        this.summary()?.platinumTierCount || 0,
        this.summary()?.goldTierCount || 0,
        this.summary()?.silverTierCount || 0,
        this.summary()?.bronzeTierCount || 0,
        this.summary()?.atRiskCount || 0
      ],
      backgroundColor: ['#E5E4E2', '#FFD700', '#C0C0C0', '#CD7F32', '#DC3545']
    }]
  }));

  tierChartOptions = {
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  comparisonChartData = computed(() => {
    const comparison = this.comparisonData();
    if (!comparison) return null;

    return {
      labels: ['Delivery', 'Quality', 'Pricing', 'Responsiveness', 'Orders'],
      datasets: comparison.vendors.map((v, i) => ({
        label: v.supplierName,
        data: [v.deliveryScore, v.qualityScore, v.pricingScore, v.responsivenessScore, v.totalOrders / 2],
        fill: true,
        backgroundColor: `rgba(${[59, 130, 246][i % 3]}, ${[130, 185, 246][i % 3]}, ${[246, 130, 59][i % 3]}, 0.2)`,
        borderColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][i % 5],
        pointBackgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][i % 5]
      }))
    };
  });

  comparisonChartOptions = {
    scales: {
      r: {
        min: 0,
        max: 100
      }
    },
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.performanceService.getPerformanceSummary(this.selectedPeriod).subscribe(summary => {
      this.summary.set(summary);
    });

    this.loadScorecards();

    this.performanceService.listPerformanceIssues({ openOnly: true }).subscribe(issues => {
      this.recentIssues.set(issues);
    });

    this.performanceService.getVendors().subscribe(vendors => {
      this.vendorOptions = vendors.map(v => ({ id: v.id, name: v.name }));
    });
  }

  loadScorecards(): void {
    const [sortBy, sortDir] = this.selectedSort.split('_');
    this.performanceService.listScorecards(
      this.selectedCategory || undefined,
      this.selectedTier || undefined,
      sortBy,
      sortDir === 'desc'
    ).subscribe(scorecards => {
      this.scorecards.set(scorecards);
    });
  }

  onPeriodChange(): void {
    this.loadDashboardData();
  }

  filterByTier(tier: SupplierPerformanceTier): void {
    this.selectedTier = this.selectedTier === tier ? null : tier;
    this.loadScorecards();
  }

  openCompareDialog(): void {
    this.compareDialogVisible = true;
    this.comparisonData.set(null);
  }

  runComparison(): void {
    if (this.selectedVendorsToCompare.length < 2) return;

    this.performanceService.compareVendors(this.selectedVendorsToCompare).subscribe(comparison => {
      this.comparisonData.set(comparison);
    });
  }

  viewVendorIssues(scorecard: VendorScorecard): void {
    // Navigate to issues filtered by vendor
    this.messageService.add({
      severity: 'info',
      summary: 'View Issues',
      detail: `Viewing issues for ${scorecard.supplierName}`
    });
  }

  exportReport(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Export Started',
      detail: 'Performance report is being generated...'
    });
  }

  getTierLabel(tier: SupplierPerformanceTier): string {
    return this.performanceService.getTierLabel(tier);
  }

  getTierColor(tier: SupplierPerformanceTier): string {
    return this.performanceService.getTierColor(tier);
  }

  getTierTextColor(tier: SupplierPerformanceTier): string {
    if (tier === SupplierPerformanceTier.GOLD || tier === SupplierPerformanceTier.SILVER) {
      return '#333';
    }
    return '#fff';
  }

  getCategoryLabel(category: VendorCategory): string {
    const labels: Record<VendorCategory, string> = {
      [VendorCategory.EQUIPMENT_MANUFACTURER]: 'Equipment',
      [VendorCategory.PARTS_SUPPLIER]: 'Parts',
      [VendorCategory.CONSUMABLES_SUPPLIER]: 'Consumables',
      [VendorCategory.SERVICE_PROVIDER]: 'Services',
      [VendorCategory.DISTRIBUTOR]: 'Distributor'
    };
    return labels[category] || category;
  }

  getIssueIcon(issueType: string): string {
    const icons: Record<string, string> = {
      late_delivery: 'pi pi-clock',
      quality_defect: 'pi pi-exclamation-circle',
      wrong_item: 'pi pi-box',
      quantity_short: 'pi pi-minus-circle',
      damaged_goods: 'pi pi-times-circle',
      pricing_discrepancy: 'pi pi-dollar',
      documentation_error: 'pi pi-file',
      communication_failure: 'pi pi-comment',
      backorder: 'pi pi-hourglass',
      expired_product: 'pi pi-calendar-times'
    };
    return icons[issueType] || 'pi pi-exclamation-triangle';
  }

  getSeverityLabel(severity: PerformanceIssueSeverity): string {
    const labels: Record<PerformanceIssueSeverity, string> = {
      [PerformanceIssueSeverity.LOW]: 'Low',
      [PerformanceIssueSeverity.MEDIUM]: 'Medium',
      [PerformanceIssueSeverity.HIGH]: 'High',
      [PerformanceIssueSeverity.CRITICAL]: 'Critical'
    };
    return labels[severity] || severity;
  }

  getSeveritySeverity(severity: PerformanceIssueSeverity): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<PerformanceIssueSeverity, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      [PerformanceIssueSeverity.LOW]: 'info',
      [PerformanceIssueSeverity.MEDIUM]: 'warn',
      [PerformanceIssueSeverity.HIGH]: 'danger',
      [PerformanceIssueSeverity.CRITICAL]: 'danger'
    };
    return map[severity] || 'secondary';
  }

  getStatusLabel(status: PerformanceIssueStatus): string {
    const labels: Record<PerformanceIssueStatus, string> = {
      [PerformanceIssueStatus.OPEN]: 'Open',
      [PerformanceIssueStatus.IN_PROGRESS]: 'In Progress',
      [PerformanceIssueStatus.PENDING_VENDOR]: 'Pending Vendor',
      [PerformanceIssueStatus.RESOLVED]: 'Resolved',
      [PerformanceIssueStatus.CLOSED]: 'Closed'
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: PerformanceIssueStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<PerformanceIssueStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      [PerformanceIssueStatus.OPEN]: 'danger',
      [PerformanceIssueStatus.IN_PROGRESS]: 'info',
      [PerformanceIssueStatus.PENDING_VENDOR]: 'warn',
      [PerformanceIssueStatus.RESOLVED]: 'success',
      [PerformanceIssueStatus.CLOSED]: 'secondary'
    };
    return map[status] || 'secondary';
  }
}
