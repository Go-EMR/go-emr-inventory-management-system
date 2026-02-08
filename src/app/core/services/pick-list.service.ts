import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PickList, PickListStatus, PickListPriority, PickListItem, PickingProgress, PaginatedResponse } from '../../shared/models';

export interface CreatePickListRequest {
  requesterId: string;
  department?: string;
  destination?: string;
  neededBy?: string;
  priority: PickListPriority;
  items: PickListItemInput[];
  notes?: string;
}

export interface PickListItemInput {
  itemId: string;
  quantity: number;
  warehouseId?: string;
  notes?: string;
}

export interface CreatePickListFromKitRequest {
  kitId: string;
  requesterId: string;
  department?: string;
  destination?: string;
  neededBy?: string;
  priority: PickListPriority;
  notes?: string;
}

export interface PickItemRequest {
  quantityPicked: number;
  lotNumber?: string;
  notes?: string;
  substituteItemId?: string;
}

export interface PickListSearchParams {
  status?: PickListStatus;
  assignedPickerId?: string;
  department?: string;
  priority?: PickListPriority;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class PickListService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/inventory/pick-lists`;
  private readonly USE_MOCK = true;

  // Mock data
  private mockPickLists: PickList[] = [
    {
      id: '1',
      pickListNumber: 'PL-2024-001',
      kitId: 'kit-1',
      kitName: 'Minor Surgery Kit',
      requesterId: 'user-1',
      requesterName: 'Dr. Anderson',
      department: 'Surgery',
      destination: 'OR Room 3',
      neededBy: new Date(Date.now() + 2 * 60 * 60 * 1000),
      status: PickListStatus.IN_PROGRESS,
      priority: PickListPriority.HIGH,
      items: [
        { id: '1', pickListId: '1', itemId: 'item-1', itemName: 'Scalpel #10', itemSku: 'SCP-10', quantityRequested: 2, quantityPicked: 2, status: 'picked' as any, createdAt: new Date() } as any,
        { id: '2', pickListId: '1', itemId: 'item-2', itemName: 'Surgical Gloves', itemSku: 'GLV-S-001', quantityRequested: 4, quantityPicked: 0, status: 'pending' as any, createdAt: new Date() } as any,
        { id: '3', pickListId: '1', itemId: 'item-3', itemName: 'Sutures 3-0', itemSku: 'SUT-3-0', quantityRequested: 10, quantityPicked: 0, status: 'pending' as any, createdAt: new Date() } as any
      ],
      assignedPickerId: 'user-2',
      assignedPickerName: 'Tech Williams',
      startedAt: new Date(Date.now() - 15 * 60 * 1000),
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      updatedAt: new Date()
    },
    {
      id: '2',
      pickListNumber: 'PL-2024-002',
      requesterId: 'user-3',
      requesterName: 'Nurse Thompson',
      department: 'Emergency',
      destination: 'ER Bay 5',
      neededBy: new Date(Date.now() + 30 * 60 * 1000),
      status: PickListStatus.PENDING,
      priority: PickListPriority.URGENT,
      items: [
        { id: '4', pickListId: '2', itemId: 'item-4', itemName: 'IV Catheter 18G', itemSku: 'IVC-18', quantityRequested: 5, quantityPicked: 0, status: 'pending' as any } as any,
        { id: '5', pickListId: '2', itemId: 'item-5', itemName: 'Saline 1000ml', itemSku: 'SAL-1L', quantityRequested: 3, quantityPicked: 0, status: 'pending' as any } as any
      ],
      createdAt: new Date(Date.now() - 10 * 60 * 1000),
      updatedAt: new Date()
    }
  ];

  createPickList(request: CreatePickListRequest): Observable<PickList> {
    if (this.USE_MOCK) {
      const newList: PickList = {
        id: `pl-${Date.now()}`,
        pickListNumber: `PL-2024-${String(this.mockPickLists.length + 1).padStart(3, '0')}`,
        requesterId: request.requesterId,
        requesterName: 'Current User',
        department: request.department,
        destination: request.destination,
        neededBy: request.neededBy ? new Date(request.neededBy) : undefined,
        status: PickListStatus.PENDING,
        priority: request.priority,
        items: request.items.map((item, i) => ({
          id: `pli-${Date.now()}-${i}`,
          pickListId: '',
          itemId: item.itemId,
          itemName: `Item ${i + 1}`,
          itemSku: `SKU-${i + 1}`,
          quantityRequested: item.quantity,
          quantityPicked: 0,
          status: 'pending' as any,
          notes: item.notes
        })) as any,
        notes: request.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.mockPickLists.push(newList);
      return of(newList).pipe(delay(300));
    }
    return this.http.post<PickList>(this.apiUrl, request);
  }

  createPickListFromKit(request: CreatePickListFromKitRequest): Observable<PickList> {
    if (this.USE_MOCK) {
      return this.createPickList({
        requesterId: request.requesterId,
        department: request.department,
        destination: request.destination,
        neededBy: request.neededBy,
        priority: request.priority,
        items: [
          { itemId: 'item-1', quantity: 2 },
          { itemId: 'item-2', quantity: 4 }
        ],
        notes: request.notes
      });
    }
    return this.http.post<PickList>(`${this.apiUrl}/from-kit`, request);
  }

  getPickList(id: string): Observable<PickList> {
    if (this.USE_MOCK) {
      const list = this.mockPickLists.find(pl => pl.id === id);
      return of(list!).pipe(delay(200));
    }
    return this.http.get<PickList>(`${this.apiUrl}/${id}`);
  }

  getPickLists(params?: PickListSearchParams): Observable<PaginatedResponse<PickList>> {
    if (this.USE_MOCK) {
      let filtered = [...this.mockPickLists];
      if (params?.status) {
        filtered = filtered.filter(pl => pl.status === params.status);
      }
      if (params?.priority) {
        filtered = filtered.filter(pl => pl.priority === params.priority);
      }
      if (params?.assignedPickerId) {
        filtered = filtered.filter(pl => pl.assignedPickerId === params.assignedPickerId);
      }
      if (params?.department) {
        filtered = filtered.filter(pl => pl.department === params.department);
      }
      return of({
        items: filtered,
        total: filtered.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 25,
        totalPages: 1
      }).pipe(delay(200));
    }
    return this.http.get<PaginatedResponse<PickList>>(this.apiUrl, { params: params as any });
  }

  assignPickList(pickListId: string, pickerId: string): Observable<PickList> {
    if (this.USE_MOCK) {
      const list = this.mockPickLists.find(pl => pl.id === pickListId);
      if (list) {
        list.assignedPickerId = pickerId;
        list.assignedPickerName = 'Assigned Picker';
        list.updatedAt = new Date();
      }
      return of(list!).pipe(delay(300));
    }
    return this.http.post<PickList>(`${this.apiUrl}/${pickListId}/assign`, { picker_id: pickerId });
  }

  startPicking(pickListId: string): Observable<PickList> {
    if (this.USE_MOCK) {
      const list = this.mockPickLists.find(pl => pl.id === pickListId);
      if (list) {
        list.status = PickListStatus.IN_PROGRESS;
        list.startedAt = new Date();
        list.updatedAt = new Date();
      }
      return of(list!).pipe(delay(300));
    }
    return this.http.post<PickList>(`${this.apiUrl}/${pickListId}/start`, {});
  }

  pickItem(pickListId: string, itemId: string, request: PickItemRequest): Observable<PickListItem> {
    if (this.USE_MOCK) {
      const list = this.mockPickLists.find(pl => pl.id === pickListId);
      if (list) {
        const item = list.items.find(i => i.itemId === itemId);
        if (item) {
          item.quantityPicked = request.quantityPicked;
          item.lotNumber = request.lotNumber;
          item.notes = request.notes;
          item.status = request.quantityPicked >= item.quantityRequested ? 'picked' as any : 'partially_picked' as any;
          item.pickedAt = new Date();
        }
        return of(item!).pipe(delay(300));
      }
      return of(null as any).pipe(delay(300));
    }
    return this.http.post<PickListItem>(`${this.apiUrl}/${pickListId}/items/${itemId}/pick`, request);
  }

  completePickList(pickListId: string, notes?: string): Observable<PickList> {
    if (this.USE_MOCK) {
      const list = this.mockPickLists.find(pl => pl.id === pickListId);
      if (list) {
        list.status = PickListStatus.COMPLETED;
        list.completedAt = new Date();
        if (notes) list.notes = notes;
        list.updatedAt = new Date();
      }
      return of(list!).pipe(delay(300));
    }
    return this.http.post<PickList>(`${this.apiUrl}/${pickListId}/complete`, { notes });
  }

  cancelPickList(pickListId: string, reason: string): Observable<PickList> {
    if (this.USE_MOCK) {
      const list = this.mockPickLists.find(pl => pl.id === pickListId);
      if (list) {
        list.status = PickListStatus.CANCELLED;
        list.notes = reason;
        list.updatedAt = new Date();
      }
      return of(list!).pipe(delay(300));
    }
    return this.http.post<PickList>(`${this.apiUrl}/${pickListId}/cancel`, { reason });
  }

  getPickingProgress(pickListId: string): Observable<PickingProgress> {
    if (this.USE_MOCK) {
      const list = this.mockPickLists.find(pl => pl.id === pickListId);
      if (list) {
        const picked = list.items.filter(i => i.status === 'picked' as any).length;
        const pending = list.items.filter(i => i.status === 'pending' as any).length;
        const outOfStock = list.items.filter(i => i.status === 'out_of_stock' as any).length;
        return of({
          pickListId,
          totalItems: list.items.length,
          pickedItems: picked,
          pendingItems: pending,
          outOfStockItems: outOfStock,
          completionPercentage: (picked / list.items.length) * 100
        }).pipe(delay(200));
      }
      return of(null as any).pipe(delay(200));
    }
    return this.http.get<PickingProgress>(`${this.apiUrl}/${pickListId}/progress`);
  }
}
