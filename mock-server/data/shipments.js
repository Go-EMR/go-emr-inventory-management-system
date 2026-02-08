const shipments = [
  {
    id: 'ship-001',
    tenantId: 'tenant-1',
    shipmentNumber: 'SHP-2025-0001',
    shipmentType: 'outbound',
    status: 'delivered',
    carrier: 'FedEx',
    trackingNumber: 'FX-794612830954',
    recipient: {
      name: 'Dr. Maria Rodriguez',
      email: 'mrodriguez@metrohealth.org',
      organization: 'Metro Health Clinic',
      city: 'Denver'
    },
    items: [
      {
        id: 'ship-item-001',
        shipmentId: 'ship-001',
        itemId: 'INV001',
        itemName: 'ECG Electrodes (Pack of 100)',
        itemSku: 'CON-ECG-001',
        quantity: 50,
        conditionOnShip: 'new'
      },
      {
        id: 'ship-item-002',
        shipmentId: 'ship-001',
        itemId: 'INV002',
        itemName: 'Disposable Syringes 10ml (Box of 100)',
        itemSku: 'CON-SYR-002',
        quantity: 20,
        conditionOnShip: 'new'
      }
    ],
    signatureRequired: true,
    notes: 'Quarterly supply transfer to satellite clinic',
    shippedDate: '2025-11-10T14:00:00.000Z',
    deliveredDate: '2025-11-13T09:30:00.000Z',
    createdAt: '2025-11-08T10:00:00.000Z',
    updatedAt: '2025-11-13T09:30:00.000Z'
  },
  {
    id: 'ship-002',
    tenantId: 'tenant-1',
    shipmentNumber: 'SHP-2026-0001',
    shipmentType: 'outbound',
    status: 'shipped',
    carrier: 'UPS',
    trackingNumber: 'UPS-1Z999AA10123456784',
    recipient: {
      name: 'Nurse Lisa Park',
      email: 'lpark@communityhealth.org',
      organization: 'Community Health Center',
      city: 'Boulder'
    },
    items: [
      {
        id: 'ship-item-003',
        shipmentId: 'ship-002',
        itemId: 'INV008',
        itemName: 'Defibrillator Pads (Adult)',
        itemSku: 'SPR-DEF-001',
        quantity: 10,
        conditionOnShip: 'new'
      }
    ],
    signatureRequired: true,
    notes: 'Urgent resupply for community health outreach program',
    shippedDate: '2026-02-04T16:00:00.000Z',
    deliveredDate: null,
    createdAt: '2026-02-03T09:00:00.000Z',
    updatedAt: '2026-02-04T16:00:00.000Z'
  },
  {
    id: 'ship-003',
    tenantId: 'tenant-2',
    shipmentNumber: 'SHP-SMC-2026-0001',
    shipmentType: 'transfer',
    status: 'pending',
    carrier: 'Internal Courier',
    trackingNumber: 'INT-SMC-20260201-001',
    recipient: {
      name: 'Dr. James Liu',
      email: 'jliu@sunrisemedical.org',
      organization: 'Sunrise Medical Center - South Campus',
      city: 'Austin'
    },
    items: [
      {
        id: 'ship-item-004',
        shipmentId: 'ship-003',
        itemId: 'INV-SMC-001',
        itemName: 'CT Contrast Media (Iohexol)',
        itemSku: 'SMC-CON-001',
        quantity: 10,
        conditionOnShip: 'new'
      },
      {
        id: 'ship-item-005',
        shipmentId: 'ship-003',
        itemId: 'INV-SMC-004',
        itemName: 'Surgical Gloves Sterile (Box of 50)',
        itemSku: 'SMC-CON-003',
        quantity: 30,
        conditionOnShip: 'new'
      }
    ],
    signatureRequired: false,
    notes: 'Inter-campus supply transfer for south campus radiology department',
    shippedDate: null,
    deliveredDate: null,
    createdAt: '2026-02-01T11:00:00.000Z',
    updatedAt: '2026-02-01T11:00:00.000Z'
  },
  {
    id: 'ship-004',
    tenantId: 'tenant-3',
    shipmentNumber: 'SHP-RCH-2025-0001',
    shipmentType: 'return',
    status: 'delivered',
    carrier: 'DHL',
    trackingNumber: 'DHL-3948571026',
    recipient: {
      name: 'Returns Department',
      email: 'returns@gehealthcare.com',
      organization: 'GE Healthcare',
      city: 'Chicago'
    },
    items: [
      {
        id: 'ship-item-006',
        shipmentId: 'ship-004',
        itemId: 'EQ-RCH-003',
        itemName: 'Portable X-Ray Unit',
        itemSku: 'RCH-SPR-001',
        quantity: 1,
        conditionOnShip: 'defective'
      }
    ],
    signatureRequired: true,
    notes: 'Warranty return - unit displaying intermittent power failures',
    shippedDate: '2025-12-20T10:00:00.000Z',
    deliveredDate: '2025-12-23T14:00:00.000Z',
    createdAt: '2025-12-18T08:30:00.000Z',
    updatedAt: '2025-12-23T14:00:00.000Z'
  }
];

const returns = [
  {
    id: 'ret-001',
    tenantId: 'tenant-1',
    returnNumber: 'RET-2026-0001',
    status: 'approved',
    reason: 'defective',
    reasonDescription: 'ECG electrodes showing inconsistent adhesion - batch quality issue',
    requestorId: '3',
    requestorName: 'Michael Chen',
    supplierId: 'sup-001',
    supplierName: 'MedLine Industries',
    items: [
      {
        id: 'ret-item-001',
        returnId: 'ret-001',
        itemId: 'INV001',
        itemName: 'ECG Electrodes (Pack of 100)',
        itemSku: 'CON-ECG-001',
        quantity: 30,
        condition: 'defective',
        lotNumber: 'LOT-2024-A001'
      }
    ],
    approvedBy: '2',
    approvedByName: 'Sarah Johnson',
    approvedAt: '2026-01-22T14:00:00.000Z',
    createdAt: '2026-01-20T09:30:00.000Z',
    updatedAt: '2026-01-22T14:00:00.000Z'
  },
  {
    id: 'ret-002',
    tenantId: 'tenant-2',
    returnNumber: 'RET-SMC-2026-0001',
    status: 'pending',
    reason: 'end_of_use',
    reasonDescription: 'Surgical microscope light bulbs reaching end of life cycle - returning unused stock from previous order',
    requestorId: '1',
    requestorName: 'System Administrator',
    supplierId: 'sup-004',
    supplierName: 'GE Healthcare',
    items: [
      {
        id: 'ret-item-002',
        returnId: 'ret-002',
        itemId: 'INV-SMC-003',
        itemName: 'Surgical Microscope Light Bulb',
        itemSku: 'SMC-SPR-001',
        quantity: 3,
        condition: 'unused',
        lotNumber: null
      }
    ],
    approvedBy: null,
    approvedByName: null,
    approvedAt: null,
    createdAt: '2026-02-05T10:00:00.000Z',
    updatedAt: '2026-02-05T10:00:00.000Z'
  }
];

module.exports = { shipments, returns };
