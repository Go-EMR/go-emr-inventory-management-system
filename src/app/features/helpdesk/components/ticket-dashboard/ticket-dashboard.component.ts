import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { HelpdeskService } from '@core/services/helpdesk.service';
import { AuthService } from '@core/services/auth.service';
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  SLAStatus
} from '@shared/models';

@Component({
  selector: 'app-ticket-dashboard',
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
    SkeletonModule
  ],
  template: `
    <div class="ticket-dashboard">
      <!-- Header -->
      <div class="dashboard-header">
        <div class="header-content">
          <h1>Help Desk</h1>
          <p>Manage support tickets and track SLA compliance</p>
        </div>
        <div class="header-actions">
          <button pButton
            label="Create Ticket"
            icon="pi pi-plus"
            [routerLink]="['/helpdesk/create']"
            class="p-button-primary"
          ></button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card open">
          <div class="stat-icon">
            <i class="pi pi-inbox"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ helpdeskService.stats()?.openTickets || 0 }}</span>
            <span class="stat-label">Open Tickets</span>
          </div>
        </div>
        <div class="stat-card in-progress">
          <div class="stat-icon">
            <i class="pi pi-sync"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ helpdeskService.stats()?.inProgressTickets || 0 }}</span>
            <span class="stat-label">In Progress</span>
          </div>
        </div>
        <div class="stat-card pending">
          <div class="stat-icon">
            <i class="pi pi-clock"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ helpdeskService.stats()?.pendingTickets || 0 }}</span>
            <span class="stat-label">Pending</span>
          </div>
        </div>
        <div class="stat-card breached">
          <div class="stat-icon">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ helpdeskService.breachedSLATickets().length }}</span>
            <span class="stat-label">SLA Breached</span>
          </div>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <p-card styleClass="kpi-card">
          <div class="kpi-content">
            <div class="kpi-value">{{ helpdeskService.stats()?.avgFirstResponseTimeMinutes || 0 }} min</div>
            <div class="kpi-label">Avg. First Response</div>
          </div>
        </p-card>
        <p-card styleClass="kpi-card">
          <div class="kpi-content">
            <div class="kpi-value">{{ helpdeskService.stats()?.avgResolutionTimeHours || 0 }} hrs</div>
            <div class="kpi-label">Avg. Resolution Time</div>
          </div>
        </p-card>
        <p-card styleClass="kpi-card">
          <div class="kpi-content">
            <div class="kpi-value">{{ helpdeskService.stats()?.slaComplianceRate || 0 }}%</div>
            <div class="kpi-label">SLA Compliance</div>
          </div>
        </p-card>
        <p-card styleClass="kpi-card">
          <div class="kpi-content">
            <div class="kpi-value">{{ helpdeskService.stats()?.totalTickets || 0 }}</div>
            <div class="kpi-label">Total Tickets</div>
          </div>
        </p-card>
      </div>

      <!-- Charts Row -->
      <div class="charts-row">
        <p-card header="Tickets by Category" styleClass="chart-card">
          <p-chart type="doughnut" [data]="categoryChartData" [options]="chartOptions" />
        </p-card>
        <p-card header="Tickets by Priority" styleClass="chart-card">
          <p-chart type="bar" [data]="priorityChartData" [options]="barChartOptions" />
        </p-card>
      </div>

      <!-- Recent Tickets & Top Assignees -->
      <div class="tables-row">
        <!-- Recent Open Tickets -->
        <p-card header="Recent Open Tickets" styleClass="table-card">
          <p-table [value]="recentTickets" [rows]="5" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>Ticket</th>
                <th>Priority</th>
                <th>Status</th>
                <th>SLA</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-ticket>
              <tr>
                <td>
                  <a [routerLink]="['/helpdesk', ticket.id]" class="ticket-link">
                    <span class="ticket-number">{{ ticket.ticketNumber }}</span>
                    <span class="ticket-subject">{{ ticket.subject | slice:0:40 }}{{ ticket.subject.length > 40 ? '...' : '' }}</span>
                  </a>
                </td>
                <td>
                  <p-tag [value]="ticket.priority" [severity]="getPrioritySeverity(ticket.priority)" />
                </td>
                <td>
                  <p-tag [value]="ticket.status" [severity]="getStatusSeverity(ticket.status)" />
                </td>
                <td>
                  <p-tag
                    [value]="getSLALabel(ticket)"
                    [severity]="getSLASeverity(ticket)"
                    [pTooltip]="getSLATooltip(ticket)"
                  />
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="4" class="text-center p-4">No open tickets</td>
              </tr>
            </ng-template>
          </p-table>
          <div class="card-footer">
            <a [routerLink]="['/helpdesk/list']" class="view-all-link">
              View All Tickets <i class="pi pi-arrow-right"></i>
            </a>
          </div>
        </p-card>

        <!-- Top Assignees -->
        <p-card header="Top Assignees" styleClass="table-card">
          <p-table [value]="helpdeskService.stats()?.topAssignees || []" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>Assignee</th>
                <th style="text-align: right">Tickets</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-assignee>
              <tr>
                <td>
                  <div class="assignee-info">
                    <span class="assignee-avatar">{{ getInitials(assignee.userName) }}</span>
                    <span>{{ assignee.userName }}</span>
                  </div>
                </td>
                <td style="text-align: right">
                  <span class="ticket-count-badge">{{ assignee.ticketCount }}</span>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="2" class="text-center p-4">No assigned tickets</td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    .ticket-dashboard {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-content h1 {
      margin: 0 0 0.25rem 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .header-content p {
      margin: 0;
      color: var(--text-muted);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
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
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon i {
      font-size: 1.5rem;
    }

    .stat-card.open .stat-icon {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .stat-card.in-progress .stat-icon {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    .stat-card.pending .stat-icon {
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
    }

    .stat-card.breached .stat-icon {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    @media (max-width: 1200px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }
    }

    :host ::ng-deep .kpi-card {
      .p-card-body {
        padding: 1rem;
      }
    }

    .kpi-content {
      text-align: center;
    }

    .kpi-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-600);
    }

    .kpi-label {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    /* Charts Row */
    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    @media (max-width: 1024px) {
      .charts-row {
        grid-template-columns: 1fr;
      }
    }

    :host ::ng-deep .chart-card {
      .p-card-body {
        padding: 1.25rem;
      }
      .p-card-content {
        padding: 0;
      }
    }

    /* Tables Row */
    .tables-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
    }

    @media (max-width: 1024px) {
      .tables-row {
        grid-template-columns: 1fr;
      }
    }

    :host ::ng-deep .table-card {
      .p-card-body {
        padding: 1.25rem;
      }
      .p-card-content {
        padding: 0;
      }
    }

    .ticket-link {
      display: flex;
      flex-direction: column;
      text-decoration: none;
      color: inherit;
    }

    .ticket-link:hover .ticket-number {
      color: var(--primary-600);
    }

    .ticket-number {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-primary);
      transition: color var(--transition-fast);
    }

    .ticket-subject {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .card-footer {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .view-all-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--primary-600);
      text-decoration: none;
    }

    .view-all-link:hover {
      text-decoration: underline;
    }

    .assignee-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .assignee-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .ticket-count-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 24px;
      padding: 0 0.5rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-full);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }
  `]
})
export class TicketDashboardComponent implements OnInit {
  helpdeskService = inject(HelpdeskService);
  authService = inject(AuthService);

