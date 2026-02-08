import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, map, catchError } from 'rxjs';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderLine,
  AutoPORule,
  AutoPOTriggerType,
  AutoPOQuantityMethod,
  AutoPOExecution,
  AutoPOExecutionStatus,
  AutoPOSummary,
  AutoPOPreview,
  AutoPOPreviewItem,
  AutoPOExecutionIssue,
  AutoPOIssueType,
  ItemSupplierPreference,
  POStats,
  POByStatus,
  POBySupplier,
  PaginatedResponse,
  Vendor
} from '../../shared/models';
import { environment } from '../../../environments/environment';

export interface CreatePORequest {
  supplierId: string;
  lines: Omit<PurchaseOrderLine, 'id'>[];
  notes?: string;
  expectedDelivery?: Date;
}

export interface ReceivePORequest {
  lines: {
    lineId: string;
    quantityReceived: number;
    lotNumber?: string;
  }[];
  notes?: string;
}

export interface CreateAutoPORuleRequest {
  name: string;
  description?: string;
  triggerType: AutoPOTriggerType;
  thresholdPercentage: number;
  itemIds?: string[];
  categoryFilters?: string[];
  tagIds?: string[];
  warehouseId?: string;
  defaultSupplierId?: string;
  quantityMethod: AutoPOQuantityMethod;
  fixedQuantity?: number;
  daysOfStock?: number;
  multiplier?: number;
  minimumOrderQuantity?: number;
  maximumOrderQuantity?: number;
  requiresApproval: boolean;
  approvalThreshold?: number;
  approverIds?: string[];
  consolidateBySupplier: boolean;
  consolidationWindowHours?: number;
  scheduleCron?: string;
  notifyOnCreation: boolean;
  notifyOnApprovalNeeded: boolean;
  notificationEmails?: string[];
}

