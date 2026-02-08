const purchaseOrders = [
  {
    id: 'po-001',
    tenantId: 'tenant-1',
    poNumber: 'PO-2025-0001',
    supplierId: 'sup-001',
    supplierName: 'MedLine Industries',
    status: 'received',
    lines: [
      {
        id: 'po-line-001',
        itemId: 'INV001',
        itemName: 'ECG Electrodes (Pack of 100)',
        sku: 'CON-ECG-001',
        quantityOrdered: 200,
        quantityReceived: 200,
        unitCost: 25.00,
        lineTotal: 5000.00
      },
      {
        id: 'po-line-002',
        itemId: 'INV005',
        itemName: 'Nitrile Gloves Medium (Box of 100)',
        sku: 'CON-GLV-001',
        quantityOrdered: 300,
        quantityReceived: 300,
        unitCost: 12.00,
        lineTotal: 3600.00
      }
    ],
    totalAmount: 8600.00,
    createdBy: '2',
    createdByName: 'Sarah Johnson',
    orderDate: '2025-10-01T00:00:00.000Z',
    expectedDelivery: '2025-10-15T00:00:00.000Z',
    createdAt: '2025-10-01T09:00:00.000Z',
    updatedAt: '2025-10-14T11:30:00.000Z'
  },
  {
    id: 'po-002',
    tenantId: 'tenant-1',
    poNumber: 'PO-2025-0002',
    supplierId: 'sup-002',
    supplierName: 'Cardinal Health',
    status: 'partially_received',
    lines: [
      {
        id: 'po-line-003',
        itemId: 'INV002',
        itemName: 'Disposable Syringes 10ml (Box of 100)',
        sku: 'CON-SYR-002',
        quantityOrdered: 150,
        quantityReceived: 100,
        unitCost: 18.00,
        lineTotal: 2700.00
      },
      {
        id: 'po-line-004',
        itemId: 'INV007',
        itemName: 'Blood Collection Tubes (Pack of 100)',
        sku: 'CON-BLD-001',
        quantityOrdered: 100,
        quantityReceived: 0,
        unitCost: 45.00,
        lineTotal: 4500.00
      }
    ],
    totalAmount: 7200.00,
    createdBy: '2',
    createdByName: 'Sarah Johnson',
    orderDate: '2025-12-01T00:00:00.000Z',
    expectedDelivery: '2025-12-20T00:00:00.000Z',
    createdAt: '2025-12-01T10:00:00.000Z',
    updatedAt: '2025-12-18T15:00:00.000Z'
  },
  {
    id: 'po-003',
    tenantId: 'tenant-1',
    poNumber: 'PO-2026-0001',
    supplierId: 'sup-003',
    supplierName: 'Becton Dickinson',
    status: 'approved',
    lines: [
      {
        id: 'po-line-005',
        itemId: 'INV004',
        itemName: 'CBC Reagent Kit',
        sku: 'REA-CBC-001',
        quantityOrdered: 20,
        quantityReceived: 0,
        unitCost: 350.00,
        lineTotal: 7000.00
      }
    ],
    totalAmount: 7000.00,
    createdBy: '1',
    createdByName: 'System Administrator',
    orderDate: '2026-01-15T00:00:00.000Z',
    expectedDelivery: '2026-02-15T00:00:00.000Z',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-16T09:30:00.000Z'
  },
  {
    id: 'po-004',
    tenantId: 'tenant-1',
    poNumber: 'PO-2026-0002',
    supplierId: 'sup-001',
    supplierName: 'MedLine Industries',
    status: 'draft',
    lines: [
      {
        id: 'po-line-006',
        itemId: 'INV003',
        itemName: 'Ventilator Breathing Circuit',
        sku: 'SPR-VEN-001',
        quantityOrdered: 50,
        quantityReceived: 0,
        unitCost: 150.00,
        lineTotal: 7500.00
      },
      {
        id: 'po-line-007',
        itemId: 'INV006',
        itemName: 'SpO2 Sensor Cable',
        sku: 'SPR-MON-002',
        quantityOrdered: 20,
        quantityReceived: 0,
        unitCost: 85.00,
        lineTotal: 1700.00
      }
    ],
    totalAmount: 9200.00,
    createdBy: '3',
    createdByName: 'Michael Chen',
    orderDate: '2026-02-01T00:00:00.000Z',
    expectedDelivery: '2026-03-01T00:00:00.000Z',
    createdAt: '2026-02-01T11:00:00.000Z',
    updatedAt: '2026-02-01T11:00:00.000Z'
  },
  {
    id: 'po-005',
    tenantId: 'tenant-2',
    poNumber: 'PO-SMC-2025-0001',
    supplierId: 'sup-004',
    supplierName: 'GE Healthcare',
    status: 'sent',
    lines: [
      {
        id: 'po-line-008',
        itemId: 'INV-SMC-003',
        itemName: 'Surgical Microscope Light Bulb',
        sku: 'SMC-SPR-001',
        quantityOrdered: 10,
        quantityReceived: 0,
        unitCost: 450.00,
        lineTotal: 4500.00
      }
    ],
    totalAmount: 4500.00,
    createdBy: '1',
    createdByName: 'System Administrator',
    orderDate: '2026-01-10T00:00:00.000Z',
    expectedDelivery: '2026-02-10T00:00:00.000Z',
    createdAt: '2026-01-10T14:00:00.000Z',
    updatedAt: '2026-01-11T09:00:00.000Z'
  },
  {
    id: 'po-006',
    tenantId: 'tenant-2',
    poNumber: 'PO-SMC-2026-0001',
    supplierId: 'sup-002',
    supplierName: 'Cardinal Health',
    status: 'pending_approval',
    lines: [
      {
        id: 'po-line-009',
        itemId: 'INV-SMC-002',
        itemName: 'Dialysis Tubing Set',
        sku: 'SMC-CON-002',
        quantityOrdered: 50,
        quantityReceived: 0,
        unitCost: 85.00,
        lineTotal: 4250.00
      },
      {
        id: 'po-line-010',
        itemId: 'INV-SMC-001',
        itemName: 'CT Contrast Media (Iohexol)',
        sku: 'SMC-CON-001',
        quantityOrdered: 30,
        quantityReceived: 0,
        unitCost: 125.00,
        lineTotal: 3750.00
      }
    ],
    totalAmount: 8000.00,
    createdBy: '3',
    createdByName: 'Michael Chen',
    orderDate: '2026-02-03T00:00:00.000Z',
    expectedDelivery: '2026-03-03T00:00:00.000Z',
    createdAt: '2026-02-03T10:00:00.000Z',
    updatedAt: '2026-02-03T10:00:00.000Z'
  }
];

