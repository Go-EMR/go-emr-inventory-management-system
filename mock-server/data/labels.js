module.exports = {
  labelTemplates: [
    {
      id: 'lt-001',
      tenantId: 'tenant-1',
      name: 'Standard Asset Label',
      widthMm: 50.8,
      heightMm: 25.4,
      sizeName: '2" x 1"',
      barcodeType: 'CODE128',
      fields: [
        { name: 'itemName', label: 'Item Name', x: 2, y: 2, fontSize: 10, bold: true },
        { name: 'sku', label: 'SKU', x: 2, y: 12, fontSize: 8, bold: false },
        { name: 'barcode', label: 'Barcode', x: 2, y: 18, width: 46, height: 6 }
      ],
      isDefault: true,
      isActive: true,
      createdAt: '2025-01-15T08:00:00.000Z'
    },
    {
      id: 'lt-002',
      tenantId: 'tenant-1',
      name: 'Equipment Tag Label',
      widthMm: 76.2,
      heightMm: 50.8,
      sizeName: '3" x 2"',
      barcodeType: 'QR_CODE',
      fields: [
        { name: 'itemName', label: 'Equipment Name', x: 2, y: 2, fontSize: 12, bold: true },
        { name: 'assetTag', label: 'Asset Tag', x: 2, y: 14, fontSize: 9, bold: false },
        { name: 'department', label: 'Department', x: 2, y: 22, fontSize: 9, bold: false },
        { name: 'qrCode', label: 'QR Code', x: 52, y: 2, width: 22, height: 22 },
        { name: 'sku', label: 'SKU', x: 2, y: 30, fontSize: 8, bold: false }
      ],
      isDefault: false,
      isActive: true,
      createdAt: '2025-02-10T10:30:00.000Z'
    },
    {
      id: 'lt-003',
      tenantId: 'tenant-4',
      name: 'Small Inventory Label',
      widthMm: 38.1,
      heightMm: 19.05,
      sizeName: '1.5" x 0.75"',
      barcodeType: 'CODE128',
      fields: [
        { name: 'itemName', label: 'Name', x: 1, y: 1, fontSize: 7, bold: true },
        { name: 'barcode', label: 'Barcode', x: 1, y: 8, width: 36, height: 8 }
      ],
      isDefault: true,
      isActive: true,
      createdAt: '2025-03-05T14:00:00.000Z'
    }
  ],

  labelJobs: [
    {
      id: 'lj-001',
      tenantId: 'tenant-1',
      templateId: 'lt-001',
      itemIds: ['item-101', 'item-102', 'item-103', 'item-104'],
      status: 'completed',
      outputFormat: 'pdf',
      labelCount: 4,
      createdAt: '2025-04-20T09:00:00.000Z'
    },
    {
      id: 'lj-002',
      tenantId: 'tenant-4',
      templateId: 'lt-003',
      itemIds: ['item-401', 'item-402'],
      status: 'pending',
      outputFormat: 'zpl',
      labelCount: 2,
      createdAt: '2025-08-15T11:30:00.000Z'
    }
  ],

  lotLabelTemplates: [
    {
      id: 'llt-001',
      tenantId: 'tenant-1',
      name: 'Lot Tracking Label - Standard',
      widthMm: 76.2,
      heightMm: 38.1,
      sizeName: '3" x 1.5"',
      barcodeType: 'CODE128',
      fields: [
        { name: 'itemName', label: 'Item Name', x: 2, y: 2, fontSize: 10, bold: true },
        { name: 'sku', label: 'SKU', x: 2, y: 12, fontSize: 8, bold: false },
        { name: 'lotNumber', label: 'Lot #', x: 2, y: 20, fontSize: 9, bold: true },
        { name: 'expirationDate', label: 'Exp', x: 40, y: 20, fontSize: 9, bold: true },
        { name: 'barcode', label: 'Barcode', x: 2, y: 28, width: 72, height: 8 }
      ],
      includeItemName: true,
      includeSku: true,
      includeLotNumber: true,
      includeExpirationDate: true,
      isDefault: true,
      isActive: true,
      createdAt: '2025-02-20T09:00:00.000Z'
    },
    {
      id: 'llt-002',
      tenantId: 'tenant-4',
      name: 'Lot QR Label - Compact',
      widthMm: 50.8,
      heightMm: 50.8,
      sizeName: '2" x 2"',
      barcodeType: 'QR_CODE',
      fields: [
        { name: 'itemName', label: 'Item', x: 2, y: 2, fontSize: 8, bold: true },
        { name: 'lotNumber', label: 'Lot', x: 2, y: 10, fontSize: 8, bold: false },
        { name: 'expirationDate', label: 'Exp', x: 2, y: 18, fontSize: 8, bold: true },
        { name: 'qrCode', label: 'QR', x: 14, y: 26, width: 22, height: 22 }
      ],
      includeItemName: true,
      includeSku: false,
      includeLotNumber: true,
      includeExpirationDate: true,
      isDefault: false,
      isActive: true,
      createdAt: '2025-04-01T13:00:00.000Z'
    }
  ],

  lotLabelJobs: [
    {
      id: 'llj-001',
      tenantId: 'tenant-1',
      templateId: 'llt-001',
      itemIds: ['item-101', 'item-102', 'item-103'],
      status: 'completed',
      outputFormat: 'pdf',
      labelCount: 3,
      createdAt: '2025-05-10T10:00:00.000Z'
    },
    {
      id: 'llj-002',
      tenantId: 'tenant-4',
      templateId: 'llt-002',
      itemIds: ['item-401', 'item-402'],
      status: 'pending',
      outputFormat: 'zpl',
      labelCount: 2,
      createdAt: '2025-08-20T15:30:00.000Z'
    }
  ]
};