export interface POFilter {
  status?: PurchaseOrderStatus;
  supplierId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  isAutoPO?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1/inventory`;

  // Signals for reactive state
  private purchaseOrdersSignal = signal<PurchaseOrder[]>([]);
  private autoPORulesSignal = signal<AutoPORule[]>([]);
  private autoPOSummarySignal = signal<AutoPOSummary | null>(null);
  private loadingSignal = signal(false);

  readonly purchaseOrders = this.purchaseOrdersSignal.asReadonly();
  readonly autoPORules = this.autoPORulesSignal.asReadonly();
  readonly autoPOSummary = this.autoPOSummarySignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  // Computed values
  readonly pendingApprovalPOs = computed(() =>
    this.purchaseOrdersSignal().filter(po => po.status === PurchaseOrderStatus.PENDING_APPROVAL)
  );

  readonly activeAutoPORules = computed(() =>
    this.autoPORulesSignal().filter(rule => rule.isEnabled)
  );

  // Mock data for development
  private mockPurchaseOrders: PurchaseOrder[] = [
    {
      id: 'po-1',
      tenantId: 'tenant-1',
      poNumber: 'PO-2026-0001',
      supplierId: 'sup-1',
      supplierName: 'MedSupply Corp',
      status: PurchaseOrderStatus.PENDING_APPROVAL,
      lines: [
        { id: 'line-1', itemId: 'item-1', itemName: 'Surgical Gloves (L)', sku: 'SG-L-100', quantityOrdered: 500, quantityReceived: 0, unitCost: 0.15, lineTotal: 75.00 },
        { id: 'line-2', itemId: 'item-2', itemName: 'N95 Masks', sku: 'N95-50', quantityOrdered: 200, quantityReceived: 0, unitCost: 1.25, lineTotal: 250.00 }
      ],
      totalAmount: 325.00,
      notes: 'Urgent restock needed',
      createdBy: 'user-1',
      createdByName: 'John Smith',
      orderDate: new Date(),
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isAutoPO: true,
      autoPORuleId: 'rule-1',
      autoPORuleName: 'Low Stock Alert - Medical Supplies',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'po-2',
      tenantId: 'tenant-1',
      poNumber: 'PO-2026-0002',
      supplierId: 'sup-2',
      supplierName: 'LabEquip Inc',
      status: PurchaseOrderStatus.APPROVED,
      lines: [
        { id: 'line-3', itemId: 'item-3', itemName: 'Test Tubes (50ml)', sku: 'TT-50-100', quantityOrdered: 1000, quantityReceived: 0, unitCost: 0.50, lineTotal: 500.00 }
      ],
      totalAmount: 500.00,
      createdBy: 'user-1',
      createdByName: 'John Smith',
      approvedBy: 'user-2',
      approvedByName: 'Jane Doe',
      orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      expectedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    },
    {
      id: 'po-3',
      tenantId: 'tenant-1',
      poNumber: 'PO-2026-0003',
      supplierId: 'sup-1',
      supplierName: 'MedSupply Corp',
      status: PurchaseOrderStatus.PARTIALLY_RECEIVED,
      lines: [
        { id: 'line-4', itemId: 'item-4', itemName: 'Syringes (10ml)', sku: 'SYR-10-100', quantityOrdered: 500, quantityReceived: 300, unitCost: 0.25, lineTotal: 125.00 },
        { id: 'line-5', itemId: 'item-5', itemName: 'Bandages (Large)', sku: 'BND-L-50', quantityOrdered: 100, quantityReceived: 100, unitCost: 2.00, lineTotal: 200.00 }
      ],
      totalAmount: 325.00,
      createdBy: 'user-2',
      createdByName: 'Jane Doe',
      approvedBy: 'user-1',
      approvedByName: 'John Smith',
      orderDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      expectedDelivery: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    },
    {
      id: 'po-4',
      tenantId: 'tenant-1',
      poNumber: 'PO-2026-0004',
      supplierId: 'sup-3',
      supplierName: 'PharmaDist LLC',
      status: PurchaseOrderStatus.RECEIVED,
      lines: [
        { id: 'line-6', itemId: 'item-6', itemName: 'Saline Solution (1L)', sku: 'SAL-1L', quantityOrdered: 50, quantityReceived: 50, unitCost: 5.00, lineTotal: 250.00 }
      ],
      totalAmount: 250.00,
      createdBy: 'user-1',
      createdByName: 'John Smith',
      approvedBy: 'user-2',
      approvedByName: 'Jane Doe',
      orderDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      expectedDelivery: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      receivedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  ];

  private mockAutoPORules: AutoPORule[] = [
    {
      id: 'rule-1',
      name: 'Low Stock Alert - Medical Supplies',
      description: 'Automatically generate POs when medical supplies fall below reorder level',
      isEnabled: true,
      triggerType: AutoPOTriggerType.REORDER_LEVEL,
      thresholdPercentage: 100,
      itemIds: [],
      categoryFilters: ['Consumables', 'Medical Supplies'],
      tagIds: [],
      defaultSupplierId: 'sup-1',
      defaultSupplierName: 'MedSupply Corp',
      quantityMethod: AutoPOQuantityMethod.REORDER_QUANTITY,
      multiplier: 1.0,
      minimumOrderQuantity: 10,
      maximumOrderQuantity: 1000,
      requiresApproval: true,
      approvalThreshold: 500,
      approverIds: ['user-1', 'user-2'],
      consolidateBySupplier: true,
      consolidationWindowHours: 4,
      notifyOnCreation: true,
      notifyOnApprovalNeeded: true,
      notificationEmails: ['inventory@hospital.com'],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      createdBy: 'user-1',
      lastTriggeredAt: new Date(),
      totalPOsGenerated: 12
    },
    {
      id: 'rule-2',
      name: 'Weekly Lab Supplies Check',
      description: 'Check lab supplies every Monday and create POs as needed',
      isEnabled: true,
      triggerType: AutoPOTriggerType.SCHEDULED,
      thresholdPercentage: 80,
      itemIds: [],
      categoryFilters: ['Laboratory Supplies', 'Reagents'],
      tagIds: [],
      defaultSupplierId: 'sup-2',
      defaultSupplierName: 'LabEquip Inc',
      quantityMethod: AutoPOQuantityMethod.DAYS_OF_STOCK,
      daysOfStock: 30,
      multiplier: 1.2,
      minimumOrderQuantity: 5,
      maximumOrderQuantity: 500,
      requiresApproval: true,
      approvalThreshold: 1000,
      approverIds: ['user-2'],
      consolidateBySupplier: true,
      consolidationWindowHours: 0,
      scheduleCron: '0 8 * * 1',
      notifyOnCreation: true,
      notifyOnApprovalNeeded: true,
      notificationEmails: ['lab@hospital.com', 'inventory@hospital.com'],
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      createdBy: 'user-2',
      lastTriggeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      totalPOsGenerated: 8
    },
    {
      id: 'rule-3',
      name: 'Critical Equipment Parts',
      description: 'Immediate PO generation for critical equipment spare parts',
      isEnabled: false,
      triggerType: AutoPOTriggerType.STOCK_MOVEMENT,
      thresholdPercentage: 100,
      itemIds: ['item-10', 'item-11', 'item-12'],
      categoryFilters: ['Spare Parts'],
      tagIds: ['tag-critical'],
      quantityMethod: AutoPOQuantityMethod.UP_TO_MAX,
      multiplier: 1.0,
      minimumOrderQuantity: 1,
      maximumOrderQuantity: 50,
      requiresApproval: false,
      approvalThreshold: 0,
      approverIds: [],
      consolidateBySupplier: false,
      consolidationWindowHours: 0,
      notifyOnCreation: true,
      notifyOnApprovalNeeded: false,
      notificationEmails: ['maintenance@hospital.com'],
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      createdBy: 'user-1',
      totalPOsGenerated: 3
    }
  ];

  private mockExecutions: AutoPOExecution[] = [
    {
      id: 'exec-1',
      ruleId: 'rule-1',
      ruleName: 'Low Stock Alert - Medical Supplies',
      executedAt: new Date(),
      status: AutoPOExecutionStatus.COMPLETED,
      itemsEvaluated: 45,
      itemsBelowThreshold: 3,
      posCreated: 1,
      linesCreated: 3,
      totalValue: 325.00,
      purchaseOrderIds: ['po-1'],
      issues: [],
      triggeredBy: 'system'
    },
    {
      id: 'exec-2',
      ruleId: 'rule-2',
      ruleName: 'Weekly Lab Supplies Check',
      executedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: AutoPOExecutionStatus.COMPLETED_WITH_WARNINGS,
      itemsEvaluated: 30,
      itemsBelowThreshold: 5,
      posCreated: 1,
      linesCreated: 4,
      totalValue: 850.00,
      purchaseOrderIds: ['po-5'],
      issues: [
        { itemId: 'item-15', itemName: 'Petri Dishes', issueType: AutoPOIssueType.NO_SUPPLIER, message: 'No preferred supplier configured for this item' }
      ],
      triggeredBy: 'schedule'
    }
  ];

  // ==================== Purchase Order CRUD ====================

  createPurchaseOrder(request: CreatePORequest): Observable<PurchaseOrder> {
    // Mock implementation
    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      tenantId: 'tenant-1',
      poNumber: `PO-2026-${String(this.mockPurchaseOrders.length + 1).padStart(4, '0')}`,
      supplierId: request.supplierId,
      supplierName: 'New Supplier', // Would be looked up
      status: PurchaseOrderStatus.DRAFT,
      lines: request.lines.map((line, idx) => ({
        ...line,
        id: `line-${Date.now()}-${idx}`
      })),
      totalAmount: request.lines.reduce((sum, line) => sum + line.lineTotal, 0),
      notes: request.notes,
      createdBy: 'current-user',
      createdByName: 'Current User',
      orderDate: new Date(),
      expectedDelivery: request.expectedDelivery,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.mockPurchaseOrders.unshift(newPO);
    this.purchaseOrdersSignal.set([...this.mockPurchaseOrders]);

    return of(newPO).pipe(delay(500));
  }

  getPurchaseOrder(id: string): Observable<PurchaseOrder | undefined> {
    const po = this.mockPurchaseOrders.find(p => p.id === id);
    return of(po).pipe(delay(300));
  }

  listPurchaseOrders(filter?: POFilter, page = 1, pageSize = 20): Observable<PaginatedResponse<PurchaseOrder>> {
    let filtered = [...this.mockPurchaseOrders];

    if (filter?.status) {
      filtered = filtered.filter(po => po.status === filter.status);
    }
    if (filter?.supplierId) {
      filtered = filtered.filter(po => po.supplierId === filter.supplierId);
    }
    if (filter?.isAutoPO !== undefined) {
      filtered = filtered.filter(po => !!po.isAutoPO === filter.isAutoPO);
    }
    if (filter?.search) {
      const search = filter.search.toLowerCase();
      filtered = filtered.filter(po =>
        po.poNumber.toLowerCase().includes(search) ||
        po.supplierName.toLowerCase().includes(search)
      );
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    this.purchaseOrdersSignal.set(items);

    return of({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }).pipe(delay(300));
  }

  approvePurchaseOrder(id: string, notes?: string): Observable<PurchaseOrder> {
    const po = this.mockPurchaseOrders.find(p => p.id === id);
    if (po) {
      po.status = PurchaseOrderStatus.APPROVED;
      po.approvedBy = 'current-user';
      po.approvedByName = 'Current User';
      po.updatedAt = new Date();
      this.purchaseOrdersSignal.set([...this.mockPurchaseOrders]);
    }
    return of(po!).pipe(delay(500));
  }

  sendPurchaseOrder(id: string): Observable<PurchaseOrder> {
    const po = this.mockPurchaseOrders.find(p => p.id === id);
    if (po) {
      po.status = PurchaseOrderStatus.SENT;
      po.updatedAt = new Date();
      this.purchaseOrdersSignal.set([...this.mockPurchaseOrders]);
    }
    return of(po!).pipe(delay(500));
  }

  receivePurchaseOrder(id: string, request: ReceivePORequest): Observable<PurchaseOrder> {
    const po = this.mockPurchaseOrders.find(p => p.id === id);
    if (po) {
      let allReceived = true;
      for (const receiveLine of request.lines) {
        const line = po.lines.find(l => l.id === receiveLine.lineId);
        if (line) {
          line.quantityReceived += receiveLine.quantityReceived;
          line.lotNumber = receiveLine.lotNumber;
          if (line.quantityReceived < line.quantityOrdered) {
            allReceived = false;
          }
        }
      }
      po.status = allReceived ? PurchaseOrderStatus.RECEIVED : PurchaseOrderStatus.PARTIALLY_RECEIVED;
      if (allReceived) {
        po.receivedDate = new Date();
      }
      po.updatedAt = new Date();
      this.purchaseOrdersSignal.set([...this.mockPurchaseOrders]);
    }
    return of(po!).pipe(delay(500));
  }

  cancelPurchaseOrder(id: string, reason?: string): Observable<PurchaseOrder> {
    const po = this.mockPurchaseOrders.find(p => p.id === id);
    if (po) {
      po.status = PurchaseOrderStatus.CANCELLED;
      po.notes = reason ? `${po.notes || ''}\nCancelled: ${reason}` : po.notes;
      po.updatedAt = new Date();
      this.purchaseOrdersSignal.set([...this.mockPurchaseOrders]);
    }
    return of(po!).pipe(delay(500));
  }

  // ==================== Auto-PO Rules ====================

  createAutoPORule(request: CreateAutoPORuleRequest): Observable<AutoPORule> {
    const newRule: AutoPORule = {
      id: `rule-${Date.now()}`,
      name: request.name,
      description: request.description,
      isEnabled: true,
      triggerType: request.triggerType,
      thresholdPercentage: request.thresholdPercentage,
      itemIds: request.itemIds || [],
      categoryFilters: request.categoryFilters || [],
      tagIds: request.tagIds || [],
      warehouseId: request.warehouseId,
      defaultSupplierId: request.defaultSupplierId,
      quantityMethod: request.quantityMethod,
      fixedQuantity: request.fixedQuantity,
      daysOfStock: request.daysOfStock,
      multiplier: request.multiplier || 1.0,
      minimumOrderQuantity: request.minimumOrderQuantity || 1,
      maximumOrderQuantity: request.maximumOrderQuantity || 0,
      requiresApproval: request.requiresApproval,
      approvalThreshold: request.approvalThreshold || 0,
      approverIds: request.approverIds || [],
      consolidateBySupplier: request.consolidateBySupplier,
      consolidationWindowHours: request.consolidationWindowHours || 0,
      scheduleCron: request.scheduleCron,
      notifyOnCreation: request.notifyOnCreation,
      notifyOnApprovalNeeded: request.notifyOnApprovalNeeded,
      notificationEmails: request.notificationEmails || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user',
      totalPOsGenerated: 0
    };

    this.mockAutoPORules.unshift(newRule);
    this.autoPORulesSignal.set([...this.mockAutoPORules]);

    return of(newRule).pipe(delay(500));
  }

  getAutoPORule(id: string): Observable<AutoPORule | undefined> {
    const rule = this.mockAutoPORules.find(r => r.id === id);
    return of(rule).pipe(delay(300));
  }

  listAutoPORules(enabledOnly = false): Observable<AutoPORule[]> {
    let rules = [...this.mockAutoPORules];
    if (enabledOnly) {
      rules = rules.filter(r => r.isEnabled);
    }
    this.autoPORulesSignal.set(rules);
    return of(rules).pipe(delay(300));
  }

  updateAutoPORule(id: string, updates: Partial<AutoPORule>): Observable<AutoPORule> {
    const rule = this.mockAutoPORules.find(r => r.id === id);
    if (rule) {
      Object.assign(rule, updates, { updatedAt: new Date() });
      this.autoPORulesSignal.set([...this.mockAutoPORules]);
    }
    return of(rule!).pipe(delay(500));
  }

  deleteAutoPORule(id: string): Observable<void> {
    const index = this.mockAutoPORules.findIndex(r => r.id === id);
    if (index > -1) {
      this.mockAutoPORules.splice(index, 1);
      this.autoPORulesSignal.set([...this.mockAutoPORules]);
    }
    return of(void 0).pipe(delay(300));
  }

  enableAutoPORule(id: string): Observable<AutoPORule> {
    return this.updateAutoPORule(id, { isEnabled: true });
  }

  disableAutoPORule(id: string): Observable<AutoPORule> {
    return this.updateAutoPORule(id, { isEnabled: false });
  }

  // ==================== Auto-PO Execution ====================

  previewAutoPO(ruleId?: string, warehouseId?: string): Observable<AutoPOPreview> {
    const previewItems: AutoPOPreviewItem[] = [
      { itemId: 'item-1', itemName: 'Surgical Gloves (L)', sku: 'SG-L-100', currentQuantity: 50, reorderLevel: 100, suggestedQuantity: 200, unitCost: 0.15, lineTotal: 30.00, supplierId: 'sup-1', supplierName: 'MedSupply Corp', hasWarning: false },
      { itemId: 'item-2', itemName: 'N95 Masks', sku: 'N95-50', currentQuantity: 25, reorderLevel: 50, suggestedQuantity: 100, unitCost: 1.25, lineTotal: 125.00, supplierId: 'sup-1', supplierName: 'MedSupply Corp', hasWarning: false },
      { itemId: 'item-7', itemName: 'IV Tubing Set', sku: 'IV-TUB-25', currentQuantity: 10, reorderLevel: 25, suggestedQuantity: 50, unitCost: 3.50, lineTotal: 175.00, hasWarning: true, warningMessage: 'No preferred supplier configured' }
    ];

    const preview: AutoPOPreview = {
      ruleId,
      items: previewItems,
      totalItems: previewItems.length,
      totalPOs: 2, // Would be grouped by supplier
      totalValue: previewItems.reduce((sum, item) => sum + item.lineTotal, 0),
      warnings: previewItems.filter(i => i.hasWarning).map(i => ({
        itemId: i.itemId,
        itemName: i.itemName,
        issueType: AutoPOIssueType.NO_SUPPLIER,
        message: i.warningMessage || ''
      }))
    };

    return of(preview).pipe(delay(500));
  }

  executeAutoPO(ruleId?: string, dryRun = false): Observable<AutoPOExecution> {
    const execution: AutoPOExecution = {
      id: `exec-${Date.now()}`,
      ruleId: ruleId || 'manual',
      ruleName: ruleId ? this.mockAutoPORules.find(r => r.id === ruleId)?.name || 'Manual Execution' : 'Manual Execution',
      executedAt: new Date(),
      status: dryRun ? AutoPOExecutionStatus.COMPLETED : AutoPOExecutionStatus.COMPLETED,
      itemsEvaluated: 45,
      itemsBelowThreshold: 3,
      posCreated: dryRun ? 0 : 1,
      linesCreated: dryRun ? 0 : 3,
      totalValue: 330.00,
      purchaseOrderIds: dryRun ? [] : ['po-new'],
      issues: [],
      triggeredBy: 'user'
    };

    if (!dryRun) {
      this.mockExecutions.unshift(execution);
    }

    return of(execution).pipe(delay(1000));
  }

  getAutoPOExecution(id: string): Observable<AutoPOExecution | undefined> {
    const execution = this.mockExecutions.find(e => e.id === id);
    return of(execution).pipe(delay(300));
  }

  listAutoPOExecutions(ruleId?: string, limit = 10): Observable<AutoPOExecution[]> {
    let executions = [...this.mockExecutions];
    if (ruleId) {
      executions = executions.filter(e => e.ruleId === ruleId);
    }
    return of(executions.slice(0, limit)).pipe(delay(300));
  }

  getAutoPOSummary(): Observable<AutoPOSummary> {
    const summary: AutoPOSummary = {
      activeRules: this.mockAutoPORules.filter(r => r.isEnabled).length,
      itemsMonitored: 156,
      itemsBelowReorder: 8,
      pendingAutoPOs: this.mockPurchaseOrders.filter(po => po.isAutoPO && po.status === PurchaseOrderStatus.PENDING_APPROVAL).length,
      posCreatedToday: 1,
      posCreatedThisWeek: 3,
      posCreatedThisMonth: 12,
      totalValueThisMonth: 4250.00,
      lastExecutionAt: new Date(),
      recentExecutions: this.mockExecutions.slice(0, 5)
    };

    this.autoPOSummarySignal.set(summary);
    return of(summary).pipe(delay(300));
  }

  // ==================== Item-Supplier Preferences ====================

  getItemSupplierPreferences(itemId: string): Observable<ItemSupplierPreference[]> {
    const mockPreferences: ItemSupplierPreference[] = [
      {
        id: 'pref-1',
        itemId,
        supplierId: 'sup-1',
        supplierName: 'MedSupply Corp',
        priority: 1,
        supplierSku: 'MS-12345',
        unitCost: 0.15,
        minimumOrderQty: 100,
        leadTimeDays: 5,
        isActive: true,
        lastOrderedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        id: 'pref-2',
        itemId,
        supplierId: 'sup-3',
        supplierName: 'PharmaDist LLC',
        priority: 2,
        supplierSku: 'PD-98765',
        unitCost: 0.18,
        minimumOrderQty: 50,
        leadTimeDays: 7,
        isActive: true,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ];

    return of(mockPreferences).pipe(delay(300));
  }

  setItemSupplierPreference(
    itemId: string,
    supplierId: string,
    preference: Partial<ItemSupplierPreference>
  ): Observable<ItemSupplierPreference> {
    const newPref: ItemSupplierPreference = {
      id: `pref-${Date.now()}`,
      itemId,
      supplierId,
      supplierName: preference.supplierName || 'Unknown Supplier',
      priority: preference.priority || 1,
      supplierSku: preference.supplierSku,
      unitCost: preference.unitCost || 0,
      minimumOrderQty: preference.minimumOrderQty || 1,
      leadTimeDays: preference.leadTimeDays || 7,
      isActive: true,
      notes: preference.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return of(newPref).pipe(delay(500));
  }

  deleteItemSupplierPreference(itemId: string, supplierId: string): Observable<void> {
    return of(void 0).pipe(delay(300));
  }

  // ==================== PO Statistics ====================

  getPOStats(): Observable<POStats> {
    const stats: POStats = {
      totalPOs: this.mockPurchaseOrders.length,
      pendingApproval: this.mockPurchaseOrders.filter(po => po.status === PurchaseOrderStatus.PENDING_APPROVAL).length,
      awaitingDelivery: this.mockPurchaseOrders.filter(po =>
        po.status === PurchaseOrderStatus.APPROVED ||
        po.status === PurchaseOrderStatus.SENT ||
        po.status === PurchaseOrderStatus.PARTIALLY_RECEIVED
      ).length,
      receivedThisMonth: this.mockPurchaseOrders.filter(po =>
        po.status === PurchaseOrderStatus.RECEIVED &&
        po.receivedDate &&
        new Date(po.receivedDate).getMonth() === new Date().getMonth()
      ).length,
      totalValuePending: this.mockPurchaseOrders
        .filter(po => po.status !== PurchaseOrderStatus.RECEIVED && po.status !== PurchaseOrderStatus.CANCELLED)
        .reduce((sum, po) => sum + po.totalAmount, 0),
      totalValueThisMonth: 4250.00,
      averageLeadTimeDays: 6.5,
      onTimeDeliveryRate: 92.5
    };

    return of(stats).pipe(delay(300));
  }

  getPOsByStatus(): Observable<POByStatus[]> {
    const byStatus: POByStatus[] = [
      { status: PurchaseOrderStatus.DRAFT, count: 0, value: 0 },
      { status: PurchaseOrderStatus.PENDING_APPROVAL, count: 1, value: 325 },
      { status: PurchaseOrderStatus.APPROVED, count: 1, value: 500 },
      { status: PurchaseOrderStatus.SENT, count: 0, value: 0 },
      { status: PurchaseOrderStatus.PARTIALLY_RECEIVED, count: 1, value: 325 },
      { status: PurchaseOrderStatus.RECEIVED, count: 1, value: 250 }
    ];

    return of(byStatus).pipe(delay(300));
  }

  getPOsBySupplier(): Observable<POBySupplier[]> {
    const bySupplier: POBySupplier[] = [
      { supplierId: 'sup-1', supplierName: 'MedSupply Corp', poCount: 2, totalValue: 650, averageLeadTime: 5 },
      { supplierId: 'sup-2', supplierName: 'LabEquip Inc', poCount: 1, totalValue: 500, averageLeadTime: 7 },
      { supplierId: 'sup-3', supplierName: 'PharmaDist LLC', poCount: 1, totalValue: 250, averageLeadTime: 6 }
    ];

    return of(bySupplier).pipe(delay(300));
  }

  // ==================== Suppliers ====================

  getSuppliers(): Observable<Vendor[]> {
    const suppliers: Vendor[] = [
      { id: 'sup-1', tenantId: 'tenant-1', name: 'MedSupply Corp', contactPerson: 'John Doe', email: 'john@medsupply.com', phone: '555-0101', address: '123 Medical Dr', city: 'Boston', country: 'USA', category: 'Consumables Supplier' as any, rating: 4.5, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'sup-2', tenantId: 'tenant-1', name: 'LabEquip Inc', contactPerson: 'Jane Smith', email: 'jane@labequip.com', phone: '555-0102', address: '456 Lab Ave', city: 'Chicago', country: 'USA', category: 'Equipment Manufacturer' as any, rating: 4.2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'sup-3', tenantId: 'tenant-1', name: 'PharmaDist LLC', contactPerson: 'Bob Wilson', email: 'bob@pharmadist.com', phone: '555-0103', address: '789 Pharma Blvd', city: 'New York', country: 'USA', category: 'Distributor' as any, rating: 4.0, isActive: true, createdAt: new Date(), updatedAt: new Date() }
    ];

    return of(suppliers).pipe(delay(300));
  }
}
