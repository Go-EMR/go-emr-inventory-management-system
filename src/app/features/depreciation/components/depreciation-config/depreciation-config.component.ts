import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DepreciationService } from '@core/services/depreciation.service';
import {
  Equipment,
  DepreciationConfig,
  DepreciationMethod,
  DepreciationType,
  DepreciationPeriod,
  DepreciationStatus
} from '@shared/models';

@Component({
  selector: 'app-depreciation-config',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    DividerModule,
    ToastModule,
    CurrencyPipe
  ],
  providers: [MessageService],
  template: `
    <div class="depreciation-config-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button pButton
            icon="pi pi-arrow-left"
            class="p-button-text p-button-secondary"
            [routerLink]="['/depreciation']"
          ></button>
          <h1>{{ isEditing ? 'Edit' : 'Configure' }} Depreciation</h1>
        </div>
      </div>

      <div class="content-grid">
        <!-- Form -->
        <p-card header="Depreciation Configuration" styleClass="form-card">
          <form (ngSubmit)="onSubmit()" #configForm="ngForm">
            <!-- Equipment Selection -->
            @if (!isEditing) {
              <div class="form-section">
                <h3>Select Equipment</h3>
                <div class="form-field">
                  <label for="equipment">Equipment <span class="required">*</span></label>
                  <p-select
                    id="equipment"
                    name="equipmentId"
                    [options]="equipmentOptions"
                    [(ngModel)]="formData.equipmentId"
                    placeholder="Select equipment to configure"
                    required
                    [filter]="true"
                    filterPlaceholder="Search equipment..."
                    styleClass="w-full"
                    (onChange)="onEquipmentChange($event)"
                  />
                </div>
              </div>

              <p-divider />
            }

            @if (selectedEquipment()) {
              <!-- Equipment Info -->
              <div class="equipment-info-section">
                <h3>Equipment Details</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Name</label>
                    <span>{{ selectedEquipment()!.name }}</span>
                  </div>
                  <div class="info-item">
                    <label>Inventory Number</label>
                    <span>{{ selectedEquipment()!.inventoryNumber }}</span>
                  </div>
                  <div class="info-item">
                    <label>Purchase Date</label>
                    <span>{{ selectedEquipment()!.purchaseDate | date:'mediumDate' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Original Cost</label>
                    <span>{{ selectedEquipment()!.purchaseCost | currency }}</span>
                  </div>
                </div>
              </div>

              <p-divider />

              <!-- Depreciation Settings -->
              <div class="form-section">
                <h3>Depreciation Settings</h3>

                <div class="form-grid">
                  <div class="form-field">
                    <label for="method">Depreciation Method <span class="required">*</span></label>
                    <p-select
                      id="method"
                      name="method"
                      [options]="methodOptions"
                      [(ngModel)]="formData.method"
                      required
                      styleClass="w-full"
                    />
                  </div>

                  <div class="form-field">
                    <label for="type">Depreciation Type <span class="required">*</span></label>
                    <p-select
                      id="type"
                      name="depreciationType"
                      [options]="typeOptions"
                      [(ngModel)]="formData.depreciationType"
                      required
                      styleClass="w-full"
                    />
                  </div>

                  <div class="form-field">
                    <label for="acquisitionCost">Acquisition Cost <span class="required">*</span></label>
                    <p-inputNumber
                      id="acquisitionCost"
                      name="acquisitionCost"
                      [(ngModel)]="formData.acquisitionCost"
                      mode="currency"
                      currency="USD"
                      required
                      styleClass="w-full"
                    />
                  </div>

                  <div class="form-field">
                    <label for="salvageValue">Salvage Value <span class="required">*</span></label>
                    <p-inputNumber
                      id="salvageValue"
                      name="salvageValue"
                      [(ngModel)]="formData.salvageValue"
                      mode="currency"
                      currency="USD"
                      required
                      styleClass="w-full"
                    />
                  </div>

                  <div class="form-field">
                    <label for="usefulLife">Useful Life (Years) <span class="required">*</span></label>
                    <p-inputNumber
                      id="usefulLife"
                      name="usefulLifeYears"
                      [(ngModel)]="formData.usefulLifeYears"
                      [min]="1"
                      [max]="50"
                      required
                      styleClass="w-full"
                    />
                  </div>

                  <div class="form-field">
                    <label for="period">Depreciation Period <span class="required">*</span></label>
                    <p-select
                      id="period"
                      name="period"
                      [options]="periodOptions"
                      [(ngModel)]="formData.period"
                      required
                      styleClass="w-full"
                    />
                  </div>

                  <div class="form-field">
                    <label for="placedInService">Placed in Service Date <span class="required">*</span></label>
                    <p-datepicker
                      id="placedInService"
                      name="placedInServiceDate"
                      [(ngModel)]="formData.placedInServiceDate"
                      [showIcon]="true"
                      dateFormat="mm/dd/yy"
                      required
                      styleClass="w-full"
                    />
                  </div>

                  <div class="form-field">
                    <label for="startDate">Depreciation Start Date <span class="required">*</span></label>
                    <p-datepicker
                      id="startDate"
                      name="depreciationStartDate"
                      [(ngModel)]="formData.depreciationStartDate"
                      [showIcon]="true"
                      dateFormat="mm/dd/yy"
                      required
                      styleClass="w-full"
                    />
                  </div>
                </div>

                @if (formData.method === DepreciationMethod.UNITS_OF_PRODUCTION) {
                  <div class="form-field" style="margin-top: 1rem;">
                    <label for="totalUnits">Total Estimated Units</label>
                    <p-inputNumber
                      id="totalUnits"
                      name="totalUnits"
                      [(ngModel)]="formData.totalUnits"
                      [min]="1"
                      styleClass="w-full"
                    />
                    <small class="hint">Total units the asset is expected to produce over its useful life.</small>
                  </div>
                }
              </div>
            }

            <!-- Form Actions -->
            <div class="form-actions">
              <button pButton
                type="button"
                label="Cancel"
                icon="pi pi-times"
                class="p-button-outlined p-button-secondary"
                [routerLink]="['/depreciation']"
              ></button>
              <button pButton
                type="button"
                label="Preview Schedule"
                icon="pi pi-eye"
                class="p-button-outlined"
                [disabled]="!isFormValid()"
                (click)="previewSchedule()"
              ></button>
              <button pButton
                type="submit"
                label="{{ isEditing ? 'Update' : 'Configure' }} Depreciation"
                icon="pi pi-check"
                [loading]="isSubmitting"
                [disabled]="!isFormValid()"
              ></button>
            </div>
          </form>
        </p-card>

        <!-- Summary Panel -->
        <div class="summary-panel">
          <p-card header="Calculation Summary" styleClass="summary-card">
            @if (selectedEquipment() && formData.acquisitionCost && formData.salvageValue) {
              <div class="summary-items">
                <div class="summary-item">
                  <label>Depreciable Basis</label>
                  <span class="value">{{ (formData.acquisitionCost! - formData.salvageValue!) | currency }}</span>
                </div>
                <div class="summary-item">
                  <label>Annual Depreciation</label>
                  <span class="value">{{ getAnnualDepreciation() | currency }}</span>
                </div>
                <div class="summary-item">
                  <label>Monthly Depreciation</label>
                  <span class="value">{{ getMonthlyDepreciation() | currency }}</span>
                </div>
                <div class="summary-item">
                  <label>Total Periods</label>
                  <span class="value">{{ getTotalPeriods() }}</span>
                </div>
                <div class="summary-item">
                  <label>Expected End Date</label>
                  <span class="value">{{ getExpectedEndDate() | date:'mediumDate' }}</span>
                </div>
              </div>
            } @else {
              <div class="no-summary">
                <i class="pi pi-calculator"></i>
                <p>Select equipment and enter values to see calculations</p>
              </div>
            }
          </p-card>

          <!-- Method Info -->
          <p-card header="Method Information" styleClass="info-card">
            <div class="method-info">
              @switch (formData.method) {
                @case (DepreciationMethod.STRAIGHT_LINE) {
                  <p><strong>Straight Line</strong></p>
                  <p>Depreciation = (Cost - Salvage) / Useful Life</p>
                  <p>Equal expense each period. Simple and widely used.</p>
                }
                @case (DepreciationMethod.DECLINING_BALANCE) {
                  <p><strong>Declining Balance</strong></p>
                  <p>Depreciation = Book Value × (1/Life × 1.5)</p>
                  <p>Accelerated depreciation with higher early expenses.</p>
                }
                @case (DepreciationMethod.DOUBLE_DECLINING_BALANCE) {
                  <p><strong>Double Declining Balance</strong></p>
                  <p>Depreciation = Book Value × (1/Life × 2)</p>
                  <p>Most aggressive acceleration. Highest early deductions.</p>
                }
                @case (DepreciationMethod.SUM_OF_YEARS_DIGITS) {
                  <p><strong>Sum of Years' Digits</strong></p>
                  <p>Depreciation = (Remaining Life / Sum) × Basis</p>
                  <p>Accelerated but less aggressive than DDB.</p>
                }
                @case (DepreciationMethod.UNITS_OF_PRODUCTION) {
                  <p><strong>Units of Production</strong></p>
                  <p>Depreciation = (Units Used / Total Units) × Basis</p>
                  <p>Based on actual usage rather than time.</p>
                }
              }
            </div>
          </p-card>
        </div>
      </div>
    </div>

    <p-toast />
  `,
  styles: [`
    .depreciation-config-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      align-items: center;
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

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 1.5rem;
    }

    @media (max-width: 1200px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    :host ::ng-deep .form-card {
      .p-card-body {
        padding: 1.5rem;
      }
      .p-card-content {
        padding: 0;
      }
    }

    .form-section h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .required {
      color: var(--alert-500);
    }

    .hint {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* Equipment Info */
    .equipment-info-section h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    @media (max-width: 640px) {
      .info-grid {
        grid-template-columns: 1fr;
      }
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-item label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .info-item span {
      font-weight: 500;
      color: var(--text-primary);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    /* Summary Panel */
    .summary-panel {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    :host ::ng-deep .summary-card,
    :host ::ng-deep .info-card {
      .p-card-body {
        padding: 1rem;
      }
      .p-card-content {
        padding: 0;
      }
    }

    .summary-items {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border-color);
    }

    .summary-item:last-child {
      border-bottom: none;
    }

    .summary-item label {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .summary-item .value {
      font-weight: 600;
      color: var(--text-primary);
      font-family: var(--font-mono);
    }

    .no-summary {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted);
    }

    .no-summary i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .no-summary p {
      margin: 0;
    }

    .method-info p {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .method-info p:first-child {
      color: var(--text-primary);
    }
  `]
})
export class DepreciationConfigComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);
  depreciationService = inject(DepreciationService);

  DepreciationMethod = DepreciationMethod;

  isEditing = false;
  isSubmitting = false;
  selectedEquipment = signal<Equipment | null>(null);

  equipmentOptions: { label: string; value: string }[] = [];

  methodOptions = Object.values(DepreciationMethod).map(m => ({ label: m, value: m }));
  typeOptions = Object.values(DepreciationType).map(t => ({ label: t, value: t }));
  periodOptions = Object.values(DepreciationPeriod).map(p => ({ label: p, value: p }));

  formData: Partial<DepreciationConfig> = {
    method: DepreciationMethod.STRAIGHT_LINE,
    depreciationType: DepreciationType.BOOK,
    period: DepreciationPeriod.MONTHLY,
    placedInServiceDate: new Date(),
    depreciationStartDate: new Date()
  };

  ngOnInit(): void {
    const equipmentId = this.route.snapshot.paramMap.get('id');

    if (equipmentId) {
      // Check if we're editing existing config or creating new for this equipment
      this.depreciationService.getConfigByEquipmentId(equipmentId).subscribe(config => {
        if (config) {
          this.isEditing = true;
          this.formData = { ...config };
          this.loadEquipment(equipmentId);
        } else {
          this.loadEquipment(equipmentId);
        }
      });
    }

    this.loadAvailableEquipment();
  }

  loadAvailableEquipment(): void {
    this.depreciationService.getEquipmentWithoutDepreciation().subscribe(equipment => {
      this.equipmentOptions = equipment.map(e => ({
        label: `${e.name} (${e.inventoryNumber})`,
        value: e.id
      }));
    });
  }

  loadEquipment(id: string): void {
    this.depreciationService.getEquipmentById(id).subscribe(equipment => {
      if (equipment) {
        this.selectedEquipment.set(equipment);
        this.formData.equipmentId = equipment.id;
        this.formData.equipmentName = equipment.name;
        this.formData.equipmentInventoryNumber = equipment.inventoryNumber;

        if (!this.isEditing && equipment.purchaseCost) {
          this.formData.acquisitionCost = equipment.purchaseCost;
        }
        if (!this.isEditing && equipment.purchaseDate) {
          this.formData.placedInServiceDate = new Date(equipment.purchaseDate);
        }
      }
    });
  }

  onEquipmentChange(event: any): void {
    if (event.value) {
      this.loadEquipment(event.value);
    } else {
      this.selectedEquipment.set(null);
    }
  }

  isFormValid(): boolean {
    return !!(
      this.formData.equipmentId &&
      this.formData.method &&
      this.formData.acquisitionCost &&
      this.formData.salvageValue !== undefined &&
      this.formData.usefulLifeYears &&
      this.formData.placedInServiceDate &&
      this.formData.depreciationStartDate
    );
  }

  getAnnualDepreciation(): number {
    if (!this.formData.acquisitionCost || !this.formData.salvageValue || !this.formData.usefulLifeYears) {
      return 0;
    }
    const basis = this.formData.acquisitionCost - this.formData.salvageValue;
    return basis / this.formData.usefulLifeYears;
  }

  getMonthlyDepreciation(): number {
    return this.getAnnualDepreciation() / 12;
  }

  getTotalPeriods(): number {
    if (!this.formData.usefulLifeYears || !this.formData.period) {
      return 0;
    }
    switch (this.formData.period) {
      case DepreciationPeriod.MONTHLY: return this.formData.usefulLifeYears * 12;
      case DepreciationPeriod.QUARTERLY: return this.formData.usefulLifeYears * 4;
      case DepreciationPeriod.ANNUALLY: return this.formData.usefulLifeYears;
      default: return 0;
    }
  }

  getExpectedEndDate(): Date | null {
    if (!this.formData.depreciationStartDate || !this.formData.usefulLifeYears) {
      return null;
    }
    const endDate = new Date(this.formData.depreciationStartDate);
    endDate.setFullYear(endDate.getFullYear() + this.formData.usefulLifeYears);
    return endDate;
  }

  previewSchedule(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Preview',
      detail: 'Schedule preview will open in new window'
    });
    // In real implementation, this would open a modal or navigate to schedule view
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields'
      });
      return;
    }

    this.isSubmitting = true;

    const config: Omit<DepreciationConfig, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'> = {
      equipmentId: this.formData.equipmentId!,
      equipmentName: this.formData.equipmentName!,
      equipmentInventoryNumber: this.formData.equipmentInventoryNumber,
      depreciationType: this.formData.depreciationType!,
      method: this.formData.method!,
      acquisitionCost: this.formData.acquisitionCost!,
      salvageValue: this.formData.salvageValue!,
      depreciableBasis: this.formData.acquisitionCost! - this.formData.salvageValue!,
      usefulLifeYears: this.formData.usefulLifeYears!,
      usefulLifeMonths: this.formData.usefulLifeYears! * 12,
      totalUnits: this.formData.totalUnits,
      placedInServiceDate: this.formData.placedInServiceDate!,
      depreciationStartDate: this.formData.depreciationStartDate!,
      expectedEndDate: this.getExpectedEndDate()!,
      period: this.formData.period!,
      status: DepreciationStatus.ACTIVE,
      accumulatedDepreciation: 0,
      currentBookValue: this.formData.acquisitionCost!,
      percentDepreciated: 0
    };

    if (this.isEditing) {
      this.depreciationService.updateConfig(this.formData.id!, config).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: 'Depreciation configuration updated successfully'
          });
          setTimeout(() => this.router.navigate(['/depreciation']), 1000);
        },
        error: () => {
          this.isSubmitting = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update configuration'
          });
        }
      });
    } else {
      this.depreciationService.createConfig(config).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Created',
            detail: 'Depreciation configured successfully'
          });
          setTimeout(() => this.router.navigate(['/depreciation']), 1000);
        },
        error: () => {
          this.isSubmitting = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create configuration'
          });
        }
      });
    }
  }
}
