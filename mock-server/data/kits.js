const kits = [
  {
    id: 'kit-001',
    tenantId: 'tenant-1',
    name: 'Emergency Intubation Kit',
    description: 'Complete kit for emergency endotracheal intubation procedures including all necessary supplies and backup equipment',
    procedureType: 'Endotracheal Intubation',
    department: 'Emergency',
    estimatedCost: 485.00,
    items: [
      {
        id: 'kit-item-001',
        kitId: 'kit-001',
        itemId: 'INV003',
        itemName: 'Ventilator Breathing Circuit',
        itemSku: 'SPR-VEN-001',
        quantity: 1,
        isRequired: true
      },
      {
        id: 'kit-item-002',
        kitId: 'kit-001',
        itemId: 'INV002',
        itemName: 'Disposable Syringes 10ml (Box of 100)',
        itemSku: 'CON-SYR-002',
        quantity: 1,
        isRequired: true
      },
      {
        id: 'kit-item-003',
        kitId: 'kit-001',
        itemId: 'INV005',
        itemName: 'Nitrile Gloves Medium (Box of 100)',
        itemSku: 'CON-GLV-001',
        quantity: 1,
        isRequired: true
      },
      {
        id: 'kit-item-004',
        kitId: 'kit-001',
        itemId: 'INV006',
        itemName: 'SpO2 Sensor Cable',
        itemSku: 'SPR-MON-002',
        quantity: 1,
        isRequired: false
      }
    ],
    isActive: true,
    createdAt: '2025-03-01T00:00:00.000Z',
    updatedAt: '2025-12-15T10:00:00.000Z'
  },
  {
    id: 'kit-002',
    tenantId: 'tenant-1',
    name: 'Blood Draw Kit',
    description: 'Standard phlebotomy kit for routine blood collection including tubes, needles, and safety supplies',
    procedureType: 'Phlebotomy',
    department: 'Laboratory',
    estimatedCost: 82.00,
    items: [
      {
        id: 'kit-item-005',
        kitId: 'kit-002',
        itemId: 'INV007',
        itemName: 'Blood Collection Tubes (Pack of 100)',
        itemSku: 'CON-BLD-001',
        quantity: 1,
        isRequired: true
      },
      {
        id: 'kit-item-006',
        kitId: 'kit-002',
        itemId: 'INV002',
        itemName: 'Disposable Syringes 10ml (Box of 100)',
        itemSku: 'CON-SYR-002',
        quantity: 1,
        isRequired: true
      },
      {
        id: 'kit-item-007',
        kitId: 'kit-002',
        itemId: 'INV005',
        itemName: 'Nitrile Gloves Medium (Box of 100)',
        itemSku: 'CON-GLV-001',
        quantity: 1,
        isRequired: true
      },
      {
        id: 'kit-item-008',
        kitId: 'kit-002',
        itemId: 'INV001',
        itemName: 'ECG Electrodes (Pack of 100)',
        itemSku: 'CON-ECG-001',
        quantity: 1,
        isRequired: false
      }
    ],
    isActive: true,
    createdAt: '2025-04-15T00:00:00.000Z',
    updatedAt: '2025-11-01T08:30:00.000Z'
  },
  {
    id: 'kit-003',
    tenantId: 'tenant-1',
    name: 'Wound Care Kit',
    description: 'Comprehensive wound care and dressing change kit for minor to moderate wound management',
    procedureType: 'Wound Management',
    department: 'Nursing',
    estimatedCost: 55.00,
    items: [
      {
        id: 'kit-item-009',
        kitId: 'kit-003',
        itemId: 'INV005',
        itemName: 'Nitrile Gloves Medium (Box of 100)',
        itemSku: 'CON-GLV-001',
        quantity: 2,
        isRequired: true
      },
      {
        id: 'kit-item-010',
        kitId: 'kit-003',
        itemId: 'INV002',
        itemName: 'Disposable Syringes 10ml (Box of 100)',
        itemSku: 'CON-SYR-002',
        quantity: 1,
        isRequired: false
      }
    ],
    isActive: true,
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z'
  }
];

module.exports = { kits };
