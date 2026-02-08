const maintenance = [
  // ============ Metro General Hospital (tenant-1) Maintenance ============
  {
    id: 'MNT001',
    tenantId: 'tenant-1',
    equipmentId: 'EQ001',
    type: 'Preventive',
    status: 'Completed',
    scheduledDate: '2024-12-01T00:00:00.000Z',
    completedDate: '2024-12-01T00:00:00.000Z',
    technician: 'Michael Chen',
    description: 'Quarterly preventive maintenance',
    findings: 'All systems functioning normally. Calibration verified.',
    cost: 450,
    nextScheduledDate: '2025-03-01T00:00:00.000Z',
    partsUsed: [
      { id: 'SP001', partNumber: 'XR-FILTER-220', name: 'X-Ray Filter Assembly', quantity: 1, unitCost: 120 }
    ],
    createdAt: '2024-11-15T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z'
  },
  {
    id: 'MNT002',
    tenantId: 'tenant-1',
    equipmentId: 'EQ003',
    type: 'Corrective',
    status: 'In Progress',
    scheduledDate: '2025-01-10T00:00:00.000Z',
    completedDate: null,
    technician: 'Michael Chen',
    description: 'Alarm system malfunction repair',
    findings: null,
    cost: null,
    nextScheduledDate: null,
    createdAt: '2025-01-08T00:00:00.000Z',
    updatedAt: '2025-01-10T00:00:00.000Z'
  },
  {
    id: 'MNT003',
    tenantId: 'tenant-1',
    equipmentId: 'EQ002',
    type: 'Calibration',
    status: 'Scheduled',
    scheduledDate: '2025-02-15T00:00:00.000Z',
    completedDate: null,
    technician: null,
    description: 'Annual calibration check',
    findings: null,
    cost: null,
    nextScheduledDate: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'MNT004',
    tenantId: 'tenant-1',
    equipmentId: 'EQ008',
    type: 'Corrective',
    status: 'Overdue',
    scheduledDate: '2024-11-01T00:00:00.000Z',
    completedDate: null,
    technician: null,
    description: 'Display repair - component replacement needed',
    findings: 'Display module needs complete replacement',
    cost: null,
    nextScheduledDate: null,
    createdAt: '2024-08-01T00:00:00.000Z',
    updatedAt: '2024-11-15T00:00:00.000Z'
  },
  {
    id: 'MNT005',
    tenantId: 'tenant-1',
    equipmentId: 'EQ007',
    type: 'Safety Inspection',
    status: 'Completed',
    scheduledDate: '2024-12-15T00:00:00.000Z',
    completedDate: '2024-12-15T00:00:00.000Z',
    technician: 'Sarah Johnson',
    description: 'Annual safety inspection and certification',
    findings: 'Passed all safety requirements. Certificate renewed.',
    cost: 650,
    nextScheduledDate: '2025-12-15T00:00:00.000Z',
    partsUsed: [
      { id: 'SP002', partNumber: 'GAS-SEAL-CS2', name: 'Gas Delivery Seal Kit', quantity: 2, unitCost: 85 },
      { id: 'SP003', partNumber: 'O2-SENSOR-CS2', name: 'Oxygen Sensor', quantity: 1, unitCost: 210 }
    ],
    createdAt: '2024-12-01T00:00:00.000Z',
    updatedAt: '2024-12-15T00:00:00.000Z'
  },

  // ============ Sunrise Medical Center (tenant-2) Maintenance ============
  {
    id: 'MNT-SMC-001',
    tenantId: 'tenant-2',
    equipmentId: 'EQ-SMC-001',
    type: 'Preventive',
    status: 'Completed',
    scheduledDate: '2024-11-15T00:00:00.000Z',
    completedDate: '2024-11-15T00:00:00.000Z',
    technician: 'David Lee',
    description: 'CT Scanner quarterly tube calibration',
    findings: 'Tube output within specifications. No issues found.',
    cost: 1250,
    nextScheduledDate: '2025-02-15T00:00:00.000Z',
    partsUsed: [
      { id: 'SP-SMC-001', partNumber: 'CT-TUBE-CAL-KIT', name: 'CT Tube Calibration Kit', quantity: 1, unitCost: 450 }
    ],
    createdAt: '2024-11-01T00:00:00.000Z',
    updatedAt: '2024-11-15T00:00:00.000Z'
  },
  {
    id: 'MNT-SMC-002',
    tenantId: 'tenant-2',
    equipmentId: 'EQ-SMC-004',
    type: 'Corrective',
    status: 'In Progress',
    scheduledDate: '2025-01-20T00:00:00.000Z',
    completedDate: null,
    technician: 'Ana Garcia',
    description: 'Dialysis machine pump replacement',
    findings: null,
    cost: null,
    nextScheduledDate: null,
    createdAt: '2025-01-18T00:00:00.000Z',
    updatedAt: '2025-01-20T00:00:00.000Z'
  },
  {
    id: 'MNT-SMC-003',
    tenantId: 'tenant-2',
    equipmentId: 'EQ-SMC-003',
    type: 'Calibration',
    status: 'Scheduled',
    scheduledDate: '2025-01-15T00:00:00.000Z',
    completedDate: null,
    technician: null,
    description: 'Cath Lab image intensifier calibration',
    findings: null,
    cost: null,
    nextScheduledDate: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },

  // ============ Riverside Community Hospital (tenant-4) Maintenance ============
  {
    id: 'MNT-RCH-001',
    tenantId: 'tenant-4',
    equipmentId: 'EQ-RCH-001',
    type: 'Preventive',
    status: 'Completed',
    scheduledDate: '2024-12-01T00:00:00.000Z',
    completedDate: '2024-12-01T00:00:00.000Z',
    technician: 'Michael Brown',
    description: 'MRI cryogen level check and magnet calibration',
    findings: 'Helium levels optimal. Magnet homogeneity excellent.',
    cost: 3500,
    nextScheduledDate: '2025-03-01T00:00:00.000Z',
    partsUsed: [
      { id: 'SP-RCH-001', partNumber: 'MRI-HE-SENSOR', name: 'Helium Level Sensor', quantity: 1, unitCost: 800 },
      { id: 'SP-RCH-002', partNumber: 'MRI-COLD-HEAD', name: 'Cold Head Maintenance Kit', quantity: 1, unitCost: 1200 }
    ],
    createdAt: '2024-11-15T00:00:00.000Z',
    updatedAt: '2024-12-01T00:00:00.000Z'
  },
  {
    id: 'MNT-RCH-002',
    tenantId: 'tenant-4',
    equipmentId: 'EQ-RCH-005',
    type: 'Corrective',
    status: 'Overdue',
    scheduledDate: '2024-10-15T00:00:00.000Z',
    completedDate: null,
    technician: null,
    description: 'PET/CT detector array repair - critical failure',
    findings: 'Multiple detector modules non-functional. Vendor assessment pending.',
    cost: null,
    nextScheduledDate: null,
    createdAt: '2024-10-01T00:00:00.000Z',
    updatedAt: '2024-11-15T00:00:00.000Z'
  },
  {
    id: 'MNT-RCH-003',
    tenantId: 'tenant-4',
    equipmentId: 'EQ-RCH-002',
    type: 'Safety Inspection',
    status: 'Completed',
    scheduledDate: '2024-11-01T00:00:00.000Z',
    completedDate: '2024-11-01T00:00:00.000Z',
    technician: 'Emily Williams',
    description: 'Linear Accelerator annual radiation safety survey',
    findings: 'All shielding adequate. Beam alignment within tolerance.',
    cost: 4500,
    nextScheduledDate: '2025-11-01T00:00:00.000Z',
    partsUsed: [
      { id: 'SP-RCH-003', partNumber: 'LINAC-ION-CHAM', name: 'Ion Chamber Dosimeter', quantity: 1, unitCost: 950 },
      { id: 'SP-RCH-004', partNumber: 'LINAC-BEAM-FILM', name: 'Beam Profile Film Pack', quantity: 3, unitCost: 120 }
    ],
    createdAt: '2024-10-15T00:00:00.000Z',
    updatedAt: '2024-11-01T00:00:00.000Z'
  },
  {
    id: 'MNT-RCH-004',
    tenantId: 'tenant-4',
    equipmentId: 'EQ-RCH-003',
    type: 'Preventive',
    status: 'Scheduled',
    scheduledDate: '2025-03-15T00:00:00.000Z',
    completedDate: null,
    technician: null,
    description: 'Da Vinci Robot annual service and instrument calibration',
    findings: null,
    cost: null,
    nextScheduledDate: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }
];

module.exports = { maintenance };
