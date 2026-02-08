import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { TimelineModule } from 'primeng/timeline';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { ComplianceService } from '@core/services/compliance.service';
import { AuthService } from '@core/services/auth.service';
import {
  ComplianceFramework,
  ComplianceStatus,
  AuditLog,
  ConsentRecord,
  DataSubjectRequest,
  DataSubjectRights,
  DataBreach,
  ComplianceTask,
  BreachSeverity,
  BreachStatus
} from '@shared/models';

@Component({
  selector: 'app-compliance-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TabsModule,
    TableModule,
    TagModule,
    ChartModule,
    ProgressBarModule,
    TimelineModule,
    DialogModule,
    ToastModule,
    TooltipModule,
    BadgeModule,
    AvatarModule,
    SelectModule
  ],
  providers: [MessageService],
  template: `
    <div class="compliance-page">
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1>
              <i class="pi pi-shield"></i>
              Compliance Center
            </h1>
            <p>Multi-jurisdiction regulatory compliance management</p>
          </div>
          <div class="header-actions">
            <button pButton label="Export Report" icon="pi pi-download" class="p-button-outlined"></button>
            <button pButton label="Run Assessment" icon="pi pi-refresh" class="p-button-primary"></button>
          </div>
        </div>

        <!-- Framework Pills -->
        <div class="framework-pills">
          @for (fw of enabledFrameworks(); track fw.framework) {
            <div class="framework-pill" [class]="'framework-pill--' + fw.status.toLowerCase().replace(' ', '-')">
              <div class="fw-icon">
                <i [class]="getFrameworkIcon(fw.framework)"></i>
              </div>
              <div class="fw-info">
                <span class="fw-name">{{ getFrameworkShortName(fw.framework) }}</span>
                <span class="fw-score">{{ fw.score }}%</span>
              </div>
              <p-tag [value]="fw.status" [severity]="getStatusSeverity(fw.status)" [rounded]="true"></p-tag>
            </div>
          }
        </div>
      </header>

      <!-- Overall Score Card -->
      <div class="score-section">
        <div class="overall-score-card">
          <div class="score-ring">
            <svg viewBox="0 0 120 120">
              <circle class="score-bg" cx="60" cy="60" r="54" />
              <circle 
                class="score-progress" 
                cx="60" cy="60" r="54" 
                [attr.stroke-dasharray]="339.292"
                [attr.stroke-dashoffset]="339.292 - (339.292 * stats().overallScore / 100)"
                [class]="getScoreClass(stats().overallScore)"
              />
            </svg>
            <div class="score-value">
              <span class="score-number">{{ stats().overallScore }}</span>
              <span class="score-label">Overall</span>
            </div>
          </div>
          <div class="score-details">
            <h3>Compliance Health</h3>
            <p>Based on {{ enabledFrameworks().length }} active frameworks</p>
            <div class="score-meta">
              <span><i class="pi pi-check-circle"></i> {{ compliantCount() }} Compliant</span>
              <span><i class="pi pi-exclamation-circle"></i> {{ partialCount() }} Partial</span>
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="quick-stats">
          <div class="quick-stat" [class.alert]="stats().overdueTasks > 0">
            <i class="pi pi-list-check"></i>
            <div class="stat-content">
              <span class="stat-value">{{ stats().pendingTasks }}</span>
              <span class="stat-label">Pending Tasks</span>
              @if (stats().overdueTasks > 0) {
                <span class="stat-alert">{{ stats().overdueTasks }} overdue</span>
              }
            </div>
          </div>
          <div class="quick-stat" [class.alert]="stats().recentBreaches > 0">
            <i class="pi pi-exclamation-triangle"></i>
            <div class="stat-content">
              <span class="stat-value">{{ stats().recentBreaches }}</span>
              <span class="stat-label">Recent Breaches</span>
              <span class="stat-sublabel">Last 30 days</span>
            </div>
          </div>
          <div class="quick-stat">
            <i class="pi pi-file-edit"></i>
            <div class="stat-content">
              <span class="stat-value">{{ stats().openDataRequests }}</span>
              <span class="stat-label">Open Requests</span>
              <span class="stat-sublabel">Data subject rights</span>
            </div>
          </div>
          <div class="quick-stat" [class.warning]="stats().expiringConsents > 0">
            <i class="pi pi-users"></i>
            <div class="stat-content">
              <span class="stat-value">{{ complianceService.activeConsents() }}</span>
              <span class="stat-label">Active Consents</span>
              @if (stats().expiringConsents > 0) {
                <span class="stat-warning">{{ stats().expiringConsents }} expiring</span>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Main Tabs -->
      <p-tabs [(value)]="activeTab">
        <p-tablist>
          <p-tab value="overview">
            <i class="pi pi-chart-pie"></i>
            Overview
          </p-tab>
          <p-tab value="frameworks">
            <i class="pi pi-sitemap"></i>
            Frameworks
          </p-tab>
          <p-tab value="audit">
            <i class="pi pi-history"></i>
            Audit Logs
            <p-badge [value]="recentAuditCount()" severity="info"></p-badge>
          </p-tab>
          <p-tab value="consents">
            <i class="pi pi-check-square"></i>
            Consents
          </p-tab>
          <p-tab value="requests">
            <i class="pi pi-inbox"></i>
            Data Requests
            @if (pendingRequestCount() > 0) {
              <p-badge [value]="pendingRequestCount()" severity="warn"></p-badge>
            }
          </p-tab>
          <p-tab value="breaches">
            <i class="pi pi-shield"></i>
            Breaches
            @if (openBreachCount() > 0) {
              <p-badge [value]="openBreachCount()" severity="danger"></p-badge>
            }
          </p-tab>
          <p-tab value="tasks">
            <i class="pi pi-list-check"></i>
            Tasks
          </p-tab>
        </p-tablist>

        <p-tabpanels>
          <!-- Overview Tab -->
          <p-tabpanel value="overview">
            <div class="overview-grid">
              <!-- Framework Scores Chart -->
              <div class="chart-card">
                <div class="chart-header">
                  <h3>Framework Compliance Scores</h3>
                </div>
                <div class="chart-content">
                  <p-chart type="radar" [data]="radarChartData" [options]="radarOptions"></p-chart>
                </div>
              </div>

              <!-- Compliance Trend -->
              <div class="chart-card">
                <div class="chart-header">
                  <h3>Compliance Trend</h3>
                  <span class="chart-subtitle">Last 6 months</span>
                </div>
                <div class="chart-content">
                  <p-chart type="line" [data]="trendChartData" [options]="lineOptions"></p-chart>
                </div>
              </div>

              <!-- Recent Activity -->
              <div class="activity-card">
                <div class="card-header">
                  <h3>Recent Compliance Activity</h3>
                  <button pButton icon="pi pi-external-link" class="p-button-text p-button-sm" label="View All"></button>
                </div>
                <div class="activity-list">
                  @for (log of recentAuditLogs(); track log.id) {
                    <div class="activity-item">
                      <div class="activity-icon" [class]="'activity-icon--' + (log.riskLevel?.toLowerCase() ?? 'low')">
                        <i [class]="getActionIcon(log.action)"></i>
                      </div>
                      <div class="activity-content">
                        <span class="activity-action">{{ log.action }}</span>
                        <span class="activity-detail">{{ log.resourceType }} - {{ log.userName }}</span>
                        <span class="activity-time">{{ formatTimeAgo(log.timestamp) }}</span>
                      </div>
                      <p-tag [value]="log.status" [severity]="log.status === 'Success' ? 'success' : 'danger'" [rounded]="true"></p-tag>
                    </div>
                  }
                </div>
              </div>

              <!-- Upcoming Tasks -->
              <div class="tasks-card">
                <div class="card-header">
                  <h3>Upcoming Compliance Tasks</h3>
                  <button pButton icon="pi pi-plus" class="p-button-text p-button-sm" label="Add Task"></button>
                </div>
                <div class="tasks-list">
                  @for (task of upcomingTasks(); track task.id) {
                    <div class="task-item" [class.overdue]="isOverdue(task.dueDate)">
                      <div class="task-priority" [class]="'priority--' + task.priority.toLowerCase()"></div>
                      <div class="task-content">
                        <span class="task-title">{{ task.title }}</span>
                        <span class="task-meta">
                          <p-tag [value]="task.framework" [severity]="getFrameworkSeverity(task.framework)" [rounded]="true"></p-tag>
                          <span class="task-assignee">{{ task.assignedTo }}</span>
                        </span>
                      </div>
                      <div class="task-due">
                        <span [class.overdue]="isOverdue(task.dueDate)">{{ formatDate(task.dueDate) }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </p-tabpanel>

          <!-- Frameworks Tab -->
          <p-tabpanel value="frameworks">
            <div class="frameworks-grid">
              <!-- HIPAA -->
              <div class="framework-card">
                <div class="fw-card-header">
                  <div class="fw-card-icon hipaa">
                    <i class="pi pi-building"></i>
                  </div>
                  <div class="fw-card-title">
                    <h3>HIPAA</h3>
                    <span>Health Insurance Portability & Accountability Act</span>
                  </div>
                  <p-tag [value]="hipaaCompliance().status" [severity]="getStatusSeverity(hipaaCompliance().status)"></p-tag>
                </div>
                <div class="fw-card-body">
                  <div class="fw-info-grid">
                    <div class="fw-info-item">
                      <span class="label">Privacy Officer</span>
                      <span class="value">{{ hipaaCompliance().privacyOfficer }}</span>
                    </div>
                    <div class="fw-info-item">
                      <span class="label">Security Officer</span>
                      <span class="value">{{ hipaaCompliance().securityOfficer }}</span>
                    </div>
                    <div class="fw-info-item">
                      <span class="label">Last Risk Assessment</span>
                      <span class="value">{{ formatDate(hipaaCompliance().lastRiskAssessment) }}</span>
                    </div>
                    <div class="fw-info-item">
                      <span class="label">Next Assessment</span>
                      <span class="value" [class.warning]="isApproaching(hipaaCompliance().nextRiskAssessment)">
                        {{ formatDate(hipaaCompliance().nextRiskAssessment) }}
                      </span>
                    </div>
                  </div>
                  <div class="fw-safeguards">
                    <h4>Safeguards Status</h4>
                    <div class="safeguard-list">
                      <div class="safeguard-item">
                        <span>Physical</span>
                        <p-tag [value]="hipaaCompliance().physicalSafeguards.remediationStatus" 
                               [severity]="getSafeguardSeverity(hipaaCompliance().physicalSafeguards.remediationStatus)"></p-tag>
                      </div>
                      <div class="safeguard-item">
                        <span>Technical</span>
                        <p-tag [value]="hipaaCompliance().technicalSafeguards.remediationStatus"
                               [severity]="getSafeguardSeverity(hipaaCompliance().technicalSafeguards.remediationStatus)"></p-tag>
                      </div>
                      <div class="safeguard-item">
                        <span>Administrative</span>
                        <p-tag [value]="hipaaCompliance().administrativeSafeguards.remediationStatus"
                               [severity]="getSafeguardSeverity(hipaaCompliance().administrativeSafeguards.remediationStatus)"></p-tag>
                      </div>
                    </div>
                  </div>
                  <div class="fw-baa">
                    <h4>Business Associate Agreements</h4>
                    <span class="baa-count">{{ hipaaCompliance().businessAssociateAgreements.length }} Active</span>
                  </div>
                </div>
                <div class="fw-card-footer">
                  <button pButton label="View Details" icon="pi pi-arrow-right" class="p-button-text"></button>
                </div>
              </div>

              <!-- DPDP -->
              <div class="framework-card">
                <div class="fw-card-header">
                  <div class="fw-card-icon dpdp">
                    <i class="pi pi-globe"></i>
                  </div>
                  <div class="fw-card-title">
                    <h3>DPDP Act</h3>
                    <span>Digital Personal Data Protection Act 2023 (India)</span>
                  </div>
                  <p-tag [value]="dpdpCompliance().status" [severity]="getStatusSeverity(dpdpCompliance().status)"></p-tag>
                </div>
                <div class="fw-card-body">
                  <div class="fw-info-grid">
                    <div class="fw-info-item">
                      <span class="label">Data Fiduciary</span>
                      <span class="value">{{ dpdpCompliance().dataFiduciary }}</span>
                    </div>
                    <div class="fw-info-item">
                      <span class="label">Consent Manager</span>
                      <span class="value">{{ dpdpCompliance().consentManager }}</span>
                    </div>
                    <div class="fw-info-item">
                      <span class="label">Grievance Officer</span>
                      <span class="value">{{ dpdpCompliance().grievanceOfficer.name }}</span>
                    </div>
                    <div class="fw-info-item">
                      <span class="label">Response Time</span>
                      <span class="value">{{ dpdpCompliance().grievanceOfficer.responseTimeDays }} days</span>
                    </div>
                  </div>
                  <div class="fw-checklist">
                    <h4>Compliance Checklist</h4>
                    <div class="checklist-items">
                      <div class="check-item" [class.checked]="dpdpCompliance().consentMechanismImplemented">
                        <i [class]="dpdpCompliance().consentMechanismImplemented ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
                        <span>Consent Mechanism</span>
                      </div>
                      <div class="check-item" [class.checked]="dpdpCompliance().dataLocalizationCompliant">
                        <i [class]="dpdpCompliance().dataLocalizationCompliant ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
                        <span>Data Localization</span>
                      </div>
                      <div class="check-item" [class.checked]="dpdpCompliance().childDataProtection">
                        <i [class]="dpdpCompliance().childDataProtection ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
                        <span>Child Data Protection</span>
                      </div>
                      <div class="check-item" [class.checked]="dpdpCompliance().breachNotificationProcedure">
                        <i [class]="dpdpCompliance().breachNotificationProcedure ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
                        <span>Breach Notification</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="fw-card-footer">
                  <button pButton label="View Details" icon="pi pi-arrow-right" class="p-button-text"></button>
                </div>
              </div>

              <!-- ABHA -->
              <div class="framework-card">
                <div class="fw-card-header">
                  <div class="fw-card-icon abha">
                    <i class="pi pi-heart"></i>
                  </div>
                  <div class="fw-card-title">
                    <h3>Ayushman Bharat / ABHA</h3>
                    <span>ABDM Health Account Integration</span>
                  </div>
                  <p-tag [value]="abhaCompliance().status" [severity]="getStatusSeverity(abhaCompliance().status)"></p-tag>
                </div>
                <div class="fw-card-body">
                  <div class="fw-info-grid">
                    <div class="fw-info-item">
                      <span class="label">HFR ID</span>
                      <span class="value monospace">{{ abhaCompliance().healthFacilityRegistryId }}</span>
                    </div>
                    <div class="fw-info-item">
                      <span class="label">HIP ID</span>
                      <span class="value monospace">{{ abhaCompliance().hipId }}</span>
                    </div>
                    <div class="fw-info-item">
                      <span class="label">Certificate Status</span>
                      <p-tag [value]="abhaCompliance().certificateStatus.status" 
                             [severity]="abhaCompliance().certificateStatus.status === 'Valid' ? 'success' : 'danger'"></p-tag>
                    </div>
                    <div class="fw-info-item">
                      <span class="label">Certificate Expiry</span>
                      <span class="value" [class.warning]="isApproaching(abhaCompliance().certificateStatus.expiryDate)">
                        {{ formatDate(abhaCompliance().certificateStatus.expiryDate) }}
                      </span>
                    </div>
                  </div>
                  <div class="fw-integration">
                    <h4>ABDM Integration Status</h4>
                    <div class="integration-status">
                      <div class="status-item" [class.active]="abhaCompliance().abdmIntegrationStatus.gatewayConnected">
                        <i class="pi pi-server"></i>
                        <span>Gateway</span>
                      </div>
                      <div class="status-item" [class.active]="abhaCompliance().abdmIntegrationStatus.consentManagerLinked">
                        <i class="pi pi-check-square"></i>
                        <span>Consent Manager</span>
                      </div>
                      <div class="status-item" [class.active]="abhaCompliance().abdmIntegrationStatus.healthLockerIntegrated">
                        <i class="pi pi-lock"></i>
                        <span>Health Locker</span>
                      </div>
                    </div>
                    <div class="sync-status">
                      <span>Last Sync: {{ formatDate(abhaCompliance().abdmIntegrationStatus.lastSyncDate) }}</span>
                      <p-tag [value]="abhaCompliance().abdmIntegrationStatus.syncStatus" 
                             [severity]="abhaCompliance().abdmIntegrationStatus.syncStatus === 'Active' ? 'success' : 'warn'"></p-tag>
                    </div>
                  </div>
                </div>
                <div class="fw-card-footer">
                  <button pButton label="View Details" icon="pi pi-arrow-right" class="p-button-text"></button>
                </div>
              </div>

              <!-- Australian Privacy -->
              <div class="framework-card">
                <div class="fw-card-header">
                  <div class="fw-card-icon australian">
                    <i class="pi pi-map"></i>
                  </div>
                  <div class="fw-card-title">
                    <h3>Australian Privacy Act</h3>
                    <span>Privacy Act 1988 & My Health Records</span>
                  </div>
                  <p-tag [value]="australianCompliance().status" [severity]="getStatusSeverity(australianCompliance().status)"></p-tag>
                </div>
                <div class="fw-card-body">
                  <div class="fw-info-grid">
                    <div class="fw-info-item">
                      <span class="label">Privacy Officer</span>
                      <span class="value">{{ australianCompliance().privacyOfficer }}</span>
                    </div>
                    <div class="fw-info-item">
                      <span class="label">MHR Registration</span>
                      <span class="value monospace">{{ australianCompliance().myHealthRecordsAct.registrationId }}</span>
                    </div>
                  </div>
                  <div class="fw-app-compliance">
                    <h4>Australian Privacy Principles</h4>
                    <div class="app-grid">
                      @for (app of australianCompliance().appCompliance; track app.appNumber) {
                        <div class="app-item" [pTooltip]="app.appName" tooltipPosition="top">
                          <span class="app-number">{{ app.appNumber }}</span>
                          <div class="app-status" [class]="'status--' + app.status.toLowerCase().replace(' ', '-')"></div>
                        </div>
                      }
                    </div>
                    <div class="app-legend">
                      <span><span class="legend-dot compliant"></span> Compliant</span>
                      <span><span class="legend-dot partial"></span> Partial</span>
                      <span><span class="legend-dot non-compliant"></span> Non-Compliant</span>
                    </div>
                  </div>
                </div>
                <div class="fw-card-footer">
                  <button pButton label="View Details" icon="pi pi-arrow-right" class="p-button-text"></button>
                </div>
              </div>

              <!-- GDPR / Romania -->
              <div class="framework-card">
                <div class="fw-card-header">
                  <div class="fw-card-icon gdpr">
                    <i class="pi pi-lock"></i>
                  </div>
                  <div class="fw-card-title">
                    <h3>GDPR / Romanian Health</h3>
                    <span>EU General Data Protection Regulation</span>
                  </div>
                  <p-tag [value]="gdprCompliance().status" [severity]="getStatusSeverity(gdprCompliance().status)"></p-tag>
                </div>
                <div class="fw-card-body">
                  <div class="fw-info-grid">
                    <div class="fw-info-item">
                      <span class="label">DPO</span>
                      <span class="value">{{ gdprCompliance().dataProtectionOfficer.name }}</span>
                    </div>
                    <div class="fw-info-item">
                      <span class="label">DPO Email</span>
                      <span class="value">{{ gdprCompliance().dataProtectionOfficer.email }}</span>
                    </div>
                    <div class="fw-info-item">
                      <span class="label">ANSPDCP Registered</span>
                      <p-tag [value]="gdprCompliance().romanianSpecific.anspdcpRegistration ? 'Yes' : 'No'" 
                             [severity]="gdprCompliance().romanianSpecific.anspdcpRegistration ? 'success' : 'danger'"></p-tag>
                    </div>
                    <div class="fw-info-item">
                      <span class="label">Last Training</span>
                      <span class="value">{{ formatDate(gdprCompliance().lastTrainingDate) }}</span>
                    </div>
                  </div>
                  <div class="fw-rights">
                    <h4>Data Subject Rights</h4>
                    <div class="rights-grid">
                      @for (right of dataSubjectRightsList; track right.key) {
                        <div class="right-item" [class.enabled]="gdprCompliance().dataSubjectRights[right.key]">
                          <i [class]="gdprCompliance().dataSubjectRights[right.key] ? 'pi pi-check' : 'pi pi-times'"></i>
                          <span>{{ right.label }}</span>
                        </div>
                      }
                    </div>
                  </div>
                </div>
                <div class="fw-card-footer">
                  <button pButton label="View Details" icon="pi pi-arrow-right" class="p-button-text"></button>
                </div>
              </div>
            </div>
          </p-tabpanel>

          <!-- Audit Logs Tab -->
          <p-tabpanel value="audit">
            <div class="audit-section">
              <div class="audit-filters">
                <p-select 
                  [options]="actionOptions" 
                  [(ngModel)]="selectedAction"
                  placeholder="All Actions"
                  [showClear]="true">
                </p-select>
                <p-select 
                  [options]="resourceOptions" 
                  [(ngModel)]="selectedResource"
                  placeholder="All Resources"
                  [showClear]="true">
                </p-select>
                <p-select 
                  [options]="riskOptions" 
                  [(ngModel)]="selectedRisk"
                  placeholder="All Risk Levels"
                  [showClear]="true">
                </p-select>
                <button pButton icon="pi pi-download" label="Export Logs" class="p-button-outlined"></button>
              </div>

              <p-table [value]="filteredAuditLogs()" [paginator]="true" [rows]="15" [rowsPerPageOptions]="[15, 30, 50]"
                       styleClass="p-datatable-sm" [showCurrentPageReport]="true"
                       currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries">
                <ng-template pTemplate="header">
                  <tr>
                    <th pSortableColumn="timestamp">Timestamp <p-sortIcon field="timestamp"></p-sortIcon></th>
                    <th pSortableColumn="userName">User <p-sortIcon field="userName"></p-sortIcon></th>
                    <th pSortableColumn="action">Action <p-sortIcon field="action"></p-sortIcon></th>
                    <th>Resource</th>
                    <th>IP Address</th>
                    <th pSortableColumn="riskLevel">Risk <p-sortIcon field="riskLevel"></p-sortIcon></th>
                    <th>Status</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-log>
                  <tr>
                    <td>
                      <span class="timestamp">{{ formatDateTime(log.timestamp) }}</span>
                    </td>
                    <td>
                      <div class="user-cell">
                        <p-avatar [label]="log.userName.charAt(0)" shape="circle" styleClass="avatar-sm"></p-avatar>
                        <div class="user-info">
                          <span class="user-name">{{ log.userName }}</span>
                          <span class="user-role">{{ log.userRole }}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p-tag [value]="log.action" [severity]="getActionSeverity(log.action)"></p-tag>
                    </td>
                    <td>
                      <span class="resource-type">{{ log.resourceType }}</span>
                      <span class="resource-id">{{ log.resourceId }}</span>
                    </td>
                    <td>
                      <span class="ip-address">{{ log.ipAddress }}</span>
                    </td>
                    <td>
                      <p-tag [value]="log.riskLevel ?? 'Low'" [severity]="getRiskSeverity(log.riskLevel)"></p-tag>
                    </td>
                    <td>
                      <p-tag [value]="log.status" [severity]="log.status === 'Success' ? 'success' : 'danger'" [rounded]="true"></p-tag>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </p-tabpanel>

          <!-- Consents Tab -->
          <p-tabpanel value="consents">
            <div class="consents-section">
              <div class="consent-stats">
                <div class="consent-stat">
                  <span class="stat-value">{{ complianceService.activeConsents() }}</span>
                  <span class="stat-label">Active</span>
                </div>
                <div class="consent-stat expired">
                  <span class="stat-value">{{ expiredConsentsCount() }}</span>
                  <span class="stat-label">Expired</span>
                </div>
                <div class="consent-stat withdrawn">
                  <span class="stat-value">{{ withdrawnConsentsCount() }}</span>
                  <span class="stat-label">Withdrawn</span>
                </div>
              </div>

              <p-table [value]="complianceService.consents()" [paginator]="true" [rows]="10"
                       styleClass="p-datatable-sm">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Principal</th>
                    <th>Type</th>
                    <th>Purposes</th>
                    <th>Frameworks</th>
                    <th>Granted</th>
                    <th>Expiry</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-consent>
                  <tr>
                    <td>
                      <div class="principal-cell">
                        <span class="principal-name">{{ consent.dataPrincipalName }}</span>
                        <span class="principal-email">{{ consent.dataPrincipalEmail }}</span>
                      </div>
                    </td>
                    <td>{{ consent.consentType }}</td>
                    <td>
                      <div class="purposes-cell">
                        @for (purpose of consent.purposes.slice(0, 2); track purpose) {
                          <span class="purpose-tag">{{ purpose }}</span>
                        }
                        @if (consent.purposes.length > 2) {
                          <span class="more-tag">+{{ consent.purposes.length - 2 }}</span>
                        }
                      </div>
                    </td>
                    <td>
                      <div class="frameworks-cell">
                        @for (fw of consent.frameworks; track fw) {
                          <p-tag [value]="getFrameworkShortName(fw)" [severity]="getFrameworkSeverity(fw)" [rounded]="true"></p-tag>
                        }
                      </div>
                    </td>
                    <td>{{ formatDate(consent.grantedDate) }}</td>
                    <td>
                      @if (consent.expiryDate) {
                        <span [class.expiring]="isApproaching(consent.expiryDate)">{{ formatDate(consent.expiryDate) }}</span>
                      } @else {
                        <span class="no-expiry">No expiry</span>
                      }
                    </td>
                    <td>
                      <p-tag [value]="consent.status" [severity]="getConsentStatusSeverity(consent.status)" [rounded]="true"></p-tag>
                    </td>
                    <td>
                      <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View Details"></button>
                      <button pButton icon="pi pi-history" class="p-button-text p-button-sm" pTooltip="Audit Trail"></button>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </p-tabpanel>

          <!-- Data Requests Tab -->
          <p-tabpanel value="requests">
            <div class="requests-section">
              <div class="requests-toolbar">
                <div class="toolbar-filters">
                  <p-select
                    [options]="requestTypeOptions"
                    [(ngModel)]="selectedRequestType"
                    placeholder="All Types"
                    [showClear]="true">
                  </p-select>
                  <p-select
                    [options]="requestStatusOptions"
                    [(ngModel)]="selectedRequestStatus"
                    placeholder="All Statuses"
                    [showClear]="true">
                  </p-select>
                </div>
                <button pButton icon="pi pi-plus" label="New Request" class="p-button-primary"></button>
              </div>
              <p-table [value]="filteredRequests()" [paginator]="true" [rows]="10"
                       styleClass="p-datatable-sm">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Request #</th>
                    <th>Requester</th>
                    <th>Type</th>
                    <th>Framework</th>
                    <th>Submitted</th>
                    <th>Due Date</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-request>
                  <tr [class.overdue]="isOverdue(request.dueDate) && request.status !== 'Completed' && request.status !== 'Rejected'">
                    <td>
                      <span class="request-number">{{ request.requestNumber }}</span>
                    </td>
                    <td>
                      <div class="requester-cell">
                        <span class="requester-name">{{ request.requesterName }}</span>
                        <span class="requester-email">{{ request.requesterEmail }}</span>
                      </div>
                    </td>
                    <td>
                      <p-tag [value]="request.requestType" [severity]="getRequestTypeSeverity(request.requestType)"></p-tag>
                    </td>
                    <td>
                      <p-tag [value]="getFrameworkShortName(request.framework)" [severity]="getFrameworkSeverity(request.framework)" [rounded]="true"></p-tag>
                    </td>
                    <td>{{ formatDate(request.submittedDate) }}</td>
                    <td>
                      <span [class.overdue]="isOverdue(request.dueDate)">{{ formatDate(request.dueDate) }}</span>
                    </td>
                    <td>{{ request.assignedTo || 'Unassigned' }}</td>
                    <td>
                      <p-tag [value]="request.status" [severity]="getRequestStatusSeverity(request.status)" [rounded]="true"></p-tag>
                    </td>
                    <td>
                      <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View Details"></button>
                      @if (request.status !== 'Completed' && request.status !== 'Rejected') {
                        <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" pTooltip="Process"></button>
                      }
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </p-tabpanel>

          <!-- Breaches Tab -->
          <p-tabpanel value="breaches">
            <div class="breaches-section">
              <div class="breach-alert" *ngIf="openBreachCount() > 0">
                <i class="pi pi-exclamation-triangle"></i>
                <span>{{ openBreachCount() }} breach(es) require attention</span>
              </div>

              <p-table [value]="complianceService.breaches()" [paginator]="true" [rows]="10"
                       styleClass="p-datatable-sm">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Breach #</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Discovered</th>
                    <th>Records Affected</th>
                    <th>Authority Notified</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-breach>
                  <tr [class]="'severity--' + breach.severity.toLowerCase()">
                    <td>
                      <span class="breach-number">{{ breach.breachNumber }}</span>
                    </td>
                    <td>{{ breach.breachType }}</td>
                    <td>
                      <p-tag [value]="breach.severity" [severity]="getBreachSeveritySeverity(breach.severity)"></p-tag>
                    </td>
                    <td>{{ formatDate(breach.discoveredDate) }}</td>
                    <td>
                      <span class="records-affected">{{ breach.recordsAffected | number }}</span>
                    </td>
                    <td>
                      @if (breach.notificationRequired) {
                        <p-tag [value]="breach.authorityNotified ? 'Yes' : 'Pending'" 
                               [severity]="breach.authorityNotified ? 'success' : 'warn'"></p-tag>
                      } @else {
                        <span class="not-required">Not required</span>
                      }
                    </td>
                    <td>
                      <p-tag [value]="breach.status" [severity]="getBreachStatusSeverity(breach.status)" [rounded]="true"></p-tag>
                    </td>
                    <td>
                      <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View Details"></button>
                      @if (breach.status !== 'Closed') {
                        <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" pTooltip="Update"></button>
                      }
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </p-tabpanel>

          <!-- Tasks Tab -->
          <p-tabpanel value="tasks">
            <div class="tasks-section">
              <div class="tasks-filters">
                <p-select 
                  [options]="frameworkOptions" 
                  [(ngModel)]="selectedFramework"
                  placeholder="All Frameworks"
                  [showClear]="true">
                </p-select>
                <p-select 
                  [options]="taskStatusOptions" 
                  [(ngModel)]="selectedTaskStatus"
                  placeholder="All Statuses"
                  [showClear]="true">
                </p-select>
                <button pButton icon="pi pi-plus" label="Add Task" class="p-button-primary"></button>
              </div>

              <p-table [value]="filteredTasks()" [paginator]="true" [rows]="10"
                       styleClass="p-datatable-sm">
                <ng-template pTemplate="header">
                  <tr>
                    <th style="width: 3rem"></th>
                    <th>Task</th>
                    <th>Framework</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Assigned To</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-task>
                  <tr [class.overdue]="isOverdue(task.dueDate) && task.status !== 'Completed'">
                    <td>
                      <div class="task-priority-indicator" [class]="'priority--' + task.priority.toLowerCase()"></div>
                    </td>
                    <td>
                      <div class="task-cell">
                        <span class="task-title">{{ task.title }}</span>
                        <span class="task-desc">{{ task.description }}</span>
                      </div>
                    </td>
                    <td>
                      <p-tag [value]="getFrameworkShortName(task.framework)" [severity]="getFrameworkSeverity(task.framework)" [rounded]="true"></p-tag>
                    </td>
                    <td>{{ task.category }}</td>
                    <td>
                      <p-tag [value]="task.priority" [severity]="getPrioritySeverity(task.priority)"></p-tag>
                    </td>
                    <td>{{ task.assignedTo }}</td>
                    <td>
                      <span [class.overdue]="isOverdue(task.dueDate)">{{ formatDate(task.dueDate) }}</span>
                      @if (task.recurrence) {
                        <span class="recurrence-badge">{{ task.recurrence }}</span>
                      }
                    </td>
                    <td>
                      <p-tag [value]="task.status" [severity]="getTaskStatusSeverity(task.status)" [rounded]="true"></p-tag>
                    </td>
                    <td>
                      <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View"></button>
                      @if (task.status !== 'Completed') {
                        <button pButton icon="pi pi-check" class="p-button-text p-button-sm p-button-success" pTooltip="Complete"></button>
                      }
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>
    </div>

    <p-toast></p-toast>
  `,
  styles: [`
    .compliance-page {
      padding: var(--space-6);
      max-width: 1600px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: var(--space-6);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-4);
    }

    .header-text h1 {
      font-family: var(--font-display);
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 var(--space-1) 0;
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .header-text h1 i {
      color: var(--primary-500);
    }

    .header-text p {
      color: var(--text-secondary);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: var(--space-2);
    }

    /* Framework Pills */
    .framework-pills {
      display: flex;
      gap: var(--space-3);
      flex-wrap: wrap;
    }

    .framework-pill {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      transition: all 0.2s ease;
    }

    .framework-pill:hover {
      border-color: var(--primary-300);
      box-shadow: var(--shadow-md);
    }

    .fw-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary-100);
      color: var(--primary-600);
    }

    .fw-info {
      display: flex;
      flex-direction: column;
    }

    .fw-name {
      font-weight: 600;
      color: var(--text-primary);
      font-size: var(--text-sm);
    }

    .fw-score {
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--primary-600);
    }

    /* Score Section */
    .score-section {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: var(--space-6);
      margin-bottom: var(--space-6);
    }

    .overall-score-card {
      display: flex;
      align-items: center;
      gap: var(--space-6);
      padding: var(--space-6);
      background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
      border-radius: var(--radius-xl);
      color: white;
    }

    .score-ring {
      position: relative;
      width: 120px;
      height: 120px;
    }

    .score-ring svg {
      transform: rotate(-90deg);
    }

    .score-bg {
      fill: none;
      stroke: rgba(255, 255, 255, 0.2);
      stroke-width: 8;
    }

    .score-progress {
      fill: none;
      stroke: white;
      stroke-width: 8;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.5s ease;
    }

    .score-value {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .score-number {
      display: block;
      font-size: var(--text-3xl);
      font-weight: 800;
    }

    .score-label {
      font-size: var(--text-xs);
      opacity: 0.8;
    }

    .score-details h3 {
      margin: 0 0 var(--space-1) 0;
      font-size: var(--text-xl);
      font-weight: 600;
    }

    .score-details p {
      margin: 0 0 var(--space-3) 0;
      opacity: 0.8;
    }

    .score-meta {
      display: flex;
      gap: var(--space-4);
      font-size: var(--text-sm);
    }

    .score-meta span {
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    /* Quick Stats */
    .quick-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-4);
    }

    .quick-stat {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      transition: all 0.2s ease;
    }

    .quick-stat:hover {
      box-shadow: var(--shadow-md);
    }

    .quick-stat.alert {
      border-color: var(--rose-300);
      background: var(--rose-50);
    }

    .quick-stat.warning {
      border-color: var(--amber-300);
      background: var(--amber-50);
    }

    .quick-stat > i {
      font-size: 1.5rem;
      color: var(--primary-500);
    }

    .quick-stat.alert > i {
      color: var(--rose-500);
    }

    .quick-stat.warning > i {
      color: var(--amber-500);
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .stat-sublabel {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .stat-alert {
      font-size: var(--text-xs);
      color: var(--rose-600);
      font-weight: 500;
    }

    .stat-warning {
      font-size: var(--text-xs);
      color: var(--amber-600);
      font-weight: 500;
    }

    /* Overview Grid */
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-6);
    }

    .chart-card,
    .activity-card,
    .tasks-card {
      background: var(--surface-ground);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
    }

    .chart-header,
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
    }

    .chart-header h3,
    .card-header h3 {
      margin: 0;
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--text-primary);
    }

    .chart-subtitle {
      font-size: var(--text-sm);
      color: var(--text-tertiary);
    }

    /* Activity List */
    .activity-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      background: var(--surface-card);
      border-radius: var(--radius-md);
    }

    .activity-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary-100);
      color: var(--primary-600);
    }

    .activity-icon--high,
    .activity-icon--critical {
      background: var(--rose-100);
      color: var(--rose-600);
    }

    .activity-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .activity-action {
      font-weight: 500;
      color: var(--text-primary);
    }

    .activity-detail {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .activity-time {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    /* Tasks List */
    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .task-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      background: var(--surface-card);
      border-radius: var(--radius-md);
      border-left: 3px solid transparent;
    }

    .task-item.overdue {
      border-left-color: var(--rose-500);
      background: var(--rose-50);
    }

    .task-priority {
      width: 4px;
      height: 32px;
      border-radius: 2px;
    }

    .task-priority.priority--critical,
    .priority--critical {
      background: var(--rose-500);
    }

    .task-priority.priority--high,
    .priority--high {
      background: var(--amber-500);
    }

    .task-priority.priority--medium,
    .priority--medium {
      background: var(--blue-500);
    }

    .task-priority.priority--low,
    .priority--low {
      background: var(--gray-400);
    }

    .task-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .task-title {
      font-weight: 500;
      color: var(--text-primary);
    }

    .task-meta {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .task-assignee {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .task-due {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .task-due .overdue {
      color: var(--rose-600);
      font-weight: 500;
    }

    /* Frameworks Grid */
    .frameworks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
      gap: var(--space-6);
    }

    .framework-card {
      background: var(--surface-ground);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      overflow: hidden;
    }

    .fw-card-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--surface-card);
      border-bottom: 1px solid var(--border-color);
    }

    .fw-card-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .fw-card-icon.hipaa {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
    }

    .fw-card-icon.dpdp {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
    }

    .fw-card-icon.abha {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
    }

    .fw-card-icon.australian {
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: white;
    }

    .fw-card-icon.gdpr {
      background: linear-gradient(135deg, #ec4899, #db2777);
      color: white;
    }

    .fw-card-title {
      flex: 1;
    }

    .fw-card-title h3 {
      margin: 0;
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--text-primary);
    }

    .fw-card-title span {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .fw-card-body {
      padding: var(--space-4);
    }

    .fw-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .fw-info-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .fw-info-item .label {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .fw-info-item .value {
      font-size: var(--text-sm);
      color: var(--text-primary);
      font-weight: 500;
    }

    .fw-info-item .value.monospace {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
    }

    .fw-info-item .value.warning {
      color: var(--amber-600);
    }

    .fw-safeguards,
    .fw-checklist,
    .fw-integration,
    .fw-app-compliance,
    .fw-rights,
    .fw-baa {
      padding-top: var(--space-4);
      border-top: 1px solid var(--border-color);
    }

    .fw-safeguards h4,
    .fw-checklist h4,
    .fw-integration h4,
    .fw-app-compliance h4,
    .fw-rights h4,
    .fw-baa h4 {
      margin: 0 0 var(--space-3) 0;
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--text-secondary);
    }

    .safeguard-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .safeguard-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-2) var(--space-3);
      background: var(--surface-card);
      border-radius: var(--radius-md);
    }

    .checklist-items {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-2);
    }

    .check-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2);
      background: var(--surface-card);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .check-item.checked {
      color: var(--green-600);
    }

    .check-item.checked i {
      color: var(--green-500);
    }

    .check-item i {
      color: var(--gray-400);
    }

    .integration-status {
      display: flex;
      gap: var(--space-4);
      margin-bottom: var(--space-3);
    }

    .status-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-3);
      background: var(--surface-card);
      border-radius: var(--radius-md);
      flex: 1;
      color: var(--text-tertiary);
    }

    .status-item.active {
      color: var(--green-600);
      background: var(--green-50);
    }

    .status-item i {
      font-size: 1.25rem;
    }

    .status-item span {
      font-size: var(--text-xs);
    }

    .sync-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .app-grid {
      display: grid;
      grid-template-columns: repeat(13, 1fr);
      gap: var(--space-2);
      margin-bottom: var(--space-3);
    }

    .app-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-2);
      background: var(--surface-card);
      border-radius: var(--radius-md);
      cursor: pointer;
    }

    .app-number {
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--text-secondary);
    }

    .app-status {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .app-status.status--compliant {
      background: var(--green-500);
    }

    .app-status.status--partially-compliant {
      background: var(--amber-500);
    }

    .app-status.status--non-compliant {
      background: var(--rose-500);
    }

    .app-legend {
      display: flex;
      gap: var(--space-4);
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .app-legend span {
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .legend-dot.compliant {
      background: var(--green-500);
    }

    .legend-dot.partial {
      background: var(--amber-500);
    }

    .legend-dot.non-compliant {
      background: var(--rose-500);
    }

    .rights-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-2);
    }

    .right-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2);
      background: var(--surface-card);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      color: var(--text-tertiary);
    }

    .right-item.enabled {
      color: var(--green-600);
    }

    .right-item.enabled i {
      color: var(--green-500);
    }

    .right-item i {
      color: var(--gray-400);
    }

    .fw-baa {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .baa-count {
      font-weight: 600;
      color: var(--primary-600);
    }

    .fw-card-footer {
      padding: var(--space-3) var(--space-4);
      border-top: 1px solid var(--border-color);
      background: var(--surface-card);
    }

    /* Audit Section */
    .audit-section,
    .consents-section,
    .requests-section,
    .breaches-section,
    .tasks-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .audit-filters,
    .tasks-filters,
    .toolbar-filters {
      display: flex;
      gap: var(--space-3);
      flex-wrap: wrap;
    }

    .requests-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
      flex-wrap: wrap;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .user-role {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .timestamp {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
    }

    .resource-type {
      display: block;
      font-weight: 500;
      color: var(--text-primary);
    }

    .resource-id {
      display: block;
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .ip-address {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
    }

    /* Consent Stats */
    .consent-stats {
      display: flex;
      gap: var(--space-4);
    }

    .consent-stat {
      padding: var(--space-4) var(--space-6);
      background: var(--green-50);
      border: 1px solid var(--green-200);
      border-radius: var(--radius-lg);
      text-align: center;
    }

    .consent-stat.expired {
      background: var(--gray-50);
      border-color: var(--gray-200);
    }

    .consent-stat.withdrawn {
      background: var(--rose-50);
      border-color: var(--rose-200);
    }

    .consent-stat .stat-value {
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--green-600);
    }

    .consent-stat.expired .stat-value {
      color: var(--gray-600);
    }

    .consent-stat.withdrawn .stat-value {
      color: var(--rose-600);
    }

    .consent-stat .stat-label {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .principal-cell,
    .requester-cell {
      display: flex;
      flex-direction: column;
    }

    .principal-name,
    .requester-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .principal-email,
    .requester-email {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .purposes-cell {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
    }

    .purpose-tag {
      padding: 2px 8px;
      background: var(--primary-100);
      color: var(--primary-700);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
    }

    .more-tag {
      padding: 2px 8px;
      background: var(--gray-100);
      color: var(--text-tertiary);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
    }

    .frameworks-cell {
      display: flex;
      gap: var(--space-1);
    }

    .no-expiry {
      color: var(--text-tertiary);
      font-style: italic;
    }

    .expiring {
      color: var(--amber-600);
      font-weight: 500;
    }

    .request-number,
    .breach-number {
      font-family: var(--font-mono);
      font-weight: 600;
      color: var(--primary-600);
    }

    .overdue {
      color: var(--rose-600);
      font-weight: 500;
    }

    tr.overdue {
      background: var(--rose-50) !important;
    }

    /* Breach Alert */
    .breach-alert {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--rose-50);
      border: 1px solid var(--rose-200);
      border-radius: var(--radius-lg);
      color: var(--rose-700);
      font-weight: 500;
    }

    .breach-alert i {
      font-size: 1.25rem;
    }

    .not-required {
      color: var(--text-tertiary);
      font-style: italic;
    }

    .records-affected {
      font-weight: 600;
    }

    tr.severity--critical {
      border-left: 3px solid var(--rose-500);
    }

    tr.severity--high {
      border-left: 3px solid var(--amber-500);
    }

    /* Task Table */
    .task-priority-indicator {
      width: 4px;
      height: 24px;
      border-radius: 2px;
    }

    .task-cell {
      display: flex;
      flex-direction: column;
    }

    .task-cell .task-title {
      font-weight: 500;
      color: var(--text-primary);
    }

    .task-cell .task-desc {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 300px;
    }

    .recurrence-badge {
      display: inline-block;
      padding: 2px 6px;
      background: var(--primary-100);
      color: var(--primary-700);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      margin-left: var(--space-2);
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .score-section {
        grid-template-columns: 1fr;
      }

      .quick-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .overview-grid {
        grid-template-columns: 1fr;
      }

      .frameworks-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .compliance-page {
        padding: var(--space-4);
      }

      .header-content {
        flex-direction: column;
        gap: var(--space-4);
      }

      .header-actions {
        width: 100%;
      }

      .framework-pills {
        flex-direction: column;
      }

      .quick-stats {
        grid-template-columns: 1fr;
      }

      .app-grid {
        grid-template-columns: repeat(7, 1fr);
      }

      .fw-info-grid {
        grid-template-columns: 1fr;
      }

      .checklist-items,
      .rights-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Avatar custom size */
    :host ::ng-deep .avatar-sm {
      width: 2rem !important;
      height: 2rem !important;
      font-size: 0.875rem !important;
    }
  `]
})
export class ComplianceDashboardComponent implements OnInit {
  complianceService = inject(ComplianceService);
  authService = inject(AuthService);
  messageService = inject(MessageService);

