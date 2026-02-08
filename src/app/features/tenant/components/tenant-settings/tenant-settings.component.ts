import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { FileUploadModule } from 'primeng/fileupload';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AvatarModule } from 'primeng/avatar';
import { ChipModule } from 'primeng/chip';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TenantService } from '@core/services/tenant.service';
import { BrandingService } from '@core/services/branding.service';
import { Tenant, TenantBranding, TenantContactInfo, TenantSettings } from '@shared/models';

@Component({
  selector: 'app-tenant-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TabsModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    ColorPickerModule,
    FileUploadModule,
    DividerModule,
    ToastModule,
    ConfirmDialogModule,
    AvatarModule,
    ChipModule,
    ToggleButtonModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="settings-page">
      @if (tenant()) {
        <!-- Page Header -->
        <div class="settings-header">
          <div class="header-content">
            <div class="org-info">
              <p-avatar
                [label]="getTenantInitials()"
                [style]="{ 'background-color': tenant()!.branding?.primaryColor || '#10b981', 'color': '#ffffff' }"
                shape="circle"
                size="xlarge"
              ></p-avatar>
              <div class="org-details">
                <h1>{{ tenant()!.name }}</h1>
                <div class="org-meta">
                  <p-chip [label]="tenant()!.subscriptionPlan | titlecase" styleClass="plan-chip"></p-chip>
                  <span class="text-color-secondary">{{ tenant()!.slug }}.goemr.com</span>
                </div>
              </div>
            </div>
            <div class="header-actions">
              <p-button
                label="Upgrade Plan"
                icon="pi pi-sparkles"
                severity="secondary"
                [outlined]="true"
                (onClick)="upgradePlan()"
              ></p-button>
            </div>
          </div>
        </div>

        <!-- Settings Layout -->
        <div class="settings-layout">
          <!-- Sidebar Navigation -->
          <aside class="settings-sidebar">
            <nav class="settings-nav">
              @for (tab of settingsTabs; track tab.id) {
                <button
                  class="nav-item"
                  [class.active]="activeTab === tab.id"
                  (click)="activeTab = tab.id"
                >
                  <i [class]="tab.icon"></i>
                  <span>{{ tab.label }}</span>
                </button>
              }
            </nav>
          </aside>

          <!-- Main Content -->
          <main class="settings-content">
            <!-- General Tab -->
            @if (activeTab === 'general') {
              <div class="content-section">
                <div class="section-header">
                  <h2>General Settings</h2>
                  <p>Basic information about your organization</p>
                </div>

                <div class="form-card">
                  <div class="form-section">
                    <h3>Organization Information</h3>
                    <div class="form-grid">
                      <div class="form-field">
                        <label for="orgName">Organization Name</label>
                        <input
                          pInputText
                          id="orgName"
                          [(ngModel)]="generalSettings.name"
                          class="w-full"
                          placeholder="Enter organization name"
                        />
                      </div>

                      <div class="form-field">
                        <label for="slug">URL Slug</label>
                        <div class="p-inputgroup">
                          <input
                            pInputText
                            id="slug"
                            [(ngModel)]="generalSettings.slug"
                            placeholder="your-org"
                          />
                          <span class="p-inputgroup-addon">.goemr.com</span>
                        </div>
                      </div>

                      <div class="form-field full-width">
                        <label for="description">Description</label>
                        <textarea
                          pTextarea
                          id="description"
                          [(ngModel)]="generalSettings.description"
                          rows="3"
                          class="w-full"
                          placeholder="Brief description of your organization"
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <div class="form-section">
                    <h3>Subscription Plan</h3>
                    <div class="subscription-card">
                      <div class="subscription-info">
                        <div class="plan-badge" [class]="'plan-' + tenant()!.subscriptionPlan.toLowerCase()">
                          {{ tenant()!.subscriptionPlan | titlecase }}
                        </div>
                        <div class="plan-details">
                          <p>Your current plan includes {{ getFeatureSummary() }}</p>
                        </div>
                      </div>
                      <p-button
                        label="View Plans"
                        icon="pi pi-external-link"
                        severity="secondary"
                        [text]="true"
                        (onClick)="upgradePlan()"
                      ></p-button>
                    </div>
                  </div>

                  <div class="form-actions">
                    <p-button
                      label="Save Changes"
                      icon="pi pi-check"
                      (onClick)="saveGeneralSettings()"
                      [loading]="saving()"
                    ></p-button>
                  </div>
                </div>
              </div>
            }

            <!-- Branding Tab -->
            @if (activeTab === 'branding') {
              <div class="content-section">
                <div class="section-header">
                  <h2>Branding</h2>
                  <p>Customize your organization's appearance</p>
                </div>

                <div class="form-card">
                  <div class="form-section">
                    <h3>Logo & Icon</h3>
                    <div class="branding-uploads">
                      <div class="upload-item">
                        <div class="upload-preview">
                          @if (brandingSettings.logoUrl) {
                            <img [src]="brandingSettings.logoUrl" alt="Logo" class="logo-preview" />
                          } @else {
                            <div class="upload-placeholder">
                              <i class="pi pi-image"></i>
                              <span>No logo</span>
                            </div>
                          }
                        </div>
                        <div class="upload-info">
                          <h4>Main Logo</h4>
                          <p>Displayed in the header and reports</p>
                          <p-fileUpload
                            mode="basic"
                            accept="image/*"
                            [maxFileSize]="1000000"
                            chooseLabel="Upload"
                            chooseIcon="pi pi-upload"
                            (onSelect)="onLogoUpload($event)"
                          ></p-fileUpload>
                          <small>Recommended: 200x50px, PNG or SVG</small>
                        </div>
                      </div>

                      <div class="upload-item">
                        <div class="upload-preview icon-preview">
                          @if (brandingSettings.logoSmallUrl) {
                            <img [src]="brandingSettings.logoSmallUrl" alt="Icon" class="icon-preview-img" />
                          } @else {
                            <p-avatar
                              [label]="getTenantInitials()"
                              [style]="{ 'background-color': brandingSettings.primaryColor || '#10b981', 'color': '#ffffff' }"
                              shape="circle"
                              size="large"
                            ></p-avatar>
                          }
                        </div>
                        <div class="upload-info">
                          <h4>Icon / Favicon</h4>
                          <p>Used for browser tab and mobile app</p>
                          <p-fileUpload
                            mode="basic"
                            accept="image/*"
                            [maxFileSize]="500000"
                            chooseLabel="Upload"
                            chooseIcon="pi pi-upload"
                            (onSelect)="onSmallLogoUpload($event)"
                          ></p-fileUpload>
                          <small>Recommended: 48x48px, PNG or SVG</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="form-section">
                    <h3>Brand Colors</h3>
                    <div class="color-pickers">
                      <div class="color-item">
                        <label>Primary Color</label>
                        <div class="color-input">
                          <p-colorPicker [(ngModel)]="brandingSettings.primaryColor" format="hex"></p-colorPicker>
                          <input pInputText [(ngModel)]="brandingSettings.primaryColor" placeholder="#10b981" />
                        </div>
                        <small>Main brand color used for buttons and accents</small>
                      </div>

                      <div class="color-item">
                        <label>Secondary Color</label>
                        <div class="color-input">
                          <p-colorPicker [(ngModel)]="brandingSettings.secondaryColor" format="hex"></p-colorPicker>
                          <input pInputText [(ngModel)]="brandingSettings.secondaryColor" placeholder="#0ea5e9" />
                        </div>
                        <small>Supporting color for links and highlights</small>
                      </div>

                      <div class="color-item">
                        <label>Accent Color</label>
                        <div class="color-input">
                          <p-colorPicker [(ngModel)]="brandingSettings.accentColor" format="hex"></p-colorPicker>
                          <input pInputText [(ngModel)]="brandingSettings.accentColor" placeholder="#f59e0b" />
                        </div>
                        <small>Used for notifications and alerts</small>
                      </div>
                    </div>
                  </div>

                  <div class="form-section">
                    <h3>Company Display</h3>
                    <div class="form-grid">
                      <div class="form-field">
                        <label for="companyName">Display Name</label>
                        <input
                          pInputText
                          id="companyName"
                          [(ngModel)]="brandingSettings.companyName"
                          class="w-full"
                          placeholder="Your Company Name"
                        />
                      </div>

                      <div class="form-field">
                        <label for="tagline">Tagline</label>
                        <input
                          pInputText
                          id="tagline"
                          [(ngModel)]="brandingSettings.tagline"
                          class="w-full"
                          placeholder="Your company tagline"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="form-section">
                    <h3>Preview</h3>
                    <div class="brand-preview" [style.background]="brandingSettings.primaryColor">
                      <div class="preview-content">
                        @if (brandingSettings.logoUrl) {
                          <img [src]="brandingSettings.logoUrl" alt="Preview" class="preview-logo" />
                        } @else {
                          <p-avatar
                            [label]="getTenantInitials()"
                            [style]="{ 'background-color': '#ffffff', 'color': brandingSettings.primaryColor }"
                            shape="circle"
                            size="large"
                          ></p-avatar>
                        }
                        <div class="preview-text">
                          <h4>{{ brandingSettings.companyName || tenant()!.name }}</h4>
                          <p>{{ brandingSettings.tagline || 'Inventory Management' }}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="form-actions space-between">
                    <p-button
                      label="Reset to Defaults"
                      icon="pi pi-refresh"
                      severity="secondary"
                      [outlined]="true"
                      (onClick)="resetBranding()"
                    ></p-button>
                    <p-button
                      label="Save Branding"
                      icon="pi pi-check"
                      (onClick)="saveBranding()"
                      [loading]="saving()"
                    ></p-button>
                  </div>
                </div>
              </div>
            }

            <!-- Contact Tab -->
            @if (activeTab === 'contact') {
              <div class="content-section">
                <div class="section-header">
                  <h2>Contact Information</h2>
                  <p>How others can reach your organization</p>
                </div>

                <div class="form-card">
                  <div class="form-section">
                    <h3>Primary Contact</h3>
                    <div class="form-grid">
                      <div class="form-field">
                        <label for="contactName">Contact Name</label>
                        <input
                          pInputText
                          id="contactName"
                          [(ngModel)]="contactSettings.primaryContactName"
                          class="w-full"
                          placeholder="John Smith"
                        />
                      </div>

                      <div class="form-field">
                        <label for="contactEmail">Email Address</label>
                        <input
                          pInputText
                          id="contactEmail"
                          [(ngModel)]="contactSettings.primaryContactEmail"
                          type="email"
                          class="w-full"
                          placeholder="contact@yourcompany.com"
                        />
                      </div>

                      <div class="form-field">
                        <label for="phone">Phone Number</label>
                        <input
                          pInputText
                          id="phone"
                          [(ngModel)]="contactSettings.phone"
                          class="w-full"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>

                      <div class="form-field">
                        <label for="website">Website</label>
                        <input
                          pInputText
                          id="website"
                          [(ngModel)]="contactSettings.website"
                          class="w-full"
                          placeholder="https://yourcompany.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="form-section">
                    <h3>Address</h3>
                    <div class="form-grid">
                      <div class="form-field full-width">
                        <label for="street">Street Address</label>
                        <input
                          pInputText
                          id="street"
                          [(ngModel)]="contactSettings.address"
                          class="w-full"
                          placeholder="123 Business Street"
                        />
                      </div>

                      <div class="form-field">
                        <label for="city">City</label>
                        <input
                          pInputText
                          id="city"
                          [(ngModel)]="contactSettings.city"
                          class="w-full"
                          placeholder="New York"
                        />
                      </div>

                      <div class="form-field">
                        <label for="state">State / Province</label>
                        <input
                          pInputText
                          id="state"
                          [(ngModel)]="contactSettings.state"
                          class="w-full"
                          placeholder="NY"
                        />
                      </div>

                      <div class="form-field">
                        <label for="zip">ZIP / Postal Code</label>
                        <input
                          pInputText
                          id="zip"
                          [(ngModel)]="contactSettings.postalCode"
                          class="w-full"
                          placeholder="10001"
                        />
                      </div>

                      <div class="form-field">
                        <label for="country">Country</label>
                        <input
                          pInputText
                          id="country"
                          [(ngModel)]="contactSettings.country"
                          class="w-full"
                          placeholder="United States"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="form-actions">
                    <p-button
                      label="Save Contact Info"
                      icon="pi pi-check"
                      (onClick)="saveContactInfo()"
                      [loading]="saving()"
                    ></p-button>
                  </div>
                </div>
              </div>
            }

            <!-- Features Tab -->
            @if (activeTab === 'features') {
              <div class="content-section">
                <div class="section-header">
                  <h2>Features & Limits</h2>
                  <p>View your plan features and current usage</p>
                </div>

                <div class="form-card">
                  <div class="form-section">
                    <h3>Available Features</h3>
                    <p class="section-description">
                      Feature availability is determined by your subscription plan.
                    </p>
                    <div class="features-list">
                      @for (feature of featureList; track feature.key) {
                        <div class="feature-card" [class.enabled]="isFeatureEnabled(feature.key)">
                          <div class="feature-icon">
                            <i [class]="feature.icon"></i>
                          </div>
                          <div class="feature-content">
                            <h4>{{ feature.label }}</h4>
                            <p>{{ feature.description }}</p>
                          </div>
                          <div class="feature-badge">
                            @if (isFeatureEnabled(feature.key)) {
                              <span class="badge enabled">
                                <i class="pi pi-check"></i>
                                Enabled
                              </span>
                            } @else {
                              <span class="badge locked">
                                <i class="pi pi-lock"></i>
                                {{ feature.requiredPlan }}
                              </span>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>

                  <div class="form-section">
                    <h3>Usage Limits</h3>
                    <div class="usage-grid">
                      <div class="usage-item">
                        <div class="usage-header">
                          <span class="usage-label">Users</span>
                          <span class="usage-value">{{ getCurrentUsage('users') }} / {{ getLimit('maxUsers') }}</span>
                        </div>
                        <div class="usage-bar">
                          <div class="usage-fill" [style.width.%]="getUsagePercent('users')"></div>
                        </div>
                      </div>

                      <div class="usage-item">
                        <div class="usage-header">
                          <span class="usage-label">Equipment</span>
                          <span class="usage-value">{{ getCurrentUsage('equipment') }} / {{ getLimit('maxEquipment') }}</span>
                        </div>
                        <div class="usage-bar">
                          <div class="usage-fill" [style.width.%]="getUsagePercent('equipment')"></div>
                        </div>
                      </div>

                      <div class="usage-item">
                        <div class="usage-header">
                          <span class="usage-label">Inventory Items</span>
                          <span class="usage-value">{{ getCurrentUsage('inventory') }} / {{ getLimit('maxInventoryItems') }}</span>
                        </div>
                        <div class="usage-bar">
                          <div class="usage-fill" [style.width.%]="getUsagePercent('inventory')"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="upgrade-banner">
                    <div class="banner-content">
                      <i class="pi pi-sparkles"></i>
                      <div>
                        <h4>Need more features?</h4>
                        <p>Upgrade your plan to unlock advanced capabilities</p>
                      </div>
                    </div>
                    <p-button
                      label="View Plans"
                      icon="pi pi-arrow-right"
                      iconPos="right"
                      (onClick)="upgradePlan()"
                    ></p-button>
                  </div>
                </div>
              </div>
            }
          </main>
        </div>
      }
    </div>
  `,
  styles: [`
    .settings-page {
      min-height: 100%;
      background: var(--surface-ground);
    }

    /* Header Styles */
    .settings-header {
      background: var(--surface-card);
      border-bottom: 1px solid var(--border-color);
      padding: 1.5rem 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1400px;
      margin: 0 auto;
    }

    .org-info {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .org-details h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .org-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .plan-chip {
      font-size: 0.75rem;
      font-weight: 600;
    }

    /* Layout */
    .settings-layout {
      display: flex;
      max-width: 1400px;
      margin: 0 auto;
      min-height: calc(100vh - 140px);
    }

    /* Sidebar Navigation */
    .settings-sidebar {
      width: 260px;
      background: var(--surface-card);
      border-right: 1px solid var(--border-color);
      padding: 1.5rem 0;
      flex-shrink: 0;
    }

    .settings-nav {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0 0.75rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border: none;
      background: transparent;
      border-radius: 0.5rem;
      cursor: pointer;
      color: var(--text-secondary);
      font-size: 0.9375rem;
      font-weight: 500;
      transition: all 0.2s;
      text-align: left;
      width: 100%;

      i {
        font-size: 1.125rem;
        width: 1.25rem;
      }

      &:hover {
        background: var(--surface-hover);
        color: var(--text-primary);
      }

      &.active {
        background: var(--primary-50);
        color: var(--primary-700);

        i {
          color: var(--primary-600);
        }
      }
    }

    /* Main Content */
    .settings-content {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }

    .content-section {
      max-width: 900px;
    }

    .section-header {
      margin-bottom: 1.5rem;

      h2 {
        margin: 0 0 0.25rem 0;
        font-size: 1.375rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.9375rem;
      }
    }

    /* Form Card */
    .form-card {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: 0.75rem;
      padding: 1.5rem;
    }

    .form-section {
      padding-bottom: 1.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);

      &:last-of-type {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
      }

      h3 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .section-description {
        margin: 0 0 1rem 0;
        color: var(--text-secondary);
        font-size: 0.875rem;
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      &.full-width {
        grid-column: 1 / -1;
      }

      label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
      margin-top: 1.5rem;

      &.space-between {
        justify-content: space-between;
      }
    }

    /* Subscription Card */
    .subscription-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      background: var(--surface-ground);
      border-radius: 0.5rem;
    }

    .subscription-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .plan-badge {
      padding: 0.375rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;

      &.plan-basic {
        background: var(--gray-100);
        color: var(--gray-700);
      }

      &.plan-professional {
        background: var(--blue-100);
        color: var(--blue-700);
      }

      &.plan-enterprise {
        background: var(--purple-100);
        color: var(--purple-700);
      }
    }

    .plan-details p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    /* Branding Uploads */
    .branding-uploads {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .upload-item {
      display: flex;
      gap: 1rem;
    }

    .upload-preview {
      width: 120px;
      height: 80px;
      border: 2px dashed var(--border-color);
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-ground);
      flex-shrink: 0;

      &.icon-preview {
        width: 80px;
        height: 80px;
      }
    }

    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      color: var(--text-secondary);

      i {
        font-size: 1.5rem;
      }

      span {
        font-size: 0.75rem;
      }
    }

    .logo-preview {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .icon-preview-img {
      width: 48px;
      height: 48px;
      object-fit: contain;
    }

    .upload-info {
      flex: 1;

      h4 {
        margin: 0 0 0.25rem 0;
        font-size: 0.9375rem;
        font-weight: 600;
      }

      p {
        margin: 0 0 0.75rem 0;
        font-size: 0.8125rem;
        color: var(--text-secondary);
      }

      small {
        display: block;
        margin-top: 0.5rem;
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
    }

    /* Color Pickers */
    .color-pickers {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    .color-item {
      label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
      }

      small {
        display: block;
        margin-top: 0.5rem;
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
    }

    .color-input {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      input {
        width: 100px;
      }
    }

    /* Brand Preview */
    .brand-preview {
      padding: 1.5rem;
      border-radius: 0.5rem;
    }

    .preview-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .preview-logo {
      max-height: 48px;
      max-width: 150px;
      filter: brightness(0) invert(1);
    }

    .preview-text {
      color: white;

      h4 {
        margin: 0 0 0.25rem 0;
        font-weight: 600;
      }

      p {
        margin: 0;
        opacity: 0.8;
        font-size: 0.875rem;
      }
    }

    /* Features List */
    .features-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .feature-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      background: var(--surface-card);
      transition: all 0.2s;

      &.enabled {
        border-color: var(--green-500);
        background: rgba(16, 185, 129, 0.1);

        .feature-icon {
          background: rgba(16, 185, 129, 0.2);

          i {
            color: var(--green-500);
          }
        }

        .feature-content h4 {
          color: var(--text-primary);
        }
      }

      &:not(.enabled) {
        opacity: 0.8;

        .feature-icon {
          background: var(--surface-hover);

          i {
            color: var(--text-secondary);
          }
        }
      }
    }

    .feature-icon {
      width: 48px;
      height: 48px;
      border-radius: 0.5rem;
      background: var(--surface-hover);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i {
        font-size: 1.25rem;
        color: var(--primary-500);
      }
    }

    .feature-content {
      flex: 1;

      h4 {
        margin: 0 0 0.25rem 0;
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      p {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--text-secondary);
      }
    }

    .feature-badge {
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.375rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.75rem;
        font-weight: 600;

        &.enabled {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;

          i {
            color: #10b981;
          }
        }

        &.locked {
          background: var(--surface-hover);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);

          i {
            color: var(--text-secondary);
          }
        }
      }
    }

    /* Usage Grid */
    .usage-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .usage-item {
      padding: 1rem;
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
    }

    .usage-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .usage-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .usage-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--primary-500);
    }

    .usage-bar {
      height: 8px;
      background: var(--surface-hover);
      border-radius: 4px;
      overflow: hidden;
    }

    .usage-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary-500) 0%, var(--primary-400) 100%);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    /* Upgrade Banner */
    .upgrade-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem;
      background: var(--surface-card);
      border: 2px solid var(--primary-500);
      border-radius: 0.75rem;
      margin-top: 1.5rem;
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: 1rem;

      i {
        font-size: 1.75rem;
        color: var(--primary-500);
      }

      h4 {
        margin: 0 0 0.25rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .settings-layout {
        flex-direction: column;
      }

      .settings-sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid var(--border-color);
        padding: 1rem 0;
      }

      .settings-nav {
        flex-direction: row;
        overflow-x: auto;
        gap: 0.5rem;
        padding: 0 1rem;
      }

      .nav-item {
        white-space: nowrap;
        padding: 0.75rem 1rem;
      }

      .settings-content {
        padding: 1.5rem;
      }

      .branding-uploads {
        grid-template-columns: 1fr;
      }

      .color-pickers {
        grid-template-columns: 1fr;
      }

      .usage-grid {
        grid-template-columns: 1fr;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .settings-header {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .header-actions {
        width: 100%;

        :host ::ng-deep .p-button {
          width: 100%;
        }
      }

      .upgrade-banner {
        flex-direction: column;
        gap: 1rem;
        text-align: center;

        .banner-content {
          flex-direction: column;
        }
      }
    }
  `]
})
export class TenantSettingsComponent implements OnInit {
  private tenantService = inject(TenantService);
  private brandingService = inject(BrandingService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  tenant = this.tenantService.currentTenant;
  saving = signal(false);
  activeTab = 'general';

  settingsTabs = [
    { id: 'general', label: 'General', icon: 'pi pi-cog' },
    { id: 'branding', label: 'Branding', icon: 'pi pi-palette' },
    { id: 'contact', label: 'Contact Info', icon: 'pi pi-phone' },
    { id: 'features', label: 'Features & Limits', icon: 'pi pi-box' }
  ];

  generalSettings = {
    name: '',
    slug: '',
    description: ''
  };

  brandingSettings: TenantBranding = {
    primaryColor: '#10b981',
    secondaryColor: '#0ea5e9',
    accentColor: '#f59e0b',
    companyName: '',
    tagline: ''
  };

  contactSettings: TenantContactInfo = {
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  };

  featureList = [
    { key: 'advancedReporting', label: 'Advanced Reporting', icon: 'pi pi-chart-bar', description: 'Custom reports, analytics dashboards, and data export', requiredPlan: 'Professional' },
    { key: 'apiAccess', label: 'API Access', icon: 'pi pi-code', description: 'REST API access for integrations', requiredPlan: 'Professional' },
    { key: 'webhooksEnabled', label: 'Webhooks', icon: 'pi pi-bolt', description: 'Real-time event notifications to external systems', requiredPlan: 'Professional' },
    { key: 'customBranding', label: 'Custom Branding', icon: 'pi pi-palette', description: 'Custom colors, logos, and white-labeling', requiredPlan: 'Enterprise' },
    { key: 'offlineMode', label: 'Offline Mode', icon: 'pi pi-wifi', description: 'Work offline with automatic sync', requiredPlan: 'Enterprise' }
  ];

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    const tenant = this.tenant();
    if (!tenant) return;

    this.generalSettings = {
      name: tenant.name,
      slug: tenant.slug,
      description: ''
    };

    if (tenant.branding) {
      this.brandingSettings = { ...tenant.branding };
    }

    if (tenant.contact) {
      this.contactSettings = { ...tenant.contact };
    }
  }

  getTenantInitials(): string {
    const name = this.tenant()?.name || 'O';
    return name.split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getFeatureSummary(): string {
    const tenant = this.tenant();
    if (!tenant?.featureFlags) return 'basic features';

    const features = [];
    if (tenant.featureFlags.maxUsers) features.push(`${tenant.featureFlags.maxUsers} users`);
    if (tenant.featureFlags.advancedReporting) features.push('advanced reporting');
    if (tenant.featureFlags.apiAccess) features.push('API access');

    return features.join(', ') || 'basic features';
  }

  isFeatureEnabled(key: string): boolean {
    const flags = this.tenant()?.featureFlags;
    if (!flags) return false;
    return (flags as any)[key] === true;
  }

  getLimit(key: string): number | string {
    const flags = this.tenant()?.featureFlags;
    if (!flags) return 'N/A';
    const value = (flags as any)[key];
    return value === -1 ? 'Unlimited' : value || 0;
  }

  getCurrentUsage(type: string): number {
    // In a real app, this would come from actual usage data
    const mockUsage: Record<string, number> = {
      users: 8,
      equipment: 156,
      inventory: 2340
    };
    return mockUsage[type] || 0;
  }

  getUsagePercent(type: string): number {
    const current = this.getCurrentUsage(type);
    const flags = this.tenant()?.featureFlags;
    if (!flags) return 0;

    const limits: Record<string, number> = {
      users: flags.maxUsers || 100,
      equipment: flags.maxEquipment || 1000,
      inventory: flags.maxInventoryItems || 10000
    };

    const limit = limits[type];
    if (limit === -1) return 10; // Unlimited - show small amount
    return Math.min(100, (current / limit) * 100);
  }

  onLogoUpload(event: any): void {
    const file = event.files[0];
    if (file) {
      // In production, upload to server and get URL
      const reader = new FileReader();
      reader.onload = () => {
        this.brandingSettings.logoUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSmallLogoUpload(event: any): void {
    const file = event.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.brandingSettings.logoSmallUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveGeneralSettings(): void {
    this.saving.set(true);

    this.tenantService.updateTenantSettings({
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      currency: 'USD',
      language: 'en'
    }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Settings Saved',
          detail: 'General settings have been updated'
        });
        this.saving.set(false);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save settings'
        });
        this.saving.set(false);
      }
    });
  }

  saveBranding(): void {
    this.saving.set(true);

    this.tenantService.updateTenantBranding(this.brandingSettings).subscribe({
      next: () => {
        this.brandingService.applyBranding(this.brandingSettings);
        this.messageService.add({
          severity: 'success',
          summary: 'Branding Saved',
          detail: 'Your branding has been updated'
        });
        this.saving.set(false);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save branding'
        });
        this.saving.set(false);
      }
    });
  }

  resetBranding(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to reset branding to defaults?',
      header: 'Reset Branding',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.brandingSettings = {
          primaryColor: '#10b981',
          secondaryColor: '#0ea5e9',
          accentColor: '#f59e0b',
          companyName: this.tenant()?.name || '',
          tagline: 'Inventory Management System'
        };
        this.brandingService.resetBranding();
        this.messageService.add({
          severity: 'info',
          summary: 'Branding Reset',
          detail: 'Branding has been reset to defaults'
        });
      }
    });
  }

  saveContactInfo(): void {
    this.saving.set(true);

    this.tenantService.updateTenantContact(this.contactSettings).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Contact Info Saved',
          detail: 'Contact information has been updated'
        });
        this.saving.set(false);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save contact info'
        });
        this.saving.set(false);
      }
    });
  }

  upgradePlan(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Contact Sales',
      detail: 'Please contact sales@goemr.com to upgrade your plan'
    });
  }
}
