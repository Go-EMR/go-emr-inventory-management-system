const jwt = require('jsonwebtoken');

const JWT_SECRET = 'goemr-mock-server-secret-key-2024';
const TOKEN_EXPIRY = '24h';

// Demo users matching Angular AuthService
const DEMO_USERS = {
  admin: {
    password: 'admin123',
    user: {
      id: '1',
      tenantId: 'tenant-1',
      username: 'admin',
      email: 'admin@goemr.com',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'Administrator',
      department: 'IT',
      isActive: true
    },
    tenantMemberships: [
      { tenantId: 'tenant-1', role: 'Super Admin' },
      { tenantId: 'tenant-2', role: 'Tenant Admin' },
      { tenantId: 'tenant-3', role: 'Viewer' }
    ]
  },
  manager: {
    password: 'manager123',
    user: {
      id: '2',
      tenantId: 'tenant-1',
      username: 'manager',
      email: 'manager@goemr.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'Manager',
      department: 'Biomedical Engineering',
      isActive: true
    },
    tenantMemberships: [
      { tenantId: 'tenant-1', role: 'Manager' }
    ]
  },
  technician: {
    password: 'tech123',
    user: {
      id: '3',
      tenantId: 'tenant-1',
      username: 'technician',
      email: 'technician@goemr.com',
      firstName: 'Michael',
      lastName: 'Chen',
      role: 'Technician',
      department: 'Maintenance',
      isActive: true
    },
    tenantMemberships: [
      { tenantId: 'tenant-1', role: 'Staff' },
      { tenantId: 'tenant-2', role: 'Staff' }
    ]
  },
  viewer: {
    password: 'viewer123',
    user: {
      id: '4',
      tenantId: 'tenant-1',
      username: 'viewer',
      email: 'viewer@goemr.com',
      firstName: 'Emily',
      lastName: 'Davis',
      role: 'Viewer',
      department: 'Operations',
      isActive: true
    },
    tenantMemberships: [
      { tenantId: 'tenant-1', role: 'Viewer' }
    ]
  }
};

// Login endpoint handler
function loginHandler(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }

  const demoUser = DEMO_USERS[username.toLowerCase()];

  if (!demoUser || demoUser.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });
  }

  const tokenPayload = {
    userId: demoUser.user.id,
    username: demoUser.user.username,
    role: demoUser.user.role,
    tenantId: demoUser.user.tenantId,
    tenantMemberships: demoUser.tenantMemberships
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

  res.json({
    success: true,
    data: {
      token,
      user: {
        ...demoUser.user,
        lastLogin: new Date().toISOString(),
        createdAt: '2024-01-01T00:00:00.000Z'
      },
      tenantMemberships: demoUser.tenantMemberships
    }
  });
}

// Auth skip paths
const AUTH_SKIP_PATTERNS = [
  /^\/api\/auth\//,
  /^\/api\/public\//,
  /^\/$/,
  /^\/api$/
];

// Token validation middleware
function authMiddleware(req, res, next) {
  // Skip auth for login and public endpoints
  if (AUTH_SKIP_PATTERNS.some(pattern => pattern.test(req.path))) {
    return next();
  }

  // Allow OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Provide Authorization: Bearer <token> header.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
}

module.exports = { loginHandler, authMiddleware, JWT_SECRET };
