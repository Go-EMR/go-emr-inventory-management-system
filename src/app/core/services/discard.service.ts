import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DiscardRecord,
  DiscardReason,
  DiscardStatus,
  DisposalMethod,
  ExpirationAlert,
  ExpirationAlertType,
  ResolutionType,
  WasteReport,
  WasteByReason,
  WasteByItem,
  WasteByMonth,
  DiscardSummary,
  PaginatedResponse
} from '../../shared/models';

export interface CreateDiscardRequest {
  itemId: string;
  stockLevelId?: string;
  lotBarcodeId?: string;
  lotNumber?: string;
  serialNumber?: string;
  quantity: number;
  reasonId: string;
  reasonNotes?: string;
  disposalMethod?: DisposalMethod;
  disposalLocation?: string;
  sourceType?: string;
  sourceReferenceId?: string;
}

export interface DiscardFilter {
  itemId?: string;
  reasonCode?: string;
  status?: DiscardStatus;
  startDate?: Date;
  endDate?: Date;
  pendingApprovalOnly?: boolean;
}

export interface ExpirationAlertFilter {
  alertType?: ExpirationAlertType;
  unresolvedOnly?: boolean;
  unacknowledgedOnly?: boolean;
  expiringWithinDays?: number;
}

export interface ScanExpiredItemsResult {
  expiredCount: number;
  expiringSoonCount: number;
  alertsCreated: number;
  alertsUpdated: number;
}

