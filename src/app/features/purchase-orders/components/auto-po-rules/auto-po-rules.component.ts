import { Component, OnInit, inject, signal } from '@angular/core';
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
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { MultiSelectModule } from 'primeng/multiselect';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DividerModule } from 'primeng/divider';

import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';

import { PurchaseOrderService, CreateAutoPORuleRequest } from '../../../../core/services/purchase-order.service';
import {
  AutoPORule,
  AutoPOTriggerType,
  AutoPOQuantityMethod,
  Vendor,
  InventoryCategory
} from '../../../../shared/models';

interface TriggerOption {
  label: string;
  value: AutoPOTriggerType;
  description: string;
  icon: string;
}

interface QuantityMethodOption {
  label: string;
  value: AutoPOQuantityMethod;
  description: string;
}

@Component({
  selector: 'app-auto-po-rules',
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
    InputTextModule,
    Textarea,
    SelectModule,
    InputNumberModule,
    CheckboxModule,
    MultiSelectModule,
    AutoCompleteModule,
    ToggleSwitchModule,
    DividerModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="auto-po-rules">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="breadcrumb">
            <a routerLink="/purchase-orders/auto-po">Auto-PO Dashboard</a>
            <i class="pi pi-chevron-right"></i>
            <span>Rules</span>
          </div>
          <h2>Auto-PO Rules</h2>
          <p class="text-secondary">Configure automated purchase order generation rules</p>
        </div>
        <div class="header-actions">
          <p-button
            label="Create Rule"
            icon="pi pi-plus"
            (onClick)="openCreateDialog()" />
        </div>
      </div>

      <!-- Rules Table -->
      <p-card>
        <p-table
          [value]="rules()"
          [paginator]="true"
          [rows]="10"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} rules"
          styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 3rem;">Status</th>
              <th pSortableColumn="name">Rule Name <p-sortIcon field="name" /></th>
              <th>Trigger Type</th>
              <th>Scope</th>
              <th>Quantity Method</th>
              <th>Approval</th>
              <th>Last Run</th>
              <th>POs Generated</th>
              <th style="width: 10rem;">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-rule>
            <tr>
              <td>
                <p-toggleswitch
                  [(ngModel)]="rule.isEnabled"
                  (onChange)="toggleRuleStatus(rule)"
                  pTooltip="{{ rule.isEnabled ? 'Disable' : 'Enable' }} this rule" />
              </td>
              <td>
                <div class="rule-info">
                  <span class="rule-name">{{ rule.name }}</span>
                  @if (rule.description) {
                    <span class="rule-description">{{ rule.description }}</span>
                  }
                </div>
              </td>
              <td>
                <p-tag [value]="getTriggerLabel(rule.triggerType)" [severity]="getTriggerSeverity(rule.triggerType)" />
                @if (rule.triggerType === 'scheduled' && rule.scheduleCron) {
                  <div class="cron-display">{{ rule.scheduleCron }}</div>
                }
              </td>
              <td>
                <div class="scope-info">
                  @if (rule.categoryFilters.length > 0) {
                    <span class="scope-item"><i class="pi pi-folder"></i> {{ rule.categoryFilters.length }} categories</span>
                  }
                  @if (rule.itemIds.length > 0) {
                    <span class="scope-item"><i class="pi pi-box"></i> {{ rule.itemIds.length }} items</span>
                  }
                  @if (rule.tagIds.length > 0) {
                    <span class="scope-item"><i class="pi pi-tag"></i> {{ rule.tagIds.length }} tags</span>
                  }
                  @if (rule.categoryFilters.length === 0 && rule.itemIds.length === 0 && rule.tagIds.length === 0) {
                    <span class="scope-all">All items</span>
                  }
                </div>
              </td>
              <td>
                <span class="quantity-method">{{ getQuantityMethodLabel(rule.quantityMethod) }}</span>
                @if (rule.quantityMethod === 'fixed') {
                  <span class="quantity-detail">({{ rule.fixedQuantity }})</span>
                }
                @if (rule.quantityMethod === 'days_of_stock' && rule.daysOfStock) {
                  <span class="quantity-detail">({{ rule.daysOfStock }} days)</span>
                }
              </td>
              <td>
                @if (rule.requiresApproval) {
                  <span class="approval-required">
                    <i class="pi pi-check-circle"></i>
                    Required
                    @if (rule.approvalThreshold > 0) {
                      <span class="threshold">> {{ rule.approvalThreshold | currency }}</span>
                    }
                  </span>
                } @else {
                  <span class="approval-auto">
                    <i class="pi pi-bolt"></i>
                    Auto-approve
                  </span>
                }
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
                    pTooltip="Run now"
                    [disabled]="!rule.isEnabled"
                    (onClick)="runRule(rule)" />
                  <p-button
                    icon="pi pi-pencil"
                    [rounded]="true"
                    [text]="true"
                    severity="info"
                    pTooltip="Edit"
                    (onClick)="openEditDialog(rule)" />
                  <p-button
                    icon="pi pi-copy"
                    [rounded]="true"
                    [text]="true"
                    severity="secondary"
                    pTooltip="Duplicate"
                    (onClick)="duplicateRule(rule)" />
                  <p-button
                    icon="pi pi-trash"
                    [rounded]="true"
                    [text]="true"
                    severity="danger"
                    pTooltip="Delete"
                    (onClick)="confirmDelete(rule)" />
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="9" class="text-center">
                <div class="empty-state">
                  <i class="pi pi-cog" style="font-size: 3rem; color: var(--text-color-secondary);"></i>
                  <h3>No Auto-PO Rules</h3>
                  <p>Create your first rule to automate purchase order generation</p>
                  <p-button label="Create Rule" icon="pi pi-plus" (onClick)="openCreateDialog()" />
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>

    <!-- Create/Edit Rule Dialog -->
    <p-dialog
      [header]="isEditing() ? 'Edit Auto-PO Rule' : 'Create Auto-PO Rule'"
      [(visible)]="ruleDialogVisible"
      [modal]="true"
      [style]="{ width: '90vw', maxWidth: '900px' }"
      [draggable]="false"
      [resizable]="false">

      <!-- Steps -->
      <div class="step-indicators">
        @for (step of wizardSteps; track step.label; let i = $index) {
          <div class="step-indicator" [class.active]="i === activeStep" [class.completed]="i < activeStep" (click)="activeStep = i">
            <div class="step-number">{{ i + 1 }}</div>
            <span class="step-label">{{ step.label }}</span>
          </div>
        }
      </div>

      <div class="rule-form">
        <!-- Step 1: Basic Info -->
        @if (activeStep === 0) {
          <div class="form-step">
            <h3>Basic Information</h3>
            <p class="step-description">Configure the rule name and trigger type</p>

            <div class="form-grid">
              <div class="form-field full-width">
                <label for="ruleName">Rule Name *</label>
                <input
                  id="ruleName"
                  type="text"
                  pInputText
                  [(ngModel)]="ruleForm.name"
                  placeholder="e.g., Low Stock Medical Supplies"
                  class="w-full" />
              </div>

              <div class="form-field full-width">
                <label for="ruleDescription">Description</label>
                <textarea
                  id="ruleDescription"
                  pTextarea
                  [(ngModel)]="ruleForm.description"
                  placeholder="Describe what this rule does"
                  rows="2"
                  class="w-full"></textarea>
              </div>

              <div class="form-field full-width">
                <label>Trigger Type *</label>
                <div class="trigger-options">
                  @for (option of triggerOptions; track option.value) {
                    <div
                      class="trigger-option"
                      [class.selected]="ruleForm.triggerType === option.value"
                      (click)="ruleForm.triggerType = option.value">
                      <i [class]="option.icon"></i>
                      <div class="option-content">
                        <span class="option-label">{{ option.label }}</span>
                        <span class="option-description">{{ option.description }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>

              @if (ruleForm.triggerType === 'scheduled') {
                <div class="form-field full-width">
                  <label for="scheduleCron">Schedule (Cron Expression)</label>
                  <input
                    id="scheduleCron"
                    type="text"
                    pInputText
                    [(ngModel)]="ruleForm.scheduleCron"
                    placeholder="e.g., 0 8 * * 1 (Every Monday at 8 AM)"
                    class="w-full" />
                  <small class="hint">Examples: "0 8 * * 1" (Mon 8AM), "0 9 1 * *" (1st of month)</small>
                </div>
              }

              <div class="form-field">
                <label for="threshold">Threshold %</label>
                <p-inputNumber
                  id="threshold"
                  [(ngModel)]="ruleForm.thresholdPercentage"
                  [min]="1"
                  [max]="200"
                  suffix="%"
                  placeholder="100" />
                <small class="hint">100% = at reorder level, 80% = 20% below</small>
              </div>
            </div>
          </div>
        }

        <!-- Step 2: Scope -->
        @if (activeStep === 1) {
          <div class="form-step">
            <h3>Rule Scope</h3>
            <p class="step-description">Define which items this rule applies to</p>

            <div class="form-grid">
              <div class="form-field full-width">
                <label for="categories">Item Categories</label>
                <p-multiSelect
                  id="categories"
                  [options]="categoryOptions"
                  [(ngModel)]="ruleForm.categoryFilters"
                  placeholder="All categories"
                  [showClear]="true"
                  display="chip"
                  styleClass="w-full" />
                <small class="hint">Leave empty to include all categories</small>
              </div>

              <div class="form-field full-width">
                <label for="warehouse">Warehouse</label>
                <p-select
                  id="warehouse"
                  [options]="warehouseOptions"
                  [(ngModel)]="ruleForm.warehouseId"
                  placeholder="All warehouses"
                  [showClear]="true"
                  styleClass="w-full" />
              </div>

              <div class="form-field full-width">
                <label for="defaultSupplier">Default Supplier</label>
                <p-select
                  id="defaultSupplier"
                  [options]="supplierOptions"
                  [(ngModel)]="ruleForm.defaultSupplierId"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Use item's preferred supplier"
                  [showClear]="true"
                  [filter]="true"
                  styleClass="w-full" />
                <small class="hint">Used when item has no preferred supplier</small>
              </div>
            </div>
          </div>
        }

        <!-- Step 3: Quantity Settings -->
        @if (activeStep === 2) {
          <div class="form-step">
            <h3>Quantity Settings</h3>
            <p class="step-description">Configure how order quantities are calculated</p>

            <div class="form-grid">
              <div class="form-field full-width">
                <label>Quantity Method *</label>
                <p-select
                  [options]="quantityMethodOptions"
                  [(ngModel)]="ruleForm.quantityMethod"
                  optionLabel="label"
                  optionValue="value"
                  styleClass="w-full">
                  <ng-template pTemplate="item" let-option>
                    <div class="method-option">
                      <span class="method-label">{{ option.label }}</span>
                      <span class="method-description">{{ option.description }}</span>
                    </div>
                  </ng-template>
                </p-select>
              </div>

              @if (ruleForm.quantityMethod === 'fixed') {
                <div class="form-field">
                  <label for="fixedQty">Fixed Quantity</label>
                  <p-inputNumber
                    id="fixedQty"
                    [(ngModel)]="ruleForm.fixedQuantity"
                    [min]="1"
                    placeholder="Enter quantity" />
                </div>
              }

              @if (ruleForm.quantityMethod === 'days_of_stock') {
                <div class="form-field">
                  <label for="daysOfStock">Days of Stock</label>
                  <p-inputNumber
                    id="daysOfStock"
                    [(ngModel)]="ruleForm.daysOfStock"
                    [min]="1"
                    suffix=" days"
                    placeholder="30" />
                </div>
              }

              <div class="form-field">
                <label for="multiplier">Quantity Multiplier</label>
                <p-inputNumber
                  id="multiplier"
                  [(ngModel)]="ruleForm.multiplier"
                  [min]="0.1"
                  [max]="10"
                  [minFractionDigits]="1"
                  [maxFractionDigits]="1"
                  placeholder="1.0" />
                <small class="hint">e.g., 1.2 = order 20% extra</small>
              </div>

              <div class="form-field">
                <label for="minQty">Minimum Order Qty</label>
                <p-inputNumber
                  id="minQty"
                  [(ngModel)]="ruleForm.minimumOrderQuantity"
                  [min]="0"
                  placeholder="1" />
              </div>

              <div class="form-field">
                <label for="maxQty">Maximum Order Qty</label>
                <p-inputNumber
                  id="maxQty"
                  [(ngModel)]="ruleForm.maximumOrderQuantity"
                  [min]="0"
                  placeholder="0 = no limit" />
              </div>

              <div class="form-field full-width">
                <p-checkbox
                  [(ngModel)]="ruleForm.consolidateBySupplier"
                  [binary]="true"
                  label="Consolidate by supplier"
                  inputId="consolidate" />
                <small class="hint block">Group items from the same supplier into a single PO</small>
              </div>

              @if (ruleForm.consolidateBySupplier) {
                <div class="form-field">
                  <label for="consolidationWindow">Consolidation Window</label>
                  <p-inputNumber
                    id="consolidationWindow"
                    [(ngModel)]="ruleForm.consolidationWindowHours"
                    [min]="0"
                    [max]="168"
                    suffix=" hours"
                    placeholder="4" />
                  <small class="hint">Wait time before finalizing consolidated PO</small>
                </div>
              }
            </div>
          </div>
        }

        <!-- Step 4: Approval & Notifications -->
        @if (activeStep === 3) {
          <div class="form-step">
            <h3>Approval & Notifications</h3>
            <p class="step-description">Configure approval workflow and notifications</p>

            <div class="form-grid">
              <div class="form-field full-width">
                <p-checkbox
                  [(ngModel)]="ruleForm.requiresApproval"
                  [binary]="true"
                  label="Require approval for generated POs"
                  inputId="requiresApproval" />
              </div>

              @if (ruleForm.requiresApproval) {
                <div class="form-field">
                  <label for="approvalThreshold">Auto-approve if under</label>
                  <p-inputNumber
                    id="approvalThreshold"
                    [(ngModel)]="ruleForm.approvalThreshold"
                    [min]="0"
                    mode="currency"
                    currency="USD"
                    placeholder="0 = always require" />
                  <small class="hint">POs below this amount auto-approve</small>
                </div>
              }

              <p-divider styleClass="full-width" />

              <div class="form-field full-width">
                <h4>Notifications</h4>
              </div>

              <div class="form-field full-width">
                <p-checkbox
                  [(ngModel)]="ruleForm.notifyOnCreation"
                  [binary]="true"
                  label="Notify when PO is created"
                  inputId="notifyCreation" />
              </div>

              <div class="form-field full-width">
                <p-checkbox
                  [(ngModel)]="ruleForm.notifyOnApprovalNeeded"
                  [binary]="true"
                  label="Notify when approval is needed"
                  inputId="notifyApproval" />
              </div>

              @if (ruleForm.notifyOnCreation || ruleForm.notifyOnApprovalNeeded) {
                <div class="form-field full-width">
                  <label for="emails">Notification Emails</label>
                  <p-autoComplete
                    id="emails"
                    [(ngModel)]="ruleForm.notificationEmails"
                    [multiple]="true"
                    placeholder="Enter email addresses"
                    styleClass="w-full" />
                </div>
              }
            </div>
          </div>
        }
      </div>

      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <div class="footer-left">
            @if (activeStep > 0) {
              <p-button
                label="Previous"
                icon="pi pi-arrow-left"
                severity="secondary"
                (onClick)="activeStep = activeStep - 1" />
            }
          </div>
          <div class="footer-right">
            <p-button
              label="Cancel"
              severity="secondary"
              [text]="true"
              (onClick)="ruleDialogVisible = false" />
            @if (activeStep < 3) {
              <p-button
                label="Next"
                icon="pi pi-arrow-right"
                iconPos="right"
                (onClick)="activeStep = activeStep + 1" />
            } @else {
              <p-button
                [label]="isEditing() ? 'Update Rule' : 'Create Rule'"
                icon="pi pi-check"
                [loading]="isSaving()"
                (onClick)="saveRule()" />
            }
          </div>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .auto-po-rules {
      padding: 1.5rem;
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

    .breadcrumb a:hover {
      text-decoration: underline;
    }

    .breadcrumb i {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .header-content h2 {
      margin: 0 0 0.25rem 0;
      font-size: 1.5rem;
    }

    .rule-info {
      display: flex;
      flex-direction: column;
    }

    .rule-name {
      font-weight: 500;
    }

    .rule-description {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .cron-display {
      font-family: monospace;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      margin-top: 0.25rem;
    }

    .scope-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .scope-item {
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .scope-all {
      color: var(--text-color-secondary);
      font-style: italic;
    }

    .quantity-method {
      font-size: 0.875rem;
    }

    .quantity-detail {
      color: var(--text-color-secondary);
      font-size: 0.75rem;
    }

    .approval-required {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--blue-600);
      font-size: 0.875rem;
    }

    .approval-required .threshold {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .approval-auto {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--green-600);
      font-size: 0.875rem;
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
      padding: 3rem;
      text-align: center;
    }

    .empty-state h3 {
      margin: 1rem 0 0.5rem;
    }

    .empty-state p {
      color: var(--text-color-secondary);
      margin-bottom: 1rem;
    }

    /* Step Indicators */
    .step-indicators { display: flex; justify-content: center; gap: 2rem; margin-bottom: 1rem; }
    .step-indicator { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; opacity: 0.5; cursor: pointer; }
    .step-indicator.active, .step-indicator.completed { opacity: 1; }
    .step-number { width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem; background: var(--bg-hover, #e5e7eb); color: var(--text-secondary, #6b7280); border: 1px solid var(--border-color, #d1d5db); }
    .step-indicator.active .step-number { background: var(--primary-600, #059669); color: white; border-color: var(--primary-600, #059669); }
    .step-indicator.completed .step-number { background: var(--primary-500, #10b981); color: white; border-color: var(--primary-500, #10b981); }
    .step-label { font-size: 0.75rem; color: var(--text-color-secondary); }

    /* Dialog Form */
    .rule-form {
      padding: 1.5rem 0;
    }

    .form-step h3 {
      margin: 0 0 0.25rem 0;
    }

    .step-description {
      color: var(--text-color-secondary);
      margin-bottom: 1.5rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field.full-width {
      grid-column: span 2;
    }

    .form-field label {
      font-weight: 500;
      font-size: 0.875rem;
    }

    .form-field h4 {
      margin: 0;
      font-size: 1rem;
    }

    .hint {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .hint.block {
      display: block;
      margin-top: 0.25rem;
    }

    /* Trigger Options */
    .trigger-options {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .trigger-option {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      border: 2px solid var(--surface-border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .trigger-option:hover {
      border-color: var(--primary-200);
    }

    .trigger-option.selected {
      border-color: var(--primary-color);
      background: var(--primary-50);
    }

    .trigger-option i {
      font-size: 1.5rem;
      color: var(--primary-color);
    }

    .option-content {
      display: flex;
      flex-direction: column;
    }

    .option-label {
      font-weight: 500;
    }

    .option-description {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    /* Method Option */
    .method-option {
      display: flex;
      flex-direction: column;
    }

    .method-label {
      font-weight: 500;
    }

    .method-description {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    /* Dialog Footer */
    .dialog-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .footer-right {
      display: flex;
      gap: 0.5rem;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-field.full-width {
        grid-column: span 1;
      }

      .trigger-options {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AutoPoRulesComponent implements OnInit {
  private poService = inject(PurchaseOrderService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  rules = signal<AutoPORule[]>([]);
  isEditing = signal(false);
  isSaving = signal(false);
  ruleDialogVisible = false;
  activeStep = 0;

  ruleForm: CreateAutoPORuleRequest & { id?: string } = this.getEmptyForm();

  wizardSteps = [
    { label: 'Basic Info' },
    { label: 'Scope' },
    { label: 'Quantity' },
    { label: 'Approval' }
  ];

  triggerOptions: TriggerOption[] = [
    { label: 'Reorder Level', value: AutoPOTriggerType.REORDER_LEVEL, description: 'Trigger when stock falls to reorder level', icon: 'pi pi-chart-line' },
    { label: 'Scheduled', value: AutoPOTriggerType.SCHEDULED, description: 'Run on a fixed schedule', icon: 'pi pi-calendar' },
    { label: 'Stock Movement', value: AutoPOTriggerType.STOCK_MOVEMENT, description: 'Trigger immediately on stock change', icon: 'pi pi-bolt' },
    { label: 'Manual Only', value: AutoPOTriggerType.MANUAL, description: 'Only run when manually triggered', icon: 'pi pi-user' }
  ];

  quantityMethodOptions: QuantityMethodOption[] = [
    { label: 'Reorder Quantity', value: AutoPOQuantityMethod.REORDER_QUANTITY, description: "Use item's configured reorder quantity" },
    { label: 'Fixed Quantity', value: AutoPOQuantityMethod.FIXED, description: 'Order a fixed amount each time' },
    { label: 'Up to Maximum', value: AutoPOQuantityMethod.UP_TO_MAX, description: "Order enough to reach item's max stock level" },
    { label: 'Days of Stock', value: AutoPOQuantityMethod.DAYS_OF_STOCK, description: 'Calculate based on average daily usage' },
    { label: 'Economic Order Qty', value: AutoPOQuantityMethod.ECONOMIC_ORDER, description: 'Calculate optimal order quantity (EOQ)' }
  ];

  categoryOptions = [
    { label: 'Consumables', value: 'Consumables' },
    { label: 'Medical Supplies', value: 'Medical Supplies' },
    { label: 'Laboratory Supplies', value: 'Laboratory Supplies' },
    { label: 'Spare Parts', value: 'Spare Parts' },
    { label: 'Reagents', value: 'Reagents' },
    { label: 'Safety Equipment', value: 'Safety Equipment' }
  ];

  warehouseOptions = [
    { label: 'Main Warehouse', value: 'wh-1' },
    { label: 'Lab Storage', value: 'wh-2' },
    { label: 'Emergency Stock', value: 'wh-3' }
  ];

  supplierOptions: Vendor[] = [];

  ngOnInit(): void {
    this.loadRules();
    this.loadSuppliers();
  }

  loadRules(): void {
    this.poService.listAutoPORules().subscribe(rules => {
      this.rules.set(rules);
    });
  }

  loadSuppliers(): void {
    this.poService.getSuppliers().subscribe(suppliers => {
      this.supplierOptions = suppliers;
    });
  }

  getEmptyForm(): CreateAutoPORuleRequest & { id?: string } {
    return {
      name: '',
      description: '',
      triggerType: AutoPOTriggerType.REORDER_LEVEL,
      thresholdPercentage: 100,
      itemIds: [],
      categoryFilters: [],
      tagIds: [],
      warehouseId: undefined,
      defaultSupplierId: undefined,
      quantityMethod: AutoPOQuantityMethod.REORDER_QUANTITY,
      fixedQuantity: undefined,
      daysOfStock: undefined,
      multiplier: 1.0,
      minimumOrderQuantity: 1,
      maximumOrderQuantity: 0,
      requiresApproval: true,
      approvalThreshold: 0,
      approverIds: [],
      consolidateBySupplier: true,
      consolidationWindowHours: 4,
      scheduleCron: undefined,
      notifyOnCreation: true,
      notifyOnApprovalNeeded: true,
      notificationEmails: []
    };
  }

  openCreateDialog(): void {
    this.ruleForm = this.getEmptyForm();
    this.isEditing.set(false);
    this.activeStep = 0;
    this.ruleDialogVisible = true;
  }

  openEditDialog(rule: AutoPORule): void {
    this.ruleForm = {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      triggerType: rule.triggerType,
      thresholdPercentage: rule.thresholdPercentage,
      itemIds: [...rule.itemIds],
      categoryFilters: [...rule.categoryFilters],
      tagIds: [...rule.tagIds],
      warehouseId: rule.warehouseId,
      defaultSupplierId: rule.defaultSupplierId,
      quantityMethod: rule.quantityMethod,
      fixedQuantity: rule.fixedQuantity,
      daysOfStock: rule.daysOfStock,
      multiplier: rule.multiplier,
      minimumOrderQuantity: rule.minimumOrderQuantity,
      maximumOrderQuantity: rule.maximumOrderQuantity,
      requiresApproval: rule.requiresApproval,
      approvalThreshold: rule.approvalThreshold,
      approverIds: [...rule.approverIds],
      consolidateBySupplier: rule.consolidateBySupplier,
      consolidationWindowHours: rule.consolidationWindowHours,
      scheduleCron: rule.scheduleCron,
      notifyOnCreation: rule.notifyOnCreation,
      notifyOnApprovalNeeded: rule.notifyOnApprovalNeeded,
      notificationEmails: [...rule.notificationEmails]
    };
    this.isEditing.set(true);
    this.activeStep = 0;
    this.ruleDialogVisible = true;
  }

  duplicateRule(rule: AutoPORule): void {
    this.openEditDialog(rule);
    this.ruleForm.id = undefined;
    this.ruleForm.name = `${rule.name} (Copy)`;
    this.isEditing.set(false);
  }

  saveRule(): void {
    if (!this.ruleForm.name) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Rule name is required'
      });
      return;
    }

    this.isSaving.set(true);

    if (this.isEditing() && this.ruleForm.id) {
      this.poService.updateAutoPORule(this.ruleForm.id, this.ruleForm as Partial<AutoPORule>).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.ruleDialogVisible = false;
          this.loadRules();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Rule updated successfully'
          });
        },
        error: () => {
          this.isSaving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update rule'
          });
        }
      });
    } else {
      this.poService.createAutoPORule(this.ruleForm).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.ruleDialogVisible = false;
          this.loadRules();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Rule created successfully'
          });
        },
        error: () => {
          this.isSaving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create rule'
          });
        }
      });
    }
  }

  toggleRuleStatus(rule: AutoPORule): void {
    const action = rule.isEnabled ? 'enable' : 'disable';
    const observable = rule.isEnabled
      ? this.poService.enableAutoPORule(rule.id)
      : this.poService.disableAutoPORule(rule.id);

    observable.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Rule ${action}d successfully`
        });
      },
      error: () => {
        rule.isEnabled = !rule.isEnabled; // Revert
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to ${action} rule`
        });
      }
    });
  }

  confirmDelete(rule: AutoPORule): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the rule "${rule.name}"? This action cannot be undone.`,
      header: 'Delete Rule',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.poService.deleteAutoPORule(rule.id).subscribe({
          next: () => {
            this.loadRules();
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Rule deleted successfully'
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete rule'
            });
          }
        });
      }
    });
  }

  runRule(rule: AutoPORule): void {
    this.confirmationService.confirm({
      message: `Run the rule "${rule.name}" now?`,
      header: 'Run Rule',
      icon: 'pi pi-play',
      accept: () => {
        this.poService.executeAutoPO(rule.id).subscribe({
          next: (execution) => {
            this.loadRules();
            this.messageService.add({
              severity: 'success',
              summary: 'Execution Complete',
              detail: `Created ${execution.posCreated} purchase order(s)`
            });
          },
          error: () => {
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

  getTriggerLabel(type: AutoPOTriggerType): string {
    const option = this.triggerOptions.find(o => o.value === type);
    return option?.label || type;
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

  getQuantityMethodLabel(method: AutoPOQuantityMethod): string {
    const option = this.quantityMethodOptions.find(o => o.value === method);
    return option?.label || method;
  }
}
