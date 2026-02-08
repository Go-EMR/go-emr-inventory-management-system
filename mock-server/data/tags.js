const tags = [
  {
    id: 'tag-001',
    tenantId: 'tenant-1',
    name: 'Critical',
    color: '#DC2626',
    description: 'Items critical to patient care that must always be in stock',
    itemCount: 3,
    createdAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2025-12-01T00:00:00.000Z'
  },
  {
    id: 'tag-002',
    tenantId: 'tenant-1',
    name: 'High Priority',
    color: '#F59E0B',
    description: 'High priority items requiring expedited reordering when low',
    itemCount: 2,
    createdAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2025-11-20T00:00:00.000Z'
  },
  {
    id: 'tag-003',
    tenantId: 'tenant-1',
    name: 'Needs Calibration',
    color: '#8B5CF6',
    description: 'Equipment or instruments requiring periodic calibration',
    itemCount: 2,
    createdAt: '2025-02-01T00:00:00.000Z',
    updatedAt: '2025-10-15T00:00:00.000Z'
  },
  {
    id: 'tag-004',
    tenantId: 'tenant-1',
    name: 'New',
    color: '#10B981',
    description: 'Recently added items that may need initial setup or orientation',
    itemCount: 1,
    createdAt: '2025-03-01T00:00:00.000Z',
    updatedAt: '2026-01-10T00:00:00.000Z'
  },
  {
    id: 'tag-005',
    tenantId: 'tenant-1',
    name: 'Recalled',
    color: '#EF4444',
    description: 'Items subject to manufacturer or regulatory recall - do not use',
    itemCount: 1,
    createdAt: '2025-04-01T00:00:00.000Z',
    updatedAt: '2025-09-15T00:00:00.000Z'
  },
  {
    id: 'tag-006',
    tenantId: 'tenant-2',
    name: 'Biohazard',
    color: '#B91C1C',
    description: 'Items classified as biohazardous requiring special handling and disposal',
    itemCount: 1,
    createdAt: '2025-05-01T00:00:00.000Z',
    updatedAt: '2025-12-20T00:00:00.000Z'
  },
  {
    id: 'tag-007',
    tenantId: 'tenant-2',
    name: 'Temperature Sensitive',
    color: '#0EA5E9',
    description: 'Items requiring strict temperature-controlled storage',
    itemCount: 1,
    createdAt: '2025-05-15T00:00:00.000Z',
    updatedAt: '2025-11-10T00:00:00.000Z'
  },
  {
    id: 'tag-008',
    tenantId: 'tenant-3',
    name: 'Radiation',
    color: '#FBBF24',
    description: 'Items associated with radiation use or exposure risk',
    itemCount: 1,
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: '2025-10-30T00:00:00.000Z'
  }
];

const itemTags = [
  {
    itemId: 'INV008',
    tagId: 'tag-001',
    tagName: 'Critical',
    tagColor: '#DC2626',
    taggedAt: '2025-03-10T09:00:00.000Z',
    taggedBy: '2'
  },
  {
    itemId: 'INV003',
    tagId: 'tag-001',
    tagName: 'Critical',
    tagColor: '#DC2626',
    taggedAt: '2025-03-10T09:05:00.000Z',
    taggedBy: '2'
  },
  {
    itemId: 'INV004',
    tagId: 'tag-001',
    tagName: 'Critical',
    tagColor: '#DC2626',
    taggedAt: '2025-03-10T09:10:00.000Z',
    taggedBy: '2'
  },
  {
    itemId: 'INV002',
    tagId: 'tag-002',
    tagName: 'High Priority',
    tagColor: '#F59E0B',
    taggedAt: '2025-04-01T10:00:00.000Z',
    taggedBy: '1'
  },
  {
    itemId: 'INV005',
    tagId: 'tag-002',
    tagName: 'High Priority',
    tagColor: '#F59E0B',
    taggedAt: '2025-04-01T10:05:00.000Z',
    taggedBy: '1'
  },
  {
    itemId: 'EQ001',
    tagId: 'tag-003',
    tagName: 'Needs Calibration',
    tagColor: '#8B5CF6',
    taggedAt: '2025-06-15T14:00:00.000Z',
    taggedBy: '3'
  },
  {
    itemId: 'EQ003',
    tagId: 'tag-003',
    tagName: 'Needs Calibration',
    tagColor: '#8B5CF6',
    taggedAt: '2025-06-15T14:10:00.000Z',
    taggedBy: '3'
  },
  {
    itemId: 'INV006',
    tagId: 'tag-004',
    tagName: 'New',
    tagColor: '#10B981',
    taggedAt: '2026-01-10T08:00:00.000Z',
    taggedBy: '2'
  },
  {
    itemId: 'INV-RCH-002',
    tagId: 'tag-005',
    tagName: 'Recalled',
    tagColor: '#EF4444',
    taggedAt: '2025-09-15T07:30:00.000Z',
    taggedBy: '1'
  },
  {
    itemId: 'INV-SMC-001',
    tagId: 'tag-006',
    tagName: 'Biohazard',
    tagColor: '#B91C1C',
    taggedAt: '2025-07-01T11:00:00.000Z',
    taggedBy: '1'
  },
  {
    itemId: 'INV-SMC-001',
    tagId: 'tag-007',
    tagName: 'Temperature Sensitive',
    tagColor: '#0EA5E9',
    taggedAt: '2025-07-01T11:05:00.000Z',
    taggedBy: '1'
  },
  {
    itemId: 'EQ-RCH-003',
    tagId: 'tag-008',
    tagName: 'Radiation',
    tagColor: '#FBBF24',
    taggedAt: '2025-08-20T13:00:00.000Z',
    taggedBy: '1'
  }
];

module.exports = { tags, itemTags };
