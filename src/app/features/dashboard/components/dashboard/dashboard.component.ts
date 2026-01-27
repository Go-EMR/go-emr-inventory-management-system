import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { MockDataService } from '@core/services/mock-data.service';
import { AuthService } from '@core/services/auth.service';
import {
  Equipment,
  EquipmentStatus,
  MaintenanceRecord,
  MaintenanceStatus,
  InventoryItem,
  StockStatus,
  Alert,
  AlertSeverity,
  AlertType
} from '@shared/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    ButtonModule,
    ChartModule,
    TableModule,
    TagModule,
    TooltipModule,
    ProgressBarModule
  ],
  template: `
    <div class="dashboard">
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1>Welcome back, {{ authService.userFullName() }}</h1>
            <p>Here's what's happening with your medical equipment inventory</p>
          </div>
          <div class="header-actions">
            <button pButton label="Add Equipment" icon="pi pi-plus" class="p-button-primary" routerLink="/equipment"></button>
          </div>
        </div>
      </header>

      <!-- Stats Cards -->
      <section class="stats-grid">
        <div class="stat-card stat-card--primary">
          <div class="stat-icon">
            <i class="pi pi-box"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().totalEquipment }}</span>
            <span class="stat-label">Total Equipment</span>
          </div>
          <div class="stat-trend stat-trend--up">
            <i class="pi pi-arrow-up"></i>
            <span>12% from last month</span>
          </div>
        </div>

        <div class="stat-card stat-card--success">
          <div class="stat-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().activeEquipment }}</span>
            <span class="stat-label">Operational</span>
          </div>
          <div class="stat-footer">
            <span class="stat-percentage">{{ operationalPercentage() }}%</span>
            <span>of total equipment</span>
          </div>
        </div>

        <div class="stat-card stat-card--warning">
          <div class="stat-icon">
            <i class="pi pi-wrench"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().underMaintenance }}</span>
            <span class="stat-label">Under Maintenance</span>
          </div>
          <div class="stat-footer">
            <a routerLink="/maintenance" class="stat-link">View schedule →</a>
          </div>
        </div>

        <div class="stat-card stat-card--danger">
          <div class="stat-icon">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().lowStockItems }}</span>
            <span class="stat-label">Low Stock Items</span>
          </div>
          <div class="stat-footer">
            <a routerLink="/inventory" class="stat-link">Manage inventory →</a>
          </div>
        </div>
      </section>

      <!-- Main Content Grid -->
      <div class="content-grid">
        <!-- Equipment Status Chart -->
        <section class="chart-card">
          <div class="card-header">
            <h2>Equipment Status Overview</h2>
            <button pButton icon="pi pi-ellipsis-v" class="p-button-text p-button-rounded"></button>
          </div>
          <div class="chart-container chart-container--doughnut">
            <p-chart type="doughnut" [data]="equipmentStatusChart()" [options]="doughnutOptions"></p-chart>
          </div>
          <div class="chart-legend">
            @for (item of equipmentStatusLegend(); track item.label) {
              <div class="legend-item">
                <span class="legend-color" [style.background-color]="item.color"></span>
                <span class="legend-label">{{ item.label }}</span>
                <span class="legend-value">{{ item.value }}</span>
              </div>
            }
          </div>
        </section>

        <!-- Maintenance Trends Chart -->
        <section class="chart-card">
          <div class="card-header">
            <h2>Maintenance Activity</h2>
            <div class="chart-filters">
              <button pButton label="Week" class="p-button-text p-button-sm"></button>
              <button pButton label="Month" class="p-button-text p-button-sm p-button-active"></button>
              <button pButton label="Year" class="p-button-text p-button-sm"></button>
            </div>
          </div>
          <div class="chart-container chart-container--bar">
            <p-chart type="bar" [data]="maintenanceChart()" [options]="barOptions"></p-chart>
          </div>
        </section>

        <!-- Alerts Panel -->
        <section class="alerts-card">
          <div class="card-header">
            <h2>
              <i class="pi pi-bell"></i>
              Active Alerts
              @if (unreadAlerts().length > 0) {
                <span class="alert-badge">{{ unreadAlerts().length }}</span>
              }
            </h2>
            <button pButton label="View All" class="p-button-text p-button-sm" routerLink="/reports"></button>
          </div>
          <div class="alerts-list">
            @for (alert of activeAlerts(); track alert.id) {
              <div class="alert-item" [class]="'alert-item--' + alert.severity.toLowerCase()">
                <div class="alert-icon">
                  <i [class]="getAlertIcon(alert.type)"></i>
                </div>
                <div class="alert-content">
                  <h4>{{ alert.title }}</h4>
                  <p>{{ alert.message }}</p>
                  <span class="alert-time">{{ formatTimeAgo(alert.createdAt) }}</span>
                </div>
                <button 
                  pButton 
                  icon="pi pi-check" 
                  class="p-button-text p-button-rounded p-button-sm"
                  pTooltip="Mark as read"
                  (click)="markAlertRead(alert.id)">
                </button>
              </div>
            } @empty {
              <div class="alerts-empty">
                <i class="pi pi-check-circle"></i>
                <p>All caught up! No active alerts.</p>
              </div>
            }
          </div>
        </section>

        <!-- Recent Equipment Table -->
        <section class="table-card">
          <div class="card-header">
            <h2>Recent Equipment Activity</h2>
            <button pButton label="View All" icon="pi pi-arrow-right" iconPos="right" class="p-button-text" routerLink="/equipment"></button>
          </div>
          <p-table 
            [value]="recentEquipment()" 
            [rows]="5"
            styleClass="p-datatable-sm"
            responsiveLayout="scroll">
            <ng-template pTemplate="header">
              <tr>
                <th>Equipment</th>
                <th>Location</th>
                <th>Status</th>
                <th>Condition</th>
                <th></th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-equipment>
              <tr>
                <td>
                  <div class="equipment-cell">
                    <span class="equipment-name">{{ equipment.name }}</span>
                    <span class="equipment-id">{{ equipment.inventoryNumber }}</span>
                  </div>
                </td>
                <td>
                  <div class="location-cell">
                    <i class="pi pi-map-marker"></i>
                    {{ equipment.location.building }}, {{ equipment.location.room }}
                  </div>
                </td>
                <td>
                  <p-tag 
                    [value]="equipment.status" 
                    [severity]="getStatusSeverity(equipment.status)">
                  </p-tag>
                </td>
                <td>
                  <div class="condition-cell">
                    <span class="condition-dot" [class]="'condition-dot--' + equipment.condition.toLowerCase().replace(' ', '-')"></span>
                    {{ equipment.condition }}
                  </div>
                </td>
                <td>
                  <button 
                    pButton 
                    icon="pi pi-eye" 
                    class="p-button-text p-button-rounded p-button-sm"
                    [routerLink]="['/equipment', equipment.id]"
                    pTooltip="View details">
                  </button>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </section>

        <!-- Upcoming Maintenance -->
        <section class="maintenance-card">
          <div class="card-header">
            <h2>Upcoming Maintenance</h2>
            <button pButton label="Schedule" icon="pi pi-plus" class="p-button-outlined p-button-sm" routerLink="/maintenance"></button>
          </div>
          <div class="maintenance-list">
            @for (record of upcomingMaintenance(); track record.id) {
              <div class="maintenance-item">
                <div class="maintenance-date">
                  <span class="date-day">{{ getDay(record.scheduledDate) }}</span>
                  <span class="date-month">{{ getMonth(record.scheduledDate) }}</span>
                </div>
                <div class="maintenance-content">
                  <h4>{{ getEquipmentName(record.equipmentId) }}</h4>
                  <p>{{ record.type }} - {{ record.description }}</p>
                  <div class="maintenance-meta">
                    <span class="technician">
                      <i class="pi pi-user"></i>
                      {{ record.technician }}
                    </span>
                    <p-tag 
                      [value]="record.status" 
                      [severity]="getMaintenanceSeverity(record.status)"
                      [rounded]="true">
                    </p-tag>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="maintenance-empty">
                <i class="pi pi-calendar"></i>
                <p>No upcoming maintenance scheduled</p>
              </div>
            }
          </div>
        </section>

        <!-- Inventory Status -->
        <section class="inventory-card">
          <div class="card-header">
            <h2>Inventory Status</h2>
            <button pButton label="Manage" class="p-button-text p-button-sm" routerLink="/inventory"></button>
          </div>
          <div class="inventory-items">
            @for (item of criticalInventory(); track item.id) {
              <div class="inventory-item">
                <div class="inventory-info">
                  <span class="inventory-name">{{ item.name }}</span>
                  <span class="inventory-category">{{ item.category }}</span>
                </div>
                <div class="inventory-stock">
                  <p-progressBar 
                    [value]="getStockPercentage(item)" 
                    [showValue]="false"
                    [styleClass]="getStockClass(item)">
                  </p-progressBar>
                  <div class="stock-values">
                    <span class="stock-current">{{ item.quantity }} {{ item.unitOfMeasure }}</span>
                    <span class="stock-min">Min: {{ item.minQuantity }}</span>
                  </div>
                </div>
                <p-tag 
                  [value]="item.status" 
                  [severity]="getInventorySeverity(item.status)">
                </p-tag>
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 0;
    }

    /* Page Header */
    .page-header {
      margin-bottom: var(--space-6);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-4);
      flex-wrap: wrap;
    }

    .header-text h1 {
      font-family: var(--font-display);
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 var(--space-1) 0;
    }

    .header-text p {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }

    .stat-card {
      background: var(--surface-card);
      border-radius: var(--radius-xl);
      padding: var(--space-5);
      position: relative;
      overflow: hidden;
      border: 1px solid var(--border-color);
      transition: transform var(--transition-base), box-shadow var(--transition-base);
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
    }

    .stat-card--primary::before { background: linear-gradient(90deg, var(--primary-500), var(--primary-400)); }
    .stat-card--success::before { background: linear-gradient(90deg, var(--primary-500), var(--primary-400)); }
    .stat-card--warning::before { background: linear-gradient(90deg, var(--warning-500), var(--warning-400)); }
    .stat-card--danger::before { background: linear-gradient(90deg, var(--alert-500), var(--alert-400)); }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--space-3);
    }

    .stat-icon i {
      font-size: 1.5rem;
    }

    .stat-card--primary .stat-icon {
      background: var(--primary-50);
      color: var(--primary-600);
    }

    .stat-card--success .stat-icon {
      background: var(--primary-50);
      color: var(--primary-600);
    }

    .stat-card--warning .stat-icon {
      background: var(--warning-50);
      color: var(--warning-600);
    }

    .stat-card--danger .stat-icon {
      background: var(--alert-50);
      color: var(--alert-600);
    }

    :host-context([data-theme="dark"]) .stat-card--primary .stat-icon,
    :host-context([data-theme="dark"]) .stat-card--success .stat-icon {
      background: rgba(16, 185, 129, 0.15);
    }

    :host-context([data-theme="dark"]) .stat-card--warning .stat-icon {
      background: rgba(245, 158, 11, 0.15);
    }

    :host-context([data-theme="dark"]) .stat-card--danger .stat-icon {
      background: rgba(244, 63, 94, 0.15);
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .stat-value {
      font-family: var(--font-display);
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
    }

    .stat-label {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .stat-trend, .stat-footer {
      margin-top: var(--space-3);
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .stat-trend--up {
      color: var(--primary-600);
    }

    .stat-trend--down {
      color: var(--alert-600);
    }

    .stat-percentage {
      font-weight: 600;
      color: var(--primary-600);
    }

    .stat-link {
      color: var(--primary-600);
      text-decoration: none;
      font-weight: 500;
      transition: color var(--transition-fast);
    }

    .stat-link:hover {
      color: var(--primary-700);
      text-decoration: underline;
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-5);
    }

    @media (max-width: 1400px) {
      .content-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 900px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Card Base Styles */
    .chart-card, .alerts-card, .table-card, .maintenance-card, .inventory-card {
      background: var(--surface-card);
      border-radius: var(--radius-xl);
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4) var(--space-5);
      border-bottom: 1px solid var(--border-color);
    }

    .card-header h2 {
      font-family: var(--font-display);
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .card-header h2 i {
      color: var(--text-secondary);
    }

    .alert-badge {
      background: var(--alert-500);
      color: white;
      font-size: var(--text-xs);
      font-weight: 600;
      padding: 2px 8px;
      border-radius: var(--radius-full);
    }

    .chart-filters {
      display: flex;
      gap: var(--space-1);
    }

    .chart-filters .p-button-active {
      background: var(--primary-50) !important;
      color: var(--primary-600) !important;
    }

    /* Chart Card */
    .chart-container {
      padding: var(--space-4);
      display: flex;
      align-items: center;
      justify-content: center;
      
      :host ::ng-deep {
        p-chart {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        canvas {
          max-width: 100%;
          max-height: 100%;
        }
      }
    }
    
    /* Doughnut chart specific */
    .chart-container--doughnut {
      height: 220px;
      padding: var(--space-3) var(--space-4);
      
      :host ::ng-deep {
        p-chart {
          width: 180px !important;
          height: 180px !important;
        }
        
        canvas {
          width: 180px !important;
          height: 180px !important;
        }
      }
    }

    .chart-container--bar {
      height: 300px;
      padding: var(--space-3) var(--space-4);
      
      :host ::ng-deep {
        p-chart {
          width: 100%;
          height: 100%;
        }
      }
    }

    .chart-legend {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-5) var(--space-4);
      border-top: 1px solid var(--border-color);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-xs);
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: var(--radius-sm);
    }

    .legend-label {
      color: var(--text-secondary);
    }

    .legend-value {
      font-weight: 600;
      color: var(--text-primary);
    }

    /* Alerts Card */
    .alerts-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .alert-item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-5);
      border-bottom: 1px solid var(--border-color);
      transition: background var(--transition-fast);
    }

    .alert-item:last-child {
      border-bottom: none;
    }

    .alert-item:hover {
      background: var(--surface-hover);
    }

    .alert-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .alert-item--critical .alert-icon {
      background: var(--alert-50);
      color: var(--alert-600);
    }

    .alert-item--high .alert-icon {
      background: var(--alert-50);
      color: var(--alert-500);
    }

    .alert-item--medium .alert-icon {
      background: var(--warning-50);
      color: var(--warning-600);
    }

    .alert-item--low .alert-icon {
      background: var(--secondary-50);
      color: var(--secondary-600);
    }

    :host-context([data-theme="dark"]) .alert-item--critical .alert-icon,
    :host-context([data-theme="dark"]) .alert-item--high .alert-icon {
      background: rgba(244, 63, 94, 0.15);
    }

    :host-context([data-theme="dark"]) .alert-item--medium .alert-icon {
      background: rgba(245, 158, 11, 0.15);
    }

    :host-context([data-theme="dark"]) .alert-item--low .alert-icon {
      background: rgba(14, 165, 233, 0.15);
    }

    .alert-content {
      flex: 1;
      min-width: 0;
    }

    .alert-content h4 {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 var(--space-1) 0;
    }

    .alert-content p {
      font-size: var(--text-xs);
      color: var(--text-secondary);
      margin: 0 0 var(--space-2) 0;
      line-height: 1.4;
    }

    .alert-time {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .alerts-empty {
      padding: var(--space-8);
      text-align: center;
      color: var(--text-tertiary);
    }

    .alerts-empty i {
      font-size: 2.5rem;
      color: var(--primary-400);
      margin-bottom: var(--space-3);
    }

    .alerts-empty p {
      margin: 0;
      font-size: var(--text-sm);
    }

    /* Table Card */
    .table-card {
      grid-column: span 2;
    }

    @media (max-width: 900px) {
      .table-card {
        grid-column: span 1;
      }
    }

    .table-card :deep(.p-datatable) {
      border: none;
    }

    .table-card :deep(.p-datatable-header) {
      display: none;
    }

    .equipment-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .equipment-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .equipment-id {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      font-family: var(--font-mono);
    }

    .location-cell {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .location-cell i {
      color: var(--text-tertiary);
    }

    .condition-cell {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
    }

    .condition-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .condition-dot--excellent { background: var(--primary-500); }
    .condition-dot--good { background: var(--primary-400); }
    .condition-dot--fair { background: var(--warning-500); }
    .condition-dot--poor { background: var(--alert-400); }
    .condition-dot--non-functional { background: var(--alert-600); }

    /* Maintenance Card */
    .maintenance-list {
      padding: var(--space-2);
    }

    .maintenance-item {
      display: flex;
      gap: var(--space-4);
      padding: var(--space-3);
      border-radius: var(--radius-lg);
      transition: background var(--transition-fast);
    }

    .maintenance-item:hover {
      background: var(--surface-hover);
    }

    .maintenance-date {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      background: var(--primary-50);
      border-radius: var(--radius-lg);
      flex-shrink: 0;
    }

    :host-context([data-theme="dark"]) .maintenance-date {
      background: rgba(16, 185, 129, 0.15);
    }

    .date-day {
      font-family: var(--font-display);
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--primary-600);
      line-height: 1;
    }

    .date-month {
      font-size: var(--text-xs);
      color: var(--primary-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .maintenance-content {
      flex: 1;
      min-width: 0;
    }

    .maintenance-content h4 {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 var(--space-1) 0;
    }

    .maintenance-content p {
      font-size: var(--text-xs);
      color: var(--text-secondary);
      margin: 0 0 var(--space-2) 0;
    }

    .maintenance-meta {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .technician {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .maintenance-empty {
      padding: var(--space-6);
      text-align: center;
      color: var(--text-tertiary);
    }

    .maintenance-empty i {
      font-size: 2rem;
      margin-bottom: var(--space-2);
    }

    .maintenance-empty p {
      margin: 0;
      font-size: var(--text-sm);
    }

    /* Inventory Card */
    .inventory-items {
      padding: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .inventory-item {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .inventory-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .inventory-name {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .inventory-category {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .inventory-stock {
      flex: 2;
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .inventory-stock :deep(.p-progressbar) {
      height: 8px;
      border-radius: var(--radius-full);
    }

    .inventory-stock :deep(.p-progressbar-value) {
      border-radius: var(--radius-full);
    }

    .inventory-stock :deep(.stock-good .p-progressbar-value) {
      background: var(--primary-500);
    }

    .inventory-stock :deep(.stock-low .p-progressbar-value) {
      background: var(--warning-500);
    }

    .inventory-stock :deep(.stock-critical .p-progressbar-value) {
      background: var(--alert-500);
    }

    .stock-values {
      display: flex;
      justify-content: space-between;
      font-size: var(--text-xs);
    }

    .stock-current {
      font-weight: 500;
      color: var(--text-primary);
    }

    .stock-min {
      color: var(--text-tertiary);
    }
  `]
})
export class DashboardComponent {
  mockDataService = inject(MockDataService);
  authService = inject(AuthService);