  activeTab = 'overview';
  
  // Filters
  selectedAction: string | null = null;
  selectedResource: string | null = null;
  selectedRisk: string | null = null;
  selectedFramework: string | null = null;
  selectedTaskStatus: string | null = null;
  selectedRequestType: string | null = null;
  selectedRequestStatus: string | null = null;

  // Chart data
  radarChartData: any;
  trendChartData: any;
  radarOptions: any;
  lineOptions: any;

  // Filter options
  actionOptions = [
    { label: 'Create', value: 'Create' },
    { label: 'Read', value: 'Read' },
    { label: 'Update', value: 'Update' },
    { label: 'Delete', value: 'Delete' },
    { label: 'Export', value: 'Export' },
    { label: 'Login', value: 'Login' },
    { label: 'Logout', value: 'Logout' }
  ];

  resourceOptions = [
    { label: 'Equipment', value: 'Equipment' },
    { label: 'Inventory', value: 'Inventory' },
    { label: 'Maintenance', value: 'Maintenance' },
    { label: 'User', value: 'User' },
    { label: 'Patient', value: 'Patient' },
    { label: 'Health Record', value: 'Health Record' }
  ];

  riskOptions = [
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' },
    { label: 'Critical', value: 'Critical' }
  ];

  frameworkOptions = [
    { label: 'HIPAA', value: 'HIPAA' },
    { label: 'DPDP', value: 'DPDP' },
    { label: 'ABHA', value: 'ABHA' },
    { label: 'Australian Privacy', value: 'Australian Privacy' },
    { label: 'GDPR', value: 'GDPR' }
  ];