const autoPORules = [
  {
    id: 'auto-po-rule-001',
    tenantId: 'tenant-1',
    name: 'Low Stock Auto Reorder',
    description: 'Automatically creates a purchase order when inventory falls below the reorder level',
    isEnabled: true,
    triggerType: 'reorder_level',
    thresholdPercentage: 100,
    quantityMethod: 'reorder_to_max',
    defaultSupplierId: 'sup-001',
    defaultSupplierName: 'MedLine Industries',
    requiresApproval: true,
    approverIds: ['1', '2'],
    categories: ['CONSUMABLES', 'REAGENTS'],
    lastTriggeredAt: '2026-01-28T06:00:00.000Z',
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: '2026-01-28T06:00:00.000Z'
  },
  {
    id: 'auto-po-rule-002',
    tenantId: 'tenant-2',
    name: 'Critical Supply Auto Reorder',
    description: 'Reorders critical supplies when stock drops to 50% of reorder level',
    isEnabled: true,
    triggerType: 'reorder_level',
    thresholdPercentage: 50,
    quantityMethod: 'fixed_quantity',
    fixedQuantity: 100,
    defaultSupplierId: 'sup-002',
    defaultSupplierName: 'Cardinal Health',
    requiresApproval: false,
    approverIds: [],
    categories: ['CONSUMABLES'],
    lastTriggeredAt: '2026-01-15T12:00:00.000Z',
    createdAt: '2025-08-15T00:00:00.000Z',
    updatedAt: '2026-01-15T12:00:00.000Z'
  }
];

const autoPOExecutions = [
  {
    id: 'auto-po-exec-001',
    ruleId: 'auto-po-rule-001',
    tenantId: 'tenant-1',
    ruleName: 'Low Stock Auto Reorder',
    triggeredItemId: 'INV005',
    triggeredItemName: 'Nitrile Gloves Medium (Box of 100)',
    triggeredItemSku: 'CON-GLV-001',
    currentStock: 0,
    reorderLevel: 100,
    generatedPOId: 'po-001',
    generatedPONumber: 'PO-2025-0001',
    status: 'completed',
    executedAt: '2025-10-01T06:00:00.000Z',
    completedAt: '2025-10-01T09:00:00.000Z'
  },
  {
    id: 'auto-po-exec-002',
    ruleId: 'auto-po-rule-002',
    tenantId: 'tenant-2',
    ruleName: 'Critical Supply Auto Reorder',
    triggeredItemId: 'INV-SMC-002',
    triggeredItemName: 'Dialysis Tubing Set',
    triggeredItemSku: 'SMC-CON-002',
    currentStock: 18,
    reorderLevel: 30,
    generatedPOId: 'po-006',
    generatedPONumber: 'PO-SMC-2026-0001',
    status: 'pending_approval',
    executedAt: '2026-02-03T06:00:00.000Z',
    completedAt: null
  }
];

module.exports = { purchaseOrders, autoPORules, autoPOExecutions };