  categoryChartData: any;
  priorityChartData: any;
  chartOptions: any;
  barChartOptions: any;

  recentTickets: Ticket[] = [];

  ngOnInit(): void {
    this.loadData();
    this.setupCharts();
  }

  loadData(): void {
    this.helpdeskService.getStats().subscribe();
    this.helpdeskService.listTickets(
      { status: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.PENDING] },
      1,
      5
    ).subscribe(response => {
      this.recentTickets = response.items;
    });
  }

  setupCharts(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-primary') || '#374151';
    const surfaceBorder = documentStyle.getPropertyValue('--border-color') || '#e5e7eb';

    // Category Chart
    this.categoryChartData = {
      labels: ['Equipment Issue', 'Inventory Request', 'Maintenance', 'IT Support', 'General'],
      datasets: [{
        data: [3, 2, 1, 1, 1],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#6b7280'],
        hoverBackgroundColor: ['#2563eb', '#059669', '#d97706', '#7c3aed', '#4b5563']
      }]
    };

    this.chartOptions = {
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            usePointStyle: true,
            padding: 16
          }
        }
      },
      maintainAspectRatio: false
    };

    // Priority Chart
    this.priorityChartData = {
      labels: ['Low', 'Medium', 'High', 'Urgent'],
      datasets: [{
        label: 'Tickets',
        data: [1, 1, 2, 2],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
      }]
    };

    this.barChartOptions = {
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: textColor
          },
          grid: {
            color: surfaceBorder
          }
        },
        x: {
          ticks: {
            color: textColor
          },
          grid: {
            display: false
          }
        }
      },
      maintainAspectRatio: false
    };
  }

  getPrioritySeverity(priority: TicketPriority): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (priority) {
      case TicketPriority.LOW: return 'success';
      case TicketPriority.MEDIUM: return 'info';
      case TicketPriority.HIGH: return 'warn';
      case TicketPriority.URGENT: return 'danger';
      default: return 'secondary';
    }
  }

  getStatusSeverity(status: TicketStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case TicketStatus.OPEN: return 'info';
      case TicketStatus.IN_PROGRESS: return 'warn';
      case TicketStatus.PENDING: return 'secondary';
      case TicketStatus.RESOLVED: return 'success';
      case TicketStatus.CLOSED: return 'secondary';
      default: return 'secondary';
    }
  }

  getSLALabel(ticket: Ticket): string {
    if (ticket.slaResponseStatus === SLAStatus.BREACHED || ticket.slaResolutionStatus === SLAStatus.BREACHED) {
      return 'Breached';
    }
    if (ticket.slaResponseStatus === SLAStatus.AT_RISK || ticket.slaResolutionStatus === SLAStatus.AT_RISK) {
      return 'At Risk';
    }
    return 'On Track';
  }

  getSLASeverity(ticket: Ticket): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    if (ticket.slaResponseStatus === SLAStatus.BREACHED || ticket.slaResolutionStatus === SLAStatus.BREACHED) {
      return 'danger';
    }
    if (ticket.slaResponseStatus === SLAStatus.AT_RISK || ticket.slaResolutionStatus === SLAStatus.AT_RISK) {
      return 'warn';
    }
    return 'success';
  }

  getSLATooltip(ticket: Ticket): string {
    const response = ticket.slaResponseStatus;
    const resolution = ticket.slaResolutionStatus;
    return `Response: ${response}, Resolution: ${resolution}`;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
