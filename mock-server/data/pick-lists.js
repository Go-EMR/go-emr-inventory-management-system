const pickLists = [
  {
    id: 'pl-001',
    tenantId: 'tenant-1',
    pickListNumber: 'PL-2026-0001',
    kitId: 'kit-001',
    kitName: 'Emergency Intubation Kit',
    requesterId: '3',
    requesterName: 'Michael Chen',
    department: 'Emergency',
    status: 'completed',
    priority: 'urgent',
    items: [
      {
        id: 'pl-item-001',
        pickListId: 'pl-001',
        itemId: 'INV003',
        itemName: 'Ventilator Breathing Circuit',
        itemSku: 'SPR-VEN-001',
        quantityRequested: 1,
        quantityPicked: 1,
        status: 'picked'
      },
      {
        id: 'pl-item-002',
        pickListId: 'pl-001',
        itemId: 'INV002',
        itemName: 'Disposable Syringes 10ml (Box of 100)',
        itemSku: 'CON-SYR-002',
        quantityRequested: 1,
        quantityPicked: 1,
        status: 'picked'
      },
      {
        id: 'pl-item-003',
        pickListId: 'pl-001',
        itemId: 'INV005',
        itemName: 'Nitrile Gloves Medium (Box of 100)',
        itemSku: 'CON-GLV-001',
        quantityRequested: 1,
        quantityPicked: 1,
        status: 'picked'
      },
      {
        id: 'pl-item-004',
        pickListId: 'pl-001',
        itemId: 'INV006',
        itemName: 'SpO2 Sensor Cable',
        itemSku: 'SPR-MON-002',
        quantityRequested: 1,
        quantityPicked: 1,
        status: 'picked'
      }
    ],
    createdAt: '2026-01-05T06:30:00.000Z',
    updatedAt: '2026-01-05T07:15:00.000Z'
  },
  {
    id: 'pl-002',
    tenantId: 'tenant-1',
    pickListNumber: 'PL-2026-0002',
    kitId: 'kit-002',
    kitName: 'Blood Draw Kit',
    requesterId: '4',
    requesterName: 'Emily Davis',
    department: 'Laboratory',
    status: 'in_progress',
    priority: 'normal',
    items: [
      {
        id: 'pl-item-005',
        pickListId: 'pl-002',
        itemId: 'INV007',
        itemName: 'Blood Collection Tubes (Pack of 100)',
        itemSku: 'CON-BLD-001',
        quantityRequested: 1,
        quantityPicked: 1,
        status: 'picked'
      },
      {
        id: 'pl-item-006',
        pickListId: 'pl-002',
        itemId: 'INV002',
        itemName: 'Disposable Syringes 10ml (Box of 100)',
        itemSku: 'CON-SYR-002',
        quantityRequested: 1,
        quantityPicked: 0,
        status: 'pending'
      },
      {
        id: 'pl-item-007',
        pickListId: 'pl-002',
        itemId: 'INV005',
        itemName: 'Nitrile Gloves Medium (Box of 100)',
        itemSku: 'CON-GLV-001',
        quantityRequested: 1,
        quantityPicked: 0,
        status: 'pending'
      },
      {
        id: 'pl-item-008',
        pickListId: 'pl-002',
        itemId: 'INV001',
        itemName: 'ECG Electrodes (Pack of 100)',
        itemSku: 'CON-ECG-001',
        quantityRequested: 1,
        quantityPicked: 0,
        status: 'pending'
      }
    ],
    createdAt: '2026-02-01T09:00:00.000Z',
    updatedAt: '2026-02-01T10:30:00.000Z'
  },
  {
    id: 'pl-003',
    tenantId: 'tenant-1',
    pickListNumber: 'PL-2026-0003',
    kitId: 'kit-003',
    kitName: 'Wound Care Kit',
    requesterId: '2',
    requesterName: 'Sarah Johnson',
    department: 'Nursing',
    status: 'pending',
    priority: 'high',
    items: [
      {
        id: 'pl-item-009',
        pickListId: 'pl-003',
        itemId: 'INV005',
        itemName: 'Nitrile Gloves Medium (Box of 100)',
        itemSku: 'CON-GLV-001',
        quantityRequested: 2,
        quantityPicked: 0,
        status: 'pending'
      },
      {
        id: 'pl-item-010',
        pickListId: 'pl-003',
        itemId: 'INV002',
        itemName: 'Disposable Syringes 10ml (Box of 100)',
        itemSku: 'CON-SYR-002',
        quantityRequested: 1,
        quantityPicked: 0,
        status: 'pending'
      }
    ],
    createdAt: '2026-02-06T11:00:00.000Z',
    updatedAt: '2026-02-06T11:00:00.000Z'
  },
  {
    id: 'pl-004',
    tenantId: 'tenant-2',
    pickListNumber: 'PL-SMC-2026-0001',
    kitId: null,
    kitName: null,
    requesterId: '1',
    requesterName: 'System Administrator',
    department: 'Radiology',
    status: 'draft',
    priority: 'low',
    items: [
      {
        id: 'pl-item-011',
        pickListId: 'pl-004',
        itemId: 'INV-SMC-001',
        itemName: 'CT Contrast Media (Iohexol)',
        itemSku: 'SMC-CON-001',
        quantityRequested: 5,
        quantityPicked: 0,
        status: 'pending'
      },
      {
        id: 'pl-item-012',
        pickListId: 'pl-004',
        itemId: 'INV-SMC-004',
        itemName: 'Surgical Gloves Sterile (Box of 50)',
        itemSku: 'SMC-CON-003',
        quantityRequested: 10,
        quantityPicked: 0,
        status: 'pending'
      }
    ],
    createdAt: '2026-02-07T08:00:00.000Z',
    updatedAt: '2026-02-07T08:00:00.000Z'
  }
];

module.exports = { pickLists };