  taskStatusOptions = [
    { label: 'Open', value: 'Open' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Overdue', value: 'Overdue' }
  ];

  requestTypeOptions = [
    { label: 'Access', value: 'Access' },
    { label: 'Rectification', value: 'Rectification' },
    { label: 'Erasure', value: 'Erasure' },
    { label: 'Portability', value: 'Portability' },
    { label: 'Restriction', value: 'Restriction' },
    { label: 'Objection', value: 'Objection' }
  ];

  requestStatusOptions = [
    { label: 'Pending', value: 'Pending' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Rejected', value: 'Rejected' }
  ];

  dataSubjectRightsList: { key: keyof DataSubjectRights; label: string }[] = [
    { key: 'rightToBeInformed', label: 'Right to be Informed' },
    { key: 'rightOfAccess', label: 'Right of Access' },
    { key: 'rightToRectification', label: 'Right to Rectification' },
    { key: 'rightToErasure', label: 'Right to Erasure' },
    { key: 'rightToRestrictProcessing', label: 'Right to Restrict' },
    { key: 'rightToDataPortability', label: 'Data Portability' },
    { key: 'rightToObject', label: 'Right to Object' },
    { key: 'automatedDecisionMaking', label: 'Automated Decisions' }
  ];

  // Computed values
  stats = this.complianceService.dashboardStats;
  hipaaCompliance = this.complianceService.hipaaCompliance;
  dpdpCompliance = this.complianceService.dpdpCompliance;
  abhaCompliance = this.complianceService.abhaCompliance;
  australianCompliance = this.complianceService.australianCompliance;
  gdprCompliance = this.complianceService.gdprCompliance;

  enabledFrameworks = computed(() => this.stats().frameworkScores);

  compliantCount = computed(() => 
    this.stats().frameworkScores.filter(f => f.status === ComplianceStatus.COMPLIANT).length
  );

  partialCount = computed(() => 
    this.stats().frameworkScores.filter(f => f.status === ComplianceStatus.PARTIALLY_COMPLIANT).length
  );

  recentAuditLogs = computed(() => 
    this.complianceService.auditLogs().slice(0, 5)
  );

  recentAuditCount = computed(() => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return this.complianceService.auditLogs().filter(l => new Date(l.timestamp) > oneDayAgo).length;
  });

  upcomingTasks = computed(() => 
    this.complianceService.tasks()
      .filter(t => t.status !== 'Completed')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5)
  );