@Injectable({ providedIn: 'root' })
export class DiscardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/inventory`;
  private readonly USE_MOCK = true;

  // Mock data
  private mockReasons: DiscardReason[] = [
    { id: 'r1', code: 'EXPIRED', name: 'Expired', description: 'Item has passed its expiration date', requiresApproval: false, requiresWitness: false, isWaste: true, isActive: true, displayOrder: 1, createdAt: new Date(), updatedAt: new Date() },
    { id: 'r2', code: 'DAMAGED', name: 'Damaged', description: 'Item is physically damaged and unusable', requiresApproval: false, requiresWitness: false, isWaste: true, isActive: true, displayOrder: 2, createdAt: new Date(), updatedAt: new Date() },
    { id: 'r3', code: 'CONTAMINATED', name: 'Contaminated', description: 'Item has been contaminated', requiresApproval: false, requiresWitness: false, isWaste: true, isActive: true, displayOrder: 3, createdAt: new Date(), updatedAt: new Date() },
    { id: 'r4', code: 'RECALLED', name: 'Recalled', description: 'Item is subject to manufacturer recall', requiresApproval: false, requiresWitness: false, isWaste: false, isActive: true, displayOrder: 4, createdAt: new Date(), updatedAt: new Date() },
    { id: 'r5', code: 'QUALITY_ISSUE', name: 'Quality Issue', description: 'Item does not meet quality standards', requiresApproval: true, requiresWitness: false, isWaste: true, isActive: true, displayOrder: 5, createdAt: new Date(), updatedAt: new Date() },
    { id: 'r6', code: 'OPENED_UNUSED', name: 'Opened/Unused', description: 'Item was opened but not used', requiresApproval: false, requiresWitness: false, isWaste: true, isActive: true, displayOrder: 6, createdAt: new Date(), updatedAt: new Date() },
    { id: 'r7', code: 'PARTIAL_USE', name: 'Partial Use', description: 'Only portion of item was used, remainder discarded', requiresApproval: false, requiresWitness: false, isWaste: true, isActive: true, displayOrder: 7, createdAt: new Date(), updatedAt: new Date() },
    { id: 'r8', code: 'CONTROLLED_WASTE', name: 'Controlled Substance Waste', description: 'Controlled substance requiring witnessed disposal', requiresApproval: true, requiresWitness: true, isWaste: true, isActive: true, displayOrder: 9, createdAt: new Date(), updatedAt: new Date() },
    { id: 'r9', code: 'OTHER', name: 'Other', description: 'Other reason - specify in notes', requiresApproval: false, requiresWitness: false, isWaste: true, isActive: true, displayOrder: 99, createdAt: new Date(), updatedAt: new Date() }
  ];

  private mockDiscards: DiscardRecord[] = [
    {
      id: 'd1',
      discardNumber: 'DIS-202501-00001',
      itemId: 'item-1',
      itemName: 'Surgical Gloves - Large',
      itemSku: 'GLV-LG-001',
      lotNumber: '2024A',
      expirationDate: new Date('2024-12-31'),
      quantity: 50,
      unitCost: 0.15,
      totalCost: 7.50,
      reasonId: 'r1',
      reasonCode: 'EXPIRED',
      reasonName: 'Expired',
      reasonNotes: 'Expired batch from 2024',
      status: DiscardStatus.COMPLETED,
      requiresApproval: false,
      requiresWitness: false,
      disposalMethod: DisposalMethod.GENERAL,
      disposalLocation: 'Waste Room A',
      disposalVerified: true,
      disposalVerifiedAt: new Date('2025-01-15'),
      createdBy: 'user-1',
      createdByName: 'John Smith',
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-01-15')
    },
    {
      id: 'd2',
      discardNumber: 'DIS-202501-00002',
      itemId: 'item-2',
      itemName: 'IV Catheter 18G',
      itemSku: 'IVC-18',
      lotNumber: 'LOT2024B',
      quantity: 10,
      unitCost: 2.50,
      totalCost: 25.00,
      reasonId: 'r2',
      reasonCode: 'DAMAGED',
      reasonName: 'Damaged',
      reasonNotes: 'Package damaged during shipping',
      status: DiscardStatus.PENDING,
      requiresApproval: false,
      requiresWitness: false,
      disposalMethod: DisposalMethod.SHARPS,
      disposalVerified: false,
      createdBy: 'user-1',
      createdByName: 'John Smith',
      createdAt: new Date('2025-01-28'),
      updatedAt: new Date('2025-01-28')
    },
    {
      id: 'd3',
      discardNumber: 'DIS-202501-00003',
      itemId: 'item-9',
      itemName: 'Morphine 10mg/mL',
      itemSku: 'MOR-10',
      lotNumber: 'CTRL-2024',
      serialNumber: 'SN-CTRL-001',
      quantity: 2,
      unitCost: 15.00,
      totalCost: 30.00,
      reasonId: 'r8',
      reasonCode: 'CONTROLLED_WASTE',
      reasonName: 'Controlled Substance Waste',
      reasonNotes: 'Partial vials from patient care',
      status: DiscardStatus.PENDING,
      requiresApproval: true,
      requiresWitness: true,
      disposalMethod: DisposalMethod.CONTROLLED,
      disposalVerified: false,
      createdBy: 'user-2',
      createdByName: 'Jane Doe',
      createdAt: new Date('2025-01-29'),
      updatedAt: new Date('2025-01-29')
    }
  ];

  private mockAlerts: ExpirationAlert[] = [
    {
      id: 'ea1',
      itemId: 'item-3',
      itemName: 'Sutures 3-0',
      itemSku: 'SUT-3-0',
      lotNumber: 'LOT2024C',
      expirationDate: new Date('2025-02-15'),
      quantity: 25,
      alertType: ExpirationAlertType.EXPIRING_SOON,
      daysUntilExpiry: 16,
      firstAlertedAt: new Date('2025-01-15'),
      lastAlertedAt: new Date('2025-01-30'),
      alertCount: 3,
      isResolved: false,
      isAcknowledged: true,
      acknowledgedAt: new Date('2025-01-16'),
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-01-30')
    },
    {
      id: 'ea2',
      itemId: 'item-5',
      itemName: 'Sterile Gauze 4x4',
      itemSku: 'GAU-4X4',
      lotNumber: 'LOT2024D',
      expirationDate: new Date('2025-01-25'),
      quantity: 100,
      alertType: ExpirationAlertType.EXPIRED,
      daysUntilExpiry: -5,
      firstAlertedAt: new Date('2025-01-10'),
      lastAlertedAt: new Date('2025-01-30'),
      alertCount: 5,
      isResolved: false,
      isAcknowledged: false,
      createdAt: new Date('2025-01-10'),
      updatedAt: new Date('2025-01-30')
    },
    {
      id: 'ea3',
      itemId: 'item-8',
      itemName: 'Saline Solution 1L',
      itemSku: 'SAL-1L',
      lotNumber: 'LOT2024E',
      expirationDate: new Date('2025-03-01'),
      quantity: 50,
      alertType: ExpirationAlertType.EXPIRING_SOON,
      daysUntilExpiry: 30,
      firstAlertedAt: new Date('2025-01-25'),
      lastAlertedAt: new Date('2025-01-30'),
      alertCount: 2,
      isResolved: false,
      isAcknowledged: false,
      createdAt: new Date('2025-01-25'),
      updatedAt: new Date('2025-01-30')
    }
  ];

  // Get discard reasons
  getDiscardReasons(activeOnly = true): Observable<DiscardReason[]> {
    if (this.USE_MOCK) {
      const reasons = activeOnly
        ? this.mockReasons.filter(r => r.isActive)
        : this.mockReasons;
      return of(reasons).pipe(delay(200));
    }
    return this.http.get<DiscardReason[]>(`${this.apiUrl}/discard-reasons`, {
      params: { active_only: activeOnly.toString() }
    });
  }

  // Create a discard record
  createDiscard(request: CreateDiscardRequest): Observable<DiscardRecord> {
    if (this.USE_MOCK) {
      const reason = this.mockReasons.find(r => r.id === request.reasonId);
      const newDiscard: DiscardRecord = {
        id: `d-${Date.now()}`,
        discardNumber: `DIS-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(this.mockDiscards.length + 1).padStart(5, '0')}`,
        itemId: request.itemId,
        itemName: 'Mock Item',
        itemSku: 'MOCK-SKU',
        stockLevelId: request.stockLevelId,
        lotBarcodeId: request.lotBarcodeId,
        lotNumber: request.lotNumber,
        serialNumber: request.serialNumber,
        quantity: request.quantity,
        unitCost: 1.00,
        totalCost: request.quantity * 1.00,
        reasonId: request.reasonId,
        reasonCode: reason?.code || 'OTHER',
        reasonName: reason?.name || 'Other',
        reasonNotes: request.reasonNotes,
        status: reason?.requiresApproval || reason?.requiresWitness ? DiscardStatus.PENDING : DiscardStatus.APPROVED,
        requiresApproval: reason?.requiresApproval || false,
        requiresWitness: reason?.requiresWitness || false,
        disposalMethod: request.disposalMethod,
        disposalLocation: request.disposalLocation,
        disposalVerified: false,
        sourceType: request.sourceType,
        sourceReferenceId: request.sourceReferenceId,
        createdBy: 'current-user',
        createdByName: 'Current User',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.mockDiscards.push(newDiscard);
      return of(newDiscard).pipe(delay(300));
    }
    return this.http.post<DiscardRecord>(`${this.apiUrl}/discards`, request);
  }

  // Get a discard record by ID
  getDiscard(id: string): Observable<DiscardRecord> {
    if (this.USE_MOCK) {
      const discard = this.mockDiscards.find(d => d.id === id);
      if (discard) {
        return of(discard).pipe(delay(200));
      }
      throw new Error('Discard not found');
    }
    return this.http.get<DiscardRecord>(`${this.apiUrl}/discards/${id}`);
  }

  // List discard records
  listDiscards(filter?: DiscardFilter, page = 1, pageSize = 25): Observable<PaginatedResponse<DiscardRecord>> {
    if (this.USE_MOCK) {
      let filtered = [...this.mockDiscards];

      if (filter?.itemId) {
        filtered = filtered.filter(d => d.itemId === filter.itemId);
      }
      if (filter?.reasonCode) {
        filtered = filtered.filter(d => d.reasonCode === filter.reasonCode);
      }
      if (filter?.status) {
        filtered = filtered.filter(d => d.status === filter.status);
      }
      if (filter?.pendingApprovalOnly) {
        filtered = filtered.filter(d => d.status === DiscardStatus.PENDING && d.requiresApproval && !d.approvedBy);
      }

      const start = (page - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize);

      return of({
        items,
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize)
      }).pipe(delay(200));
    }
    return this.http.get<PaginatedResponse<DiscardRecord>>(`${this.apiUrl}/discards`, {
      params: {
        page: page.toString(),
        page_size: pageSize.toString(),
        ...(filter?.itemId && { item_id: filter.itemId }),
        ...(filter?.reasonCode && { reason_code: filter.reasonCode }),
        ...(filter?.status && { status: filter.status }),
        ...(filter?.pendingApprovalOnly && { pending_approval_only: 'true' })
      }
    });
  }

  // Approve a discard
  approveDiscard(discardId: string, notes?: string): Observable<DiscardRecord> {
    if (this.USE_MOCK) {
      const discard = this.mockDiscards.find(d => d.id === discardId);
      if (discard) {
        discard.approvedBy = 'current-user';
        discard.approvedByName = 'Current User';
        discard.approvedAt = new Date();
        discard.approvalNotes = notes;
        if (!discard.requiresWitness || discard.witnessedBy) {
          discard.status = DiscardStatus.APPROVED;
        }
        discard.updatedAt = new Date();
        return of(discard).pipe(delay(300));
      }
      throw new Error('Discard not found');
    }
    return this.http.post<DiscardRecord>(`${this.apiUrl}/discards/${discardId}/approve`, { notes });
  }

  // Witness a discard (for controlled substances)
  witnessDiscard(discardId: string, notes?: string): Observable<DiscardRecord> {
    if (this.USE_MOCK) {
      const discard = this.mockDiscards.find(d => d.id === discardId);
      if (discard) {
        discard.witnessedBy = 'current-user';
        discard.witnessedByName = 'Current User';
        discard.witnessedAt = new Date();
        discard.witnessNotes = notes;
        if (!discard.requiresApproval || discard.approvedBy) {
          discard.status = DiscardStatus.APPROVED;
        }
        discard.updatedAt = new Date();
        return of(discard).pipe(delay(300));
      }
      throw new Error('Discard not found');
    }
    return this.http.post<DiscardRecord>(`${this.apiUrl}/discards/${discardId}/witness`, { notes });
  }

  // Complete a discard
  completeDiscard(discardId: string, disposalVerified = true): Observable<DiscardRecord> {
    if (this.USE_MOCK) {
      const discard = this.mockDiscards.find(d => d.id === discardId);
      if (discard) {
        discard.status = DiscardStatus.COMPLETED;
        discard.disposalVerified = disposalVerified;
        if (disposalVerified) {
          discard.disposalVerifiedAt = new Date();
          discard.disposalVerifiedBy = 'current-user';
        }
        discard.updatedAt = new Date();
        return of(discard).pipe(delay(300));
      }
      throw new Error('Discard not found');
    }
    return this.http.post<DiscardRecord>(`${this.apiUrl}/discards/${discardId}/complete`, { disposal_verified: disposalVerified });
  }

  // Cancel a discard
  cancelDiscard(discardId: string, reason: string): Observable<DiscardRecord> {
    if (this.USE_MOCK) {
      const discard = this.mockDiscards.find(d => d.id === discardId);
      if (discard) {
        discard.status = DiscardStatus.CANCELLED;
        discard.reasonNotes = `${discard.reasonNotes || ''} | Cancelled: ${reason}`;
        discard.updatedAt = new Date();
        return of(discard).pipe(delay(300));
      }
      throw new Error('Discard not found');
    }
    return this.http.post<DiscardRecord>(`${this.apiUrl}/discards/${discardId}/cancel`, { reason });
  }

  // List expiration alerts
  listExpirationAlerts(filter?: ExpirationAlertFilter, page = 1, pageSize = 25): Observable<PaginatedResponse<ExpirationAlert>> {
    if (this.USE_MOCK) {
      let filtered = [...this.mockAlerts];

      if (filter?.alertType) {
        filtered = filtered.filter(a => a.alertType === filter.alertType);
      }
      if (filter?.unresolvedOnly) {
        filtered = filtered.filter(a => !a.isResolved);
      }
      if (filter?.unacknowledgedOnly) {
        filtered = filtered.filter(a => !a.isAcknowledged);
      }
      if (filter?.expiringWithinDays !== undefined) {
        const days = filter.expiringWithinDays;
        filtered = filtered.filter(a => a.daysUntilExpiry >= 0 && a.daysUntilExpiry <= days);
      }

      const start = (page - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize);

      return of({
        items,
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize)
      }).pipe(delay(200));
    }
    return this.http.get<PaginatedResponse<ExpirationAlert>>(`${this.apiUrl}/expiration-alerts`, {
      params: {
        page: page.toString(),
        page_size: pageSize.toString(),
        ...(filter?.alertType && { alert_type: filter.alertType }),
        ...(filter?.unresolvedOnly && { unresolved_only: 'true' }),
        ...(filter?.unacknowledgedOnly && { unacknowledged_only: 'true' }),
        ...(filter?.expiringWithinDays && { expiring_within_days: filter.expiringWithinDays.toString() })
      }
    });
  }

  // Acknowledge an expiration alert
  acknowledgeAlert(alertId: string): Observable<ExpirationAlert> {
    if (this.USE_MOCK) {
      const alert = this.mockAlerts.find(a => a.id === alertId);
      if (alert) {
        alert.isAcknowledged = true;
        alert.acknowledgedAt = new Date();
        alert.acknowledgedBy = 'current-user';
        alert.updatedAt = new Date();
        return of(alert).pipe(delay(200));
      }
      throw new Error('Alert not found');
    }
    return this.http.post<ExpirationAlert>(`${this.apiUrl}/expiration-alerts/${alertId}/acknowledge`, {});
  }

  // Resolve an expiration alert
  resolveAlert(alertId: string, resolutionType: ResolutionType, notes?: string): Observable<ExpirationAlert> {
    if (this.USE_MOCK) {
      const alert = this.mockAlerts.find(a => a.id === alertId);
      if (alert) {
        alert.isResolved = true;
        alert.resolvedAt = new Date();
        alert.resolvedBy = 'current-user';
        alert.resolvedByName = 'Current User';
        alert.resolutionType = resolutionType;
        alert.resolutionNotes = notes;
        alert.updatedAt = new Date();
        return of(alert).pipe(delay(200));
      }
      throw new Error('Alert not found');
    }
    return this.http.post<ExpirationAlert>(`${this.apiUrl}/expiration-alerts/${alertId}/resolve`, {
      resolution_type: resolutionType,
      notes
    });
  }

  // Create a discard from an expiration alert
  discardFromAlert(alertId: string, disposalMethod: DisposalMethod, disposalLocation?: string, notes?: string): Observable<{ discard: DiscardRecord; alert: ExpirationAlert }> {
    if (this.USE_MOCK) {
      const alert = this.mockAlerts.find(a => a.id === alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      const expiredReason = this.mockReasons.find(r => r.code === 'EXPIRED');
      const newDiscard: DiscardRecord = {
        id: `d-${Date.now()}`,
        discardNumber: `DIS-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(this.mockDiscards.length + 1).padStart(5, '0')}`,
        itemId: alert.itemId,
        itemName: alert.itemName,
        itemSku: alert.itemSku,
        stockLevelId: alert.stockLevelId,
        lotBarcodeId: alert.lotBarcodeId,
        lotNumber: alert.lotNumber,
        expirationDate: alert.expirationDate,
        quantity: alert.quantity,
        unitCost: 1.00,
        totalCost: alert.quantity * 1.00,
        reasonId: expiredReason?.id || 'r1',
        reasonCode: 'EXPIRED',
        reasonName: 'Expired',
        reasonNotes: notes,
        status: DiscardStatus.APPROVED,
        requiresApproval: false,
        requiresWitness: false,
        disposalMethod,
        disposalLocation,
        disposalVerified: false,
        sourceType: 'expiration_alert',
        sourceReferenceId: alertId,
        createdBy: 'current-user',
        createdByName: 'Current User',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.mockDiscards.push(newDiscard);

      alert.isResolved = true;
      alert.resolvedAt = new Date();
      alert.resolvedBy = 'current-user';
      alert.resolutionType = ResolutionType.DISCARDED;
      alert.discardRecordId = newDiscard.id;
      alert.updatedAt = new Date();

      return of({ discard: newDiscard, alert }).pipe(delay(300));
    }
    return this.http.post<{ discard: DiscardRecord; alert: ExpirationAlert }>(`${this.apiUrl}/expiration-alerts/${alertId}/discard`, {
      disposal_method: disposalMethod,
      disposal_location: disposalLocation,
      notes
    });
  }

  // Scan for expired items
  scanExpiredItems(expiringWithinDays = 30): Observable<ScanExpiredItemsResult> {
    if (this.USE_MOCK) {
      return of({
        expiredCount: 2,
        expiringSoonCount: 5,
        alertsCreated: 3,
        alertsUpdated: 4
      }).pipe(delay(500));
    }
    return this.http.post<ScanExpiredItemsResult>(`${this.apiUrl}/expiration-alerts/scan`, {
      expiring_within_days: expiringWithinDays
    });
  }

  // Get waste report
  getWasteReport(startDate: Date, endDate: Date, itemIds?: string[], reasonCodes?: string[]): Observable<WasteReport> {
    if (this.USE_MOCK) {
      const report: WasteReport = {
        startDate,
        endDate,
        totalDiscards: 15,
        totalQuantity: 287,
        totalCost: 425.50,
        byReason: [
          { reasonCode: 'EXPIRED', reasonName: 'Expired', count: 8, quantity: 180, cost: 220.00, percentage: 51.7 },
          { reasonCode: 'DAMAGED', reasonName: 'Damaged', count: 4, quantity: 65, cost: 120.50, percentage: 28.3 },
          { reasonCode: 'OPENED_UNUSED', reasonName: 'Opened/Unused', count: 3, quantity: 42, cost: 85.00, percentage: 20.0 }
        ],
        byItem: [
          { itemId: 'item-1', itemName: 'Surgical Gloves - Large', itemSku: 'GLV-LG-001', count: 5, quantity: 150, cost: 150.00 },
          { itemId: 'item-2', itemName: 'IV Catheter 18G', itemSku: 'IVC-18', count: 3, quantity: 45, cost: 112.50 },
          { itemId: 'item-3', itemName: 'Sutures 3-0', itemSku: 'SUT-3-0', count: 2, quantity: 30, cost: 75.00 }
        ],
        byMonth: [
          { month: new Date('2024-11-01'), count: 4, quantity: 80, cost: 95.00 },
          { month: new Date('2024-12-01'), count: 5, quantity: 95, cost: 145.00 },
          { month: new Date('2025-01-01'), count: 6, quantity: 112, cost: 185.50 }
        ]
      };
      return of(report).pipe(delay(300));
    }
    return this.http.get<WasteReport>(`${this.apiUrl}/waste-report`, {
      params: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        ...(itemIds?.length && { item_ids: itemIds.join(',') }),
        ...(reasonCodes?.length && { reason_codes: reasonCodes.join(',') })
      }
    });
  }

  // Get discard summary
  getDiscardSummary(): Observable<DiscardSummary> {
    if (this.USE_MOCK) {
      const pendingDiscards = this.mockDiscards.filter(d => d.status === DiscardStatus.PENDING).length;
      const pendingApprovals = this.mockDiscards.filter(d => d.status === DiscardStatus.PENDING && d.requiresApproval && !d.approvedBy).length;
      const completedThisMonth = this.mockDiscards.filter(d => {
        const thisMonth = new Date();
        thisMonth.setDate(1);
        return d.status === DiscardStatus.COMPLETED && d.createdAt >= thisMonth;
      }).length;
      const totalWasteCostThisMonth = this.mockDiscards
        .filter(d => {
          const thisMonth = new Date();
          thisMonth.setDate(1);
          return d.status === DiscardStatus.COMPLETED && d.createdAt >= thisMonth;
        })
        .reduce((sum, d) => sum + (d.totalCost || 0), 0);

      const expiringAlerts = this.mockAlerts.filter(a => !a.isResolved && a.alertType === ExpirationAlertType.EXPIRING_SOON).length;
      const expiredAlerts = this.mockAlerts.filter(a => !a.isResolved && a.alertType === ExpirationAlertType.EXPIRED).length;

      return of({
        pendingDiscards,
        pendingApprovals,
        completedThisMonth,
        totalWasteCostThisMonth,
        expiringAlerts,
        expiredAlerts
      }).pipe(delay(200));
    }
    return this.http.get<DiscardSummary>(`${this.apiUrl}/discards/summary`);
  }
}
