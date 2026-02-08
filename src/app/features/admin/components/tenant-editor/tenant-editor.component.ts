import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ColorPickerModule } from 'primeng/colorpicker';
import { FileUploadModule } from 'primeng/fileupload';
import { AvatarModule } from 'primeng/avatar';
import { MessageService } from 'primeng/api';
import { TenantService } from '@core/services/tenant.service';
import { Tenant, TenantStatus, SubscriptionPlan, TenantFeatureFlags, TenantBranding, ComplianceFramework, TenantContactInfo } from '@shared/models';

@Component({
  selector: 'app-tenant-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TabsModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    SelectModule,
    InputNumberModule,
    CheckboxModule,
    DividerModule,
    ToastModule,
    ColorPickerModule,
    FileUploadModule,
    AvatarModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>

    <div class="tenant-editor p-4">
      <div class="flex align-items-center justify-content-between mb-4">
        <div>
          <h1 class="text-2xl font-bold m-0">
            {{ isEditing ? 'Edit Organization' : 'Create Organization' }}
          </h1>
          <p class="text-color-secondary mt-1">
            {{ isEditing ? 'Update organization details and settings' : 'Set up a new organization' }}
          </p>
        </div>
        <p-button
          label="Back to List"
          icon="pi pi-arrow-left"
          severity="secondary"
          [text]="true"
          (onClick)="goBack()"
        ></p-button>
      </div>

      <p-tabs value="0">
        <p-tablist>
          <p-tab value="0">Basic Information</p-tab>
          <p-tab value="1">Feature Limits</p-tab>
          <p-tab value="2">Branding</p-tab>
        </p-tablist>
        <p-tabpanels>
          <!-- Basic Info Tab -->
          <p-tabpanel value="0">
            <p-card>
              <div class="grid">
                <div class="col-12 md:col-6">
                  <div class="field">
                    <label for="name" class="font-medium required">Organization Name</label>
                    <input
                      pInputText
                      id="name"
                      [(ngModel)]="tenantForm.name"
                      class="w-full"
                      placeholder="Acme Healthcare"
                      required
                    />
                  </div>
                </div>

                <div class="col-12 md:col-6">
                  <div class="field">
                    <label for="slug" class="font-medium required">URL Slug</label>
                    <div class="p-inputgroup">
                      <input
                        pInputText
                        id="slug"
                        [(ngModel)]="tenantForm.slug"
                        placeholder="acme-healthcare"
                        (ngModelChange)="onSlugChange($event)"
                      />
                      <span class="p-inputgroup-addon">.goemr.com</span>
                    </div>
                    <small class="text-color-secondary">
                      This will be the URL for your organization
                    </small>
                  </div>
                </div>

                <div class="col-12 md:col-6">
                  <div class="field">
                    <label for="status" class="font-medium">Status</label>
                    <p-select
                      id="status"
                      [(ngModel)]="tenantForm.status"
                      [options]="statusOptions"
                      styleClass="w-full"
                    ></p-select>
                  </div>
                </div>

                <div class="col-12 md:col-6">
                  <div class="field">
                    <label for="plan" class="font-medium">Subscription Plan</label>
                    <p-select
                      id="plan"
                      [(ngModel)]="tenantForm.subscriptionPlan"
                      [options]="planOptions"
                      styleClass="w-full"
                      (onChange)="onPlanChange($event.value)"
                    ></p-select>
                  </div>
                </div>

                <div class="col-12">
                  <p-divider></p-divider>
                  <h3 class="text-lg font-semibold mb-3">Primary Contact</h3>
                </div>

                <div class="col-12 md:col-6">
                  <div class="field">
                    <label for="contactName" class="font-medium">Contact Name</label>
                    <input
                      pInputText
                      id="contactName"
                      [(ngModel)]="tenantForm.contact.primaryContactName"
                      class="w-full"
                      placeholder="John Smith"
                    />
                  </div>
                </div>

                <div class="col-12 md:col-6">
                  <div class="field">
                    <label for="contactEmail" class="font-medium">Contact Email</label>
                    <input
                      pInputText
                      id="contactEmail"
                      [(ngModel)]="tenantForm.contact.primaryContactEmail"
                      type="email"
                      class="w-full"
                      placeholder="john@acme.com"
                    />
                  </div>
                </div>

                <div class="col-12 md:col-6">
                  <div class="field">
                    <label for="phone" class="font-medium">Phone</label>
                    <input
                      pInputText
                      id="phone"
                      [(ngModel)]="tenantForm.contact.phone"
                      class="w-full"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>
            </p-card>
          </p-tabpanel>

          <!-- Feature Limits Tab -->
          <p-tabpanel value="1">
            <p-card>
              <p class="text-color-secondary mb-4">
                Configure the feature limits for this organization based on their subscription plan.
              </p>

              <div class="grid">
                <div class="col-12 md:col-4">
                  <div class="field">
                    <label for="maxUsers" class="font-medium">Max Users</label>
                    <p-inputNumber
                      id="maxUsers"
                      [(ngModel)]="tenantForm.featureFlags.maxUsers"
                      [min]="-1"
                      [showButtons]="true"
                      styleClass="w-full"
                    ></p-inputNumber>
                    <small class="text-color-secondary">Set to -1 for unlimited</small>
                  </div>
                </div>

                <div class="col-12 md:col-4">
                  <div class="field">
                    <label for="maxEquipment" class="font-medium">Max Equipment</label>
                    <p-inputNumber
                      id="maxEquipment"
                      [(ngModel)]="tenantForm.featureFlags.maxEquipment"
                      [min]="-1"
                      [showButtons]="true"
                      styleClass="w-full"
                    ></p-inputNumber>
                    <small class="text-color-secondary">Set to -1 for unlimited</small>
                  </div>
                </div>

                <div class="col-12 md:col-4">
                  <div class="field">
                    <label for="maxInventory" class="font-medium">Max Inventory Items</label>
                    <p-inputNumber
                      id="maxInventory"
                      [(ngModel)]="tenantForm.featureFlags.maxInventoryItems"
                      [min]="-1"
                      [showButtons]="true"
                      styleClass="w-full"
                    ></p-inputNumber>
                    <small class="text-color-secondary">Set to -1 for unlimited</small>
                  </div>
                </div>

                <div class="col-12">
                  <p-divider></p-divider>
                  <h3 class="text-lg font-semibold mb-3">Feature Access</h3>
                </div>

                <div class="col-12 md:col-6">
                  <div class="field-checkbox">
                    <p-checkbox
                      [(ngModel)]="tenantForm.featureFlags.advancedReporting"
                      [binary]="true"
                      inputId="advancedReporting"
                    ></p-checkbox>
                    <label for="advancedReporting" class="ml-2">
                      Advanced Reporting
                      <span class="text-color-secondary text-sm ml-2">(Professional+)</span>
                    </label>
                  </div>
                </div>

                <div class="col-12 md:col-6">
                  <div class="field-checkbox">
                    <p-checkbox
                      [(ngModel)]="tenantForm.featureFlags.apiAccess"
                      [binary]="true"
                      inputId="apiAccess"
                    ></p-checkbox>
                    <label for="apiAccess" class="ml-2">
                      API Access
                      <span class="text-color-secondary text-sm ml-2">(Professional+)</span>
                    </label>
                  </div>
                </div>

                <div class="col-12 md:col-6">
                  <div class="field-checkbox">
                    <p-checkbox
                      [(ngModel)]="tenantForm.featureFlags.webhooksEnabled"
                      [binary]="true"
                      inputId="webhooksEnabled"
                    ></p-checkbox>
                    <label for="webhooksEnabled" class="ml-2">
                      Webhooks
                      <span class="text-color-secondary text-sm ml-2">(Professional+)</span>
                    </label>
                  </div>
                </div>

                <div class="col-12 md:col-6">
                  <div class="field-checkbox">
                    <p-checkbox
                      [(ngModel)]="tenantForm.featureFlags.customBranding"
                      [binary]="true"
                      inputId="customBranding"
                    ></p-checkbox>
                    <label for="customBranding" class="ml-2">
                      Custom Branding
                      <span class="text-color-secondary text-sm ml-2">(Enterprise)</span>
                    </label>
                  </div>
                </div>

                <div class="col-12 md:col-6">
                  <div class="field-checkbox">
                    <p-checkbox
                      [(ngModel)]="tenantForm.featureFlags.offlineMode"
                      [binary]="true"
                      inputId="offlineMode"
                    ></p-checkbox>
                    <label for="offlineMode" class="ml-2">
                      Offline Mode
                      <span class="text-color-secondary text-sm ml-2">(Enterprise)</span>
                    </label>
                  </div>
                </div>

                <div class="col-12">
                  <p-divider></p-divider>
                  <h3 class="text-lg font-semibold mb-3">Compliance Modules</h3>
                </div>

                <div class="col-12 md:col-4">
                  <div class="field-checkbox">
                    <p-checkbox
                      [(ngModel)]="complianceHipaa"
                      [binary]="true"
                      inputId="hipaa"
                    ></p-checkbox>
                    <label for="hipaa" class="ml-2">HIPAA</label>
                  </div>
                </div>

                <div class="col-12 md:col-4">
                  <div class="field-checkbox">
                    <p-checkbox
                      [(ngModel)]="complianceFda"
                      [binary]="true"
                      inputId="fda"
                    ></p-checkbox>
                    <label for="fda" class="ml-2">FDA 21 CFR Part 11</label>
                  </div>
                </div>

                <div class="col-12 md:col-4">
                  <div class="field-checkbox">
                    <p-checkbox
                      [(ngModel)]="complianceJoint"
                      [binary]="true"
                      inputId="joint"
                    ></p-checkbox>
                    <label for="joint" class="ml-2">Joint Commission</label>
                  </div>
                </div>
              </div>
            </p-card>
          </p-tabpanel>

          <!-- Branding Tab -->
          <p-tabpanel value="2">
            <p-card>
              <div class="grid">
                <div class="col-12 md:col-6">
                  <h3 class="text-lg font-semibold mb-3">Logo</h3>
                  <div class="flex align-items-center gap-4 mb-4">
                    @if (tenantForm.branding.logoUrl) {
                      <img [src]="tenantForm.branding.logoUrl" alt="Logo" class="logo-preview" />
                    } @else {
                      <div class="logo-placeholder">
                        <i class="pi pi-image text-4xl text-color-secondary"></i>
                      </div>
                    }
                    <div>
                      <p-fileUpload
                        mode="basic"
                        accept="image/*"
                        [maxFileSize]="1000000"
                        chooseLabel="Upload Logo"
                        (onSelect)="onLogoUpload($event)"
                      ></p-fileUpload>
                      <p class="text-sm text-color-secondary mt-1">
                        Recommended: 200x50px, PNG or SVG
                      </p>
                    </div>
                  </div>
                </div>

                <div class="col-12 md:col-6">
                  <h3 class="text-lg font-semibold mb-3">Brand Colors</h3>

                  <div class="field">
                    <label class="font-medium">Primary Color</label>
                    <div class="flex align-items-center gap-2">
                      <p-colorPicker [(ngModel)]="tenantForm.branding.primaryColor" format="hex"></p-colorPicker>
                      <input
                        pInputText
                        [(ngModel)]="tenantForm.branding.primaryColor"
                        class="w-8rem"
                        placeholder="#10b981"
                      />
                    </div>
                  </div>

                  <div class="field">
                    <label class="font-medium">Secondary Color</label>
                    <div class="flex align-items-center gap-2">
                      <p-colorPicker [(ngModel)]="tenantForm.branding.secondaryColor" format="hex"></p-colorPicker>
                      <input
                        pInputText
                        [(ngModel)]="tenantForm.branding.secondaryColor"
                        class="w-8rem"
                        placeholder="#0ea5e9"
                      />
                    </div>
                  </div>
                </div>

                <div class="col-12">
                  <p-divider></p-divider>
                </div>

                <div class="col-12 md:col-6">
                  <div class="field">
                    <label for="companyName" class="font-medium">Display Company Name</label>
                    <input
                      pInputText
                      id="companyName"
                      [(ngModel)]="tenantForm.branding.companyName"
                      class="w-full"
                      placeholder="Your Company Name"
                    />
                  </div>
                </div>

                <div class="col-12 md:col-6">
                  <div class="field">
                    <label for="tagline" class="font-medium">Tagline</label>
                    <input
                      pInputText
                      id="tagline"
                      [(ngModel)]="tenantForm.branding.tagline"
                      class="w-full"
                      placeholder="Your company tagline"
                    />
                  </div>
                </div>

                <div class="col-12">
                  <h3 class="text-lg font-semibold mb-3">Preview</h3>
                  <div class="brand-preview p-4 border-round" [style.background]="tenantForm.branding.primaryColor">
                    <div class="flex align-items-center gap-3">
                      @if (tenantForm.branding.logoUrl) {
                        <img [src]="tenantForm.branding.logoUrl" alt="Preview" class="preview-logo" />
                      } @else {
                        <p-avatar
                          [label]="getTenantInitials()"
                          [style]="{ 'background-color': '#ffffff', 'color': tenantForm.branding.primaryColor }"
                          shape="circle"
                          size="large"
                        ></p-avatar>
                      }
                      <div class="text-white">
                        <h4 class="m-0 font-bold">{{ tenantForm.branding.companyName || tenantForm.name || 'Company Name' }}</h4>
                        <p class="m-0 text-sm opacity-80">{{ tenantForm.branding.tagline || 'Tagline here' }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </p-card>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>

      <!-- Action Buttons -->
      <div class="flex justify-content-end gap-2 mt-4">
        <p-button
          label="Cancel"
          severity="secondary"
          [outlined]="true"
          (onClick)="goBack()"
        ></p-button>
        <p-button
          [label]="isEditing ? 'Update Organization' : 'Create Organization'"
          icon="pi pi-check"
          (onClick)="save()"
          [loading]="saving()"
          [disabled]="!isValid()"
        ></p-button>
      </div>
    </div>
  `,
  styles: [`
    .required::after {
      content: ' *';
      color: var(--red-500);
    }

    .logo-preview {
      max-height: 60px;
      max-width: 200px;
      object-fit: contain;
    }

    .logo-placeholder {
      width: 100px;
      height: 60px;
      border: 2px dashed var(--surface-border);
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .brand-preview {
      border: 1px solid var(--surface-border);
    }

    .preview-logo {
      max-height: 40px;
      max-width: 120px;
      filter: brightness(0) invert(1);
    }

    .field-checkbox {
      display: flex;
      align-items: center;
      margin-bottom: 0.5rem;
    }
  `]
})
export class TenantEditorComponent implements OnInit {
  private tenantService = inject(TenantService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditing = false;
  tenantId: string | null = null;
  saving = signal(false);

  // Compliance checkboxes
  complianceHipaa = false;
  complianceFda = false;
  complianceJoint = false;

  tenantForm: {
    name: string;
    slug: string;
    status: TenantStatus;
    subscriptionPlan: SubscriptionPlan;
    contact: TenantContactInfo;
    featureFlags: TenantFeatureFlags;
    branding: TenantBranding;
  } = {
    name: '',
    slug: '',
    status: TenantStatus.ACTIVE,
    subscriptionPlan: SubscriptionPlan.BASIC,
    contact: {
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      phone: '',
      email: '',
      website: '',
      primaryContactName: '',
      primaryContactEmail: '',
      primaryContactPhone: ''
    },
    featureFlags: {
      maxUsers: 10,
      maxEquipment: 100,
      maxInventoryItems: 1000,
      advancedReporting: false,
      apiAccess: false,
      webhooksEnabled: false,
      customBranding: false,
      complianceModules: [],
      offlineMode: false,
      multiLocation: false,
      barcodePrinting: false,
      helpDesk: false,
      depreciation: false,
      advancedProcurement: false,
      dataExport: false
    },
    branding: {
      primaryColor: '#10b981',
      secondaryColor: '#0ea5e9',
      accentColor: '#f59e0b',
      companyName: '',
      tagline: ''
    }
  };

  statusOptions = [
    { label: 'Active', value: TenantStatus.ACTIVE },
    { label: 'Trial', value: TenantStatus.TRIAL },
    { label: 'Pending', value: TenantStatus.PENDING },
    { label: 'Suspended', value: TenantStatus.SUSPENDED }
  ];

  planOptions = [
    { label: 'Basic', value: SubscriptionPlan.BASIC },
    { label: 'Professional', value: SubscriptionPlan.PROFESSIONAL },
    { label: 'Enterprise', value: SubscriptionPlan.ENTERPRISE }
  ];

  ngOnInit(): void {
    this.tenantId = this.route.snapshot.paramMap.get('id');
    this.isEditing = !!this.tenantId && this.tenantId !== 'new';

    if (this.isEditing && this.tenantId) {
      this.loadTenant(this.tenantId);
    }
  }

  private loadTenant(id: string): void {
    this.tenantService.getTenant(id).subscribe({
      next: (tenant) => {
        if (tenant) {
          this.tenantForm = {
            name: tenant.name,
            slug: tenant.slug,
            status: tenant.status,
            subscriptionPlan: tenant.subscriptionPlan,
            contact: tenant.contact || this.tenantForm.contact,
            featureFlags: tenant.featureFlags || this.tenantForm.featureFlags,
            branding: tenant.branding || this.tenantForm.branding
          };

          // Set compliance checkboxes
          if (tenant.featureFlags?.complianceModules) {
            this.complianceHipaa = tenant.featureFlags.complianceModules.includes(ComplianceFramework.HIPAA);
            this.complianceFda = tenant.featureFlags.complianceModules.includes(ComplianceFramework.FDA_21_CFR_PART_11);
            this.complianceJoint = tenant.featureFlags.complianceModules.includes(ComplianceFramework.JOINT_COMMISSION);
          }
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load organization'
        });
        this.goBack();
      }
    });
  }

  onSlugChange(value: string): void {
    // Auto-format slug
    this.tenantForm.slug = value.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  onPlanChange(plan: SubscriptionPlan): void {
    // Set default limits based on plan
    switch (plan) {
      case SubscriptionPlan.BASIC:
        this.tenantForm.featureFlags = {
          ...this.tenantForm.featureFlags,
          maxUsers: 10,
          maxEquipment: 100,
          maxInventoryItems: 1000,
          advancedReporting: false,
          apiAccess: false,
          webhooksEnabled: false,
          customBranding: false,
          offlineMode: false
        };
        break;
      case SubscriptionPlan.PROFESSIONAL:
        this.tenantForm.featureFlags = {
          ...this.tenantForm.featureFlags,
          maxUsers: 50,
          maxEquipment: 500,
          maxInventoryItems: 5000,
          advancedReporting: true,
          apiAccess: true,
          webhooksEnabled: true,
          customBranding: false,
          offlineMode: false
        };
        break;
      case SubscriptionPlan.ENTERPRISE:
        this.tenantForm.featureFlags = {
          ...this.tenantForm.featureFlags,
          maxUsers: -1,
          maxEquipment: -1,
          maxInventoryItems: -1,
          advancedReporting: true,
          apiAccess: true,
          webhooksEnabled: true,
          customBranding: true,
          offlineMode: true
        };
        break;
    }
  }

  onLogoUpload(event: any): void {
    const file = event.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.tenantForm.branding.logoUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  getTenantInitials(): string {
    const name = this.tenantForm.name || 'N';
    return name.split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  isValid(): boolean {
    return !!(this.tenantForm.name && this.tenantForm.slug);
  }

  save(): void {
    if (!this.isValid()) return;

    this.saving.set(true);

    // Build compliance modules array
    const complianceModules: ComplianceFramework[] = [];
    if (this.complianceHipaa) complianceModules.push(ComplianceFramework.HIPAA);
    if (this.complianceFda) complianceModules.push(ComplianceFramework.FDA_21_CFR_PART_11);
    if (this.complianceJoint) complianceModules.push(ComplianceFramework.JOINT_COMMISSION);
    this.tenantForm.featureFlags.complianceModules = complianceModules;

    const tenantData: Partial<Tenant> = {
      name: this.tenantForm.name,
      slug: this.tenantForm.slug,
      status: this.tenantForm.status,
      subscriptionPlan: this.tenantForm.subscriptionPlan,
      contact: this.tenantForm.contact,
      featureFlags: this.tenantForm.featureFlags,
      branding: this.tenantForm.branding
    };

    const operation = this.isEditing
      ? this.tenantService.updateTenant(this.tenantId!, tenantData)
      : this.tenantService.createTenant(tenantData as Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>);

    operation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.isEditing ? 'Updated' : 'Created',
          detail: `Organization ${this.isEditing ? 'updated' : 'created'} successfully`
        });
        this.saving.set(false);
        this.goBack();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to ${this.isEditing ? 'update' : 'create'} organization`
        });
        this.saving.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/tenants']);
  }
}
