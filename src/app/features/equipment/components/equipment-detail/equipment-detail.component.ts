import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { MockDataService } from '@core/services/mock-data.service';
import { AuthService } from '@core/services/auth.service';
import {
  Equipment,
  EquipmentStatus,
  EquipmentCondition,
  RiskLevel,
  MaintenanceRecord,
  MaintenanceStatus,
  MaintenanceType,
  UserRole
} from '@shared/models';

@Component({
  selector: 'app-equipment-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TabsModule,
    ButtonModule,
    TagModule,
    CardModule,
    TableModule,
    TimelineModule,
    TooltipModule,
    DialogModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="equipment-detail">
      @if (equipment()) {
        <!-- Breadcrumb -->
        <nav class="breadcrumb">
          <a routerLink="/equipment" class="breadcrumb-link">
            <i class="pi pi-arrow-left"></i>
            Back to Equipment
          </a>
        </nav>

        <!-- Header Section -->
        <header class="detail-header">
          <div class="header-main">
            <div class="equipment-identity">
              <div class="equipment-icon">
                <i [class]="getCategoryIcon(equipment()!.category)"></i>
              </div>
              <div class="equipment-titles">
                <h1>{{ equipment()!.name }}</h1>
                <div class="equipment-subtitle">
                  <span class="inventory-number">{{ equipment()!.inventoryNumber }}</span>
                  <span class="separator">•</span>
                  <span>{{ equipment()!.manufacturer }} {{ equipment()!.model }}</span>
                </div>
              </div>
            </div>
            <div class="header-tags">
              <p-tag [value]="equipment()!.status" [severity]="getStatusSeverity(equipment()!.status)"></p-tag>
              <p-tag [value]="equipment()!.condition" [severity]="getConditionSeverity(equipment()!.condition)"></p-tag>
              <p-tag [value]="'Risk: ' + equipment()!.riskLevel" [severity]="getRiskSeverity(equipment()!.riskLevel)" [rounded]="true"></p-tag>
            </div>
          </div>
          <div class="header-actions">
            @if (authService.hasAnyRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN])) {
              <button pButton label="Schedule Maintenance" icon="pi pi-calendar" class="p-button-outlined"></button>
              <button pButton label="Edit" icon="pi pi-pencil" class="p-button-primary"></button>
            }
          </div>
        </header>

        <!-- Quick Stats -->
        <div class="quick-stats">
          <div class="stat-item">
            <i class="pi pi-map-marker"></i>
            <div class="stat-info">
              <span class="stat-label">Location</span>
              <span class="stat-value">{{ equipment()!.location.building }}, {{ equipment()!.location.room }}</span>
            </div>
          </div>
          <div class="stat-item">
            <i class="pi pi-building"></i>
            <div class="stat-info">
              <span class="stat-label">Department</span>
              <span class="stat-value">{{ equipment()!.department }}</span>
            </div>
          </div>
          <div class="stat-item">
            <i class="pi pi-calendar"></i>
            <div class="stat-info">
              <span class="stat-label">Next Maintenance</span>
              <span class="stat-value">{{ formatDate(equipment()!.nextMaintenanceDate) }}</span>
            </div>
          </div>
          <div class="stat-item">
            <i class="pi pi-shield"></i>
            <div class="stat-info">
              <span class="stat-label">Warranty Until</span>
              <span class="stat-value" [class.expired]="isExpired(equipment()!.warrantyExpiry)">
                {{ formatDate(equipment()!.warrantyExpiry) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Tabs Content -->
        <p-tabs value="0">
          <p-tablist>
            <p-tab value="0">
              <i class="pi pi-info-circle"></i>
              Overview
            </p-tab>
            <p-tab value="1">
              <i class="pi pi-wrench"></i>
              Maintenance History
              @if (maintenanceRecords().length > 0) {
                <span class="tab-badge">{{ maintenanceRecords().length }}</span>
              }
            </p-tab>
            <p-tab value="2">
              <i class="pi pi-file"></i>
              Documents
            </p-tab>
            <p-tab value="3">
              <i class="pi pi-history"></i>
              Activity Log
            </p-tab>
          </p-tablist>

          <p-tabpanels>
            <!-- Overview Tab -->
            <p-tabpanel value="0">
              <div class="overview-grid">
                <!-- General Information -->
                <section class="info-card">
                  <h3>General Information</h3>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">Serial Number</span>
                      <span class="info-value mono">{{ equipment()!.serialNumber }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Asset Type</span>
                      <span class="info-value">{{ equipment()!.type }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Category</span>
                      <span class="info-value">{{ equipment()!.category }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Manufacturer</span>
                      <span class="info-value">{{ equipment()!.manufacturer }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Model</span>
                      <span class="info-value">{{ equipment()!.model }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Manual Available</span>
                      <span class="info-value">
                        @if (equipment()!.operatingManualAvailable) {
                          <i class="pi pi-check-circle text-success"></i> Yes
                        } @else {
                          <i class="pi pi-times-circle text-danger"></i> No
                        }
                      </span>
                    </div>
                  </div>
                </section>

                <!-- Dates & Timeline -->
                <section class="info-card">
                  <h3>Important Dates</h3>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">Purchase Date</span>
                      <span class="info-value">{{ formatDate(equipment()!.purchaseDate) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Installation Date</span>
                      <span class="info-value">{{ formatDate(equipment()!.installationDate) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Warranty Expiry</span>
                      <span class="info-value" [class.expired]="isExpired(equipment()!.warrantyExpiry)">
                        {{ formatDate(equipment()!.warrantyExpiry) }}
                        @if (isExpired(equipment()!.warrantyExpiry)) {
                          <p-tag value="Expired" severity="danger" [rounded]="true"></p-tag>
                        }
                      </span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Last Maintenance</span>
                      <span class="info-value">{{ formatDate(equipment()!.lastMaintenanceDate) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Next Maintenance</span>
                      <span class="info-value" [class.overdue]="isOverdue(equipment()!.nextMaintenanceDate)">
                        {{ formatDate(equipment()!.nextMaintenanceDate) }}
                        @if (isOverdue(equipment()!.nextMaintenanceDate)) {
                          <p-tag value="Overdue" severity="danger" [rounded]="true"></p-tag>
                        }
                      </span>
                    </div>
                  </div>
                </section>

                <!-- Financial Information -->
                <section class="info-card">
                  <h3>Financial Information</h3>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">Purchase Cost</span>
                      <span class="info-value">{{ formatCurrency(equipment()!.purchaseCost) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Current Value</span>
                      <span class="info-value">{{ formatCurrency(equipment()!.currentValue) }}</span>
                    </div>
                  </div>
                </section>

                <!-- Technical Specifications -->
                <section class="info-card">
                  <h3>Technical Specifications</h3>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">Power Requirements</span>
                      <span class="info-value">{{ equipment()!.powerRequirements || 'Not specified' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">Risk Level</span>
                      <span class="info-value">
                        <p-tag [value]="equipment()!.riskLevel" [severity]="getRiskSeverity(equipment()!.riskLevel)"></p-tag>
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            </p-tabpanel>

            <!-- Maintenance History Tab -->
            <p-tabpanel value="1">
              <div class="maintenance-section">
                <div class="section-header">
                  <h3>Maintenance Records</h3>
                  @if (authService.hasAnyRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN])) {
                    <button pButton label="Add Record" icon="pi pi-plus" class="p-button-outlined p-button-sm"></button>
                  }
                </div>

                @if (maintenanceRecords().length > 0) {
                  <p-table 
                    [value]="maintenanceRecords()" 
                    [rows]="5"
                    [paginator]="maintenanceRecords().length > 5"
                    styleClass="p-datatable-sm"
                    responsiveLayout="scroll">
                    <ng-template pTemplate="header">
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Technician</th>
                        <th>Status</th>
                        <th>Cost</th>
                      </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-record>
                      <tr>
                        <td>
                          <span class="date-cell">{{ formatDate(record.scheduledDate) }}</span>
                        </td>
                        <td>
                          <p-tag [value]="record.type" [severity]="getMaintenanceTypeSeverity(record.type)"></p-tag>
                        </td>
                        <td>
                          <span class="description-cell">{{ record.description }}</span>
                        </td>
                        <td>
                          <div class="technician-cell">
                            <i class="pi pi-user"></i>
                            {{ record.technician }}
                          </div>
                        </td>
                        <td>
                          <p-tag [value]="record.status" [severity]="getMaintenanceStatusSeverity(record.status)"></p-tag>
                        </td>
                        <td>
                          <span class="cost-cell">{{ formatCurrency(record.cost) }}</span>
                        </td>
                      </tr>
                    </ng-template>
                  </p-table>
                } @else {
                  <div class="empty-state">
                    <i class="pi pi-wrench"></i>
                    <h4>No maintenance records</h4>
                    <p>No maintenance has been performed on this equipment yet.</p>
                  </div>
                }
              </div>
            </p-tabpanel>

            <!-- Documents Tab -->
            <p-tabpanel value="2">
              <div class="documents-section">
                <div class="section-header">
                  <h3>Documents & Attachments</h3>
                  @if (authService.hasAnyRole([UserRole.ADMIN, UserRole.MANAGER])) {
                    <button pButton label="Upload" icon="pi pi-upload" class="p-button-outlined p-button-sm"></button>
                  }
                </div>

                <div class="documents-grid">
                  <div class="document-card">
                    <div class="document-icon">
                      <i class="pi pi-file-pdf"></i>
                    </div>
                    <div class="document-info">
                      <span class="document-name">User Manual</span>
                      <span class="document-meta">PDF • 2.4 MB</span>
                    </div>
                    <button pButton icon="pi pi-download" class="p-button-text p-button-rounded"></button>
                  </div>

                  <div class="document-card">
                    <div class="document-icon">
                      <i class="pi pi-file-pdf"></i>
                    </div>
                    <div class="document-info">
                      <span class="document-name">Service Manual</span>
                      <span class="document-meta">PDF • 5.1 MB</span>
                    </div>
                    <button pButton icon="pi pi-download" class="p-button-text p-button-rounded"></button>
                  </div>

                  <div class="document-card">
                    <div class="document-icon">
                      <i class="pi pi-file"></i>
                    </div>
                    <div class="document-info">
                      <span class="document-name">Warranty Certificate</span>
                      <span class="document-meta">PDF • 156 KB</span>
                    </div>
                    <button pButton icon="pi pi-download" class="p-button-text p-button-rounded"></button>
                  </div>

                  <div class="document-card">
                    <div class="document-icon">
                      <i class="pi pi-image"></i>
                    </div>
                    <div class="document-info">
                      <span class="document-name">Equipment Photos</span>
                      <span class="document-meta">ZIP • 8.3 MB</span>
                    </div>
                    <button pButton icon="pi pi-download" class="p-button-text p-button-rounded"></button>
                  </div>
                </div>
              </div>
            </p-tabpanel>

            <!-- Activity Log Tab -->
            <p-tabpanel value="3">
              <div class="activity-section">
                <h3>Recent Activity</h3>
                <p-timeline [value]="activityLog">
                  <ng-template pTemplate="content" let-event>
                    <div class="activity-event">
                      <span class="activity-title">{{ event.title }}</span>
                      <span class="activity-description">{{ event.description }}</span>
                      <span class="activity-time">{{ event.time }}</span>
                    </div>
                  </ng-template>
                  <ng-template pTemplate="opposite" let-event>
                    <small class="activity-user">{{ event.user }}</small>
                  </ng-template>
                </p-timeline>
              </div>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
      } @else {
        <div class="not-found">
          <i class="pi pi-exclamation-triangle"></i>
          <h2>Equipment Not Found</h2>
          <p>The requested equipment could not be found.</p>
          <button pButton label="Back to Equipment List" icon="pi pi-arrow-left" routerLink="/equipment"></button>
        </div>
      }

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .equipment-detail {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }

    /* Breadcrumb */
    .breadcrumb {
      margin-bottom: var(--space-2);
    }

    .breadcrumb-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--text-secondary);
      text-decoration: none;
      transition: color var(--transition-fast);
    }

    .breadcrumb-link:hover {
      color: var(--primary-600);
    }

    /* Header */
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-4);
      flex-wrap: wrap;
    }

    .header-main {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .equipment-identity {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .equipment-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
      border-radius: var(--radius-xl);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.75rem;
      flex-shrink: 0;
    }

    .equipment-titles h1 {
      font-family: var(--font-display);
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 var(--space-1) 0;
    }

    .equipment-subtitle {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .inventory-number {
      font-family: var(--font-mono);
      background: var(--surface-ground);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-md);
    }

    .separator {
      color: var(--border-color);
    }

    .header-tags {
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .header-actions {
      display: flex;
      gap: var(--space-3);
    }

    /* Quick Stats */
    .quick-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-4);
      padding: var(--space-4);
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
    }

    @media (max-width: 1024px) {
      .quick-stats {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .quick-stats {
        grid-template-columns: 1fr;
      }
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      background: var(--surface-ground);
      border-radius: var(--radius-lg);
    }

    .stat-item i {
      font-size: 1.25rem;
      color: var(--primary-500);
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-label {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .stat-value {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--text-primary);
    }

    .stat-value.expired, .stat-value.overdue {
      color: var(--alert-600);
    }

    .tab-badge {
      background: var(--primary-500);
      color: white;
      font-size: var(--text-xs);
      font-weight: 600;
      padding: 2px 6px;
      border-radius: var(--radius-full);
      margin-left: var(--space-1);
    }

    /* Overview Grid */
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-5);
    }

    @media (max-width: 1024px) {
      .overview-grid {
        grid-template-columns: 1fr;
      }
    }

    .info-card {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      padding: var(--space-5);
    }

    .info-card h3 {
      font-family: var(--font-display);
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 var(--space-4) 0;
      padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--border-color);
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-4);
    }

    @media (max-width: 640px) {
      .info-grid {
        grid-template-columns: 1fr;
      }
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .info-label {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-value {
      font-size: var(--text-sm);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .info-value.mono {
      font-family: var(--font-mono);
    }

    .info-value.expired {
      color: var(--alert-600);
    }

    .text-success { color: var(--primary-500); }
    .text-danger { color: var(--alert-500); }

    /* Maintenance Section */
    .maintenance-section, .documents-section, .activity-section {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      padding: var(--space-5);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
    }

    .section-header h3 {
      font-family: var(--font-display);
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .date-cell {
      font-size: var(--text-sm);
      color: var(--text-primary);
    }

    .description-cell {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .technician-cell {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .cost-cell {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      color: var(--text-primary);
    }

    /* Documents Grid */
    .documents-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-4);
    }

    @media (max-width: 768px) {
      .documents-grid {
        grid-template-columns: 1fr;
      }
    }

    .document-card {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      background: var(--surface-ground);
      border-radius: var(--radius-lg);
      transition: background var(--transition-fast);
    }

    .document-card:hover {
      background: var(--surface-hover);
    }

    .document-icon {
      width: 44px;
      height: 44px;
      background: var(--alert-50);
      color: var(--alert-500);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    :host-context([data-theme="dark"]) .document-icon {
      background: rgba(244, 63, 94, 0.15);
    }

    .document-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .document-name {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .document-meta {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    /* Activity Log */
    .activity-section h3 {
      font-family: var(--font-display);
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 var(--space-4) 0;
    }

    .activity-event {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .activity-title {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--text-primary);
    }

    .activity-description {
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }

    .activity-time {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .activity-user {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    /* Empty State */
    .empty-state {
      padding: var(--space-8);
      text-align: center;
    }

    .empty-state i {
      font-size: 2.5rem;
      color: var(--text-tertiary);
      margin-bottom: var(--space-3);
    }

    .empty-state h4 {
      font-family: var(--font-display);
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 var(--space-2) 0;
    }

    .empty-state p {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0;
    }

    /* Not Found */
    .not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      text-align: center;
    }

    .not-found i {
      font-size: 4rem;
      color: var(--warning-500);
      margin-bottom: var(--space-4);
    }

    .not-found h2 {
      font-family: var(--font-display);
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 var(--space-2) 0;
    }

    .not-found p {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0 0 var(--space-6) 0;
    }

    @media (max-width: 768px) {
      .detail-header {
        flex-direction: column;
      }

      .header-actions {
        width: 100%;
        justify-content: flex-start;
      }

      .equipment-identity {
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
      }
    }
  `]
})
export class EquipmentDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  mockDataService = inject(MockDataService);
  authService = inject(AuthService);
  messageService = inject(MessageService);

  // Expose enum for template use
  UserRole = UserRole;

  equipmentId = signal<string>('');
  
  equipment = computed(() => {
    const id = this.equipmentId();
    return this.mockDataService.equipment().find(e => e.id === id) || null;
  });

  maintenanceRecords = computed(() => {
    const id = this.equipmentId();
    return this.mockDataService.maintenanceRecords().filter(m => m.equipmentId === id);
  });

  activityLog = [
    { title: 'Status Updated', description: 'Changed from "Under Maintenance" to "In Service"', time: '2 hours ago', user: 'John Smith' },
    { title: 'Maintenance Completed', description: 'Preventive maintenance performed', time: '3 hours ago', user: 'Jane Doe' },
    { title: 'Document Added', description: 'Service manual uploaded', time: '1 day ago', user: 'Admin' },
    { title: 'Equipment Created', description: 'New equipment record added to inventory', time: '30 days ago', user: 'Admin' }
  ];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.equipmentId.set(params['id']);
    });
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  isExpired(date: Date | string | undefined): boolean {
    if (!date) return false;
    return new Date(date) < new Date();
  }

  isOverdue(date: Date | string | undefined): boolean {
    if (!date) return false;
    return new Date(date) < new Date();
  }

  getStatusSeverity(status: EquipmentStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<EquipmentStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      [EquipmentStatus.IN_SERVICE]: 'success',
      [EquipmentStatus.OUT_OF_SERVICE]: 'danger',
      [EquipmentStatus.UNDER_MAINTENANCE]: 'warn',
      [EquipmentStatus.AWAITING_REPAIR]: 'warn',
      [EquipmentStatus.AWAITING_PARTS]: 'info',
      [EquipmentStatus.DECOMMISSIONED]: 'secondary',
      [EquipmentStatus.DISPOSED]: 'secondary'
    };
    return map[status] || 'info';
  }

  getConditionSeverity(condition: EquipmentCondition): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<EquipmentCondition, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      [EquipmentCondition.EXCELLENT]: 'success',
      [EquipmentCondition.GOOD]: 'success',
      [EquipmentCondition.FAIR]: 'warn',
      [EquipmentCondition.POOR]: 'danger',
      [EquipmentCondition.NON_FUNCTIONAL]: 'danger'
    };
    return map[condition] || 'info';
  }

  getRiskSeverity(risk: RiskLevel): 'success' | 'warn' | 'danger' {
    const map: Record<RiskLevel, 'success' | 'warn' | 'danger'> = {
      [RiskLevel.LOW]: 'success',
      [RiskLevel.MEDIUM]: 'warn',
      [RiskLevel.HIGH]: 'danger'
    };
    return map[risk];
  }

  getMaintenanceTypeSeverity(type: MaintenanceType): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<MaintenanceType, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      [MaintenanceType.PREVENTIVE]: 'success',
      [MaintenanceType.CORRECTIVE]: 'warn',
      [MaintenanceType.CALIBRATION]: 'info',
      [MaintenanceType.SAFETY_INSPECTION]: 'info',
      [MaintenanceType.PERFORMANCE_VERIFICATION]: 'info',
      [MaintenanceType.EMERGENCY]: 'danger'
    };
    return map[type] || 'info';
  }

  getMaintenanceStatusSeverity(status: MaintenanceStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<MaintenanceStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      [MaintenanceStatus.SCHEDULED]: 'info',
      [MaintenanceStatus.IN_PROGRESS]: 'warn',
      [MaintenanceStatus.COMPLETED]: 'success',
      [MaintenanceStatus.OVERDUE]: 'danger',
      [MaintenanceStatus.CANCELLED]: 'secondary'
    };
    return map[status] || 'info';
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Imaging': 'pi pi-image',
      'Diagnostic': 'pi pi-search',
      'Therapeutic': 'pi pi-heart',
      'Monitoring': 'pi pi-chart-line',
      'Laboratory': 'pi pi-filter',
      'Surgical': 'pi pi-wrench',
      'Life Support': 'pi pi-heart-fill',
      'Rehabilitation': 'pi pi-users',
      'Sterilization': 'pi pi-shield'
    };
    return icons[category] || 'pi pi-box';
  }
}
