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
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChartModule } from 'primeng/chart';
import { TimelineModule } from 'primeng/timeline';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';

import { PurchaseOrderService } from '../../../../core/services/purchase-order.service';
import {
  AutoPOSummary,
  AutoPORule,
  AutoPOExecution,
  AutoPOExecutionStatus,
  AutoPOPreview,
  AutoPOPreviewItem,
  AutoPOTriggerType,
  PurchaseOrder,
  PurchaseOrderStatus
} from '../../../../shared/models';

@Component({
  selector: 'app-auto-po-dashboard',
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
    DialogModule,
    ProgressBarModule,
    ChartModule,
    TimelineModule,
    BadgeModule,
    DividerModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="auto-po-dashboard">
      <!-- Header -->
      <div class="dashboard-header">
        <div class="header-content">
          <h2>Auto-PO Dashboard</h2>
          <p class="text-secondary">Automated purchase order generation based on reorder levels</p>
        </div>
        <div class="header-actions">
          <p-button
            label="Preview Auto-PO"
            icon="pi pi-eye"
            severity="secondary"
            (onClick)="openPreviewDialog()" />
          <p-button
            label="Run Auto-PO Now"
            icon="pi pi-play"
            (onClick)="confirmRunAutoPO()" />
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon rules">
            <i class="pi pi-cog"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ summary()?.activeRules || 0 }}</span>
            <span class="card-label">Active Rules</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon monitored">
            <i class="pi pi-box"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ summary()?.itemsMonitored || 0 }}</span>
            <span class="card-label">Items Monitored</span>
          </div>
        </div>

        <div class="summary-card alert" [class.has-alerts]="(summary()?.itemsBelowReorder || 0) > 0">
          <div class="card-icon below-reorder">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ summary()?.itemsBelowReorder || 0 }}</span>
            <span class="card-label">Below Reorder Level</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon pending">
            <i class="pi pi-clock"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ summary()?.pendingAutoPOs || 0 }}</span>
            <span class="card-label">Pending Approval</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon today">
            <i class="pi pi-calendar"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ summary()?.posCreatedToday || 0 }}</span>
            <span class="card-label">Created Today</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon value">
            <i class="pi pi-dollar"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ summary()?.totalValueThisMonth | currency }}</span>
            <span class="card-label">This Month</span>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="dashboard-grid">
        <!-- Active Rules -->
        <p-card header="Active Auto-PO Rules" styleClass="rules-card">
          <ng-template pTemplate="header">
            <div class="card-header-actions">
              <p-button
                label="Manage Rules"
                icon="pi pi-cog"
                severity="secondary"
                size="small"
                routerLink="/purchase-orders/auto-po/rules" />
            </div>
          </ng-template>

          <p-table [value]="activeRules()" [rows]="5" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>Rule Name</th>
                <th>Trigger</th>
                <th>Last Run</th>
                <th>POs Generated</th>
                <th>Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-rule>
              <tr>
                <td>
                  <div class="rule-name">
                    <span class="name">{{ rule.name }}</span>
                    @if (rule.description) {
                      <span class="description">{{ rule.description }}</span>
                    }
                  </div>
                </td>
                <td>
                  <p-tag [value]="getTriggerLabel(rule.triggerType)" [severity]="getTriggerSeverity(rule.triggerType)" />
                </td>
                <td>
                  @if (rule.lastTriggeredAt) {
                    <span class="last-run">{{ rule.lastTriggeredAt | date:'short' }}</span>
                  } @else {
                    <span class="never-run">Never</span>
                  }
                </td>
                <td>
                  <span class="po-count">{{ rule.totalPOsGenerated }}</span>
                </td>
                <td>
                  <div class="action-buttons">
                    <p-button
                      icon="pi pi-play"
                      [rounded]="true"
                      [text]="true"
                      severity="success"
                      pTooltip="Run this rule now"
                      (onClick)="runRule(rule)" />
                    <p-button
                      icon="pi pi-eye"
                      [rounded]="true"
                      [text]="true"
                      severity="info"
                      pTooltip="Preview"
                      (onClick)="previewRule(rule)" />
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="5" class="text-center">
                  <div class="empty-state">
                    <i class="pi pi-cog" style="font-size: 2rem; color: var(--text-color-secondary);"></i>
                    <p>No active auto-PO rules</p>
                    <p-button label="Create Rule" icon="pi pi-plus" routerLink="/purchase-orders/auto-po/rules/new" />
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>

        <!-- Recent Executions -->
        <p-card header="Recent Executions" styleClass="executions-card">
          <p-timeline [value]="recentExecutions()" align="left" styleClass="execution-timeline">
            <ng-template pTemplate="marker" let-exec>
              <span class="execution-marker" [ngClass]="getExecutionMarkerClass(exec.status)">
                <i [class]="getExecutionIcon(exec.status)"></i>
              </span>
            </ng-template>
            <ng-template pTemplate="content" let-exec>
              <div class="execution-item">
                <div class="execution-header">
                  <span class="execution-rule">{{ exec.ruleName }}</span>
                  <p-tag [value]="getExecutionStatusLabel(exec.status)" [severity]="getExecutionStatusSeverity(exec.status)" />
                </div>
                <div class="execution-stats">
                  <span><i class="pi pi-box"></i> {{ exec.itemsEvaluated }} evaluated</span>
                  <span><i class="pi pi-exclamation-circle"></i> {{ exec.itemsBelowThreshold }} below threshold</span>
                  <span><i class="pi pi-file"></i> {{ exec.posCreated }} POs created</span>
                  <span><i class="pi pi-dollar"></i> {{ exec.totalValue | currency }}</span>
                </div>
                <div class="execution-time">
                  <i class="pi pi-clock"></i> {{ exec.executedAt | date:'medium' }}
                  <span class="triggered-by">by {{ exec.triggeredBy }}</span>
                </div>
                @if (exec.issues && exec.issues.length > 0) {
                  <div class="execution-issues">
                    <i class="pi pi-exclamation-triangle"></i>
                    {{ exec.issues.length }} warning(s)
                  </div>
                }
              </div>
            </ng-template>
          </p-timeline>

          @if (recentExecutions().length === 0) {
            <div class="empty-state">
              <i class="pi pi-history" style="font-size: 2rem; color: var(--text-color-secondary);"></i>
              <p>No recent executions</p>
            </div>
          }
        </p-card>

        <!-- Items Below Reorder -->
        <p-card header="Items Below Reorder Level" styleClass="items-card">
          @if (previewItems().length > 0) {
            <p-table [value]="previewItems().slice(0, 5)" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>Item</th>
                  <th>Current</th>
                  <th>Reorder Level</th>
                  <th>Suggested Qty</th>
                  <th>Supplier</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-item>
                <tr [class.has-warning]="item.hasWarning">
                  <td>
                    <div class="item-info">
                      <span class="item-name">{{ item.itemName }}</span>
                      <span class="item-sku">{{ item.sku }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="current-qty" [class.critical]="item.currentQuantity <= item.reorderLevel * 0.5">
                      {{ item.currentQuantity }}
                    </span>
                  </td>
                  <td>{{ item.reorderLevel }}</td>
                  <td>{{ item.suggestedQuantity }}</td>
                  <td>
                    @if (item.supplierName) {
                      <span>{{ item.supplierName }}</span>
                    } @else {
                      <span class="no-supplier">
                        <i class="pi pi-exclamation-triangle"></i>
                        No supplier
                      </span>
                    }
                  </td>
                </tr>
              </ng-template>
            </p-table>
            @if (previewItems().length > 5) {
              <div class="view-all">
                <p-button
                  label="View All {{ previewItems().length }} Items"
                  [text]="true"
                  (onClick)="openPreviewDialog()" />
              </div>
            }
          } @else {
            <div class="empty-state success">
              <i class="pi pi-check-circle" style="font-size: 2rem; color: var(--green-500);"></i>
              <p>All items are above reorder levels</p>
            </div>
          }
        </p-card>

        <!-- Monthly Stats Chart -->
        <p-card header="Auto-PO Activity" styleClass="chart-card">
          <p-chart type="bar" [data]="chartData()" [options]="chartOptions" height="200px" />
        </p-card>
      </div>
    </div>

    <!-- Preview Dialog -->
    <p-dialog
      header="Auto-PO Preview"
      [(visible)]="previewDialogVisible"
      [modal]="true"
      [style]="{ width: '80vw', maxWidth: '1000px' }"
      [draggable]="false"
      [resizable]="false">
      @if (previewData()) {
        <div class="preview-summary">
          <div class="preview-stat">
            <span class="stat-value">{{ previewData()!.totalItems }}</span>
            <span class="stat-label">Items to Order</span>
          </div>
          <div class="preview-stat">
            <span class="stat-value">{{ previewData()!.totalPOs }}</span>
            <span class="stat-label">POs to Create</span>
          </div>
          <div class="preview-stat">
            <span class="stat-value">{{ previewData()!.totalValue | currency }}</span>
            <span class="stat-label">Total Value</span>
          </div>
          @if (previewData()!.warnings.length > 0) {
            <div class="preview-stat warning">
              <span class="stat-value">{{ previewData()!.warnings.length }}</span>
              <span class="stat-label">Warnings</span>
            </div>
          }
        </div>

        <p-divider />

        <p-table [value]="previewData()!.items" [paginator]="true" [rows]="10" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Item</th>
              <th>SKU</th>
              <th>Current Qty</th>
              <th>Reorder Level</th>
              <th>Order Qty</th>
              <th>Unit Cost</th>
              <th>Line Total</th>
              <th>Supplier</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr [class.has-warning]="item.hasWarning">
              <td>{{ item.itemName }}</td>
              <td>{{ item.sku }}</td>
              <td>
                <span [class.critical]="item.currentQuantity <= item.reorderLevel * 0.5">
                  {{ item.currentQuantity }}
                </span>
              </td>
              <td>{{ item.reorderLevel }}</td>
              <td>{{ item.suggestedQuantity }}</td>
              <td>{{ item.unitCost | currency }}</td>
              <td>{{ item.lineTotal | currency }}</td>
              <td>
                @if (item.supplierName) {
                  {{ item.supplierName }}
                } @else {
                  <span class="no-supplier">
                    <i class="pi pi-exclamation-triangle"></i>
                    {{ item.warningMessage }}
                  </span>
                }
              </td>
            </tr>
          </ng-template>
        </p-table>
      } @else {
        <div class="loading-preview">
          <p-progressBar mode="indeterminate" [style]="{ height: '6px' }" />
          <p>Loading preview...</p>
        </div>
      }

      <ng-template pTemplate="footer">
        <p-button label="Cancel" severity="secondary" (onClick)="previewDialogVisible = false" />
        <p-button
          label="Generate Purchase Orders"
          icon="pi pi-check"
          [disabled]="!previewData() || previewData()!.totalItems === 0"
          (onClick)="executeFromPreview()" />
      </ng-template>
    </p-dialog>

    <!-- Execution Progress Dialog -->
    <p-dialog
      header="Auto-PO Execution"
      [(visible)]="executionDialogVisible"
      [modal]="true"
      [closable]="!isExecuting()"
      [style]="{ width: '500px' }"
      [draggable]="false">
      @if (isExecuting()) {
        <div class="execution-progress">
          <p-progressBar mode="indeterminate" [style]="{ height: '6px' }" />
          <p>Generating purchase orders...</p>
        </div>
      } @else if (lastExecution()) {
        <div class="execution-result">
          <div class="result-icon" [ngClass]="getExecutionMarkerClass(lastExecution()!.status)">
            <i [class]="getExecutionIcon(lastExecution()!.status)" style="font-size: 2rem;"></i>
          </div>
          <h3>{{ getExecutionStatusLabel(lastExecution()!.status) }}</h3>

          <div class="result-stats">
            <div class="stat">
              <span class="value">{{ lastExecution()!.itemsEvaluated }}</span>
              <span class="label">Items Evaluated</span>
            </div>
            <div class="stat">
              <span class="value">{{ lastExecution()!.itemsBelowThreshold }}</span>
              <span class="label">Below Threshold</span>
            </div>
            <div class="stat">
              <span class="value">{{ lastExecution()!.posCreated }}</span>
              <span class="label">POs Created</span>
            </div>
            <div class="stat">
              <span class="value">{{ lastExecution()!.totalValue | currency }}</span>
              <span class="label">Total Value</span>
            </div>
          </div>

          @if (lastExecution()!.issues.length > 0) {
            <div class="result-issues">
              <h4>Warnings</h4>
              <ul>
                @for (issue of lastExecution()!.issues; track issue.itemId) {
                  <li>
                    <strong>{{ issue.itemName }}:</strong> {{ issue.message }}
                  </li>
                }
              </ul>
            </div>
          }
        </div>
      }

      <ng-template pTemplate="footer">
        <p-button
          label="Close"
          [disabled]="isExecuting()"
          (onClick)="executionDialogVisible = false" />
        @if (lastExecution()?.posCreated) {
          <p-button
            label="View Created POs"
            icon="pi pi-external-link"
            routerLink="/purchase-orders"
            [queryParams]="{ isAutoPO: true }"
            (onClick)="executionDialogVisible = false" />
        }
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .auto-po-dashboard {
      padding: 1.5rem;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .header-content h2 {
      margin: 0 0 0.25rem 0;
      font-size: 1.5rem;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-card {
      background: var(--surface-card);
      border-radius: 8px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .summary-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .summary-card.alert.has-alerts {
      border-left: 4px solid var(--orange-500);
    }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .card-icon.rules { background: var(--blue-100); color: var(--blue-600); }
    .card-icon.monitored { background: var(--purple-100); color: var(--purple-600); }
    .card-icon.below-reorder { background: var(--orange-100); color: var(--orange-600); }
    .card-icon.pending { background: var(--yellow-100); color: var(--yellow-700); }
    .card-icon.today { background: var(--green-100); color: var(--green-600); }
    .card-icon.value { background: var(--teal-100); color: var(--teal-600); }

    .card-content {
      display: flex;
      flex-direction: column;
    }

    .card-value {
      font-size: 1.5rem;
      font-weight: 600;
      line-height: 1.2;
    }

    .card-label {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    :host ::ng-deep .rules-card,
    :host ::ng-deep .items-card {
      grid-column: span 1;
    }

    :host ::ng-deep .executions-card {
      grid-column: span 1;
      grid-row: span 2;
    }

    :host ::ng-deep .chart-card {
      grid-column: span 1;
    }

    .card-header-actions {
      position: absolute;
      top: 1rem;
      right: 1rem;
    }

    .rule-name {
      display: flex;
      flex-direction: column;
    }

    .rule-name .name {
      font-weight: 500;
    }

    .rule-name .description {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .never-run {
      color: var(--text-color-secondary);
      font-style: italic;
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
    }

    .empty-state {
      padding: 2rem;
      text-align: center;
      color: var(--text-color-secondary);
    }

    .empty-state p {
      margin: 0.5rem 0;
    }

    .empty-state.success {
      color: var(--green-600);
    }

    /* Execution Timeline */
    :host ::ng-deep .execution-timeline {
      padding: 0;
    }

    .execution-marker {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .execution-marker.completed { background: var(--green-500); }
    .execution-marker.warning { background: var(--orange-500); }
    .execution-marker.failed { background: var(--red-500); }
    .execution-marker.running { background: var(--blue-500); }
    .execution-marker.pending { background: var(--gray-400); }

    .execution-item {
      padding-bottom: 1rem;
    }

    .execution-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .execution-rule {
      font-weight: 500;
    }

    .execution-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      margin-bottom: 0.25rem;
    }

    .execution-stats span {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .execution-time {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .triggered-by {
      margin-left: 0.5rem;
    }

    .execution-issues {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: var(--orange-600);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    /* Items Table */
    .item-info {
      display: flex;
      flex-direction: column;
    }

    .item-name {
      font-weight: 500;
    }

    .item-sku {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .current-qty.critical {
      color: var(--red-600);
      font-weight: 600;
    }

    .no-supplier {
      color: var(--orange-600);
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
    }

    tr.has-warning {
      background: var(--orange-50);
    }

    .view-all {
      text-align: center;
      padding-top: 1rem;
    }

    /* Preview Dialog */
    .preview-summary {
      display: flex;
      justify-content: space-around;
      padding: 1rem 0;
    }

    .preview-stat {
      text-align: center;
    }

    .preview-stat .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .preview-stat .stat-label {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }

    .preview-stat.warning .stat-value {
      color: var(--orange-600);
    }

    .loading-preview {
      padding: 2rem;
      text-align: center;
    }

    /* Execution Dialog */
    .execution-progress {
      padding: 2rem;
      text-align: center;
    }

    .execution-result {
      text-align: center;
      padding: 1rem;
    }

    .result-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
      color: white;
    }

    .result-stats {
      display: flex;
      justify-content: space-around;
      margin: 1.5rem 0;
    }

    .result-stats .stat {
      text-align: center;
    }

    .result-stats .value {
      display: block;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .result-stats .label {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .result-issues {
      text-align: left;
      background: var(--orange-50);
      border-radius: 6px;
      padding: 1rem;
      margin-top: 1rem;
    }

    .result-issues h4 {
      margin: 0 0 0.5rem 0;
      color: var(--orange-700);
    }

    .result-issues ul {
      margin: 0;
      padding-left: 1.5rem;
    }

    .result-issues li {
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    @media (max-width: 1200px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }

      :host ::ng-deep .executions-card {
        grid-row: span 1;
      }
    }

    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        gap: 1rem;
      }

      .header-actions {
        width: 100%;
        justify-content: flex-end;
      }

      .summary-cards {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class AutoPoDashboardComponent implements OnInit {
  private poService = inject(PurchaseOrderService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  // State signals
  summary = signal<AutoPOSummary | null>(null);
  activeRules = signal<AutoPORule[]>([]);
  recentExecutions = signal<AutoPOExecution[]>([]);
  previewItems = signal<AutoPOPreviewItem[]>([]);
  previewData = signal<AutoPOPreview | null>(null);
  lastExecution = signal<AutoPOExecution | null>(null);
  isExecuting = signal(false);

  previewDialogVisible = false;
  executionDialogVisible = false;

  chartData = computed(() => ({
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'POs Created',
        data: [3, 5, 2, 4],
        backgroundColor: 'rgba(59, 130, 246, 0.6)'
      },
      {
        label: 'Items Ordered',
        data: [12, 18, 8, 15],
        backgroundColor: 'rgba(16, 185, 129, 0.6)'
      }
    ]
  }));

  chartOptions = {
    plugins: {
      legend: {
        position: 'bottom'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.poService.getAutoPOSummary().subscribe(summary => {
      this.summary.set(summary);
      this.recentExecutions.set(summary.recentExecutions);
    });

    this.poService.listAutoPORules(true).subscribe(rules => {
      this.activeRules.set(rules);
    });

    this.poService.previewAutoPO().subscribe(preview => {
      this.previewItems.set(preview.items);
    });
  }

  openPreviewDialog(): void {
    this.previewDialogVisible = true;
    this.previewData.set(null);
    this.poService.previewAutoPO().subscribe(preview => {
      this.previewData.set(preview);
    });
  }

  confirmRunAutoPO(): void {
    this.confirmationService.confirm({
      message: 'This will check all active auto-PO rules and generate purchase orders for items below reorder levels. Continue?',
      header: 'Run Auto-PO',
      icon: 'pi pi-play',
      acceptLabel: 'Run Now',
      rejectLabel: 'Cancel',
      accept: () => this.executeAutoPO()
    });
  }

  executeAutoPO(): void {
    this.executionDialogVisible = true;
    this.isExecuting.set(true);
    this.lastExecution.set(null);

    this.poService.executeAutoPO().subscribe({
      next: (execution) => {
        this.isExecuting.set(false);
        this.lastExecution.set(execution);
        this.loadDashboardData();
        this.messageService.add({
          severity: execution.posCreated > 0 ? 'success' : 'info',
          summary: 'Auto-PO Complete',
          detail: `Created ${execution.posCreated} purchase order(s)`
        });
      },
      error: (err) => {
        this.isExecuting.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to execute auto-PO'
        });
      }
    });
  }

  executeFromPreview(): void {
    this.previewDialogVisible = false;
    this.executeAutoPO();
  }

  runRule(rule: AutoPORule): void {
    this.confirmationService.confirm({
      message: `Run the "${rule.name}" rule now?`,
      header: 'Run Rule',
      icon: 'pi pi-play',
      accept: () => {
        this.executionDialogVisible = true;
        this.isExecuting.set(true);
        this.lastExecution.set(null);

        this.poService.executeAutoPO(rule.id).subscribe({
          next: (execution) => {
            this.isExecuting.set(false);
            this.lastExecution.set(execution);
            this.loadDashboardData();
          },
          error: () => {
            this.isExecuting.set(false);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to execute rule'
            });
          }
        });
      }
    });
  }

  previewRule(rule: AutoPORule): void {
    this.previewDialogVisible = true;
    this.previewData.set(null);
    this.poService.previewAutoPO(rule.id).subscribe(preview => {
      this.previewData.set(preview);
    });
  }

  getTriggerLabel(type: AutoPOTriggerType): string {
    const labels: Record<AutoPOTriggerType, string> = {
      [AutoPOTriggerType.REORDER_LEVEL]: 'Reorder Level',
      [AutoPOTriggerType.SCHEDULED]: 'Scheduled',
      [AutoPOTriggerType.STOCK_MOVEMENT]: 'Stock Movement',
      [AutoPOTriggerType.MANUAL]: 'Manual'
    };
    return labels[type] || type;
  }

  getTriggerSeverity(type: AutoPOTriggerType): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<AutoPOTriggerType, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      [AutoPOTriggerType.REORDER_LEVEL]: 'info',
      [AutoPOTriggerType.SCHEDULED]: 'success',
      [AutoPOTriggerType.STOCK_MOVEMENT]: 'warn',
      [AutoPOTriggerType.MANUAL]: 'secondary'
    };
    return severities[type] || 'secondary';
  }

  getExecutionMarkerClass(status: AutoPOExecutionStatus): string {
    const classes: Record<AutoPOExecutionStatus, string> = {
      [AutoPOExecutionStatus.COMPLETED]: 'completed',
      [AutoPOExecutionStatus.COMPLETED_WITH_WARNINGS]: 'warning',
      [AutoPOExecutionStatus.FAILED]: 'failed',
      [AutoPOExecutionStatus.RUNNING]: 'running',
      [AutoPOExecutionStatus.PENDING]: 'pending'
    };
    return classes[status] || 'pending';
  }

  getExecutionIcon(status: AutoPOExecutionStatus): string {
    const icons: Record<AutoPOExecutionStatus, string> = {
      [AutoPOExecutionStatus.COMPLETED]: 'pi pi-check',
      [AutoPOExecutionStatus.COMPLETED_WITH_WARNINGS]: 'pi pi-exclamation-triangle',
      [AutoPOExecutionStatus.FAILED]: 'pi pi-times',
      [AutoPOExecutionStatus.RUNNING]: 'pi pi-spin pi-spinner',
      [AutoPOExecutionStatus.PENDING]: 'pi pi-clock'
    };
    return icons[status] || 'pi pi-question';
  }

  getExecutionStatusLabel(status: AutoPOExecutionStatus): string {
    const labels: Record<AutoPOExecutionStatus, string> = {
      [AutoPOExecutionStatus.COMPLETED]: 'Completed',
      [AutoPOExecutionStatus.COMPLETED_WITH_WARNINGS]: 'Completed with Warnings',
      [AutoPOExecutionStatus.FAILED]: 'Failed',
      [AutoPOExecutionStatus.RUNNING]: 'Running',
      [AutoPOExecutionStatus.PENDING]: 'Pending'
    };
    return labels[status] || status;
  }

  getExecutionStatusSeverity(status: AutoPOExecutionStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<AutoPOExecutionStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      [AutoPOExecutionStatus.COMPLETED]: 'success',
      [AutoPOExecutionStatus.COMPLETED_WITH_WARNINGS]: 'warn',
      [AutoPOExecutionStatus.FAILED]: 'danger',
      [AutoPOExecutionStatus.RUNNING]: 'info',
      [AutoPOExecutionStatus.PENDING]: 'secondary'
    };
    return severities[status] || 'secondary';
  }
}
