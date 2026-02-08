import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { TabsModule } from 'primeng/tabs';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { DialogModule } from 'primeng/dialog';
import { Textarea } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { VendorPerformanceService } from '../../../../core/services/vendor-performance.service';
import {
  VendorPerformanceMetrics,
  VendorScorecard,
  VendorPerformanceIssue,
  SupplierPerformanceTier,
  PerformanceRecommendation,
  PerformanceArea,
  RecommendationPriority,
  PerformanceIssueStatus,
  PerformanceIssueSeverity,
  PerformanceIssueType
} from '../../../../shared/models';

@Component({
  selector: 'app-vendor-scorecard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    SelectModule,
    ChartModule,
    ProgressBarModule,
    TabsModule,
    DividerModule,
    TableModule,
    TimelineModule,
    DialogModule,
    Textarea,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="vendor-scorecard-page">
      @if (loading()) {
        <div class="loading">
          <p-progressBar mode="indeterminate" [style]="{ height: '6px' }" />
          <p>Loading vendor performance data...</p>
        </div>
      } @else if (metrics()) {
        <!-- Header -->
        <div class="page-header">
          <div class="header-content">
            <div class="breadcrumb">
              <a routerLink="/vendors/performance">Vendor Performance</a>
              <i class="pi pi-chevron-right"></i>
              <span>{{ metrics()!.supplierName }}</span>
            </div>
            <div class="title-row">
              <h2>{{ metrics()!.supplierName }}</h2>
              <div class="tier-badge" [style.background-color]="getTierColor(metrics()!.tier)">
                <i class="pi pi-star-fill"></i>
                {{ getTierLabel(metrics()!.tier) }}
              </div>
            </div>
            <p class="period">Performance data from {{ metrics()!.periodStart | date:'mediumDate' }} to {{ metrics()!.periodEnd | date:'mediumDate' }}</p>
          </div>
          <div class="header-actions">
            <p-select
              [options]="periodOptions"
              [(ngModel)]="selectedPeriod"
              (onChange)="onPeriodChange()" />
            <p-button
              label="Log Issue"
              icon="pi pi-exclamation-triangle"
              severity="warn"
              (onClick)="openIssueDialog()" />
            <p-button
              label="Export Report"
              icon="pi pi-download"
              severity="secondary" />
          </div>
        </div>

        <!-- Score Overview -->
        <div class="score-overview">
          <div class="overall-score-card">
            <div class="score-circle" [class]="metrics()!.tier">
              <span class="score">{{ metrics()!.overallScore }}</span>
              <span class="label">Overall Score</span>
            </div>
            <div class="score-change" [class.positive]="metrics()!.scoreTrend > 0" [class.negative]="metrics()!.scoreTrend < 0">
              <i [class]="metrics()!.scoreTrend > 0 ? 'pi pi-arrow-up' : metrics()!.scoreTrend < 0 ? 'pi pi-arrow-down' : 'pi pi-minus'"></i>
              <span>{{ metrics()!.scoreTrend > 0 ? '+' : '' }}{{ metrics()!.scoreTrend }} from previous period</span>
            </div>
          </div>

          <div class="score-breakdown">
            @for (metric of scoreMetrics(); track metric.area) {
              <div class="metric-card" [class.low]="metric.score < 70">
                <div class="metric-header">
                  <i [class]="metric.icon"></i>
                  <span>{{ metric.label }}</span>
                </div>
                <div class="metric-score">{{ metric.score }}</div>
                <p-progressBar [value]="metric.score" [showValue]="false" [styleClass]="getScoreClass(metric.score)" />
                <div class="metric-detail">{{ metric.detail }}</div>
              </div>
            }
          </div>
        </div>

        <!-- Detailed Metrics Tabs -->
        <p-tabs value="0" styleClass="metrics-tabs">
          <p-tablist>
            <p-tab value="0">Delivery Performance</p-tab>
            <p-tab value="1">Quality</p-tab>
            <p-tab value="2">Pricing</p-tab>
            <p-tab value="3">Responsiveness</p-tab>
            <p-tab value="4">Order Fulfillment</p-tab>
          </p-tablist>
          <p-tabpanels>
            <!-- Delivery Tab -->
            <p-tabpanel value="0">
              <div class="metrics-grid">
                <div class="metric-section">
                  <h4>Delivery Statistics</h4>
                  <div class="stats-grid">
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.delivery.totalDeliveries }}</span>
                      <span class="stat-label">Total Deliveries</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value highlight">{{ metrics()!.delivery.onTimeRate }}%</span>
                      <span class="stat-label">On-Time Rate</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.delivery.onTimeDeliveries }}</span>
                      <span class="stat-label">On-Time</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value warning">{{ metrics()!.delivery.lateDeliveries }}</span>
                      <span class="stat-label">Late</span>
                    </div>
                  </div>
                </div>

                <div class="metric-section">
                  <h4>Lead Time Analysis</h4>
                  <div class="stats-grid">
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.delivery.averageLeadTimeDays | number:'1.1-1' }} days</span>
                      <span class="stat-label">Average Lead Time</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.delivery.promisedLeadTimeDays }} days</span>
                      <span class="stat-label">Promised Lead Time</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value" [class.warning]="metrics()!.delivery.averageDaysLate > 3">{{ metrics()!.delivery.averageDaysLate | number:'1.1-1' }} days</span>
                      <span class="stat-label">Avg Days Late (when late)</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.delivery.maxDaysLate }} days</span>
                      <span class="stat-label">Max Days Late</span>
                    </div>
                  </div>
                </div>

                <div class="chart-section full-width">
                  <h4>On-Time Delivery Trend</h4>
                  <p-chart type="line" [data]="deliveryTrendChart()" [options]="trendChartOptions" height="250px" />
                </div>
              </div>
            </p-tabpanel>

            <!-- Quality Tab -->
            <p-tabpanel value="1">
              <div class="metrics-grid">
                <div class="metric-section">
                  <h4>Acceptance Statistics</h4>
                  <div class="stats-grid">
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.quality.totalLineItemsReceived }}</span>
                      <span class="stat-label">Total Items Received</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value highlight">{{ metrics()!.quality.acceptanceRate }}%</span>
                      <span class="stat-label">Acceptance Rate</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value warning">{{ metrics()!.quality.itemsRejected }}</span>
                      <span class="stat-label">Items Rejected</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.quality.defectRate }}%</span>
                      <span class="stat-label">Defect Rate</span>
                    </div>
                  </div>
                </div>

                <div class="metric-section">
                  <h4>Quality Issues Breakdown</h4>
                  <div class="issues-breakdown">
                    <div class="issue-row">
                      <span class="issue-label">Damaged Items</span>
                      <span class="issue-count">{{ metrics()!.quality.damagedItems }}</span>
                    </div>
                    <div class="issue-row">
                      <span class="issue-label">Wrong Items</span>
                      <span class="issue-count">{{ metrics()!.quality.wrongItems }}</span>
                    </div>
                    <div class="issue-row">
                      <span class="issue-label">Quantity Discrepancies</span>
                      <span class="issue-count">{{ metrics()!.quality.quantityDiscrepancies }}</span>
                    </div>
                    <div class="issue-row">
                      <span class="issue-label">Documentation Errors</span>
                      <span class="issue-count">{{ metrics()!.quality.documentationErrors }}</span>
                    </div>
                    <div class="issue-row">
                      <span class="issue-label">Packaging Issues</span>
                      <span class="issue-count">{{ metrics()!.quality.packagingIssues }}</span>
                    </div>
                  </div>
                </div>

                <div class="metric-section">
                  <h4>Returns</h4>
                  <div class="stats-grid compact">
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.quality.returnRequests }}</span>
                      <span class="stat-label">Return Requests</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.quality.returnRate }}%</span>
                      <span class="stat-label">Return Rate</span>
                    </div>
                  </div>
                </div>
              </div>
            </p-tabpanel>

            <!-- Pricing Tab -->
            <p-tabpanel value="2">
              <div class="metrics-grid">
                <div class="metric-section">
                  <h4>Spend Summary</h4>
                  <div class="stats-grid">
                    <div class="stat-item">
                      <span class="stat-value highlight">{{ metrics()!.pricing.totalSpend | currency }}</span>
                      <span class="stat-label">Total Spend</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.pricing.averageOrderValue | currency }}</span>
                      <span class="stat-label">Avg Order Value</span>
                    </div>
                  </div>
                </div>

                <div class="metric-section">
                  <h4>Price Stability</h4>
                  <div class="stats-grid">
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.pricing.priceVariance }}%</span>
                      <span class="stat-label">Price Variance</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value warning">{{ metrics()!.pricing.priceIncreases }}</span>
                      <span class="stat-label">Price Increases</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value success">{{ metrics()!.pricing.priceDecreases }}</span>
                      <span class="stat-label">Price Decreases</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.pricing.avgPriceChangePercent }}%</span>
                      <span class="stat-label">Avg Price Change</span>
                    </div>
                  </div>
                </div>

                <div class="metric-section">
                  <h4>Invoice Accuracy</h4>
                  <div class="stats-grid">
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.pricing.totalInvoices }}</span>
                      <span class="stat-label">Total Invoices</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value highlight">{{ metrics()!.pricing.invoiceAccuracyRate }}%</span>
                      <span class="stat-label">Accuracy Rate</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value warning">{{ metrics()!.pricing.invoiceDiscrepancies }}</span>
                      <span class="stat-label">Discrepancies</span>
                    </div>
                  </div>
                </div>

                <div class="metric-section">
                  <h4>Savings</h4>
                  <div class="stats-grid compact">
                    <div class="stat-item">
                      <span class="stat-value success">{{ metrics()!.pricing.costSavingsAchieved | currency }}</span>
                      <span class="stat-label">Savings Achieved</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.pricing.potentialSavings | currency }}</span>
                      <span class="stat-label">Potential Savings</span>
                    </div>
                  </div>
                </div>
              </div>
            </p-tabpanel>

            <!-- Responsiveness Tab -->
            <p-tabpanel value="3">
              <div class="metrics-grid">
                <div class="metric-section">
                  <h4>Response Times</h4>
                  <div class="stats-grid">
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.responsiveness.avgQuoteResponseHours | number:'1.1-1' }}h</span>
                      <span class="stat-label">Quote Response</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.responsiveness.avgInquiryResponseHours | number:'1.1-1' }}h</span>
                      <span class="stat-label">Inquiry Response</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.responsiveness.avgOrderConfirmationHours | number:'1.1-1' }}h</span>
                      <span class="stat-label">Order Confirmation</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.responsiveness.avgIssueResolutionHours | number:'1.1-1' }}h</span>
                      <span class="stat-label">Issue Resolution</span>
                    </div>
                  </div>
                </div>

                <div class="metric-section">
                  <h4>Support Quality</h4>
                  <div class="stats-grid">
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.responsiveness.supportTicketsOpened }}</span>
                      <span class="stat-label">Tickets Opened</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.responsiveness.supportTicketsResolved }}</span>
                      <span class="stat-label">Tickets Resolved</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value highlight">{{ metrics()!.responsiveness.supportSatisfactionScore }}/5</span>
                      <span class="stat-label">Satisfaction Score</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value warning">{{ metrics()!.responsiveness.ordersRequiringFollowUp }}</span>
                      <span class="stat-label">Required Follow-up</span>
                    </div>
                  </div>
                </div>
              </div>
            </p-tabpanel>

            <!-- Orders Tab -->
            <p-tabpanel value="4">
              <div class="metrics-grid">
                <div class="metric-section">
                  <h4>Order Statistics</h4>
                  <div class="stats-grid">
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.orders.totalOrders }}</span>
                      <span class="stat-label">Total Orders</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value highlight">{{ metrics()!.orders.completionRate }}%</span>
                      <span class="stat-label">Completion Rate</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.orders.ordersCompleted }}</span>
                      <span class="stat-label">Completed</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value warning">{{ metrics()!.orders.ordersCancelled }}</span>
                      <span class="stat-label">Cancelled</span>
                    </div>
                  </div>
                </div>

                <div class="metric-section">
                  <h4>Fill Rates</h4>
                  <div class="stats-grid">
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.orders.lineFillRate }}%</span>
                      <span class="stat-label">Line Fill Rate</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.orders.unitFillRate }}%</span>
                      <span class="stat-label">Unit Fill Rate</span>
                    </div>
                  </div>
                </div>

                <div class="metric-section">
                  <h4>Backorders</h4>
                  <div class="stats-grid compact">
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.orders.backorderCount }}</span>
                      <span class="stat-label">Backorder Count</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.orders.backorderRate }}%</span>
                      <span class="stat-label">Backorder Rate</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">{{ metrics()!.orders.avgBackorderDurationDays }} days</span>
                      <span class="stat-label">Avg Duration</span>
                    </div>
                  </div>
                </div>
              </div>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>

        <!-- Recommendations -->
        @if (metrics()!.recommendations.length > 0) {
          <p-card header="Recommendations" styleClass="recommendations-card">
            <div class="recommendations-list">
              @for (rec of metrics()!.recommendations; track rec.id) {
                <div class="recommendation-item" [class]="rec.priority">
                  <div class="rec-icon">
                    <i [class]="getAreaIcon(rec.area)"></i>
                  </div>
                  <div class="rec-content">
                    <div class="rec-header">
                      <span class="rec-title">{{ rec.title }}</span>
                      <p-tag [value]="getPriorityLabel(rec.priority)" [severity]="getPrioritySeverity(rec.priority)" />
                    </div>
                    <p class="rec-description">{{ rec.description }}</p>
                    <p class="rec-action"><strong>Suggested action:</strong> {{ rec.suggestedAction }}</p>
                    @if (rec.potentialImpact > 0) {
                      <span class="rec-impact">Potential impact: +{{ rec.potentialImpact }} points</span>
                    }
                  </div>
                </div>
              }
            </div>
          </p-card>
        }

        <!-- Recent Issues -->
        <p-card header="Recent Issues" styleClass="issues-card">
          @if (vendorIssues().length > 0) {
            <p-table [value]="vendorIssues()" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>Issue</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-issue>
                <tr>
                  <td>
                    <div class="issue-info">
                      <span class="issue-title">{{ issue.title }}</span>
                      @if (issue.relatedPoNumber) {
                        <span class="issue-ref">{{ issue.relatedPoNumber }}</span>
                      }
                    </div>
                  </td>
                  <td>{{ getIssueTypeLabel(issue.issueType) }}</td>
                  <td>
                    <p-tag [value]="getSeverityLabel(issue.severity)" [severity]="getSeveritySeverity(issue.severity)" />
                  </td>
                  <td>
                    <p-tag [value]="getStatusLabel(issue.status)" [severity]="getStatusSeverity(issue.status)" />
                  </td>
                  <td>{{ issue.createdAt | date:'short' }}</td>
                  <td>
                    @if (issue.status !== 'resolved' && issue.status !== 'closed') {
                      <p-button
                        icon="pi pi-check"
                        [rounded]="true"
                        [text]="true"
                        severity="success"
                        pTooltip="Resolve"
                        (onClick)="resolveIssue(issue)" />
                    }
                  </td>
                </tr>
              </ng-template>
            </p-table>
          } @else {
            <div class="empty-state">
              <i class="pi pi-check-circle" style="font-size: 2rem; color: var(--green-500);"></i>
              <p>No issues recorded for this vendor</p>
            </div>
          }
        </p-card>
      } @else {
        <div class="not-found">
          <i class="pi pi-building" style="font-size: 4rem; color: var(--text-color-secondary);"></i>
          <h2>Vendor Not Found</h2>
          <p>The requested vendor could not be found.</p>
          <p-button label="Back to Performance Dashboard" icon="pi pi-arrow-left" routerLink="/vendors/performance" />
        </div>
      }
    </div>

    <!-- Log Issue Dialog -->
    <p-dialog
      header="Log Performance Issue"
      [(visible)]="issueDialogVisible"
      [modal]="true"
      [style]="{ width: '500px' }"
      [draggable]="false">
      <div class="issue-form">
        <div class="form-field">
          <label>Issue Type</label>
          <p-select
            [options]="issueTypeOptions"
            [(ngModel)]="newIssue.issueType"
            placeholder="Select type"
            styleClass="w-full" />
        </div>
        <div class="form-field">
          <label>Severity</label>
          <p-select
            [options]="severityOptions"
            [(ngModel)]="newIssue.severity"
            placeholder="Select severity"
            styleClass="w-full" />
        </div>
        <div class="form-field">
          <label>Title</label>
          <input type="text" pInputText [(ngModel)]="newIssue.title" class="w-full" placeholder="Brief description" />
        </div>
        <div class="form-field">
          <label>Description</label>
          <textarea pTextarea [(ngModel)]="newIssue.description" rows="3" class="w-full" placeholder="Detailed description of the issue"></textarea>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <p-button label="Cancel" severity="secondary" (onClick)="issueDialogVisible = false" />
        <p-button label="Log Issue" icon="pi pi-check" [disabled]="!isIssueFormValid()" (onClick)="submitIssue()" />
      </ng-template>
    </p-dialog>

    <!-- Resolve Issue Dialog -->
    <p-dialog
      header="Resolve Issue"
      [(visible)]="resolveDialogVisible"
      [modal]="true"
      [style]="{ width: '400px' }">
      <div class="form-field">
        <label>Resolution Notes</label>
        <textarea pTextarea [(ngModel)]="resolutionNotes" rows="3" class="w-full" placeholder="Describe how the issue was resolved"></textarea>
      </div>

      <ng-template pTemplate="footer">
        <p-button label="Cancel" severity="secondary" (onClick)="resolveDialogVisible = false" />
        <p-button label="Resolve" icon="pi pi-check" [disabled]="!resolutionNotes" (onClick)="confirmResolve()" />
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .vendor-scorecard-page {
      padding: 1.5rem;
    }

    .loading, .not-found {
      text-align: center;
      padding: 3rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .breadcrumb a {
      color: var(--primary-color);
      text-decoration: none;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .title-row h2 {
      margin: 0;
    }

    .tier-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      color: white;
      font-weight: 500;
    }

    .period {
      color: var(--text-color-secondary);
      margin: 0.25rem 0 0;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* Score Overview */
    .score-overview {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .overall-score-card {
      background: var(--surface-card);
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      min-width: 200px;
    }

    .score-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
      border: 4px solid;
    }

    .score-circle.platinum { border-color: #E5E4E2; background: rgba(229, 228, 226, 0.1); }
    .score-circle.gold { border-color: #FFD700; background: rgba(255, 215, 0, 0.1); }
    .score-circle.silver { border-color: #C0C0C0; background: rgba(192, 192, 192, 0.1); }
    .score-circle.bronze { border-color: #CD7F32; background: rgba(205, 127, 50, 0.1); }
    .score-circle.at_risk { border-color: #DC3545; background: rgba(220, 53, 69, 0.1); }

    .score-circle .score {
      font-size: 2.5rem;
      font-weight: 700;
    }

    .score-circle .label {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .score-change {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      font-size: 0.875rem;
    }

    .score-change.positive { color: var(--green-600); }
    .score-change.negative { color: var(--red-600); }

    .score-breakdown {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1rem;
    }

    .metric-card {
      background: var(--surface-card);
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
    }

    .metric-card.low {
      border-left: 4px solid var(--red-500);
    }

    .metric-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      color: var(--text-color-secondary);
      font-size: 0.875rem;
    }

    .metric-score {
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .metric-detail {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      margin-top: 0.5rem;
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .metric-section {
      background: var(--surface-ground);
      border-radius: 8px;
      padding: 1.25rem;
    }

    .metric-section h4 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
    }

    .metric-section.full-width,
    .chart-section.full-width {
      grid-column: span 2;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .stats-grid.compact {
      grid-template-columns: repeat(3, 1fr);
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .stat-value.highlight { color: var(--primary-color); }
    .stat-value.warning { color: var(--orange-600); }
    .stat-value.success { color: var(--green-600); }

    .stat-label {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .issues-breakdown {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .issue-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem;
      background: var(--surface-card);
      border-radius: 4px;
    }

    .issue-count {
      font-weight: 600;
    }

    /* Recommendations */
    .recommendations-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .recommendation-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: var(--surface-ground);
      border-radius: 8px;
      border-left: 4px solid var(--gray-400);
    }

    .recommendation-item.critical { border-left-color: var(--red-500); }
    .recommendation-item.high { border-left-color: var(--orange-500); }
    .recommendation-item.medium { border-left-color: var(--yellow-500); }

    .rec-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--surface-card);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: var(--primary-color);
    }

    .rec-content {
      flex: 1;
    }

    .rec-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .rec-title {
      font-weight: 500;
    }

    .rec-description {
      margin: 0 0 0.5rem;
      color: var(--text-color-secondary);
    }

    .rec-action {
      margin: 0;
      font-size: 0.875rem;
    }

    .rec-impact {
      font-size: 0.75rem;
      color: var(--green-600);
    }

    /* Issues Card */
    .issue-info {
      display: flex;
      flex-direction: column;
    }

    .issue-title {
      font-weight: 500;
    }

    .issue-ref {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .empty-state {
      padding: 2rem;
      text-align: center;
      color: var(--text-color-secondary);
    }

    /* Form */
    .issue-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field label {
      font-weight: 500;
    }

    @media (max-width: 1200px) {
      .score-overview {
        flex-direction: column;
      }

      .score-breakdown {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 768px) {
      .score-breakdown {
        grid-template-columns: repeat(2, 1fr);
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .metric-section.full-width,
      .chart-section.full-width {
        grid-column: 1;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class VendorScorecardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private performanceService = inject(VendorPerformanceService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  metrics = signal<VendorPerformanceMetrics | null>(null);
  vendorIssues = signal<VendorPerformanceIssue[]>([]);
  loading = signal(true);

  selectedPeriod = '90d';
  supplierId = '';

  // Issue dialog
  issueDialogVisible = false;
  newIssue: Partial<VendorPerformanceIssue> = {};

  // Resolve dialog
  resolveDialogVisible = false;
  resolutionNotes = '';
  selectedIssue: VendorPerformanceIssue | null = null;

  periodOptions = [
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
    { label: 'Last 6 Months', value: '6m' },
    { label: 'Last Year', value: '1y' }
  ];

  issueTypeOptions = [
    { label: 'Late Delivery', value: PerformanceIssueType.LATE_DELIVERY },
    { label: 'Quality Defect', value: PerformanceIssueType.QUALITY_DEFECT },
    { label: 'Wrong Item', value: PerformanceIssueType.WRONG_ITEM },
    { label: 'Quantity Short', value: PerformanceIssueType.QUANTITY_SHORT },
    { label: 'Damaged Goods', value: PerformanceIssueType.DAMAGED_GOODS },
    { label: 'Pricing Discrepancy', value: PerformanceIssueType.PRICING_DISCREPANCY },
    { label: 'Documentation Error', value: PerformanceIssueType.DOCUMENTATION_ERROR },
    { label: 'Communication Failure', value: PerformanceIssueType.COMMUNICATION_FAILURE }
  ];

  severityOptions = [
    { label: 'Low', value: PerformanceIssueSeverity.LOW },
    { label: 'Medium', value: PerformanceIssueSeverity.MEDIUM },
    { label: 'High', value: PerformanceIssueSeverity.HIGH },
    { label: 'Critical', value: PerformanceIssueSeverity.CRITICAL }
  ];

  trendChartOptions = {
    plugins: { legend: { display: false } },
    scales: {
      y: { min: 0, max: 100 }
    }
  };

  scoreMetrics = computed(() => {
    const m = this.metrics();
    if (!m) return [];
    return [
      { area: PerformanceArea.DELIVERY, label: 'Delivery', icon: 'pi pi-truck', score: m.delivery.deliveryScore, detail: `${m.delivery.onTimeRate}% on-time` },
      { area: PerformanceArea.QUALITY, label: 'Quality', icon: 'pi pi-check-circle', score: m.quality.qualityScore, detail: `${m.quality.acceptanceRate}% accepted` },
      { area: PerformanceArea.PRICING, label: 'Pricing', icon: 'pi pi-dollar', score: m.pricing.pricingScore, detail: `${m.pricing.invoiceAccuracyRate}% accurate` },
      { area: PerformanceArea.RESPONSIVENESS, label: 'Response', icon: 'pi pi-clock', score: m.responsiveness.responsivenessScore, detail: `${m.responsiveness.avgQuoteResponseHours}h avg` },
      { area: PerformanceArea.ORDERS, label: 'Orders', icon: 'pi pi-shopping-cart', score: m.orders.orderScore, detail: `${m.orders.completionRate}% complete` }
    ];
  });

  deliveryTrendChart = computed(() => {
    const m = this.metrics();
    if (!m) return null;
    return {
      labels: m.delivery.onTimeTrend.map(p => p.label),
      datasets: [{
        label: 'On-Time Rate',
        data: m.delivery.onTimeTrend.map(p => p.value),
        fill: true,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3
      }]
    };
  });

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id') || '';
    if (this.supplierId) {
      this.loadData();
    } else {
      this.loading.set(false);
    }
  }

  loadData(): void {
    this.loading.set(true);
    this.performanceService.getPerformanceMetrics(this.supplierId, this.selectedPeriod).subscribe({
      next: (metrics) => {
        this.metrics.set(metrics);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });

    this.performanceService.listPerformanceIssues({ supplierId: this.supplierId }).subscribe(issues => {
      this.vendorIssues.set(issues);
    });
  }

  onPeriodChange(): void {
    this.loadData();
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'score-bar-good';
    if (score >= 60) return 'score-bar-warning';
    return 'score-bar-poor';
  }

  getTierLabel(tier: SupplierPerformanceTier): string {
    return this.performanceService.getTierLabel(tier);
  }

  getTierColor(tier: SupplierPerformanceTier): string {
    return this.performanceService.getTierColor(tier);
  }

  getAreaIcon(area: PerformanceArea): string {
    const icons: Record<PerformanceArea, string> = {
      [PerformanceArea.DELIVERY]: 'pi pi-truck',
      [PerformanceArea.QUALITY]: 'pi pi-check-circle',
      [PerformanceArea.PRICING]: 'pi pi-dollar',
      [PerformanceArea.RESPONSIVENESS]: 'pi pi-clock',
      [PerformanceArea.ORDERS]: 'pi pi-shopping-cart'
    };
    return icons[area] || 'pi pi-info-circle';
  }

  getPriorityLabel(priority: RecommendationPriority): string {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  }

  getPrioritySeverity(priority: RecommendationPriority): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<RecommendationPriority, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      [RecommendationPriority.LOW]: 'info',
      [RecommendationPriority.MEDIUM]: 'warn',
      [RecommendationPriority.HIGH]: 'danger',
      [RecommendationPriority.CRITICAL]: 'danger'
    };
    return map[priority] || 'secondary';
  }

  getIssueTypeLabel(type: PerformanceIssueType): string {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  getSeverityLabel(severity: PerformanceIssueSeverity): string {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
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
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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

  openIssueDialog(): void {
    this.newIssue = {
      supplierId: this.supplierId,
      supplierName: this.metrics()?.supplierName
    };
    this.issueDialogVisible = true;
  }

  isIssueFormValid(): boolean {
    return !!(this.newIssue.issueType && this.newIssue.severity && this.newIssue.title);
  }

  submitIssue(): void {
    this.performanceService.createPerformanceIssue(this.newIssue).subscribe({
      next: (issue) => {
        this.issueDialogVisible = false;
        this.vendorIssues.update(issues => [issue, ...issues]);
        this.messageService.add({
          severity: 'success',
          summary: 'Issue Logged',
          detail: 'Performance issue has been recorded'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to log issue'
        });
      }
    });
  }

  resolveIssue(issue: VendorPerformanceIssue): void {
    this.selectedIssue = issue;
    this.resolutionNotes = '';
    this.resolveDialogVisible = true;
  }

  confirmResolve(): void {
    if (!this.selectedIssue) return;

    this.performanceService.resolvePerformanceIssue(this.selectedIssue.id, this.resolutionNotes).subscribe({
      next: () => {
        this.resolveDialogVisible = false;
        this.loadData();
        this.messageService.add({
          severity: 'success',
          summary: 'Issue Resolved',
          detail: 'The issue has been marked as resolved'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to resolve issue'
        });
      }
    });
  }
}
