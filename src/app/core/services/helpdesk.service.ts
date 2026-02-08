import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketComment,
  TicketHistory,
  TicketHistoryAction,
  SLAStatus,
  SLAConfig,
  TicketStats,
  TicketFilter,
  PaginatedResponse
} from '../../shared/models';
import { environment } from '../../../environments/environment';

export interface CreateTicketRequest {
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  relatedEquipmentId?: string;
  relatedInventoryItemId?: string;
  tags?: string[];
}

export interface UpdateTicketRequest {
  subject?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignedToId?: string;
  tags?: string[];
}

export interface AddCommentRequest {
  content: string;
  isInternal: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class HelpdeskService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1/helpdesk`;

  // Signals for reactive state
  private ticketsSignal = signal<Ticket[]>([]);
  private selectedTicketSignal = signal<Ticket | null>(null);
  private ticketCommentsSignal = signal<TicketComment[]>([]);
  private ticketHistorySignal = signal<TicketHistory[]>([]);
  private statsSignal = signal<TicketStats | null>(null);
  private loadingSignal = signal(false);

  readonly tickets = this.ticketsSignal.asReadonly();
  readonly selectedTicket = this.selectedTicketSignal.asReadonly();
  readonly ticketComments = this.ticketCommentsSignal.asReadonly();
  readonly ticketHistory = this.ticketHistorySignal.asReadonly();
  readonly stats = this.statsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  // Computed values
  readonly openTickets = computed(() =>
    this.ticketsSignal().filter(t => t.status === TicketStatus.OPEN)
  );

  readonly inProgressTickets = computed(() =>
    this.ticketsSignal().filter(t => t.status === TicketStatus.IN_PROGRESS)
  );

  readonly urgentTickets = computed(() =>
    this.ticketsSignal().filter(t => t.priority === TicketPriority.URGENT)
  );

  readonly breachedSLATickets = computed(() =>
    this.ticketsSignal().filter(t =>
      t.slaResponseStatus === SLAStatus.BREACHED ||
      t.slaResolutionStatus === SLAStatus.BREACHED
    )
  );

  // Mock data for development
  private mockTickets: Ticket[] = [
    {
      id: 'ticket-1',
      tenantId: 'tenant-1',
      ticketNumber: 'TKT-2026-0001',
      subject: 'Ventilator not powering on',
      description: 'The Puritan Bennett 840 ventilator in ICU Room 3 is not powering on. The power indicator light is not illuminating and there is no response when pressing the power button.',
      category: TicketCategory.EQUIPMENT_ISSUE,
      priority: TicketPriority.URGENT,
      status: TicketStatus.IN_PROGRESS,
      requesterId: 'user-3',
      requesterName: 'Dr. Sarah Johnson',
      requesterEmail: 'sarah.johnson@hospital.com',
      assignedToId: 'user-2',
      assignedToName: 'Mike Wilson',
      relatedEquipmentId: 'eq-1',
      relatedEquipmentName: 'Puritan Bennett 840 Ventilator',
      slaResponseStatus: SLAStatus.ON_TRACK,
      slaResolutionStatus: SLAStatus.AT_RISK,
      responseDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000),
      resolutionDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
      firstResponseAt: new Date(Date.now() - 30 * 60 * 1000),
      tags: ['critical', 'icu'],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: 'ticket-2',
      tenantId: 'tenant-1',
      ticketNumber: 'TKT-2026-0002',
      subject: 'Request for additional surgical gloves',
      description: 'We are running low on size large surgical gloves in the OR department. Please arrange for urgent restocking.',
      category: TicketCategory.INVENTORY_REQUEST,
      priority: TicketPriority.HIGH,
      status: TicketStatus.OPEN,
      requesterId: 'user-4',
      requesterName: 'Nurse Jennifer Lee',
      requesterEmail: 'jennifer.lee@hospital.com',
      slaResponseStatus: SLAStatus.ON_TRACK,
      slaResolutionStatus: SLAStatus.ON_TRACK,
      responseDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
      resolutionDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      relatedInventoryItemId: 'inv-1',
      relatedInventoryItemName: 'Surgical Gloves (Large)',
      tags: ['supplies', 'or'],
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
      id: 'ticket-3',
      tenantId: 'tenant-1',
      ticketNumber: 'TKT-2026-0003',
      subject: 'Scheduled maintenance for MRI scanner',
      description: 'The quarterly maintenance for the GE Signa MRI scanner is due. Please schedule a technician visit.',
      category: TicketCategory.MAINTENANCE_REQUEST,
      priority: TicketPriority.MEDIUM,
      status: TicketStatus.PENDING,
      requesterId: 'user-5',
      requesterName: 'Robert Chen',
      requesterEmail: 'robert.chen@hospital.com',
      assignedToId: 'user-2',
      assignedToName: 'Mike Wilson',
      relatedEquipmentId: 'eq-2',
      relatedEquipmentName: 'GE Signa MRI Scanner',
      slaResponseStatus: SLAStatus.ON_TRACK,
      slaResolutionStatus: SLAStatus.ON_TRACK,
      responseDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000),
      resolutionDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000),
      firstResponseAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      tags: ['scheduled', 'imaging'],
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 'ticket-4',
      tenantId: 'tenant-1',
      ticketNumber: 'TKT-2026-0004',
      subject: 'Unable to access inventory system',
      description: 'I am receiving an error when trying to access the inventory management module. The error says "Access Denied".',
      category: TicketCategory.IT_SUPPORT,
      priority: TicketPriority.HIGH,
      status: TicketStatus.RESOLVED,
      requesterId: 'user-6',
      requesterName: 'Emily Davis',
      requesterEmail: 'emily.davis@hospital.com',
      assignedToId: 'user-1',
      assignedToName: 'John Smith',
      slaResponseStatus: SLAStatus.ON_TRACK,
      slaResolutionStatus: SLAStatus.ON_TRACK,
      responseDeadline: new Date(Date.now() - 20 * 60 * 60 * 1000),
      resolutionDeadline: new Date(Date.now() - 16 * 60 * 60 * 1000),
      firstResponseAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 18 * 60 * 60 * 1000)
    },
    {
      id: 'ticket-5',
      tenantId: 'tenant-1',
      ticketNumber: 'TKT-2026-0005',
      subject: 'Question about equipment warranty',
      description: 'I need clarification on the warranty terms for the Philips IntelliVue patient monitors purchased last year.',
      category: TicketCategory.GENERAL_INQUIRY,
      priority: TicketPriority.LOW,
      status: TicketStatus.CLOSED,
      requesterId: 'user-7',
      requesterName: 'Lisa Brown',
      requesterEmail: 'lisa.brown@hospital.com',
      assignedToId: 'user-1',
      assignedToName: 'John Smith',
      slaResponseStatus: SLAStatus.ON_TRACK,
      slaResolutionStatus: SLAStatus.ON_TRACK,
      responseDeadline: new Date(Date.now() - 48 * 60 * 60 * 1000),
      resolutionDeadline: new Date(Date.now() - 24 * 60 * 60 * 1000),
      firstResponseAt: new Date(Date.now() - 70 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 50 * 60 * 60 * 1000),
      closedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
    },
    {
      id: 'ticket-6',
      tenantId: 'tenant-1',
      ticketNumber: 'TKT-2026-0006',
      subject: 'Defibrillator showing error code E-04',
      description: 'The Zoll X Series defibrillator in the ER is displaying error code E-04. The device needs immediate attention as it may be needed for emergencies.',
      category: TicketCategory.EQUIPMENT_ISSUE,
      priority: TicketPriority.URGENT,
      status: TicketStatus.OPEN,
      requesterId: 'user-8',
      requesterName: 'Dr. Michael Park',
      requesterEmail: 'michael.park@hospital.com',
      relatedEquipmentId: 'eq-3',
      relatedEquipmentName: 'Zoll X Series Defibrillator',
      slaResponseStatus: SLAStatus.BREACHED,
      slaResolutionStatus: SLAStatus.AT_RISK,
      responseDeadline: new Date(Date.now() - 30 * 60 * 1000),
      resolutionDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000),
      tags: ['critical', 'er', 'life-support'],
      createdAt: new Date(Date.now() - 90 * 60 * 1000),
      updatedAt: new Date(Date.now() - 90 * 60 * 1000)
    }
  ];

  private mockComments: Map<string, TicketComment[]> = new Map([
    ['ticket-1', [
      {
        id: 'comment-1',
        ticketId: 'ticket-1',
        authorId: 'user-2',
        authorName: 'Mike Wilson',
        authorRole: 'Technician',
        content: 'I have checked the power supply and it seems to be functioning. Will inspect the internal power board next.',
        isInternal: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        id: 'comment-2',
        ticketId: 'ticket-1',
        authorId: 'user-1',
        authorName: 'John Smith',
        authorRole: 'Manager',
        content: 'Please prioritize this - we need the ventilator operational ASAP. Contact the vendor if needed.',
        isInternal: true,
        createdAt: new Date(Date.now() - 20 * 60 * 1000),
        updatedAt: new Date(Date.now() - 20 * 60 * 1000)
      }
    ]]
  ]);

  private mockHistory: Map<string, TicketHistory[]> = new Map([
    ['ticket-1', [
      {
        id: 'history-1',
        ticketId: 'ticket-1',
        action: TicketHistoryAction.CREATED,
        performedById: 'user-3',
        performedByName: 'Dr. Sarah Johnson',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'history-2',
        ticketId: 'ticket-1',
        action: TicketHistoryAction.ASSIGNED,
        performedById: 'user-1',
        performedByName: 'John Smith',
        newValue: 'Mike Wilson',
        createdAt: new Date(Date.now() - 90 * 60 * 1000)
      },
      {
        id: 'history-3',
        ticketId: 'ticket-1',
        action: TicketHistoryAction.STATUS_CHANGED,
        performedById: 'user-2',
        performedByName: 'Mike Wilson',
        field: 'status',
        oldValue: 'Open',
        newValue: 'In Progress',
        createdAt: new Date(Date.now() - 30 * 60 * 1000)
      }
    ]]
  ]);

  private mockSLAConfigs: SLAConfig[] = [
    {
      id: 'sla-1',
      tenantId: 'tenant-1',
      name: 'Urgent Priority SLA',
      priority: TicketPriority.URGENT,
      responseTimeMinutes: 60,
      resolutionTimeMinutes: 240,
      businessHoursOnly: false,
      businessHoursStart: '08:00',
      businessHoursEnd: '18:00',
      workingDays: [1, 2, 3, 4, 5],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'sla-2',
      tenantId: 'tenant-1',
      name: 'High Priority SLA',
      priority: TicketPriority.HIGH,
      responseTimeMinutes: 240,
      resolutionTimeMinutes: 480,
      businessHoursOnly: true,
      businessHoursStart: '08:00',
      businessHoursEnd: '18:00',
      workingDays: [1, 2, 3, 4, 5],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'sla-3',
      tenantId: 'tenant-1',
      name: 'Medium Priority SLA',
      priority: TicketPriority.MEDIUM,
      responseTimeMinutes: 480,
      resolutionTimeMinutes: 1440,
      businessHoursOnly: true,
      businessHoursStart: '08:00',
      businessHoursEnd: '18:00',
      workingDays: [1, 2, 3, 4, 5],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'sla-4',
      tenantId: 'tenant-1',
      name: 'Low Priority SLA',
      priority: TicketPriority.LOW,
      responseTimeMinutes: 1440,
      resolutionTimeMinutes: 4320,
      businessHoursOnly: true,
      businessHoursStart: '08:00',
      businessHoursEnd: '18:00',
      workingDays: [1, 2, 3, 4, 5],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // ==================== Ticket CRUD ====================

  createTicket(request: CreateTicketRequest): Observable<Ticket> {
    const ticketNumber = `TKT-${new Date().getFullYear()}-${String(this.mockTickets.length + 1).padStart(4, '0')}`;
    const now = new Date();

    // Get SLA config for priority
    const slaConfig = this.mockSLAConfigs.find(s => s.priority === request.priority);
    const responseMinutes = slaConfig?.responseTimeMinutes || 240;
    const resolutionMinutes = slaConfig?.resolutionTimeMinutes || 1440;

    const newTicket: Ticket = {
      id: `ticket-${Date.now()}`,
      tenantId: 'tenant-1',
      ticketNumber,
      subject: request.subject,
      description: request.description,
      category: request.category,
      priority: request.priority,
      status: TicketStatus.OPEN,
      requesterId: 'current-user',
      requesterName: 'Current User',
      requesterEmail: 'user@hospital.com',
      relatedEquipmentId: request.relatedEquipmentId,
      relatedInventoryItemId: request.relatedInventoryItemId,
      slaResponseStatus: SLAStatus.ON_TRACK,
      slaResolutionStatus: SLAStatus.ON_TRACK,
      responseDeadline: new Date(now.getTime() + responseMinutes * 60 * 1000),
      resolutionDeadline: new Date(now.getTime() + resolutionMinutes * 60 * 1000),
      tags: request.tags,
      createdAt: now,
      updatedAt: now
    };

    this.mockTickets.unshift(newTicket);
    this.ticketsSignal.set([...this.mockTickets]);

    // Add creation history
    this.addHistory(newTicket.id, {
      action: TicketHistoryAction.CREATED,
      performedById: 'current-user',
      performedByName: 'Current User'
    });

    return of(newTicket).pipe(delay(500));
  }

  getTicket(id: string): Observable<Ticket | undefined> {
    const ticket = this.mockTickets.find(t => t.id === id);
    if (ticket) {
      this.selectedTicketSignal.set(ticket);
    }
    return of(ticket).pipe(delay(300));
  }

  listTickets(filter?: TicketFilter, page = 1, pageSize = 20): Observable<PaginatedResponse<Ticket>> {
    let filtered = [...this.mockTickets];

    if (filter?.search) {
      const search = filter.search.toLowerCase();
      filtered = filtered.filter(t =>
        t.ticketNumber.toLowerCase().includes(search) ||
        t.subject.toLowerCase().includes(search) ||
        t.requesterName.toLowerCase().includes(search)
      );
    }
    if (filter?.status?.length) {
      filtered = filtered.filter(t => filter.status!.includes(t.status));
    }
    if (filter?.priority?.length) {
      filtered = filtered.filter(t => filter.priority!.includes(t.priority));
    }
    if (filter?.category?.length) {
      filtered = filtered.filter(t => filter.category!.includes(t.category));
    }
    if (filter?.assignedToId) {
      filtered = filtered.filter(t => t.assignedToId === filter.assignedToId);
    }
    if (filter?.requesterId) {
      filtered = filtered.filter(t => t.requesterId === filter.requesterId);
    }
    if (filter?.slaStatus?.length) {
      filtered = filtered.filter(t =>
        filter.slaStatus!.includes(t.slaResponseStatus) ||
        filter.slaStatus!.includes(t.slaResolutionStatus)
      );
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    this.ticketsSignal.set(items);

    return of({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }).pipe(delay(300));
  }

  updateTicket(id: string, request: UpdateTicketRequest): Observable<Ticket> {
    const ticket = this.mockTickets.find(t => t.id === id);
    if (ticket) {
      const oldStatus = ticket.status;
      const oldPriority = ticket.priority;
      const oldAssignee = ticket.assignedToName;

      Object.assign(ticket, request, { updatedAt: new Date() });

      // Track status change
      if (request.status && request.status !== oldStatus) {
        this.addHistory(id, {
          action: TicketHistoryAction.STATUS_CHANGED,
          performedById: 'current-user',
          performedByName: 'Current User',
          field: 'status',
          oldValue: oldStatus,
          newValue: request.status
        });

        if (request.status === TicketStatus.RESOLVED) {
          ticket.resolvedAt = new Date();
        } else if (request.status === TicketStatus.CLOSED) {
          ticket.closedAt = new Date();
        }
      }

      // Track priority change
      if (request.priority && request.priority !== oldPriority) {
        this.addHistory(id, {
          action: TicketHistoryAction.PRIORITY_CHANGED,
          performedById: 'current-user',
          performedByName: 'Current User',
          field: 'priority',
          oldValue: oldPriority,
          newValue: request.priority
        });
      }

      // Track assignment
      if (request.assignedToId && ticket.assignedToName !== oldAssignee) {
        this.addHistory(id, {
          action: oldAssignee ? TicketHistoryAction.REASSIGNED : TicketHistoryAction.ASSIGNED,
          performedById: 'current-user',
          performedByName: 'Current User',
          oldValue: oldAssignee,
          newValue: ticket.assignedToName
        });
      }

      this.ticketsSignal.set([...this.mockTickets]);
      this.selectedTicketSignal.set(ticket);
    }
    return of(ticket!).pipe(delay(500));
  }

  assignTicket(id: string, assigneeId: string, assigneeName: string): Observable<Ticket> {
    return this.updateTicket(id, {
      assignedToId: assigneeId,
      status: TicketStatus.IN_PROGRESS
    }).pipe(delay(300));
  }

  resolveTicket(id: string, resolution?: string): Observable<Ticket> {
    const ticket = this.mockTickets.find(t => t.id === id);
    if (ticket) {
      ticket.status = TicketStatus.RESOLVED;
      ticket.resolvedAt = new Date();
      ticket.updatedAt = new Date();

      this.addHistory(id, {
        action: TicketHistoryAction.RESOLVED,
        performedById: 'current-user',
        performedByName: 'Current User',
        notes: resolution
      });

      this.ticketsSignal.set([...this.mockTickets]);
      this.selectedTicketSignal.set(ticket);
    }
    return of(ticket!).pipe(delay(500));
  }

  closeTicket(id: string): Observable<Ticket> {
    const ticket = this.mockTickets.find(t => t.id === id);
    if (ticket) {
      ticket.status = TicketStatus.CLOSED;
      ticket.closedAt = new Date();
      ticket.updatedAt = new Date();

      this.addHistory(id, {
        action: TicketHistoryAction.CLOSED,
        performedById: 'current-user',
        performedByName: 'Current User'
      });

      this.ticketsSignal.set([...this.mockTickets]);
      this.selectedTicketSignal.set(ticket);
    }
    return of(ticket!).pipe(delay(500));
  }

  reopenTicket(id: string, reason?: string): Observable<Ticket> {
    const ticket = this.mockTickets.find(t => t.id === id);
    if (ticket) {
      ticket.status = TicketStatus.OPEN;
      ticket.resolvedAt = undefined;
      ticket.closedAt = undefined;
      ticket.updatedAt = new Date();

      this.addHistory(id, {
        action: TicketHistoryAction.REOPENED,
        performedById: 'current-user',
        performedByName: 'Current User',
        notes: reason
      });

      this.ticketsSignal.set([...this.mockTickets]);
      this.selectedTicketSignal.set(ticket);
    }
    return of(ticket!).pipe(delay(500));
  }

  // ==================== Comments ====================

  getComments(ticketId: string): Observable<TicketComment[]> {
    const comments = this.mockComments.get(ticketId) || [];
    this.ticketCommentsSignal.set(comments);
    return of(comments).pipe(delay(300));
  }

  addComment(ticketId: string, request: AddCommentRequest): Observable<TicketComment> {
    const comment: TicketComment = {
      id: `comment-${Date.now()}`,
      ticketId,
      authorId: 'current-user',
      authorName: 'Current User',
      authorRole: 'Staff',
      content: request.content,
      isInternal: request.isInternal,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const comments = this.mockComments.get(ticketId) || [];
    comments.push(comment);
    this.mockComments.set(ticketId, comments);
    this.ticketCommentsSignal.set([...comments]);

    // Update ticket's first response if this is the first non-internal comment
    if (!request.isInternal) {
      const ticket = this.mockTickets.find(t => t.id === ticketId);
      if (ticket && !ticket.firstResponseAt) {
        ticket.firstResponseAt = new Date();
        ticket.updatedAt = new Date();
        this.ticketsSignal.set([...this.mockTickets]);
      }
    }

    this.addHistory(ticketId, {
      action: TicketHistoryAction.COMMENT_ADDED,
      performedById: 'current-user',
      performedByName: 'Current User',
      notes: request.isInternal ? 'Internal note added' : 'Reply added'
    });

    return of(comment).pipe(delay(500));
  }

  // ==================== History ====================

  getHistory(ticketId: string): Observable<TicketHistory[]> {
    const history = this.mockHistory.get(ticketId) || [];
    this.ticketHistorySignal.set(history);
    return of(history).pipe(delay(300));
  }

  private addHistory(ticketId: string, entry: Omit<TicketHistory, 'id' | 'ticketId' | 'createdAt'>): void {
    const history = this.mockHistory.get(ticketId) || [];
    history.push({
      id: `history-${Date.now()}`,
      ticketId,
      createdAt: new Date(),
      ...entry
    });
    this.mockHistory.set(ticketId, history);
    this.ticketHistorySignal.set([...history]);
  }

  // ==================== Statistics ====================

  getStats(): Observable<TicketStats> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const allTickets = this.mockTickets;
    const resolvedTickets = allTickets.filter(t => t.resolvedAt);

    // Calculate average resolution time
    let totalResolutionTime = 0;
    let resolvedCount = 0;
    resolvedTickets.forEach(t => {
      if (t.resolvedAt && t.createdAt) {
        totalResolutionTime += t.resolvedAt.getTime() - t.createdAt.getTime();
        resolvedCount++;
      }
    });
    const avgResolutionTimeHours = resolvedCount > 0
      ? totalResolutionTime / resolvedCount / (1000 * 60 * 60)
      : 0;

    // Calculate average first response time
    let totalResponseTime = 0;
    let respondedCount = 0;
    allTickets.forEach(t => {
      if (t.firstResponseAt && t.createdAt) {
        totalResponseTime += t.firstResponseAt.getTime() - t.createdAt.getTime();
        respondedCount++;
      }
    });
    const avgFirstResponseTimeMinutes = respondedCount > 0
      ? totalResponseTime / respondedCount / (1000 * 60)
      : 0;

    // SLA compliance
    const slaCompliantTickets = allTickets.filter(t =>
      t.slaResponseStatus !== SLAStatus.BREACHED &&
      t.slaResolutionStatus !== SLAStatus.BREACHED
    );
    const slaComplianceRate = allTickets.length > 0
      ? (slaCompliantTickets.length / allTickets.length) * 100
      : 100;

    // Tickets by category
    const categoryGroups = new Map<TicketCategory, number>();
    allTickets.forEach(t => {
      categoryGroups.set(t.category, (categoryGroups.get(t.category) || 0) + 1);
    });
    const ticketsByCategory = Array.from(categoryGroups.entries()).map(([category, count]) => ({
      category,
      count
    }));

    // Tickets by priority
    const priorityGroups = new Map<TicketPriority, number>();
    allTickets.forEach(t => {
      priorityGroups.set(t.priority, (priorityGroups.get(t.priority) || 0) + 1);
    });
    const ticketsByPriority = Array.from(priorityGroups.entries()).map(([priority, count]) => ({
      priority,
      count
    }));

    // Top assignees
    const assigneeGroups = new Map<string, { userId: string; userName: string; ticketCount: number }>();
    allTickets.filter(t => t.assignedToId).forEach(t => {
      const existing = assigneeGroups.get(t.assignedToId!);
      if (existing) {
        existing.ticketCount++;
      } else {
        assigneeGroups.set(t.assignedToId!, {
          userId: t.assignedToId!,
          userName: t.assignedToName || 'Unknown',
          ticketCount: 1
        });
      }
    });
    const topAssignees = Array.from(assigneeGroups.values())
      .sort((a, b) => b.ticketCount - a.ticketCount)
      .slice(0, 5);

    const stats: TicketStats = {
      totalTickets: allTickets.length,
      openTickets: allTickets.filter(t => t.status === TicketStatus.OPEN).length,
      inProgressTickets: allTickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length,
      pendingTickets: allTickets.filter(t => t.status === TicketStatus.PENDING).length,
      resolvedTickets: allTickets.filter(t => t.status === TicketStatus.RESOLVED).length,
      closedTickets: allTickets.filter(t => t.status === TicketStatus.CLOSED).length,
      avgResolutionTimeHours: Math.round(avgResolutionTimeHours * 10) / 10,
      avgFirstResponseTimeMinutes: Math.round(avgFirstResponseTimeMinutes),
      slaComplianceRate: Math.round(slaComplianceRate * 10) / 10,
      ticketsByCategory,
      ticketsByPriority,
      ticketsOverTime: [
        { date: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), opened: 3, closed: 2 },
        { date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), opened: 2, closed: 1 },
        { date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), opened: 4, closed: 3 },
        { date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), opened: 1, closed: 2 },
        { date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), opened: 2, closed: 1 },
        { date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), opened: 3, closed: 4 },
        { date: now, opened: 2, closed: 0 }
      ],
      topAssignees
    };

    this.statsSignal.set(stats);
    return of(stats).pipe(delay(300));
  }

  // ==================== SLA Configuration ====================

  getSLAConfigs(): Observable<SLAConfig[]> {
    return of(this.mockSLAConfigs).pipe(delay(300));
  }

  updateSLAConfig(id: string, updates: Partial<SLAConfig>): Observable<SLAConfig> {
    const config = this.mockSLAConfigs.find(c => c.id === id);
    if (config) {
      Object.assign(config, updates, { updatedAt: new Date() });
    }
    return of(config!).pipe(delay(500));
  }

  // ==================== Staff list for assignment ====================

  getStaffList(): Observable<{ id: string; name: string; role: string }[]> {
    const staff = [
      { id: 'user-1', name: 'John Smith', role: 'Administrator' },
      { id: 'user-2', name: 'Mike Wilson', role: 'Technician' },
      { id: 'user-9', name: 'Sarah Connor', role: 'Technician' },
      { id: 'user-10', name: 'James Rodriguez', role: 'Manager' }
    ];
    return of(staff).pipe(delay(200));
  }
}