  pendingRequestCount = computed(() => this.complianceService.pendingRequests());
  openBreachCount = computed(() => this.complianceService.openBreaches());

  expiredConsentsCount = computed(() => 
    this.complianceService.consents().filter(c => c.status === 'Expired').length
  );

  withdrawnConsentsCount = computed(() => 
    this.complianceService.consents().filter(c => c.status === 'Withdrawn').length
  );

  filteredAuditLogs = computed(() => {
    let logs = this.complianceService.auditLogs();

    if (this.selectedAction) {
      logs = logs.filter(l => l.action === this.selectedAction);
    }
    if (this.selectedResource) {
      logs = logs.filter(l => l.resourceType === this.selectedResource);
    }
    if (this.selectedRisk) {
      logs = logs.filter(l => l.riskLevel === this.selectedRisk);
    }

    return logs;
  });

  filteredTasks = computed(() => {
    let tasks = this.complianceService.tasks();

    if (this.selectedFramework) {
      tasks = tasks.filter(t => t.framework === this.selectedFramework);
    }
    if (this.selectedTaskStatus) {
      tasks = tasks.filter(t => t.status === this.selectedTaskStatus);
    }

    return tasks;
  });

  filteredRequests = computed(() => {
    let requests = this.complianceService.dataRequests();

    if (this.selectedRequestType) {
      requests = requests.filter(r => r.requestType === this.selectedRequestType);
    }
    if (this.selectedRequestStatus) {
      requests = requests.filter(r => r.status === this.selectedRequestStatus);
    }

    return requests;
  });

