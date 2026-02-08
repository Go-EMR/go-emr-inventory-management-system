import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProcedureKit, ProcedureKitItem, PaginatedResponse } from '../../shared/models';

export interface CreateKitRequest {
  name: string;
  description?: string;
  procedureType?: string;
  department?: string;
  estimatedCost?: number;
  items: KitItemInput[];
}

export interface KitItemInput {
  itemId: string;
  quantity: number;
  isRequired: boolean;
  notes?: string;
}

export interface UpdateKitRequest {
  name?: string;
  description?: string;
  department?: string;
  estimatedCost?: number;
  isActive?: boolean;
}

export interface KitSearchParams {
  department?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class KitService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/inventory/kits`;
  private readonly USE_MOCK = true;

  // Mock data
  private mockKits: ProcedureKit[] = [
    {
      id: 'kit-1',
      name: 'Minor Surgery Kit',
      description: 'Standard kit for minor surgical procedures',
      procedureType: 'minor_surgery',
      department: 'Surgery',
      items: [
        { id: '1', kitId: 'kit-1', itemId: 'item-1', itemName: 'Scalpel #10', itemSku: 'SCP-10', quantity: 2, isRequired: true, currentStock: 50 },
        { id: '2', kitId: 'kit-1', itemId: 'item-2', itemName: 'Surgical Gloves', itemSku: 'GLV-S-001', quantity: 4, isRequired: true, currentStock: 200 },
        { id: '3', kitId: 'kit-1', itemId: 'item-3', itemName: 'Sutures 3-0', itemSku: 'SUT-3-0', quantity: 10, isRequired: true, currentStock: 100 },
        { id: '4', kitId: 'kit-1', itemId: 'item-4', itemName: 'Sterile Drape', itemSku: 'DRP-STR-001', quantity: 2, isRequired: false, currentStock: 30 }
      ],
      estimatedCost: 125.50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'kit-2',
      name: 'IV Start Kit',
      description: 'Kit for starting IV lines',
      procedureType: 'iv_therapy',
      department: 'Emergency',
      items: [
        { id: '5', kitId: 'kit-2', itemId: 'item-5', itemName: 'IV Catheter 18G', itemSku: 'IVC-18', quantity: 2, isRequired: true, currentStock: 150 },
        { id: '6', kitId: 'kit-2', itemId: 'item-6', itemName: 'Alcohol Prep Pads', itemSku: 'ALC-PAD-001', quantity: 4, isRequired: true, currentStock: 500 },
        { id: '7', kitId: 'kit-2', itemId: 'item-7', itemName: 'Tegaderm', itemSku: 'TGD-001', quantity: 2, isRequired: true, currentStock: 200 },
        { id: '8', kitId: 'kit-2', itemId: 'item-8', itemName: 'IV Extension Set', itemSku: 'IVE-001', quantity: 1, isRequired: true, currentStock: 75 }
      ],
      estimatedCost: 18.75,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'kit-3',
      name: 'Wound Care Kit',
      description: 'Basic wound care and dressing kit',
      procedureType: 'wound_care',
      department: 'General',
      items: [
        { id: '9', kitId: 'kit-3', itemId: 'item-9', itemName: 'Gauze 4x4', itemSku: 'GAU-4X4', quantity: 10, isRequired: true, currentStock: 300 },
        { id: '10', kitId: 'kit-3', itemId: 'item-10', itemName: 'Medical Tape', itemSku: 'TPE-MED-001', quantity: 1, isRequired: true, currentStock: 100 },
        { id: '11', kitId: 'kit-3', itemId: 'item-11', itemName: 'Saline Flush', itemSku: 'SAL-FLUSH', quantity: 2, isRequired: true, currentStock: 250 }
      ],
      estimatedCost: 12.30,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  createKit(request: CreateKitRequest): Observable<ProcedureKit> {
    if (this.USE_MOCK) {
      const newKit: ProcedureKit = {
        id: `kit-${Date.now()}`,
        name: request.name,
        description: request.description,
        procedureType: request.procedureType || 'general',
        department: request.department,
        items: request.items.map((item, i) => ({
          id: `ki-${Date.now()}-${i}`,
          kitId: '',
          itemId: item.itemId,
          itemName: `Item ${i + 1}`,
          itemSku: `SKU-${i + 1}`,
          quantity: item.quantity,
          isRequired: item.isRequired,
          notes: item.notes,
          currentStock: 100
        })),
        estimatedCost: request.estimatedCost,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.mockKits.push(newKit);
      return of(newKit).pipe(delay(300));
    }
    return this.http.post<ProcedureKit>(this.apiUrl, request);
  }

  getKit(id: string): Observable<ProcedureKit> {
    if (this.USE_MOCK) {
      const kit = this.mockKits.find(k => k.id === id);
      return of(kit!).pipe(delay(200));
    }
    return this.http.get<ProcedureKit>(`${this.apiUrl}/${id}`);
  }

  getKits(params?: KitSearchParams): Observable<PaginatedResponse<ProcedureKit>> {
    if (this.USE_MOCK) {
      let filtered = [...this.mockKits];
      if (params?.department) {
        filtered = filtered.filter(k => k.department === params.department);
      }
      if (params?.isActive !== undefined) {
        filtered = filtered.filter(k => k.isActive === params.isActive);
      }
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(k =>
          k.name.toLowerCase().includes(search) ||
          k.description?.toLowerCase().includes(search)
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
    return this.http.get<PaginatedResponse<ProcedureKit>>(this.apiUrl, { params: params as any });
  }

  updateKit(id: string, request: UpdateKitRequest): Observable<ProcedureKit> {
    if (this.USE_MOCK) {
      const kit = this.mockKits.find(k => k.id === id);
      if (kit) {
        if (request.name) kit.name = request.name;
        if (request.description !== undefined) kit.description = request.description;
        if (request.department !== undefined) kit.department = request.department;
        if (request.estimatedCost !== undefined) kit.estimatedCost = request.estimatedCost;
        if (request.isActive !== undefined) kit.isActive = request.isActive;
        kit.updatedAt = new Date();
      }
      return of(kit!).pipe(delay(300));
    }
    return this.http.patch<ProcedureKit>(`${this.apiUrl}/${id}`, request);
  }

  deleteKit(id: string): Observable<void> {
    if (this.USE_MOCK) {
      const index = this.mockKits.findIndex(k => k.id === id);
      if (index >= 0) {
        this.mockKits.splice(index, 1);
      }
      return of(void 0).pipe(delay(300));
    }
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addKitItem(kitId: string, item: KitItemInput): Observable<ProcedureKitItem> {
    if (this.USE_MOCK) {
      const kit = this.mockKits.find(k => k.id === kitId);
      if (kit) {
        const newItem: ProcedureKitItem = {
          id: `ki-${Date.now()}`,
          kitId,
          itemId: item.itemId,
          itemName: 'New Item',
          itemSku: 'NEW-SKU',
          quantity: item.quantity,
          isRequired: item.isRequired,
          notes: item.notes,
          currentStock: 100
        };
        kit.items.push(newItem);
        kit.updatedAt = new Date();
        return of(newItem).pipe(delay(300));
      }
      return of(null as any).pipe(delay(300));
    }
    return this.http.post<ProcedureKitItem>(`${this.apiUrl}/${kitId}/items`, item);
  }

  updateKitItem(kitId: string, itemId: string, update: Partial<KitItemInput>): Observable<ProcedureKitItem> {
    if (this.USE_MOCK) {
      const kit = this.mockKits.find(k => k.id === kitId);
      if (kit) {
        const item = kit.items.find(i => i.id === itemId);
        if (item) {
          if (update.quantity !== undefined) item.quantity = update.quantity;
          if (update.isRequired !== undefined) item.isRequired = update.isRequired;
          if (update.notes !== undefined) item.notes = update.notes;
          kit.updatedAt = new Date();
          return of(item).pipe(delay(300));
        }
      }
      return of(null as any).pipe(delay(300));
    }
    return this.http.patch<ProcedureKitItem>(`${this.apiUrl}/${kitId}/items/${itemId}`, update);
  }

  removeKitItem(kitId: string, itemId: string): Observable<void> {
    if (this.USE_MOCK) {
      const kit = this.mockKits.find(k => k.id === kitId);
      if (kit) {
        kit.items = kit.items.filter(i => i.id !== itemId);
        kit.updatedAt = new Date();
      }
      return of(void 0).pipe(delay(300));
    }
    return this.http.delete<void>(`${this.apiUrl}/${kitId}/items/${itemId}`);
  }

  cloneKit(id: string, newName: string): Observable<ProcedureKit> {
    if (this.USE_MOCK) {
      const original = this.mockKits.find(k => k.id === id);
      if (original) {
        const cloned: ProcedureKit = {
          ...original,
          id: `kit-${Date.now()}`,
          name: newName,
          items: original.items.map(item => ({
            ...item,
            id: `ki-${Date.now()}-${Math.random()}`,
            kitId: ''
          })),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.mockKits.push(cloned);
        return of(cloned).pipe(delay(300));
      }
      return of(null as any).pipe(delay(300));
    }
    return this.http.post<ProcedureKit>(`${this.apiUrl}/${id}/clone`, { new_name: newName });
  }

  checkKitAvailability(id: string, warehouseId?: string): Observable<{ available: boolean; shortages: { itemId: string; itemName: string; required: number; available: number }[] }> {
    if (this.USE_MOCK) {
      const kit = this.mockKits.find(k => k.id === id);
      if (kit) {
        const shortages = kit.items
          .filter(item => item.isRequired && (item.currentStock || 0) < item.quantity)
          .map(item => ({
            itemId: item.itemId,
            itemName: item.itemName,
            required: item.quantity,
            available: item.currentStock || 0
          }));
        return of({
          available: shortages.length === 0,
          shortages
        }).pipe(delay(200));
      }
      return of({ available: false, shortages: [] }).pipe(delay(200));
    }
    const params: any = {};
    if (warehouseId) params.warehouse_id = warehouseId;
    return this.http.get<any>(`${this.apiUrl}/${id}/availability`, { params });
  }
}
