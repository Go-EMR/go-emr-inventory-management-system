import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BarcodeType, ScanResult, LabelTemplate, LabelPrintJob, PaginatedResponse } from '../../shared/models';

export interface GenerateBarcodeResponse {
  barcodeValue: string;
  barcodeImageUrl: string;
}

export interface GenerateLabelsRequest {
  templateId: string;
  itemIds: string[];
  outputFormat: 'pdf' | 'zpl';
}

export interface ScanReceiveRequest {
  purchaseOrderId: string;
  scans: ScanEntry[];
}

export interface ScanEntry {
  barcodeValue: string;
  quantity: number;
  lotNumber?: string;
  expirationDate?: string;
}

export interface ScanReceiveResponse {
  itemsReceived: number;
  itemsNotFound: number;
  errors: string[];
}

@Injectable({ providedIn: 'root' })
export class BarcodeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/inventory`;
  private readonly USE_MOCK = true;

  // Mock templates
  private mockTemplates: LabelTemplate[] = [
    {
      id: '1',
      name: 'Standard 2x1 Label',
      description: 'Standard 2x1 inch label with barcode and item name',
      widthMm: 50.8,
      heightMm: 25.4,
      sizeName: '2x1 inch',
      barcodeType: BarcodeType.CODE128,
      fields: [
        { fieldName: 'name', x: 2, y: 2, width: 46, height: 8, fontSize: '10', fontWeight: 'bold' },
        { fieldName: 'sku', x: 2, y: 10, width: 46, height: 6, fontSize: '8', fontWeight: 'normal' },
        { fieldName: 'barcode', x: 2, y: 16, width: 46, height: 8, fontSize: '8', fontWeight: 'normal' }
      ],
      isDefault: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'Large Shelf Label',
      description: 'Large label for shelf identification',
      widthMm: 101.6,
      heightMm: 50.8,
      sizeName: '4x2 inch',
      barcodeType: BarcodeType.QR_CODE,
      fields: [
        { fieldName: 'name', x: 4, y: 4, width: 60, height: 12, fontSize: '14', fontWeight: 'bold' },
        { fieldName: 'sku', x: 4, y: 18, width: 60, height: 8, fontSize: '10', fontWeight: 'normal' },
        { fieldName: 'qr', x: 70, y: 4, width: 28, height: 28, fontSize: '0', fontWeight: 'normal' }
      ],
      isDefault: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  generateBarcode(itemId: string, barcodeType: BarcodeType): Observable<GenerateBarcodeResponse> {
    if (this.USE_MOCK) {
      return of({
        barcodeValue: `INV-${itemId.toUpperCase().substring(0, 8)}`,
        barcodeImageUrl: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`
      }).pipe(delay(300));
    }
    return this.http.post<GenerateBarcodeResponse>(`${this.apiUrl}/barcodes/generate`, {
      item_id: itemId,
      barcode_type: barcodeType
    });
  }

  lookupBarcode(barcodeValue: string): Observable<ScanResult> {
    if (this.USE_MOCK) {
      const found = barcodeValue.startsWith('INV-');
      return of({
        barcodeValue,
        barcodeType: BarcodeType.CODE128,
        itemId: found ? 'item-123' : undefined,
        itemName: found ? 'Surgical Gloves - Large' : undefined,
        itemSku: found ? 'GLV-LG-001' : undefined,
        found
      }).pipe(delay(200));
    }
    return this.http.get<ScanResult>(`${this.apiUrl}/barcodes/lookup`, { params: { barcode_value: barcodeValue } });
  }

  getLabelTemplates(): Observable<PaginatedResponse<LabelTemplate>> {
    if (this.USE_MOCK) {
      return of({
        items: this.mockTemplates,
        total: this.mockTemplates.length,
        page: 1,
        pageSize: 25,
        totalPages: 1
      }).pipe(delay(200));
    }
    return this.http.get<PaginatedResponse<LabelTemplate>>(`${this.apiUrl}/label-templates`);
  }

  generateLabels(request: GenerateLabelsRequest): Observable<LabelPrintJob> {
    if (this.USE_MOCK) {
      const job: LabelPrintJob = {
        id: `job-${Date.now()}`,
        templateId: request.templateId,
        itemIds: request.itemIds,
        status: 'pending',
        outputFormat: request.outputFormat,
        labelCount: request.itemIds.length,
        createdAt: new Date()
      };
      // Simulate processing
      setTimeout(() => {
        job.status = 'completed';
        job.outputUrl = `https://storage.example.com/labels/${job.id}.${request.outputFormat}`;
        job.completedAt = new Date();
      }, 2000);
      return of(job).pipe(delay(300));
    }
    return this.http.post<LabelPrintJob>(`${this.apiUrl}/labels/generate`, request);
  }

  getLabelPrintJob(id: string): Observable<LabelPrintJob> {
    if (this.USE_MOCK) {
      return of({
        id,
        templateId: '1',
        itemIds: ['item-1', 'item-2'],
        status: 'completed' as const,
        outputFormat: 'pdf' as const,
        outputUrl: `https://storage.example.com/labels/${id}.pdf`,
        labelCount: 2,
        createdAt: new Date(Date.now() - 60000),
        completedAt: new Date()
      }).pipe(delay(200));
    }
    return this.http.get<LabelPrintJob>(`${this.apiUrl}/label-jobs/${id}`);
  }

  scanReceive(request: ScanReceiveRequest): Observable<ScanReceiveResponse> {
    if (this.USE_MOCK) {
      const received = request.scans.filter(s => s.barcodeValue.startsWith('INV-')).length;
      const notFound = request.scans.length - received;
      return of({
        itemsReceived: received,
        itemsNotFound: notFound,
        errors: notFound > 0 ? [`${notFound} items not found in system`] : []
      }).pipe(delay(500));
    }
    return this.http.post<ScanReceiveResponse>(`${this.apiUrl}/scan-receive`, request);
  }
}