  ngOnInit(): void {
    this.initializeCharts();
  }

  initializeCharts(): void {
    const scores = this.stats().frameworkScores;

    this.radarChartData = {
      labels: scores.map(s => this.getFrameworkShortName(s.framework)),
      datasets: [{
        label: 'Compliance Score',
        data: scores.map(s => s.score),
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10b981',
        pointBackgroundColor: '#10b981'
      }]
    };

    this.radarOptions = {
      plugins: {
        legend: { display: false }
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20 }
        }
      }
    };

    this.trendChartData = {
      labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Overall',
          data: [85, 87, 88, 89, 90, 90],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'HIPAA',
          data: [88, 89, 90, 91, 92, 92],
          borderColor: '#3b82f6',
          tension: 0.4
        },
        {
          label: 'GDPR',
          data: [84, 86, 87, 88, 89, 90],
          borderColor: '#ec4899',
          tension: 0.4
        }
      ]
    };

    this.lineOptions = {
      plugins: {
        legend: { position: 'bottom' }
      },
      scales: {
        y: {
          min: 70,
          max: 100
        }
      }
    };
  }

  getFrameworkIcon(framework: ComplianceFramework): string {
    const icons: Record<string, string> = {
      'HIPAA': 'pi pi-building',
      'DPDP': 'pi pi-globe',
      'ABHA': 'pi pi-heart',
      'ABDM': 'pi pi-heart',
      'Australian Privacy': 'pi pi-map',
      'My Health Records': 'pi pi-folder',
      'GDPR': 'pi pi-lock',
      'Romanian Health': 'pi pi-lock'
    };
    return icons[framework] || 'pi pi-shield';
  }

  getFrameworkShortName(framework: ComplianceFramework | string): string {
    const names: Record<string, string> = {
      'HIPAA': 'HIPAA',
      'DPDP': 'DPDP',
      'ABHA': 'ABHA',
      'ABDM': 'ABDM',
      'Australian Privacy': 'AU Privacy',
      'My Health Records': 'MHR',
      'GDPR': 'GDPR',
      'Romanian Health': 'Romania'
    };
    return names[framework] || framework;
  }

  getStatusSeverity(status: ComplianceStatus | string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'Compliant': 'success',
      'Partially Compliant': 'warn',
      'Non-Compliant': 'danger',
      'Pending Review': 'info',
      'Not Applicable': 'secondary'
    };
    return map[status] || 'info';
  }

  getScoreClass(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      'Create': 'pi pi-plus',
      'Read': 'pi pi-eye',
      'Update': 'pi pi-pencil',
      'Delete': 'pi pi-trash',
      'Export': 'pi pi-download',
      'Login': 'pi pi-sign-in',
      'Logout': 'pi pi-sign-out',
      'Login Failed': 'pi pi-times-circle'
    };
    return icons[action] || 'pi pi-circle';
  }

  getActionSeverity(action: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'Create': 'success',
      'Read': 'info',
      'Update': 'warn',
      'Delete': 'danger',
      'Export': 'info',
      'Login': 'success',
      'Logout': 'secondary',
      'Login Failed': 'danger'
    };
    return map[action] || 'info';
  }

  getRiskSeverity(risk?: string | null): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    if (!risk) return 'info';
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'Low': 'success',
      'Medium': 'warn',
      'High': 'danger',
      'Critical': 'danger'
    };
    return map[risk] || 'info';
  }

  getFrameworkSeverity(framework: ComplianceFramework | string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'HIPAA': 'info',
      'DPDP': 'warn',
      'ABHA': 'success',
      'ABDM': 'success',
      'Australian Privacy': 'secondary',
      'GDPR': 'danger'
    };
    return map[framework] || 'info';
  }

  getSafeguardSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'Complete': 'success',
      'In Progress': 'warn',
      'Pending': 'danger'
    };
    return map[status] || 'info';
  }

  getConsentStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'Active': 'success',
      'Expired': 'secondary',
      'Withdrawn': 'danger',
      'Pending': 'warn'
    };
    return map[status] || 'info';
  }

  getRequestTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'Access Request': 'info',
      'Rectification Request': 'warn',
      'Erasure Request': 'danger',
      'Portability': 'info',
      'Objection': 'warn',
      'Grievance': 'danger'
    };
    return map[type] || 'info';
  }

  getRequestStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'Submitted': 'info',
      'Acknowledged': 'info',
      'Identity Verification': 'warn',
      'In Progress': 'warn',
      'Pending Approval': 'warn',
      'Completed': 'success',
      'Rejected': 'danger',
      'Appealed': 'danger'
    };
    return map[status] || 'info';
  }

  getBreachSeveritySeverity(severity: BreachSeverity): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'Low': 'success',
      'Medium': 'warn',
      'High': 'danger',
      'Critical': 'danger'
    };
    return map[severity] || 'info';
  }

  getBreachStatusSeverity(status: BreachStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'Detected': 'danger',
      'Investigating': 'warn',
      'Contained': 'warn',
      'Notifying': 'info',
      'Remediating': 'info',
      'Closed': 'success'
    };
    return map[status] || 'info';
  }

  getPrioritySeverity(priority: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'Critical': 'danger',
      'High': 'warn',
      'Medium': 'info',
      'Low': 'secondary'
    };
    return map[priority] || 'info';
  }

  getTaskStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'Open': 'info',
      'In Progress': 'warn',
      'Completed': 'success',
      'Overdue': 'danger'
    };
    return map[status] || 'info';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTimeAgo(date: Date | string): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  isOverdue(date: Date | string): boolean {
    return new Date(date) < new Date();
  }

  isApproaching(date: Date | string): boolean {
    const targetDate = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  }
}