  stats = this.mockDataService.dashboardStats;
  equipment = this.mockDataService.equipment;
  maintenance = this.mockDataService.maintenanceRecords;
  inventory = this.mockDataService.inventory;
  alerts = this.mockDataService.alerts;

  operationalPercentage = computed(() => {
    const stats = this.stats();
    return stats.totalEquipment > 0 
      ? Math.round((stats.activeEquipment / stats.totalEquipment) * 100) 
      : 0;
  });

  recentEquipment = computed(() => this.equipment().slice(0, 5));

  upcomingMaintenance = computed(() => 
    this.maintenance()
      .filter(m => m.status === MaintenanceStatus.SCHEDULED || m.status === MaintenanceStatus.IN_PROGRESS)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
      .slice(0, 4)
  );

  activeAlerts = computed(() => 
    this.alerts()
      .filter(a => !a.isAcknowledged)
      .sort((a, b) => {
        const severityOrder: Record<AlertSeverity, number> = { 
          [AlertSeverity.CRITICAL]: 0, 
          [AlertSeverity.HIGH]: 1, 
          [AlertSeverity.MEDIUM]: 2, 
          [AlertSeverity.LOW]: 3,
          [AlertSeverity.INFO]: 4
        };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
      .slice(0, 5)
  );

  unreadAlerts = computed(() => this.alerts().filter(a => !a.isRead));

  criticalInventory = computed(() => 
    this.inventory()
      .filter((i: InventoryItem) => i.status === StockStatus.LOW_STOCK || i.status === StockStatus.OUT_OF_STOCK)
      .slice(0, 5)
  );

  equipmentStatusChart = computed(() => {
    const eq = this.equipment();
    const statusCounts: Record<string, number> = {
      [EquipmentStatus.IN_SERVICE]: 0,
      [EquipmentStatus.UNDER_MAINTENANCE]: 0,
      [EquipmentStatus.AWAITING_REPAIR]: 0,
      [EquipmentStatus.OUT_OF_SERVICE]: 0,
      'Other': 0
    };

    eq.forEach(e => {
      if (e.status in statusCounts) {
        statusCounts[e.status]++;
      } else {
        statusCounts['Other']++;
      }
    });

    return {
      labels: ['In Service', 'Under Maintenance', 'Awaiting Repair', 'Out of Service', 'Other'],
      datasets: [{
        data: [
          statusCounts[EquipmentStatus.IN_SERVICE],
          statusCounts[EquipmentStatus.UNDER_MAINTENANCE],
          statusCounts[EquipmentStatus.AWAITING_REPAIR],
          statusCounts[EquipmentStatus.OUT_OF_SERVICE],
          statusCounts['Other']
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#f43f5e', '#64748b', '#94a3b8'],
        borderWidth: 0,
        hoverOffset: 8
      }]
    };
  });

  equipmentStatusLegend = computed(() => {
    const data = this.equipmentStatusChart();
    return data.labels.map((label, i) => ({
      label,
      value: data.datasets[0].data[i],
      color: data.datasets[0].backgroundColor[i]
    })).filter(item => item.value > 0);
  });

  maintenanceChart = computed(() => ({
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Preventive',
        data: [4, 6, 3, 5],
        backgroundColor: '#10b981',
        borderRadius: 6
      },
      {
        label: 'Corrective',
        data: [2, 1, 4, 2],
        backgroundColor: '#f59e0b',
        borderRadius: 6
      },
      {
        label: 'Emergency',
        data: [0, 1, 0, 1],
        backgroundColor: '#f43f5e',
        borderRadius: 6
      }
    ]
  }));

  doughnutOptions = {
    cutout: '60%',
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false
      }
    }
  };

  barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 16,
          font: {
            size: 12
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          },
          stepSize: 2
        }
      }
    },
    barPercentage: 0.7,
    categoryPercentage: 0.8
  };

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

  getMaintenanceSeverity(status: MaintenanceStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<MaintenanceStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      [MaintenanceStatus.SCHEDULED]: 'info',
      [MaintenanceStatus.IN_PROGRESS]: 'warn',
      [MaintenanceStatus.COMPLETED]: 'success',
      [MaintenanceStatus.OVERDUE]: 'danger',
      [MaintenanceStatus.CANCELLED]: 'secondary'
    };
    return map[status] || 'info';
  }

  getInventorySeverity(status: StockStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<StockStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      [StockStatus.IN_STOCK]: 'success',
      [StockStatus.LOW_STOCK]: 'warn',
      [StockStatus.OUT_OF_STOCK]: 'danger',
      [StockStatus.EXPIRED]: 'danger',
      [StockStatus.DISCONTINUED]: 'secondary'
    };
    return map[status] || 'info';
  }

  getAlertIcon(type: AlertType): string {
    const icons: Record<AlertType, string> = {
      [AlertType.MAINTENANCE_DUE]: 'pi pi-wrench',
      [AlertType.MAINTENANCE_OVERDUE]: 'pi pi-exclamation-circle',
      [AlertType.LOW_STOCK]: 'pi pi-shopping-cart',
      [AlertType.EQUIPMENT_FAILURE]: 'pi pi-ban',
      [AlertType.WARRANTY_EXPIRING]: 'pi pi-calendar-times',
      [AlertType.EXPIRY_WARNING]: 'pi pi-clock',
      [AlertType.RECALL_NOTICE]: 'pi pi-file-excel'
    };
    return icons[type] || 'pi pi-bell';
  }

  getStockPercentage(item: InventoryItem): number {
    if (item.maxQuantity === 0) return 0;
    return Math.round((item.quantity / item.maxQuantity) * 100);
  }

  getStockClass(item: InventoryItem): string {
    const percentage = this.getStockPercentage(item);
    if (percentage <= 20) return 'stock-critical';
    if (percentage <= 40) return 'stock-low';
    return 'stock-good';
  }

  getEquipmentName(equipmentId: string): string {
    const eq = this.equipment().find(e => e.id === equipmentId);
    return eq?.name || 'Unknown Equipment';
  }

  getDay(date: Date | string): string {
    return new Date(date).getDate().toString().padStart(2, '0');
  }

  getMonth(date: Date | string): string {
    return new Date(date).toLocaleString('en', { month: 'short' });
  }

  formatTimeAgo(date: Date | string): string {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  markAlertRead(alertId: string): void {
    this.mockDataService.markAlertAsRead(alertId);
  }
}
