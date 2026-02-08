import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Shipment,
  ShipmentItem,
  ShipmentStatus,
  ShipmentType,
  ShipmentStatusHistory,
  ShipmentSummary,
  ReturnRequest,
  ReturnRequestStatus,
  ReturnReason,
  PaginatedResponse,
  RecipientInfo
} from '../../shared/models';

export interface CreateShipmentRequest {
  shipmentType: ShipmentType;
  recipient: RecipientInfo;
  department?: string;
  costCenter?: string;
  referenceNumber?: string;
  referenceType?: string;
  warehouseId?: string;
  scheduledShipDate?: string;
  expectedReturnDate?: string;
  returnReason?: string;
  notes?: string;
  specialInstructions?: string;
  signatureRequired?: boolean;
  insuranceValue?: number;
  items: CreateShipmentItemRequest[];
}

export interface CreateShipmentItemRequest {
  itemId: string;
  stockLevelId?: string;
  quantity: number;
  lotNumber?: string;
  serialNumber?: string;
  expirationDate?: string;
  condition?: string;
  checkoutId?: string;
  notes?: string;
}

export interface ShipmentSearchParams {
  status?: ShipmentStatus;
  shipmentType?: ShipmentType;
  recipientName?: string;
  warehouseId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface MarkAsShippedRequest {
  carrier: string;
  trackingNumber: string;
  shippingMethod?: string;
  estimatedDelivery?: string;
}

export interface CreateReturnRequest {
  originalShipmentId?: string;
  checkoutId?: string;
  requestorName: string;
  requestorEmail?: string;
  requestorPhone?: string;
  reason: ReturnReason;
  reasonDetails?: string;
  expectedReturnDate?: string;
  notes?: string;
  items: CreateReturnItemRequest[];
}

export interface CreateReturnItemRequest {
  shipmentItemId?: string;
  itemId: string;
  quantity: number;
  serialNumber?: string;
  lotNumber?: string;
  expectedCondition?: string;
}

export interface ReturnSearchParams {
  status?: ReturnRequestStatus;
  requestorName?: string;
  dateFrom?: string;
  dateTo?: string;
  overdueOnly?: boolean;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class ShipmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/inventory/shipments`;
  private readonly returnsUrl = `${environment.apiUrl}/inventory/returns`;
  private readonly USE_MOCK = true;

  // Mock data
  private mockShipments: Shipment[] = [
    {
      id: 'ship-1',
      shipmentNumber: 'SHP-202601-000001',
      shipmentType: ShipmentType.OUTBOUND,
      status: ShipmentStatus.DELIVERED,
      carrier: 'FedEx',
      trackingNumber: '794644790132',
      shippingMethod: 'Ground',
      recipient: {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@clinic.com',
        phone: '555-0123',
        organization: 'Downtown Medical Clinic',
        addressLine1: '123 Healthcare Ave',
        city: 'Boston',
        state: 'MA',
        postalCode: '02101',
        country: 'USA'
      },
      department: 'Cardiology',
      warehouseId: 'wh-1',
      warehouseName: 'Main Warehouse',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      scheduledShipDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      shippedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      estimatedDelivery: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      actualDelivery: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      createdBy: 'user-1',
      createdByName: 'Admin User',
      shippedBy: 'user-2',
      shippedByName: 'Warehouse Staff',
      signatureRequired: true,
      items: [
        {
          id: 'si-1',
          shipmentId: 'ship-1',
          itemId: 'item-1',
          itemName: 'Portable ECG Monitor',
          itemSku: 'ECG-PORT-001',
          quantity: 1,
          serialNumber: 'ECG-2024-001234',
          conditionOnShip: 'good',
          createdAt: new Date()
        }
      ],
      updatedAt: new Date()
    },
    {
      id: 'ship-2',
      shipmentNumber: 'SHP-202601-000002',
      shipmentType: ShipmentType.OUTBOUND,
      status: ShipmentStatus.IN_TRANSIT,
      carrier: 'UPS',
      trackingNumber: '1Z999AA10123456784',
      shippingMethod: '2-Day',
      recipient: {
        name: 'Nurse Mike Chen',
        email: 'mike.chen@hospital.org',
        phone: '555-0456',
        organization: 'Community Hospital',
        addressLine1: '456 Medical Center Blvd',
        city: 'Chicago',
        state: 'IL',
        postalCode: '60601',
        country: 'USA'
      },
      department: 'Emergency',
      warehouseId: 'wh-1',
      warehouseName: 'Main Warehouse',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      shippedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      estimatedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdBy: 'user-1',
      createdByName: 'Admin User',
      shippedBy: 'user-2',
      shippedByName: 'Warehouse Staff',
      signatureRequired: false,
      items: [
        {
          id: 'si-2',
          shipmentId: 'ship-2',
          itemId: 'item-2',
          itemName: 'Blood Pressure Monitor',
          itemSku: 'BPM-001',
          quantity: 2,
          conditionOnShip: 'good',
          createdAt: new Date()
        },
        {
          id: 'si-3',
          shipmentId: 'ship-2',
          itemId: 'item-3',
          itemName: 'Pulse Oximeter',
          itemSku: 'POX-001',
          quantity: 3,
          conditionOnShip: 'good',
          createdAt: new Date()
        }
      ],
      updatedAt: new Date()
    },
    {
      id: 'ship-3',
      shipmentNumber: 'SHP-202601-000003',
      shipmentType: ShipmentType.OUTBOUND,
      status: ShipmentStatus.PENDING,
      recipient: {
        name: 'Dr. Emily Brown',
        email: 'emily.brown@rehab.org',
        phone: '555-0789',
        organization: 'Rehabilitation Center',
        addressLine1: '789 Recovery Lane',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94102',
        country: 'USA'
      },
      department: 'Physical Therapy',
      warehouseId: 'wh-1',
      warehouseName: 'Main Warehouse',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      scheduledShipDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: 'user-1',
      createdByName: 'Admin User',
      signatureRequired: true,
      notes: 'Handle with care - fragile equipment',
      items: [
        {
          id: 'si-4',
          shipmentId: 'ship-3',
          itemId: 'item-4',
          itemName: 'Therapeutic Ultrasound Device',
          itemSku: 'TUD-001',
          quantity: 1,
          serialNumber: 'TUD-2024-005678',
          conditionOnShip: 'excellent',
          createdAt: new Date()
        }
      ],
      updatedAt: new Date()
    }
  ];

  private mockReturns: ReturnRequest[] = [
    {
      id: 'ret-1',
      returnNumber: 'RTN-202601-000001',
      originalShipmentId: 'ship-old-1',
      status: ReturnRequestStatus.PENDING,
      requestorName: 'Dr. James Wilson',
      requestorEmail: 'james.wilson@clinic.com',
      requestorPhone: '555-1111',
      reason: ReturnReason.END_OF_USE,
      reasonDetails: 'Trial period completed',
      requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      items: [
        {
          id: 'ri-1',
          returnRequestId: 'ret-1',
          itemId: 'item-5',
          itemName: 'Infusion Pump',
          itemSku: 'INF-001',
          quantity: 1,
          serialNumber: 'INF-2024-001122',
          expectedCondition: 'good'
        }
      ],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    }
  ];

  // Shipment CRUD
  createShipment(request: CreateShipmentRequest): Observable<Shipment> {
    if (this.USE_MOCK) {
      const newShipment: Shipment = {
        id: `ship-${Date.now()}`,
        shipmentNumber: `SHP-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(this.mockShipments.length + 1).padStart(6, '0')}`,
        shipmentType: request.shipmentType,
        status: ShipmentStatus.PENDING,
        recipient: request.recipient,
        department: request.department,
        costCenter: request.costCenter,
        referenceNumber: request.referenceNumber,
        referenceType: request.referenceType,
        warehouseId: request.warehouseId,
        scheduledShipDate: request.scheduledShipDate ? new Date(request.scheduledShipDate) : undefined,
        expectedReturnDate: request.expectedReturnDate ? new Date(request.expectedReturnDate) : undefined,
        returnReason: request.returnReason,
        notes: request.notes,
        specialInstructions: request.specialInstructions,
        signatureRequired: request.signatureRequired || false,
        insuranceValue: request.insuranceValue,
        createdBy: 'current-user',
        createdByName: 'Current User',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: request.items.map((item, idx) => ({
          id: `si-${Date.now()}-${idx}`,
          shipmentId: '',
          itemId: item.itemId,
          itemName: 'Item Name',
          itemSku: 'SKU',
          stockLevelId: item.stockLevelId,
          quantity: item.quantity,
          lotNumber: item.lotNumber,
          serialNumber: item.serialNumber,
          expirationDate: item.expirationDate ? new Date(item.expirationDate) : undefined,
          conditionOnShip: item.condition || 'good',
          checkoutId: item.checkoutId,
          notes: item.notes,
          createdAt: new Date()
        }))
      };
      this.mockShipments.push(newShipment);
      return of(newShipment).pipe(delay(300));
    }
    return this.http.post<Shipment>(this.apiUrl, request);
  }

  getShipment(id: string): Observable<Shipment> {
    if (this.USE_MOCK) {
      const shipment = this.mockShipments.find(s => s.id === id);
      return of(shipment!).pipe(delay(200));
    }
    return this.http.get<Shipment>(`${this.apiUrl}/${id}`);
  }

  getShipmentByNumber(shipmentNumber: string): Observable<Shipment> {
    if (this.USE_MOCK) {
      const shipment = this.mockShipments.find(s => s.shipmentNumber === shipmentNumber);
      return of(shipment!).pipe(delay(200));
    }
    return this.http.get<Shipment>(`${this.apiUrl}/by-number/${shipmentNumber}`);
  }

  getShipments(params?: ShipmentSearchParams): Observable<PaginatedResponse<Shipment>> {
    if (this.USE_MOCK) {
      let filtered = [...this.mockShipments];
      if (params?.status) {
        filtered = filtered.filter(s => s.status === params.status);
      }
      if (params?.shipmentType) {
        filtered = filtered.filter(s => s.shipmentType === params.shipmentType);
      }
      if (params?.recipientName) {
        filtered = filtered.filter(s =>
          s.recipient.name.toLowerCase().includes(params.recipientName!.toLowerCase())
        );
      }
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(s =>
          s.shipmentNumber.toLowerCase().includes(search) ||
          s.recipient.name.toLowerCase().includes(search) ||
          s.trackingNumber?.toLowerCase().includes(search)
        );
      }
      return of({
        items: filtered,
        total: filtered.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 25,
        totalPages: 1
      }).pipe(delay(200));
    }
    return this.http.get<PaginatedResponse<Shipment>>(this.apiUrl, { params: params as any });
  }

  // Status updates
  updateShipmentStatus(shipmentId: string, status: ShipmentStatus, location?: string, notes?: string): Observable<Shipment> {
    if (this.USE_MOCK) {
      const shipment = this.mockShipments.find(s => s.id === shipmentId);
      if (shipment) {
        shipment.status = status;
        shipment.updatedAt = new Date();
        if (status === ShipmentStatus.DELIVERED) {
          shipment.actualDelivery = new Date();
        }
      }
      return of(shipment!).pipe(delay(300));
    }
    return this.http.post<Shipment>(`${this.apiUrl}/${shipmentId}/status`, { status, location, notes });
  }

  markAsShipped(shipmentId: string, request: MarkAsShippedRequest): Observable<Shipment> {
    if (this.USE_MOCK) {
      const shipment = this.mockShipments.find(s => s.id === shipmentId);
      if (shipment) {
        shipment.status = ShipmentStatus.SHIPPED;
        shipment.carrier = request.carrier;
        shipment.trackingNumber = request.trackingNumber;
        shipment.shippingMethod = request.shippingMethod;
        shipment.shippedAt = new Date();
        shipment.estimatedDelivery = request.estimatedDelivery ? new Date(request.estimatedDelivery) : undefined;
        shipment.shippedBy = 'current-user';
        shipment.shippedByName = 'Current User';
        shipment.updatedAt = new Date();
      }
      return of(shipment!).pipe(delay(300));
    }
    return this.http.post<Shipment>(`${this.apiUrl}/${shipmentId}/ship`, request);
  }

  markAsDelivered(shipmentId: string, notes?: string): Observable<Shipment> {
    if (this.USE_MOCK) {
      const shipment = this.mockShipments.find(s => s.id === shipmentId);
      if (shipment) {
        shipment.status = ShipmentStatus.DELIVERED;
        shipment.actualDelivery = new Date();
        if (notes) shipment.notes = (shipment.notes || '') + '\n' + notes;
        shipment.updatedAt = new Date();
      }
      return of(shipment!).pipe(delay(300));
    }
    return this.http.post<Shipment>(`${this.apiUrl}/${shipmentId}/deliver`, { notes });
  }

  cancelShipment(shipmentId: string, reason: string): Observable<Shipment> {
    if (this.USE_MOCK) {
      const shipment = this.mockShipments.find(s => s.id === shipmentId);
      if (shipment) {
        shipment.status = ShipmentStatus.CANCELLED;
        shipment.notes = (shipment.notes || '') + '\nCancelled: ' + reason;
        shipment.updatedAt = new Date();
      }
      return of(shipment!).pipe(delay(300));
    }
    return this.http.post<Shipment>(`${this.apiUrl}/${shipmentId}/cancel`, { reason });
  }

  getShipmentHistory(shipmentId: string): Observable<ShipmentStatusHistory[]> {
    if (this.USE_MOCK) {
      const shipment = this.mockShipments.find(s => s.id === shipmentId);
      const history: ShipmentStatusHistory[] = [
        {
          id: 'h-1',
          shipmentId,
          status: ShipmentStatus.PENDING,
          notes: 'Shipment created',
          performedBy: 'user-1',
          performedByName: 'Admin User',
          performedAt: shipment?.createdAt || new Date()
        }
      ];
      if (shipment?.shippedAt) {
        history.push({
          id: 'h-2',
          shipmentId,
          status: ShipmentStatus.SHIPPED,
          notes: `Shipped via ${shipment.carrier}`,
          performedBy: 'user-2',
          performedByName: 'Warehouse Staff',
          performedAt: shipment.shippedAt
        });
      }
      if (shipment?.actualDelivery) {
        history.push({
          id: 'h-3',
          shipmentId,
          status: ShipmentStatus.DELIVERED,
          notes: 'Package delivered',
          performedAt: shipment.actualDelivery
        });
      }
      return of(history).pipe(delay(200));
    }
    return this.http.get<ShipmentStatusHistory[]>(`${this.apiUrl}/${shipmentId}/history`);
  }

  getShipmentSummary(warehouseId?: string): Observable<ShipmentSummary> {
    if (this.USE_MOCK) {
      const pending = this.mockShipments.filter(s => s.status === ShipmentStatus.PENDING).length;
      const inTransit = this.mockShipments.filter(s =>
        [ShipmentStatus.SHIPPED, ShipmentStatus.IN_TRANSIT, ShipmentStatus.OUT_FOR_DELIVERY].includes(s.status)
      ).length;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const deliveredThisMonth = this.mockShipments.filter(s =>
        s.status === ShipmentStatus.DELIVERED && s.actualDelivery && s.actualDelivery >= monthStart
      ).length;
      const overdueReturns = this.mockShipments.filter(s =>
        s.status === ShipmentStatus.DELIVERED &&
        s.expectedReturnDate &&
        now > s.expectedReturnDate
      ).length;

      return of({
        totalShipments: this.mockShipments.length,
        pendingShipments: pending,
        inTransitShipments: inTransit,
        deliveredThisMonth,
        pendingReturns: this.mockReturns.filter(r => r.status === ReturnRequestStatus.PENDING).length,
        overdueReturns
      }).pipe(delay(200));
    }
    const params: any = {};
    if (warehouseId) params.warehouse_id = warehouseId;
    return this.http.get<ShipmentSummary>(`${this.apiUrl}/summary`, { params });
  }

  // Return Requests
  createReturnRequest(request: CreateReturnRequest): Observable<ReturnRequest> {
    if (this.USE_MOCK) {
      const newReturn: ReturnRequest = {
        id: `ret-${Date.now()}`,
        returnNumber: `RTN-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(this.mockReturns.length + 1).padStart(6, '0')}`,
        originalShipmentId: request.originalShipmentId,
        checkoutId: request.checkoutId,
        status: ReturnRequestStatus.PENDING,
        requestorName: request.requestorName,
        requestorEmail: request.requestorEmail,
        requestorPhone: request.requestorPhone,
        reason: request.reason,
        reasonDetails: request.reasonDetails,
        requestedAt: new Date(),
        expectedReturnDate: request.expectedReturnDate ? new Date(request.expectedReturnDate) : undefined,
        notes: request.notes,
        items: request.items.map((item, idx) => ({
          id: `ri-${Date.now()}-${idx}`,
          returnRequestId: '',
          shipmentItemId: item.shipmentItemId,
          itemId: item.itemId,
          itemName: 'Item Name',
          itemSku: 'SKU',
          quantity: item.quantity,
          serialNumber: item.serialNumber,
          lotNumber: item.lotNumber,
          expectedCondition: item.expectedCondition
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.mockReturns.push(newReturn);
      return of(newReturn).pipe(delay(300));
    }
    return this.http.post<ReturnRequest>(this.returnsUrl, request);
  }

  getReturnRequest(id: string): Observable<ReturnRequest> {
    if (this.USE_MOCK) {
      const returnReq = this.mockReturns.find(r => r.id === id);
      return of(returnReq!).pipe(delay(200));
    }
    return this.http.get<ReturnRequest>(`${this.returnsUrl}/${id}`);
  }

  getReturnRequests(params?: ReturnSearchParams): Observable<PaginatedResponse<ReturnRequest>> {
    if (this.USE_MOCK) {
      let filtered = [...this.mockReturns];
      if (params?.status) {
        filtered = filtered.filter(r => r.status === params.status);
      }
      if (params?.requestorName) {
        filtered = filtered.filter(r =>
          r.requestorName.toLowerCase().includes(params.requestorName!.toLowerCase())
        );
      }
      if (params?.overdueOnly) {
        const now = new Date();
        filtered = filtered.filter(r =>
          r.expectedReturnDate && now > r.expectedReturnDate &&
          ![ReturnRequestStatus.RECEIVED, ReturnRequestStatus.COMPLETED, ReturnRequestStatus.CANCELLED].includes(r.status)
        );
      }
      return of({
        items: filtered,
        total: filtered.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 25,
        totalPages: 1
      }).pipe(delay(200));
    }
    return this.http.get<PaginatedResponse<ReturnRequest>>(this.returnsUrl, { params: params as any });
  }

  approveReturnRequest(returnId: string, notes?: string): Observable<ReturnRequest> {
    if (this.USE_MOCK) {
      const returnReq = this.mockReturns.find(r => r.id === returnId);
      if (returnReq) {
        returnReq.status = ReturnRequestStatus.APPROVED;
        returnReq.approvedAt = new Date();
        returnReq.approvedBy = 'current-user';
        if (notes) returnReq.notes = (returnReq.notes || '') + '\n' + notes;
        returnReq.updatedAt = new Date();
      }
      return of(returnReq!).pipe(delay(300));
    }
    return this.http.post<ReturnRequest>(`${this.returnsUrl}/${returnId}/approve`, { notes });
  }

  receiveReturn(returnId: string, inspectionNotes: string, inspectionPassed: boolean, warehouseId?: string): Observable<ReturnRequest> {
    if (this.USE_MOCK) {
      const returnReq = this.mockReturns.find(r => r.id === returnId);
      if (returnReq) {
        returnReq.status = ReturnRequestStatus.RECEIVED;
        returnReq.actualReturnDate = new Date();
        returnReq.receivedBy = 'current-user';
        returnReq.inspectionNotes = inspectionNotes;
        returnReq.inspectionPassed = inspectionPassed;
        returnReq.updatedAt = new Date();
      }
      return of(returnReq!).pipe(delay(300));
    }
    return this.http.post<ReturnRequest>(`${this.returnsUrl}/${returnId}/receive`, {
      inspection_notes: inspectionNotes,
      inspection_passed: inspectionPassed,
      warehouse_id: warehouseId
    });
  }

  getOverdueReturns(): Observable<Shipment[]> {
    if (this.USE_MOCK) {
      const now = new Date();
      const overdue = this.mockShipments.filter(s =>
        s.status === ShipmentStatus.DELIVERED &&
        s.expectedReturnDate &&
        now > s.expectedReturnDate
      );
      return of(overdue).pipe(delay(200));
    }
    return this.http.get<Shipment[]>(`${this.returnsUrl}/overdue`);
  }
}
