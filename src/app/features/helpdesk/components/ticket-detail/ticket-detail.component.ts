import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TabsModule } from 'primeng/tabs';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { TimelineModule } from 'primeng/timeline';
import { AvatarModule } from 'primeng/avatar';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { HelpdeskService } from '@core/services/helpdesk.service';
import { AuthService } from '@core/services/auth.service';
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketComment,
  TicketHistory,
  TicketHistoryAction,
  SLAStatus
} from '@shared/models';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    DividerModule,
    TabsModule,
    TextareaModule,
    SelectModule,
    TooltipModule,
    TimelineModule,
    AvatarModule,
    DialogModule,
    CheckboxModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="ticket-detail-page">
      @if (ticket()) {
        <!-- Header -->
        <div class="page-header">
          <div class="header-left">
            <button pButton
              icon="pi pi-arrow-left"
              class="p-button-text p-button-secondary"
              [routerLink]="['/helpdesk']"
              pTooltip="Back to List"
            ></button>
            <div class="header-info">
              <div class="ticket-number-row">
                <span class="ticket-number">{{ ticket()!.ticketNumber }}</span>
                <p-tag [value]="ticket()!.status" [severity]="getStatusSeverity(ticket()!.status)" />
                <p-tag [value]="ticket()!.priority" [severity]="getPrioritySeverity(ticket()!.priority)" />
                <p-tag
                  [value]="getSLALabel(ticket()!)"
                  [severity]="getSLASeverity(ticket()!)"
                  [pTooltip]="getSLATooltip(ticket()!)"
                />
              </div>
              <h1 class="ticket-subject">{{ ticket()!.subject }}</h1>
            </div>
          </div>
          <div class="header-actions">
            @if (ticket()!.status !== TicketStatus.CLOSED) {
              @if (ticket()!.status === TicketStatus.RESOLVED) {
                <button pButton
                  label="Reopen"
                  icon="pi pi-refresh"
                  class="p-button-outlined"
                  (click)="reopenTicket()"
                ></button>
                <button pButton
                  label="Close"
                  icon="pi pi-check"
                  class="p-button-success"
                  (click)="closeTicket()"
                ></button>
              } @else {
                <button pButton
                  label="Resolve"
                  icon="pi pi-check"
                  class="p-button-success"
                  (click)="resolveTicket()"
                ></button>
              }
            } @else {
              <button pButton
                label="Reopen"
                icon="pi pi-refresh"
                class="p-button-outlined"
                (click)="reopenTicket()"
              ></button>
            }
          </div>
        </div>

        <!-- Main Content -->
        <div class="content-grid">
          <!-- Left Column - Details & Comments -->
          <div class="main-column">
            <p-card styleClass="detail-card">
              <p-tabs value="0">
                <p-tablist>
                  <p-tab value="0">Details</p-tab>
                  <p-tab value="1">
                    Comments
                    @if (helpdeskService.ticketComments().length > 0) {
                      <span class="comment-count">({{ helpdeskService.ticketComments().length }})</span>
                    }
                  </p-tab>
                  <p-tab value="2">History</p-tab>
                </p-tablist>
                <p-tabpanels>
                  <!-- Details Tab -->
                  <p-tabpanel value="0">
                    <div class="detail-section">
                      <h3>Description</h3>
                      <p class="description-text">{{ ticket()!.description }}</p>
                    </div>

                    @if (ticket()!.relatedEquipmentName || ticket()!.relatedInventoryItemName) {
                      <div class="detail-section">
                        <h3>Related Items</h3>
                        @if (ticket()!.relatedEquipmentName) {
                          <div class="related-item">
                            <i class="pi pi-box"></i>
                            <span>{{ ticket()!.relatedEquipmentName }}</span>
                          </div>
                        }
                        @if (ticket()!.relatedInventoryItemName) {
                          <div class="related-item">
                            <i class="pi pi-database"></i>
                            <span>{{ ticket()!.relatedInventoryItemName }}</span>
                          </div>
                        }
                      </div>
                    }

                    @if (ticket()!.tags && ticket()!.tags!.length > 0) {
                      <div class="detail-section">
                        <h3>Tags</h3>
                        <div class="tags-list">
                          @for (tag of ticket()!.tags; track tag) {
                            <span class="tag-chip">{{ tag }}</span>
                          }
                        </div>
                      </div>
                    }
                  </p-tabpanel>

                  <!-- Comments Tab -->
                  <p-tabpanel value="1">
                    <!-- Add Comment Form -->
                    <div class="add-comment-form">
                      <textarea
                        pTextarea
                        [(ngModel)]="newComment"
                        placeholder="Add a comment..."
                        [rows]="3"
                        class="comment-input"
                      ></textarea>
                      <div class="comment-form-actions">
                        <p-checkbox
                          [(ngModel)]="isInternalNote"
                          [binary]="true"
                          label="Internal note (not visible to requester)"
                        />
                        <button pButton
                          label="Add Comment"
                          icon="pi pi-send"
                          [disabled]="!newComment.trim()"
                          (click)="addComment()"
                        ></button>
                      </div>
                    </div>

                    <p-divider />

                    <!-- Comments List -->
                    <div class="comments-list">
                      @for (comment of helpdeskService.ticketComments(); track comment.id) {
                        <div class="comment-item" [class.internal]="comment.isInternal">
                          <div class="comment-header">
                            <p-avatar
                              [label]="getInitials(comment.authorName)"
                              shape="circle"
                              size="normal"
                            />
                            <div class="comment-meta">
                              <span class="author-name">{{ comment.authorName }}</span>
                              <span class="author-role">{{ comment.authorRole }}</span>
                              @if (comment.isInternal) {
                                <span class="internal-badge">Internal</span>
                              }
                            </div>
                            <span class="comment-date">{{ comment.createdAt | date:'MMM d, y h:mm a' }}</span>
                          </div>
                          <div class="comment-content">{{ comment.content }}</div>
                        </div>
                      } @empty {
                        <div class="empty-comments">
                          <i class="pi pi-comments"></i>
                          <p>No comments yet</p>
                        </div>
                      }
                    </div>
                  </p-tabpanel>

                  <!-- History Tab -->
                  <p-tabpanel value="2">
                    <p-timeline [value]="helpdeskService.ticketHistory()" styleClass="ticket-timeline">
                      <ng-template pTemplate="content" let-event>
                        <div class="timeline-event">
                          <div class="event-header">
                            <span class="event-action">{{ event.action }}</span>
                            <span class="event-date">{{ event.createdAt | date:'MMM d, y h:mm a' }}</span>
                          </div>
                          <div class="event-details">
                            <span>by {{ event.performedByName }}</span>
                            @if (event.oldValue && event.newValue) {
                              <span class="value-change">
                                {{ event.oldValue }} → {{ event.newValue }}
                              </span>
                            }
                            @if (event.notes) {
                              <p class="event-notes">{{ event.notes }}</p>
                            }
                          </div>
                        </div>
                      </ng-template>
                    </p-timeline>
                  </p-tabpanel>
                </p-tabpanels>
              </p-tabs>
            </p-card>
          </div>

          <!-- Right Column - Sidebar -->
          <div class="sidebar-column">
            <!-- Status & Assignment -->
            <p-card header="Ticket Info" styleClass="sidebar-card">
              <div class="info-row">
                <label>Status</label>
                <p-select
                  [options]="statusOptions"
                  [(ngModel)]="ticketStatus"
                  (onChange)="updateStatus()"
                  styleClass="w-full"
                  [disabled]="ticket()!.status === TicketStatus.CLOSED"
                />
              </div>

              <div class="info-row">
                <label>Priority</label>
                <p-select
                  [options]="priorityOptions"
                  [(ngModel)]="ticketPriority"
                  (onChange)="updatePriority()"
                  styleClass="w-full"
                />
              </div>

              <div class="info-row">
                <label>Assigned To</label>
                <p-select
                  [options]="staffOptions"
                  [(ngModel)]="assignedToId"
                  (onChange)="updateAssignee()"
                  placeholder="Select assignee"
                  [showClear]="true"
                  styleClass="w-full"
                />
              </div>

              <p-divider />

              <div class="info-row">
                <label>Category</label>
                <span class="info-value">{{ ticket()!.category }}</span>
              </div>

              <div class="info-row">
                <label>Requester</label>
                <div class="requester-info">
                  <p-avatar [label]="getInitials(ticket()!.requesterName)" shape="circle" size="normal" />
                  <div>
                    <span class="requester-name">{{ ticket()!.requesterName }}</span>
                    @if (ticket()!.requesterEmail) {
                      <span class="requester-email">{{ ticket()!.requesterEmail }}</span>
                    }
                  </div>
                </div>
              </div>
            </p-card>

            <!-- SLA Info -->
            <p-card header="SLA Status" styleClass="sidebar-card">
              <div class="sla-item">
                <div class="sla-label">
                  <span>First Response</span>
                  <p-tag
                    [value]="ticket()!.slaResponseStatus"
                    [severity]="getSLAItemSeverity(ticket()!.slaResponseStatus)"
                    size="small"
                  />
                </div>
                @if (ticket()!.responseDeadline) {
                  <span class="sla-deadline">
                    Due: {{ ticket()!.responseDeadline | date:'MMM d, h:mm a' }}
                  </span>
                }
                @if (ticket()!.firstResponseAt) {
                  <span class="sla-completed">
                    <i class="pi pi-check-circle"></i>
                    Responded: {{ ticket()!.firstResponseAt | date:'MMM d, h:mm a' }}
                  </span>
                }
              </div>

              <p-divider />

              <div class="sla-item">
                <div class="sla-label">
                  <span>Resolution</span>
                  <p-tag
                    [value]="ticket()!.slaResolutionStatus"
                    [severity]="getSLAItemSeverity(ticket()!.slaResolutionStatus)"
                    size="small"
                  />
                </div>
                @if (ticket()!.resolutionDeadline) {
                  <span class="sla-deadline">
                    Due: {{ ticket()!.resolutionDeadline | date:'MMM d, h:mm a' }}
                  </span>
                }
                @if (ticket()!.resolvedAt) {
                  <span class="sla-completed">
                    <i class="pi pi-check-circle"></i>
                    Resolved: {{ ticket()!.resolvedAt | date:'MMM d, h:mm a' }}
                  </span>
                }
              </div>
            </p-card>

            <!-- Dates -->
            <p-card header="Dates" styleClass="sidebar-card">
              <div class="date-row">
                <label>Created</label>
                <span>{{ ticket()!.createdAt | date:'MMM d, y h:mm a' }}</span>
              </div>
              <div class="date-row">
                <label>Updated</label>
                <span>{{ ticket()!.updatedAt | date:'MMM d, y h:mm a' }}</span>
              </div>
              @if (ticket()!.resolvedAt) {
                <div class="date-row">
                  <label>Resolved</label>
                  <span>{{ ticket()!.resolvedAt | date:'MMM d, y h:mm a' }}</span>
                </div>
              }
              @if (ticket()!.closedAt) {
                <div class="date-row">
                  <label>Closed</label>
                  <span>{{ ticket()!.closedAt | date:'MMM d, y h:mm a' }}</span>
                </div>
              }
            </p-card>
          </div>
        </div>
      } @else {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Loading ticket...</p>
        </div>
      }
    </div>

    <p-confirmDialog />
    <p-toast />
  `,
  styles: [`
    .ticket-detail-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-left {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .header-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .ticket-number-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .ticket-number {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .ticket-subject {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
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

    :host ::ng-deep .detail-card {
      .p-card-body {
        padding: 0;
      }
      .p-card-content {
        padding: 0;
      }
    }

    .detail-section {
      padding: 1rem 0;
    }

    .detail-section h3 {
      margin: 0 0 0.75rem 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .description-text {
      margin: 0;
      white-space: pre-wrap;
      line-height: 1.6;
      color: var(--text-primary);
    }

    .related-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
    }

    .related-item i {
      color: var(--primary-600);
    }

    .tags-list {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .tag-chip {
      padding: 0.25rem 0.75rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    /* Comments */
    .add-comment-form {
      margin-bottom: 1rem;
    }

    .comment-input {
      width: 100%;
      margin-bottom: 0.75rem;
    }

    .comment-form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .comment-item {
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
      border-left: 3px solid var(--primary-500);
    }

    .comment-item.internal {
      background: rgba(245, 158, 11, 0.1);
      border-left-color: #f59e0b;
    }

    .comment-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .comment-meta {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .author-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .author-role {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .internal-badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      background: rgba(245, 158, 11, 0.2);
      color: #d97706;
      border-radius: var(--radius-sm);
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 0.25rem;
    }

    .comment-date {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .comment-content {
      white-space: pre-wrap;
      line-height: 1.5;
      color: var(--text-secondary);
    }

    .empty-comments {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted);
    }

    .empty-comments i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    /* Timeline */
    .timeline-event {
      padding: 0.5rem 0;
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }

    .event-action {
      font-weight: 600;
      color: var(--text-primary);
    }

    .event-date {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .event-details {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .value-change {
      display: block;
      font-family: monospace;
      background: var(--bg-secondary);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      margin-top: 0.25rem;
    }

    .event-notes {
      margin: 0.25rem 0 0 0;
      font-style: italic;
    }

    /* Sidebar */
    :host ::ng-deep .sidebar-card {
      .p-card-body {
        padding: 1rem;
      }
      .p-card-content {
        padding: 0;
      }
      .p-card-header {
        padding: 0 0 0.75rem 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .info-row {
      margin-bottom: 1rem;
    }

    .info-row:last-child {
      margin-bottom: 0;
    }

    .info-row label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.25rem;
      text-transform: uppercase;
    }

    .info-value {
      color: var(--text-primary);
    }

    .requester-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .requester-name {
      display: block;
      font-weight: 600;
      color: var(--text-primary);
    }

    .requester-email {
      display: block;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* SLA */
    .sla-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .sla-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .sla-label span:first-child {
      font-weight: 500;
      color: var(--text-primary);
    }

    .sla-deadline {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .sla-completed {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: #10b981;
    }

    .sla-completed i {
      font-size: 0.75rem;
    }

    /* Dates */
    .date-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border-color);
    }

    .date-row:last-child {
      border-bottom: none;
    }

    .date-row label {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .date-row span {
      font-size: 0.875rem;
      color: var(--text-primary);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: var(--text-muted);
    }

    .loading-state i {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .comment-count {
      margin-left: 0.25rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
  `]
})
export class TicketDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  helpdeskService = inject(HelpdeskService);
  authService = inject(AuthService);

  TicketStatus = TicketStatus;

  ticket = this.helpdeskService.selectedTicket;

  ticketStatus: TicketStatus | null = null;
  ticketPriority: TicketPriority | null = null;
  assignedToId: string | null = null;

  newComment = '';
  isInternalNote = false;

  statusOptions = Object.values(TicketStatus).map(s => ({ label: s, value: s }));
  priorityOptions = Object.values(TicketPriority).map(p => ({ label: p, value: p }));
  staffOptions: { label: string; value: string }[] = [];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTicket(id);
    }
    this.loadStaff();
  }

  loadTicket(id: string): void {
    this.helpdeskService.getTicket(id).subscribe(ticket => {
      if (ticket) {
        this.ticketStatus = ticket.status;
        this.ticketPriority = ticket.priority;
        this.assignedToId = ticket.assignedToId || null;

        this.helpdeskService.getComments(id).subscribe();
        this.helpdeskService.getHistory(id).subscribe();
      }
    });
  }

  loadStaff(): void {
    this.helpdeskService.getStaffList().subscribe(staff => {
      this.staffOptions = staff.map(s => ({ label: s.name, value: s.id }));
    });
  }

  updateStatus(): void {
    if (this.ticketStatus && this.ticket()) {
      this.helpdeskService.updateTicket(this.ticket()!.id, { status: this.ticketStatus }).subscribe(() => {
        this.messageService.add({ severity: 'success', summary: 'Status Updated', detail: 'Ticket status has been updated' });
      });
    }
  }

  updatePriority(): void {
    if (this.ticketPriority && this.ticket()) {
      this.helpdeskService.updateTicket(this.ticket()!.id, { priority: this.ticketPriority }).subscribe(() => {
        this.messageService.add({ severity: 'success', summary: 'Priority Updated', detail: 'Ticket priority has been updated' });
      });
    }
  }

  updateAssignee(): void {
    if (this.ticket()) {
      const staffMember = this.staffOptions.find(s => s.value === this.assignedToId);
      this.helpdeskService.updateTicket(this.ticket()!.id, {
        assignedToId: this.assignedToId || undefined
      }).subscribe(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Assignee Updated',
          detail: this.assignedToId ? `Ticket assigned to ${staffMember?.label}` : 'Ticket unassigned'
        });
      });
    }
  }

  addComment(): void {
    if (this.newComment.trim() && this.ticket()) {
      this.helpdeskService.addComment(this.ticket()!.id, {
        content: this.newComment,
        isInternal: this.isInternalNote
      }).subscribe(() => {
        this.newComment = '';
        this.isInternalNote = false;
        this.messageService.add({ severity: 'success', summary: 'Comment Added', detail: 'Your comment has been added' });
      });
    }
  }

  resolveTicket(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to resolve this ticket?',
      header: 'Resolve Ticket',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.helpdeskService.resolveTicket(this.ticket()!.id).subscribe(() => {
          this.ticketStatus = TicketStatus.RESOLVED;
          this.messageService.add({ severity: 'success', summary: 'Ticket Resolved', detail: 'The ticket has been resolved' });
        });
      }
    });
  }

  closeTicket(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to close this ticket?',
      header: 'Close Ticket',
      icon: 'pi pi-times-circle',
      accept: () => {
        this.helpdeskService.closeTicket(this.ticket()!.id).subscribe(() => {
          this.ticketStatus = TicketStatus.CLOSED;
          this.messageService.add({ severity: 'success', summary: 'Ticket Closed', detail: 'The ticket has been closed' });
        });
      }
    });
  }

  reopenTicket(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to reopen this ticket?',
      header: 'Reopen Ticket',
      icon: 'pi pi-refresh',
      accept: () => {
        this.helpdeskService.reopenTicket(this.ticket()!.id).subscribe(() => {
          this.ticketStatus = TicketStatus.OPEN;
          this.messageService.add({ severity: 'success', summary: 'Ticket Reopened', detail: 'The ticket has been reopened' });
        });
      }
    });
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
      return 'SLA Breached';
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
    return `Response: ${ticket.slaResponseStatus}, Resolution: ${ticket.slaResolutionStatus}`;
  }

  getSLAItemSeverity(status: SLAStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case SLAStatus.ON_TRACK: return 'success';
      case SLAStatus.AT_RISK: return 'warn';
      case SLAStatus.BREACHED: return 'danger';
      default: return 'secondary';
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
