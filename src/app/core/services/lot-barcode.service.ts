import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LotBarcode,
  LotBarcodePayload,
  LotScanResult,
  BarcodeScanHistory,
  LotLabelTemplate,
  BarcodeType,
  ScanPurpose,
  PaginatedResponse
} from '../../shared/models';

export interface GenerateLotBarcodeRequest {
  itemId: string;
  lotNumber: string;
  expirationDate?: string; // YYYY-MM-DD
  serialNumber?: string;
  gtin?: string;
  ndc?: string;
  manufactureDate?: string;
  batchNumber?: string;
}

export interface GenerateLotBarcodesForItemRequest {
  itemId: string;
  lots: {
    lotNumber: string;
    expirationDate?: string;
    serialNumber?: string;
    quantity?: number;
  }[];
}

export interface GenerateLotLabelsRequest {
  templateId: string;
  lotBarcodeIds: string[];
  outputFormat: 'pdf' | 'zpl';
}

export interface LotLabelPrintJob {
  id: string;
  templateId: string;
  lotBarcodeIds: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  outputFormat: 'pdf' | 'zpl';
  outputUrl?: string;
  labelCount: number;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface RecordScanRequest {
  barcodeValue: string;
  barcodeType: BarcodeType;
  scanPurpose: ScanPurpose;
  scanLocation?: string;
  deviceId?: string;
}

export interface LotBarcodeFilter {
  itemId?: string;
  lotNumber?: string;
  isActive?: boolean;
  hasExpiration?: boolean;
  expiringWithinDays?: number;
}

@Injectable({ providedIn: 'root' })
export class LotBarcodeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/inventory`;
  private readonly USE_MOCK = true;

  // Mock data
  private mockLotBarcodes: LotBarcode[] = [
    {
      id: 'lb-001',
      itemId: 'item-1',
      itemName: 'Surgical Gloves - Large',
      itemSku: 'GLV-LG-001',
      stockLevelId: 'sl-001',
      barcodeValue: 'LOT-GLVLG001-2024A-202506-100001',
      barcodeType: BarcodeType.QR_CODE,
      lotNumber: '2024A',
      expirationDate: new Date('2025-06-30'),
      serialNumber: undefined,
      manufactureDate: new Date('2024-01-15'),
      batchNumber: 'B2024-001',
      gtin: '00123456789012',
      ndc: undefined,
      payloadJson: JSON.stringify({
        v: '1.0',
        item_id: 'item-1',
        sku: 'GLV-LG-001',
        lot: '2024A',
        exp: '2025-06-30',
        bc_id: 'lb-001'
      }),
      labelGenerated: true,
      labelGeneratedAt: new Date('2024-01-20'),
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20')
    },
    {
      id: 'lb-002',
      itemId: 'item-2',
      itemName: 'Scalpel #10',
      itemSku: 'SCP-10',
      stockLevelId: 'sl-002',
      barcodeValue: 'LOT-SCP10-LOT2024B-202512-100002',
      barcodeType: BarcodeType.QR_CODE,
      lotNumber: 'LOT2024B',
      expirationDate: new Date('2025-12-31'),
      serialNumber: 'SN-12345',
      manufactureDate: new Date('2024-02-01'),
      batchNumber: 'B2024-002',
      gtin: '00123456789013',
      ndc: undefined,
      payloadJson: JSON.stringify({
        v: '1.0',
        item_id: 'item-2',
        sku: 'SCP-10',
        lot: 'LOT2024B',
        exp: '2025-12-31',
        sn: 'SN-12345',
        bc_id: 'lb-002'
      }),
      labelGenerated: false,
      isActive: true,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01')
    },
    {
      id: 'lb-003',
      itemId: 'item-3',
      itemName: 'Sutures 3-0',
      itemSku: 'SUT-3-0',
      stockLevelId: 'sl-003',
      barcodeValue: 'LOT-SUT30-LOT2024C-202503-100003',
      barcodeType: BarcodeType.QR_CODE,
      lotNumber: 'LOT2024C',
      expirationDate: new Date('2025-03-15'),
      serialNumber: undefined,
      manufactureDate: new Date('2024-03-01'),
      batchNumber: 'B2024-003',
      gtin: '00123456789014',
      ndc: '12345-6789-01',
      payloadJson: JSON.stringify({
        v: '1.0',
        item_id: 'item-3',
        sku: 'SUT-3-0',
        lot: 'LOT2024C',
        exp: '2025-03-15',
        ndc: '12345-6789-01',
        bc_id: 'lb-003'
      }),
      labelGenerated: true,
      labelGeneratedAt: new Date('2024-03-05'),
      isActive: true,
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-05')
    }
  ];

  private mockLotLabelTemplates: LotLabelTemplate[] = [
    {
      id: 'llt-001',
      name: 'Standard Lot Label (2x1.5)',
      description: 'Standard lot label with QR code containing item, lot, and expiration data',
      widthMm: 50.8,
      heightMm: 38.1,
      sizeName: '2x1.5 inch',
      barcodeType: BarcodeType.QR_CODE,
      includeItemName: true,
      includeSku: true,
      includeLotNumber: true,
      includeExpirationDate: true,
      includeSerialNumber: false,
      includeManufactureDate: false,
      includeNdc: false,
      fields: [
        { fieldName: 'qr_code', x: 2, y: 2, width: 20, height: 20, fontSize: '', fontWeight: '' },
        { fieldName: 'item_name', x: 24, y: 2, width: 24, height: 6, fontSize: '8', fontWeight: 'bold' },
        { fieldName: 'sku', x: 24, y: 8, width: 24, height: 5, fontSize: '7', fontWeight: 'normal' },
        { fieldName: 'lot_number', x: 24, y: 14, width: 24, height: 5, fontSize: '7', fontWeight: 'normal' },
        { fieldName: 'expiration', x: 24, y: 20, width: 24, height: 5, fontSize: '8', fontWeight: 'bold' }
      ],
      isDefault: true,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: 'llt-002',
      name: 'Medication Lot Label (2x2)',
      description: 'Lot label with NDC for pharmaceutical items',
      widthMm: 50.8,
      heightMm: 50.8,
      sizeName: '2x2 inch',
      barcodeType: BarcodeType.QR_CODE,
      includeItemName: true,
      includeSku: true,
      includeLotNumber: true,
      includeExpirationDate: true,
      includeSerialNumber: false,
      includeManufactureDate: false,
      includeNdc: true,
      fields: [
        { fieldName: 'qr_code', x: 2, y: 2, width: 25, height: 25, fontSize: '', fontWeight: '' },
        { fieldName: 'item_name', x: 30, y: 2, width: 18, height: 8, fontSize: '8', fontWeight: 'bold' },
        { fieldName: 'ndc', x: 30, y: 12, width: 18, height: 5, fontSize: '7', fontWeight: 'normal' },
        { fieldName: 'lot_number', x: 2, y: 30, width: 24, height: 5, fontSize: '7', fontWeight: 'normal' },
        { fieldName: 'expiration', x: 26, y: 30, width: 22, height: 5, fontSize: '8', fontWeight: 'bold' }
      ],
      isDefault: false,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];

  // Generate a lot barcode for a specific lot
  generateLotBarcode(request: GenerateLotBarcodeRequest): Observable<LotBarcode> {
    if (this.USE_MOCK) {
      const newBarcode: LotBarcode = {
        id: `lb-${Date.now()}`,
        itemId: request.itemId,
        itemName: 'Mock Item Name',
        itemSku: 'MOCK-SKU',
        barcodeValue: `LOT-MOCKSKU-${request.lotNumber}-${request.expirationDate?.replace(/-/g, '').substring(0, 6) || 'NOEXP'}-${Math.floor(Math.random() * 1000000)}`,
        barcodeType: BarcodeType.QR_CODE,
        lotNumber: request.lotNumber,
        expirationDate: request.expirationDate ? new Date(request.expirationDate) : undefined,
        serialNumber: request.serialNumber,
        manufactureDate: request.manufactureDate ? new Date(request.manufactureDate) : undefined,
        batchNumber: request.batchNumber,
        gtin: request.gtin,
        ndc: request.ndc,
        payloadJson: JSON.stringify({
          v: '1.0',
          item_id: request.itemId,
          sku: 'MOCK-SKU',
          lot: request.lotNumber,
          exp: request.expirationDate,
          sn: request.serialNumber,
          gtin: request.gtin,
          ndc: request.ndc,
          bc_id: `lb-${Date.now()}`
        }),
        labelGenerated: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.mockLotBarcodes.push(newBarcode);
      return of(newBarcode).pipe(delay(300));
    }
    return this.http.post<LotBarcode>(`${this.apiUrl}/lot-barcodes`, request);
  }

  // Generate multiple lot barcodes for an item (batch creation)
  generateLotBarcodesForItem(request: GenerateLotBarcodesForItemRequest): Observable<LotBarcode[]> {
    if (this.USE_MOCK) {
      const newBarcodes: LotBarcode[] = request.lots.map((lot, index) => ({
        id: `lb-${Date.now()}-${index}`,
        itemId: request.itemId,
        itemName: 'Mock Item Name',
        itemSku: 'MOCK-SKU',
        barcodeValue: `LOT-MOCKSKU-${lot.lotNumber}-${lot.expirationDate?.replace(/-/g, '').substring(0, 6) || 'NOEXP'}-${Math.floor(Math.random() * 1000000)}`,
        barcodeType: BarcodeType.QR_CODE,
        lotNumber: lot.lotNumber,
        expirationDate: lot.expirationDate ? new Date(lot.expirationDate) : undefined,
        serialNumber: lot.serialNumber,
        payloadJson: JSON.stringify({
          v: '1.0',
          item_id: request.itemId,
          sku: 'MOCK-SKU',
          lot: lot.lotNumber,
          exp: lot.expirationDate,
          sn: lot.serialNumber,
          bc_id: `lb-${Date.now()}-${index}`
        }),
        labelGenerated: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      this.mockLotBarcodes.push(...newBarcodes);
      return of(newBarcodes).pipe(delay(500));
    }
    return this.http.post<LotBarcode[]>(`${this.apiUrl}/lot-barcodes/batch`, request);
  }

  // Get a lot barcode by ID
  getLotBarcode(id: string): Observable<LotBarcode> {
    if (this.USE_MOCK) {
      const barcode = this.mockLotBarcodes.find(b => b.id === id);
      if (barcode) {
        return of(barcode).pipe(delay(200));
      }
      throw new Error('Lot barcode not found');
    }
    return this.http.get<LotBarcode>(`${this.apiUrl}/lot-barcodes/${id}`);
  }

  // Lookup a lot barcode by value (scanned QR code)
  lookupLotBarcode(barcodeValue: string): Observable<LotScanResult> {
    if (this.USE_MOCK) {
      // First check lot barcodes
      const lotBarcode = this.mockLotBarcodes.find(b => b.barcodeValue === barcodeValue);
      if (lotBarcode) {
        const now = new Date();
        const expirationDate = lotBarcode.expirationDate;
        const isExpired = expirationDate ? expirationDate < now : false;
        const daysUntilExpiry = expirationDate
          ? Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : -1;

        return of({
          barcodeValue,
          barcodeType: lotBarcode.barcodeType,
          found: true,
          isLotBarcode: true,
          isItemBarcode: false,
          itemId: lotBarcode.itemId,
          itemName: lotBarcode.itemName,
          itemSku: lotBarcode.itemSku,
          lotBarcodeId: lotBarcode.id,
          lotNumber: lotBarcode.lotNumber,
          expirationDate: lotBarcode.expirationDate,
          serialNumber: lotBarcode.serialNumber,
          isExpired,
          daysUntilExpiry
        }).pipe(delay(200));
      }

      // Check if it's an item barcode (fallback)
      if (barcodeValue.startsWith('INV-')) {
        return of({
          barcodeValue,
          barcodeType: BarcodeType.CODE128,
          found: true,
          isLotBarcode: false,
          isItemBarcode: true,
          itemId: 'item-123',
          itemName: 'Surgical Gloves - Large',
          itemSku: 'GLV-LG-001',
          isExpired: false,
          daysUntilExpiry: -1
        }).pipe(delay(200));
      }

      // Not found
      return of({
        barcodeValue,
        barcodeType: BarcodeType.QR_CODE,
        found: false,
        isLotBarcode: false,
        isItemBarcode: false,
        isExpired: false,
        daysUntilExpiry: -1
      }).pipe(delay(200));
    }
    return this.http.get<LotScanResult>(`${this.apiUrl}/lot-barcodes/lookup`, {
      params: { barcode_value: barcodeValue }
    });
  }

  // List lot barcodes for an item
  getLotBarcodesByItem(itemId: string, includeInactive = false): Observable<LotBarcode[]> {
    if (this.USE_MOCK) {
      const barcodes = this.mockLotBarcodes.filter(b =>
        b.itemId === itemId && (includeInactive || b.isActive)
      );
      return of(barcodes).pipe(delay(200));
    }
    return this.http.get<LotBarcode[]>(`${this.apiUrl}/items/${itemId}/lot-barcodes`, {
      params: { include_inactive: includeInactive.toString() }
    });
  }

  // List all lot barcodes with filtering
  getLotBarcodes(filter?: LotBarcodeFilter, page = 1, pageSize = 25): Observable<PaginatedResponse<LotBarcode>> {
    if (this.USE_MOCK) {
      let filtered = [...this.mockLotBarcodes];

      if (filter?.itemId) {
        filtered = filtered.filter(b => b.itemId === filter.itemId);
      }
      if (filter?.lotNumber) {
        filtered = filtered.filter(b =>
          b.lotNumber.toLowerCase().includes(filter.lotNumber!.toLowerCase())
        );
      }
      if (filter?.isActive !== undefined) {
        filtered = filtered.filter(b => b.isActive === filter.isActive);
      }
      if (filter?.hasExpiration !== undefined) {
        filtered = filtered.filter(b => (!!b.expirationDate) === filter.hasExpiration);
      }
      if (filter?.expiringWithinDays) {
        const now = new Date();
        const threshold = new Date(now.getTime() + filter.expiringWithinDays * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(b =>
          b.expirationDate && b.expirationDate <= threshold && b.expirationDate >= now
        );
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
    return this.http.get<PaginatedResponse<LotBarcode>>(`${this.apiUrl}/lot-barcodes`, {
      params: {
        page: page.toString(),
        page_size: pageSize.toString(),
        ...(filter?.itemId && { item_id: filter.itemId }),
        ...(filter?.lotNumber && { lot_number: filter.lotNumber }),
        ...(filter?.isActive !== undefined && { is_active: filter.isActive.toString() }),
        ...(filter?.expiringWithinDays && { expiring_within_days: filter.expiringWithinDays.toString() })
      }
    });
  }

  // Deactivate a lot barcode
  deactivateLotBarcode(id: string): Observable<void> {
    if (this.USE_MOCK) {
      const barcode = this.mockLotBarcodes.find(b => b.id === id);
      if (barcode) {
        barcode.isActive = false;
        barcode.updatedAt = new Date();
      }
      return of(undefined).pipe(delay(200));
    }
    return this.http.delete<void>(`${this.apiUrl}/lot-barcodes/${id}`);
  }

  // Get lot label templates
  getLotLabelTemplates(): Observable<PaginatedResponse<LotLabelTemplate>> {
    if (this.USE_MOCK) {
      return of({
        items: this.mockLotLabelTemplates,
        total: this.mockLotLabelTemplates.length,
        page: 1,
        pageSize: 25,
        totalPages: 1
      }).pipe(delay(200));
    }
    return this.http.get<PaginatedResponse<LotLabelTemplate>>(`${this.apiUrl}/lot-label-templates`);
  }

  // Generate lot labels
  generateLotLabels(request: GenerateLotLabelsRequest): Observable<LotLabelPrintJob> {
    if (this.USE_MOCK) {
      const job: LotLabelPrintJob = {
        id: `llj-${Date.now()}`,
        templateId: request.templateId,
        lotBarcodeIds: request.lotBarcodeIds,
        status: 'pending',
        outputFormat: request.outputFormat,
        labelCount: request.lotBarcodeIds.length,
        createdAt: new Date()
      };

      // Simulate processing
      setTimeout(() => {
        job.status = 'completed';
        job.outputUrl = `https://storage.example.com/lot-labels/${job.id}.${request.outputFormat}`;
        job.completedAt = new Date();
      }, 2000);

      return of(job).pipe(delay(300));
    }
    return this.http.post<LotLabelPrintJob>(`${this.apiUrl}/lot-labels/generate`, request);
  }

  // Get lot label print job status
  getLotLabelPrintJob(id: string): Observable<LotLabelPrintJob> {
    if (this.USE_MOCK) {
      return of({
        id,
        templateId: 'llt-001',
        lotBarcodeIds: ['lb-001', 'lb-002'],
        status: 'completed' as const,
        outputFormat: 'pdf' as const,
        outputUrl: `https://storage.example.com/lot-labels/${id}.pdf`,
        labelCount: 2,
        createdAt: new Date(Date.now() - 60000),
        completedAt: new Date()
      }).pipe(delay(200));
    }
    return this.http.get<LotLabelPrintJob>(`${this.apiUrl}/lot-label-jobs/${id}`);
  }

  // Record a barcode scan for auditing
  recordScan(request: RecordScanRequest): Observable<BarcodeScanHistory> {
    if (this.USE_MOCK) {
      const lotBarcode = this.mockLotBarcodes.find(b => b.barcodeValue === request.barcodeValue);
      const record: BarcodeScanHistory = {
        id: `scan-${Date.now()}`,
        barcodeValue: request.barcodeValue,
        barcodeType: request.barcodeType,
        lotBarcodeId: lotBarcode?.id,
        itemId: lotBarcode?.itemId,
        itemBarcodeMatch: !lotBarcode && request.barcodeValue.startsWith('INV-'),
        lotBarcodeMatch: !!lotBarcode,
        scanPurpose: request.scanPurpose,
        scanLocation: request.scanLocation,
        deviceId: request.deviceId,
        scanSuccessful: true,
        scannedAt: new Date()
      };
      return of(record).pipe(delay(200));
    }
    return this.http.post<BarcodeScanHistory>(`${this.apiUrl}/barcode-scans`, request);
  }

  // Get scan history
  getScanHistory(
    filter?: { itemId?: string; lotBarcodeId?: string; purpose?: ScanPurpose },
    page = 1,
    pageSize = 25
  ): Observable<PaginatedResponse<BarcodeScanHistory>> {
    if (this.USE_MOCK) {
      // Return empty mock for now
      return of({
        items: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0
      }).pipe(delay(200));
    }
    return this.http.get<PaginatedResponse<BarcodeScanHistory>>(`${this.apiUrl}/barcode-scans`, {
      params: {
        page: page.toString(),
        page_size: pageSize.toString(),
        ...(filter?.itemId && { item_id: filter.itemId }),
        ...(filter?.lotBarcodeId && { lot_barcode_id: filter.lotBarcodeId }),
        ...(filter?.purpose && { purpose: filter.purpose })
      }
    });
  }

  // Parse QR code payload
  parseQRPayload(payloadJson: string): LotBarcodePayload | null {
    try {
      const data = JSON.parse(payloadJson);
      return {
        version: data.v || data.version,
        itemId: data.item_id || data.itemId,
        sku: data.sku,
        lotNumber: data.lot || data.lotNumber,
        expirationDate: data.exp || data.expirationDate,
        serialNumber: data.sn || data.serialNumber,
        gtin: data.gtin,
        ndc: data.ndc,
        barcodeId: data.bc_id || data.barcodeId
      };
    } catch {
      return null;
    }
  }

  // Get expiring lot barcodes
  getExpiringLotBarcodes(daysUntilExpiry: number): Observable<LotBarcode[]> {
    if (this.USE_MOCK) {
      const now = new Date();
      const threshold = new Date(now.getTime() + daysUntilExpiry * 24 * 60 * 60 * 1000);
      const expiring = this.mockLotBarcodes.filter(b =>
        b.isActive &&
        b.expirationDate &&
        b.expirationDate <= threshold &&
        b.expirationDate >= now
      );
      return of(expiring).pipe(delay(200));
    }
    return this.http.get<LotBarcode[]>(`${this.apiUrl}/lot-barcodes/expiring`, {
      params: { days: daysUntilExpiry.toString() }
    });
  }
}
