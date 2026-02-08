module.exports = {
  trackedDates: [
    {
      id: 'td-001',
      tenantId: 'tenant-1',
      itemId: 'eq-001',
      dateType: 'maintenance_due',
      dueDate: '2025-10-15T00:00:00.000Z',
      isRecurring: true,
      recurrenceDays: 90,
      createdAt: '2025-01-15T08:00:00.000Z'
    },
    {
      id: 'td-002',
      tenantId: 'tenant-1',
      itemId: 'eq-001',
      dateType: 'calibration_due',
      dueDate: '2025-09-20T00:00:00.000Z',
      isRecurring: true,
      recurrenceDays: 180,
      createdAt: '2025-01-15T08:00:00.000Z'
    },
    {
      id: 'td-003',
      tenantId: 'tenant-1',
      itemId: 'eq-002',
      dateType: 'warranty_expiry',
      dueDate: '2026-06-01T00:00:00.000Z',
      isRecurring: false,
      recurrenceDays: null,
      createdAt: '2020-06-01T08:00:00.000Z'
    },
    {
      id: 'td-004',
      tenantId: 'tenant-1',
      itemId: 'eq-003',
      dateType: 'certification_expiry',
      dueDate: '2025-12-31T00:00:00.000Z',
      isRecurring: true,
      recurrenceDays: 365,
      createdAt: '2024-12-31T10:00:00.000Z'
    },
    {
      id: 'td-005',
      tenantId: 'tenant-4',
      itemId: 'eq-004',
      dateType: 'calibration_due',
      dueDate: '2025-09-09T00:00:00.000Z',
      isRecurring: true,
      recurrenceDays: 90,
      createdAt: '2025-06-09T10:00:00.000Z'
    },
    {
      id: 'td-006',
      tenantId: 'tenant-4',
      itemId: 'eq-005',
      dateType: 'maintenance_due',
      dueDate: '2025-11-01T00:00:00.000Z',
      isRecurring: true,
      recurrenceDays: 120,
      createdAt: '2025-07-01T09:00:00.000Z'
    },
    {
      id: 'td-007',
      tenantId: 'tenant-1',
      itemId: 'item-103',
      dateType: 'expiration_date',
      dueDate: '2026-03-15T00:00:00.000Z',
      isRecurring: false,
      recurrenceDays: null,
      createdAt: '2025-06-20T14:00:00.000Z'
    },
    {
      id: 'td-008',
      tenantId: 'tenant-4',
      itemId: 'eq-005',
      dateType: 'warranty_expiry',
      dueDate: '2025-10-15T00:00:00.000Z',
      isRecurring: false,
      recurrenceDays: null,
      createdAt: '2018-04-15T08:00:00.000Z'
    }
  ],

  dateAlerts: [
    {
      id: 'da-001',
      tenantId: 'tenant-1',
      itemId: 'eq-001',
      itemName: 'Siemens MAGNETOM Vida 3T MRI',
      trackedDateId: 'td-002',
      dateType: 'calibration_due',
      dueDate: '2025-09-20T00:00:00.000Z',
      daysUntilDue: -5,
      severity: 'critical',
      isAcknowledged: false,
      createdAt: '2025-09-15T00:00:00.000Z'
    },
    {
      id: 'da-002',
      tenantId: 'tenant-1',
      itemId: 'eq-001',
      itemName: 'Siemens MAGNETOM Vida 3T MRI',
      trackedDateId: 'td-001',
      dateType: 'maintenance_due',
      dueDate: '2025-10-15T00:00:00.000Z',
      daysUntilDue: 30,
      severity: 'warning',
      isAcknowledged: false,
      createdAt: '2025-09-15T00:00:00.000Z'
    },
    {
      id: 'da-003',
      tenantId: 'tenant-1',
      itemId: 'eq-003',
      itemName: 'Intuitive Da Vinci Xi Surgical Robot',
      trackedDateId: 'td-004',
      dateType: 'certification_expiry',
      dueDate: '2025-12-31T00:00:00.000Z',
      daysUntilDue: 107,
      severity: 'info',
      isAcknowledged: true,
      createdAt: '2025-09-15T00:00:00.000Z'
    },
    {
      id: 'da-004',
      tenantId: 'tenant-4',
      itemId: 'eq-004',
      itemName: 'GE Revolution EVO CT Scanner',
      trackedDateId: 'td-005',
      dateType: 'calibration_due',
      dueDate: '2025-09-09T00:00:00.000Z',
      daysUntilDue: -6,
      severity: 'critical',
      isAcknowledged: false,
      createdAt: '2025-09-15T00:00:00.000Z'
    },
    {
      id: 'da-005',
      tenantId: 'tenant-4',
      itemId: 'eq-005',
      itemName: 'Philips Azurion 7 Cath Lab',
      trackedDateId: 'td-008',
      dateType: 'warranty_expiry',
      dueDate: '2025-10-15T00:00:00.000Z',
      daysUntilDue: 30,
      severity: 'urgent',
      isAcknowledged: false,
      createdAt: '2025-09-15T00:00:00.000Z'
    }
  ],

  dateAlertConfig: [
    {
      id: 'dac-001',
      tenantId: 'tenant-1',
      dateType: 'maintenance_due',
      alertDaysBefore: [30, 14, 7, 1],
      emailEnabled: true,
      dashboardEnabled: true,
      isActive: true,
      createdAt: '2025-01-01T00:00:00.000Z'
    },
    {
      id: 'dac-002',
      tenantId: 'tenant-1',
      dateType: 'calibration_due',
      alertDaysBefore: [30, 14, 7, 3, 1],
      emailEnabled: true,
      dashboardEnabled: true,
      isActive: true,
      createdAt: '2025-01-01T00:00:00.000Z'
    },
    {
      id: 'dac-003',
      tenantId: 'tenant-4',
      dateType: 'warranty_expiry',
      alertDaysBefore: [90, 60, 30, 14],
      emailEnabled: true,
      dashboardEnabled: true,
      isActive: true,
      createdAt: '2025-01-01T00:00:00.000Z'
    },
    {
      id: 'dac-004',
      tenantId: 'tenant-4',
      dateType: 'certification_expiry',
      alertDaysBefore: [60, 30, 14, 7],
      emailEnabled: false,
      dashboardEnabled: true,
      isActive: true,
      createdAt: '2025-01-01T00:00:00.000Z'
    }
  ]
};
