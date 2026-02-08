module.exports = {
  lotBarcodes: [
    {
      id: 'lb-001',
      tenantId: 'tenant-1',
      itemId: 'item-101',
      itemName: 'Surgical Gloves (Large)',
      itemSku: 'SGL-LG-100',
      barcodeValue: '01034567890123451721063010ABC123',
      barcodeType: 'CODE128',
      lotNumber: 'LOT-2025-0412A',
      expirationDate: '2026-06-30T00:00:00.000Z',
      serialNumber: 'SN-SGL-00001',
      payloadJson: JSON.stringify({
        gtin: '03456789012345',
        lot: 'LOT-2025-0412A',
        exp: '2026-06-30',
        serial: 'SN-SGL-00001'
      }),
      labelGenerated: true,
      isActive: true,
      createdAt: '2025-04-12T08:30:00.000Z',
      updatedAt: '2025-04-12T08:30:00.000Z'
    },
    {
      id: 'lb-002',
      tenantId: 'tenant-1',
      itemId: 'item-102',
      itemName: 'IV Catheter 20G',
      itemSku: 'IVC-20G-50',
      barcodeValue: '01098765432109871726123110XYZ789',
      barcodeType: 'CODE128',
      lotNumber: 'LOT-2025-0515B',
      expirationDate: '2026-12-31T00:00:00.000Z',
      serialNumber: 'SN-IVC-00042',
      payloadJson: JSON.stringify({
        gtin: '09876543210987',
        lot: 'LOT-2025-0515B',
        exp: '2026-12-31',
        serial: 'SN-IVC-00042'
      }),
      labelGenerated: true,
      isActive: true,
      createdAt: '2025-05-15T10:15:00.000Z',
      updatedAt: '2025-05-15T10:15:00.000Z'
    },
    {
      id: 'lb-003',
      tenantId: 'tenant-1',
      itemId: 'item-103',
      itemName: 'Sterile Saline 500ml',
      itemSku: 'SS-500-24',
      barcodeValue: 'https://id.gs1.org/01/05551234567890/10/LOT-2025-0620C/21/SN-SS-00103',
      barcodeType: 'QR_CODE',
      lotNumber: 'LOT-2025-0620C',
      expirationDate: '2026-03-15T00:00:00.000Z',
      serialNumber: 'SN-SS-00103',
      payloadJson: JSON.stringify({
        gtin: '05551234567890',
        lot: 'LOT-2025-0620C',
        exp: '2026-03-15',
        serial: 'SN-SS-00103',
        productUrl: 'https://id.gs1.org/01/05551234567890'
      }),
      labelGenerated: false,
      isActive: true,
      createdAt: '2025-06-20T14:00:00.000Z',
      updatedAt: '2025-06-20T14:00:00.000Z'
    },
    {
      id: 'lb-004',
      tenantId: 'tenant-4',
      itemId: 'item-401',
      itemName: 'Suture Kit 3-0 Vicryl',
      itemSku: 'SK-3V-12',
      barcodeValue: '01077712345678901725093010MED456',
      barcodeType: 'CODE128',
      lotNumber: 'LOT-2025-0310D',
      expirationDate: '2025-09-30T00:00:00.000Z',
      serialNumber: 'SN-SK-00077',
      payloadJson: JSON.stringify({
        gtin: '07771234567890',
        lot: 'LOT-2025-0310D',
        exp: '2025-09-30',
        serial: 'SN-SK-00077'
      }),
      labelGenerated: true,
      isActive: false,
      createdAt: '2025-03-10T09:45:00.000Z',
      updatedAt: '2025-10-01T00:00:00.000Z'
    },
    {
      id: 'lb-005',
      tenantId: 'tenant-4',
      itemId: 'item-402',
      itemName: 'Hemostatic Gauze',
      itemSku: 'HG-4X4-25',
      barcodeValue: 'https://id.gs1.org/01/08884567890123/10/LOT-2025-0722E/21/SN-HG-00201',
      barcodeType: 'QR_CODE',
      lotNumber: 'LOT-2025-0722E',
      expirationDate: '2027-07-22T00:00:00.000Z',
      serialNumber: 'SN-HG-00201',
      payloadJson: JSON.stringify({
        gtin: '08884567890123',
        lot: 'LOT-2025-0722E',
        exp: '2027-07-22',
        serial: 'SN-HG-00201',
        productUrl: 'https://id.gs1.org/01/08884567890123'
      }),
      labelGenerated: true,
      isActive: true,
      createdAt: '2025-07-22T11:30:00.000Z',
      updatedAt: '2025-07-22T11:30:00.000Z'
    },
    {
      id: 'lb-006',
      tenantId: 'tenant-1',
      itemId: 'item-104',
      itemName: 'Disposable Scalpel #10',
      itemSku: 'DS-10-50',
      barcodeValue: '01066612345678901727063010SURG321',
      barcodeType: 'CODE128',
      lotNumber: 'LOT-2025-0830F',
      expirationDate: '2027-06-30T00:00:00.000Z',
      serialNumber: 'SN-DS-00550',
      payloadJson: JSON.stringify({
        gtin: '06661234567890',
        lot: 'LOT-2025-0830F',
        exp: '2027-06-30',
        serial: 'SN-DS-00550'
      }),
      labelGenerated: false,
      isActive: true,
      createdAt: '2025-08-30T16:20:00.000Z',
      updatedAt: '2025-08-30T16:20:00.000Z'
    }
  ],

  barcodeScans: [
    {
      id: 'scan-001',
      tenantId: 'tenant-1',
      barcodeValue: '01034567890123451721063010ABC123',
      barcodeType: 'CODE128',
      lotBarcodeId: 'lb-001',
      itemId: 'item-101',
      scanPurpose: 'receive',
      scanSuccessful: true,
      scannedBy: 'user-1',
      scannedAt: '2025-04-12T09:00:00.000Z'
    },
    {
      id: 'scan-002',
      tenantId: 'tenant-1',
      barcodeValue: '01034567890123451721063010ABC123',
      barcodeType: 'CODE128',
      lotBarcodeId: 'lb-001',
      itemId: 'item-101',
      scanPurpose: 'checkout',
      scanSuccessful: true,
      scannedBy: 'user-2',
      scannedAt: '2025-04-15T13:30:00.000Z'
    },
    {
      id: 'scan-003',
      tenantId: 'tenant-1',
      barcodeValue: '01098765432109871726123110XYZ789',
      barcodeType: 'CODE128',
      lotBarcodeId: 'lb-002',
      itemId: 'item-102',
      scanPurpose: 'receive',
      scanSuccessful: true,
      scannedBy: 'user-1',
      scannedAt: '2025-05-15T10:45:00.000Z'
    },
    {
      id: 'scan-004',
      tenantId: 'tenant-1',
      barcodeValue: 'https://id.gs1.org/01/05551234567890/10/LOT-2025-0620C/21/SN-SS-00103',
      barcodeType: 'QR_CODE',
      lotBarcodeId: 'lb-003',
      itemId: 'item-103',
      scanPurpose: 'inventory',
      scanSuccessful: true,
      scannedBy: 'user-3',
      scannedAt: '2025-07-01T08:15:00.000Z'
    },
    {
      id: 'scan-005',
      tenantId: 'tenant-4',
      barcodeValue: '01077712345678901725093010MED456',
      barcodeType: 'CODE128',
      lotBarcodeId: 'lb-004',
      itemId: 'item-401',
      scanPurpose: 'verify',
      scanSuccessful: false,
      scannedBy: 'user-10',
      scannedAt: '2025-10-02T14:00:00.000Z'
    },
    {
      id: 'scan-006',
      tenantId: 'tenant-4',
      barcodeValue: 'https://id.gs1.org/01/08884567890123/10/LOT-2025-0722E/21/SN-HG-00201',
      barcodeType: 'QR_CODE',
      lotBarcodeId: 'lb-005',
      itemId: 'item-402',
      scanPurpose: 'receive',
      scanSuccessful: true,
      scannedBy: 'user-11',
      scannedAt: '2025-07-22T12:00:00.000Z'
    },
    {
      id: 'scan-007',
      tenantId: 'tenant-1',
      barcodeValue: '01034567890123451721063010ABC123',
      barcodeType: 'CODE128',
      lotBarcodeId: 'lb-001',
      itemId: 'item-101',
      scanPurpose: 'checkin',
      scanSuccessful: true,
      scannedBy: 'user-2',
      scannedAt: '2025-04-18T09:30:00.000Z'
    },
    {
      id: 'scan-008',
      tenantId: 'tenant-1',
      barcodeValue: '01066612345678901727063010SURG321',
      barcodeType: 'CODE128',
      lotBarcodeId: 'lb-006',
      itemId: 'item-104',
      scanPurpose: 'receive',
      scanSuccessful: true,
      scannedBy: 'user-1',
      scannedAt: '2025-08-30T17:00:00.000Z'
    }
  ]
};
