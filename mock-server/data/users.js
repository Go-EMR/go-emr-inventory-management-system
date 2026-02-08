const users = [
  {
    id: '1',
    tenantId: 'tenant-1',
    username: 'admin',
    email: 'admin@goemr.com',
    firstName: 'System',
    lastName: 'Administrator',
    password: 'admin123',
    passwordHashed: false,
    role: 'Administrator',
    department: 'IT',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    tenantId: 'tenant-1',
    username: 'manager',
    email: 'manager@goemr.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    password: 'manager123',
    passwordHashed: false,
    role: 'Manager',
    department: 'Biomedical Engineering',
    isActive: true,
    createdAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: '3',
    tenantId: 'tenant-1',
    username: 'technician',
    email: 'technician@goemr.com',
    firstName: 'Michael',
    lastName: 'Chen',
    password: 'tech123',
    passwordHashed: false,
    role: 'Technician',
    department: 'Maintenance',
    isActive: true,
    createdAt: '2024-02-01T00:00:00.000Z'
  },
  {
    id: '4',
    tenantId: 'tenant-1',
    username: 'viewer',
    email: 'viewer@goemr.com',
    firstName: 'Emily',
    lastName: 'Davis',
    password: 'viewer123',
    passwordHashed: false,
    role: 'Viewer',
    department: 'Operations',
    isActive: true,
    createdAt: '2024-02-15T00:00:00.000Z'
  }
];

const tenantMemberships = [
  {
    id: 'mem-1',
    userId: '1',
    tenantId: 'tenant-1',
    tenantName: 'GoEMR Demo Hospital',
    tenantSlug: 'goemr-demo',
    role: 'Super Admin',
    isDefault: true,
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'mem-2',
    userId: '1',
    tenantId: 'tenant-2',
    tenantName: 'Metro General Hospital',
    tenantSlug: 'metro-general',
    role: 'Tenant Admin',
    isDefault: false,
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'mem-3',
    userId: '1',
    tenantId: 'tenant-3',
    tenantName: 'City Medical Center',
    tenantSlug: 'city-medical',
    role: 'Viewer',
    isDefault: false,
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'mem-4',
    userId: '2',
    tenantId: 'tenant-1',
    tenantName: 'GoEMR Demo Hospital',
    tenantSlug: 'goemr-demo',
    role: 'Manager',
    isDefault: true,
    status: 'active',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z'
  },
  {
    id: 'mem-5',
    userId: '3',
    tenantId: 'tenant-1',
    tenantName: 'GoEMR Demo Hospital',
    tenantSlug: 'goemr-demo',
    role: 'Staff',
    isDefault: true,
    status: 'active',
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-02-01T00:00:00.000Z'
  },
  {
    id: 'mem-6',
    userId: '3',
    tenantId: 'tenant-2',
    tenantName: 'Metro General Hospital',
    tenantSlug: 'metro-general',
    role: 'Staff',
    isDefault: false,
    status: 'active',
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-02-01T00:00:00.000Z'
  },
  {
    id: 'mem-7',
    userId: '4',
    tenantId: 'tenant-1',
    tenantName: 'GoEMR Demo Hospital',
    tenantSlug: 'goemr-demo',
    role: 'Viewer',
    isDefault: true,
    status: 'active',
    createdAt: '2024-02-15T00:00:00.000Z',
    updatedAt: '2024-02-15T00:00:00.000Z'
  }
];

module.exports = { users, tenantMemberships };
