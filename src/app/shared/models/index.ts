// Equipment Types and Interfaces based on WHO Medical Device Technical Series

export interface Equipment {
  id: string;
  tenantId: string;
  inventoryNumber: string;
  name: string;
  type: EquipmentType;
  category: EquipmentCategory;
  manufacturer: string;
  model: string;
  serialNumber: string;
  location: Location;
  department: string;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  riskLevel: RiskLevel;
  purchaseDate: Date;
  installationDate?: Date;
  warrantyExpiry?: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  purchaseCost?: number;
  currentValue?: number;
  powerRequirements?: string;
  operatingManualAvailable: boolean;
  serviceManualAvailable: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  id: string;
  building: string;
  floor: string;
  room: string;
  bed?: string;
}

export enum EquipmentType {
  DIAGNOSTIC = 'Diagnostic',
  THERAPEUTIC = 'Therapeutic',
  MONITORING = 'Monitoring',
  LABORATORY = 'Laboratory',
  IMAGING = 'Imaging',
  SURGICAL = 'Surgical',
  LIFE_SUPPORT = 'Life Support',
  REHABILITATION = 'Rehabilitation',
  STERILIZATION = 'Sterilization',
  OTHER = 'Other'
}

export enum EquipmentCategory {
  // Therapeutic
  LIFE_SUPPORT = 'Life Support',
  SURGICAL_ICU = 'Surgical and ICU',
  PHYSICAL_THERAPY = 'Physical Therapy',
  
  // Diagnostic
  MONITORING_SURGICAL_ICU = 'Monitoring (Surgical/ICU)',
  MONITORING_PHYSIOLOGICAL = 'Physiological Monitoring',
  
  // Analytical
  LABORATORY_ANALYTICAL = 'Laboratory Analytical',
  LABORATORY_ACCESSORIES = 'Laboratory Accessories',
  COMPUTERS_RELATED = 'Computers and Related',
  
  // Miscellaneous
  PATIENT_RELATED = 'Patient Related',
  OTHER = 'Other'
}

export enum EquipmentStatus {
  IN_SERVICE = 'In Service',
  OUT_OF_SERVICE = 'Out of Service',
  UNDER_MAINTENANCE = 'Under Maintenance',
  AWAITING_REPAIR = 'Awaiting Repair',
  AWAITING_PARTS = 'Awaiting Parts',
  DECOMMISSIONED = 'Decommissioned',
  DISPOSED = 'Disposed'
}

export enum EquipmentCondition {
  EXCELLENT = 'Excellent',
  GOOD = 'Good',
  FAIR = 'Fair',
  POOR = 'Poor',
  NON_FUNCTIONAL = 'Non-Functional'
}

export enum RiskLevel {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

// Maintenance Types
export interface MaintenanceRecord {
  id: string;
  tenantId: string;
  equipmentId: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  scheduledDate: Date;
  completedDate?: Date;
  technician?: string;
  description: string;
  findings?: string;
  partsUsed?: SparePart[];
  cost?: number;
  nextScheduledDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum MaintenanceType {
  PREVENTIVE = 'Preventive',
  CORRECTIVE = 'Corrective',
  CALIBRATION = 'Calibration',
  SAFETY_INSPECTION = 'Safety Inspection',
  PERFORMANCE_VERIFICATION = 'Performance Verification',
  EMERGENCY = 'Emergency'
}

export enum MaintenanceStatus {
  SCHEDULED = 'Scheduled',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  OVERDUE = 'Overdue',
  CANCELLED = 'Cancelled'
}

// Inventory Types
export interface InventoryItem {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  type: InventoryType;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  reorderLevel: number;
  unitOfMeasure: string;
  unitCost: number;
  totalValue: number;
  location: string;
  supplier?: Vendor;
  expiryDate?: Date;
  lotNumber?: string;
  lastRestockDate?: Date;
  status: StockStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum InventoryCategory {
  CONSUMABLES = 'Consumables',
  SPARE_PARTS = 'Spare Parts',
  REAGENTS = 'Reagents',
  ACCESSORIES = 'Accessories',
  TOOLS = 'Tools',
  SAFETY_EQUIPMENT = 'Safety Equipment'
}

export enum InventoryType {
  MEDICAL_SUPPLIES = 'Medical Supplies',
  LABORATORY_SUPPLIES = 'Laboratory Supplies',
  MAINTENANCE_PARTS = 'Maintenance Parts',
  GENERAL_SUPPLIES = 'General Supplies'
}

export enum StockStatus {
  IN_STOCK = 'In Stock',
  LOW_STOCK = 'Low Stock',
  OUT_OF_STOCK = 'Out of Stock',
  EXPIRED = 'Expired',
  DISCONTINUED = 'Discontinued'
}

// Vendor Types
export interface Vendor {
  id: string;
  tenantId: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  category: VendorCategory;
  rating: number;
  contractStartDate?: Date;
  contractEndDate?: Date;
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum VendorCategory {
  EQUIPMENT_MANUFACTURER = 'Equipment Manufacturer',
  PARTS_SUPPLIER = 'Parts Supplier',
  CONSUMABLES_SUPPLIER = 'Consumables Supplier',
  SERVICE_PROVIDER = 'Service Provider',
  DISTRIBUTOR = 'Distributor'
}

// Work Order Types
export interface WorkOrder {
  id: string;
  tenantId: string;
  workOrderNumber: string;
  equipmentId: string;
  equipment?: Equipment;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  requestedBy: string;
  requestedDate: Date;
  assignedTo?: string;
  scheduledDate?: Date;
  completedDate?: Date;
  description: string;
  resolution?: string;
  laborHours?: number;
  partsCost?: number;
  totalCost?: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum WorkOrderType {
  REPAIR = 'Repair',
  MAINTENANCE = 'Maintenance',
  INSTALLATION = 'Installation',
  INSPECTION = 'Inspection',
  CALIBRATION = 'Calibration',
  UPGRADE = 'Upgrade'
}

export enum WorkOrderPriority {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export enum WorkOrderStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  ON_HOLD = 'On Hold',
  COMPLETED = 'Completed',
  CLOSED = 'Closed'
}

// Spare Part Types
export interface SparePart {
  id: string;
  partNumber: string;
  name: string;
  quantity: number;
  unitCost: number;
}

// Alert Types
export interface Alert {
  id: string;
  tenantId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  relatedItemId?: string;
  relatedItemType?: 'equipment' | 'inventory' | 'maintenance' | 'workorder';
  isRead: boolean;
  isAcknowledged: boolean;
  createdAt: Date;
}

export enum AlertType {
  LOW_STOCK = 'Low Stock',
  MAINTENANCE_DUE = 'Maintenance Due',
  MAINTENANCE_OVERDUE = 'Maintenance Overdue',
  WARRANTY_EXPIRING = 'Warranty Expiring',
  EQUIPMENT_FAILURE = 'Equipment Failure',
  EXPIRY_WARNING = 'Expiry Warning',
  RECALL_NOTICE = 'Recall Notice'
}

export enum AlertSeverity {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
  INFO = 'Info'
}

// User Types
export interface User {
  id: string;
  tenantId?: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

export enum UserRole {
  ADMIN = 'Administrator',
  MANAGER = 'Manager',
  TECHNICIAN = 'Technician',
  VIEWER = 'Viewer'
}

// Dashboard Statistics
export interface DashboardStats {
  totalEquipment: number;
  activeEquipment: number;
  underMaintenance: number;
  outOfService: number;
  totalInventoryItems: number;
  lowStockItems: number;
  pendingWorkOrders: number;
  overdueMaintenances: number;
  alertsCount: number;
  monthlyMaintenanceCost: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter/Search Types
export interface EquipmentFilter {
  search?: string;
  type?: EquipmentType;
  status?: EquipmentStatus;
  department?: string;
  riskLevel?: RiskLevel;
}

export interface InventoryFilter {
  search?: string;
  category?: InventoryCategory;
  status?: StockStatus;
  supplier?: string;
}

export interface MaintenanceFilter {
  search?: string;
  type?: MaintenanceType;
  status?: MaintenanceStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

// ==========================================
// COMPLIANCE & REGULATORY MODELS
// Multi-jurisdiction: HIPAA, DPDP, ABHA, Australian Privacy Act, Romanian/GDPR
// ==========================================

// Compliance Frameworks
export enum ComplianceFramework {
  HIPAA = 'HIPAA',                           // US Health Insurance Portability and Accountability Act
  FDA_21_CFR_PART_11 = 'FDA 21 CFR Part 11', // FDA Electronic Records and Signatures
  JOINT_COMMISSION = 'Joint Commission',     // The Joint Commission Healthcare Standards
  DPDP = 'DPDP',                             // India Digital Personal Data Protection Act 2023
  ABHA = 'ABHA',                             // India Ayushman Bharat Health Account
  ABDM = 'ABDM',                             // India Ayushman Bharat Digital Mission
  AUSTRALIAN_PRIVACY = 'Australian Privacy', // Australian Privacy Act 1988
  MY_HEALTH_RECORDS = 'My Health Records',   // Australian My Health Records Act 2012
  GDPR = 'GDPR',                             // EU General Data Protection Regulation
  ROMANIAN_HEALTH = 'Romanian Health'        // Romanian Healthcare Regulations
}

export enum ComplianceStatus {
  COMPLIANT = 'Compliant',
  PARTIALLY_COMPLIANT = 'Partially Compliant',
  NON_COMPLIANT = 'Non-Compliant',
  PENDING_REVIEW = 'Pending Review',
  NOT_APPLICABLE = 'Not Applicable'
}

export enum DataClassification {
  PUBLIC = 'Public',
  INTERNAL = 'Internal',
  CONFIDENTIAL = 'Confidential',
  PHI = 'PHI',                               // Protected Health Information (HIPAA)
  SPI = 'SPI',                               // Sensitive Personal Information (DPDP)
  HEALTH_INFORMATION = 'Health Information'  // Australian/GDPR
}

// Main Compliance Configuration
export interface ComplianceConfig {
  id: string;
  organizationId: string;
  enabledFrameworks: ComplianceFramework[];
  primaryRegion: ComplianceRegion;
  secondaryRegions: ComplianceRegion[];
  dataRetentionPeriod: number; // in months
  auditRetentionPeriod: number; // in months
  encryptionEnabled: boolean;
  encryptionAlgorithm: string;
  autoLogoutMinutes: number;
  passwordPolicy: PasswordPolicy;
  mfaRequired: boolean;
  consentRequired: boolean;
  dataLocalization: boolean;
  crossBorderTransferAllowed: boolean;
  lastReviewDate: Date;
  nextReviewDate: Date;
  updatedAt: Date;
}

export enum ComplianceRegion {
  US = 'United States',
  INDIA = 'India',
  AUSTRALIA = 'Australia',
  ROMANIA = 'Romania',
  EU = 'European Union'
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expiryDays: number;
  historyCount: number; // prevent reuse of last N passwords
}

// HIPAA Specific
export interface HIPAACompliance {
  id: string;
  organizationId: string;
  privacyOfficer: string;
  securityOfficer: string;
  lastRiskAssessment: Date;
  nextRiskAssessment: Date;
  businessAssociateAgreements: BusinessAssociateAgreement[];
  breachNotificationPlan: boolean;
  employeeTrainingComplete: boolean;
  lastTrainingDate: Date;
  physicalSafeguards: SafeguardStatus;
  technicalSafeguards: SafeguardStatus;
  administrativeSafeguards: SafeguardStatus;
  minimumNecessaryPolicy: boolean;
  deIdentificationProcedures: boolean;
  patientRightsPolicy: boolean;
  status: ComplianceStatus;
}

export interface BusinessAssociateAgreement {
  id: string;
  vendorId: string;
  vendorName: string;
  agreementDate: Date;
  expiryDate: Date;
  status: 'Active' | 'Expired' | 'Pending';
  lastReviewDate: Date;
}

export interface SafeguardStatus {
  implemented: boolean;
  lastAuditDate: Date;
  findings: string[];
  remediationStatus: 'Complete' | 'In Progress' | 'Pending';
}

// India DPDP Act Specific
export interface DPDPCompliance {
  id: string;
  organizationId: string;
  dataFiduciary: string; // Person responsible for data processing
  consentManager: string;
  grievanceOfficer: GrievanceOfficer;
  dataProcessingPurposes: DataProcessingPurpose[];
  consentMechanismImplemented: boolean;
  dataLocalizationCompliant: boolean;
  childDataProtection: boolean;
  significantDataFiduciary: boolean; // Additional obligations if true
  dataProtectionImpactAssessment: boolean;
  dataPrincipalRights: DataPrincipalRights;
  crossBorderTransferCompliant: boolean;
  approvedCountries: string[];
  breachNotificationProcedure: boolean;
  status: ComplianceStatus;
}

export interface GrievanceOfficer {
  name: string;
  email: string;
  phone: string;
  responseTimeDays: number; // Maximum 7 days as per DPDP
}

export interface DataProcessingPurpose {
  id: string;
  purpose: string;
  legalBasis: 'Consent' | 'Legitimate Use' | 'Legal Obligation' | 'Vital Interest';
  dataCategories: string[];
  retentionPeriod: number;
  thirdPartySharing: boolean;
}

export interface DataPrincipalRights {
  rightToAccess: boolean;
  rightToCorrection: boolean;
  rightToErasure: boolean;
  rightToPortability: boolean;
  rightToNominate: boolean; // Nominate someone to exercise rights
  grievanceRedressal: boolean;
}

// Ayushman Bharat / ABHA Specific
export interface ABHACompliance {
  id: string;
  organizationId: string;
  healthFacilityRegistryId: string; // HFR ID
  hipId: string; // Health Information Provider ID
  hiuId: string; // Health Information User ID
  abdmIntegrationStatus: ABDMIntegrationStatus;
  abhaCreationEnabled: boolean;
  healthRecordsLinking: boolean;
  consentManagerIntegration: boolean;
  healthLockerSupport: boolean;
  hiuCallbackConfigured: boolean;
  hipCallbackConfigured: boolean;
  dataExchangeProtocol: 'FHIR' | 'HL7' | 'Custom';
  certificateStatus: CertificateStatus;
  lastHealthIdVerification: Date;
  supportedHealthRecordTypes: HealthRecordType[];
  status: ComplianceStatus;
}

export interface ABDMIntegrationStatus {
  gatewayConnected: boolean;
  consentManagerLinked: boolean;
  healthLockerIntegrated: boolean;
  lastSyncDate: Date;
  syncStatus: 'Active' | 'Error' | 'Pending';
}

export interface CertificateStatus {
  certificateId: string;
  issuedDate: Date;
  expiryDate: Date;
  status: 'Valid' | 'Expired' | 'Revoked';
}

export enum HealthRecordType {
  PRESCRIPTION = 'Prescription',
  DIAGNOSTIC_REPORT = 'Diagnostic Report',
  OP_CONSULTATION = 'OP Consultation',
  DISCHARGE_SUMMARY = 'Discharge Summary',
  IMMUNIZATION = 'Immunization Record',
  HEALTH_DOCUMENT = 'Health Document',
  WELLNESS_RECORD = 'Wellness Record'
}

// Australian Privacy Act Specific
export interface AustralianPrivacyCompliance {
  id: string;
  organizationId: string;
  privacyOfficer: string;
  appCompliance: APPComplianceStatus[]; // Australian Privacy Principles
  notifiableDataBreachScheme: boolean;
  privacyPolicy: PrivacyPolicyStatus;
  myHealthRecordsAct: MyHealthRecordsCompliance;
  healthRecordsActVic: boolean; // Victorian Health Records Act
  crossBorderDisclosure: CrossBorderDisclosure;
  directMarketingCompliance: boolean;
  accessAndCorrectionProcedures: boolean;
  status: ComplianceStatus;
}

export interface APPComplianceStatus {
  appNumber: number; // APP 1-13
  appName: string;
  status: ComplianceStatus;
  lastReviewDate: Date;
  notes: string;
}

export interface PrivacyPolicyStatus {
  exists: boolean;
  lastUpdated: Date;
  publiclyAccessible: boolean;
  coversAllAPPs: boolean;
}

export interface MyHealthRecordsCompliance {
  registered: boolean;
  registrationId: string;
  uploadEnabled: boolean;
  accessControlConfigured: boolean;
  emergencyAccessProcedures: boolean;
  auditTrailEnabled: boolean;
}

export interface CrossBorderDisclosure {
  allowed: boolean;
  approvedCountries: string[];
  contractualProtections: boolean;
  consentObtained: boolean;
}

// Romanian/EU GDPR Specific
export interface GDPRCompliance {
  id: string;
  organizationId: string;
  dataProtectionOfficer: DataProtectionOfficer;
  processingRegister: boolean; // Article 30 Records
  lawfulBasisDocumented: boolean;
  privacyByDesign: boolean;
  privacyByDefault: boolean;
  dpia: DPIAStatus; // Data Protection Impact Assessment
  dataSubjectRights: DataSubjectRights;
  breachNotificationProcedure: BreachNotificationProcedure;
  internationalTransfers: InternationalTransfers;
  processorAgreements: boolean;
  employeeTraining: boolean;
  lastTrainingDate: Date;
  romanianSpecific: RomanianHealthCompliance;
  status: ComplianceStatus;
}

export interface DataProtectionOfficer {
  required: boolean;
  appointed: boolean;
  name: string;
  email: string;
  phone: string;
  registeredWithAuthority: boolean; // ANSPDCP in Romania
}

export interface DPIAStatus {
  required: boolean;
  completed: boolean;
  lastAssessmentDate: Date;
  highRiskProcessing: boolean;
  mitigationMeasures: string[];
}

export interface DataSubjectRights {
  rightToBeInformed: boolean;
  rightOfAccess: boolean;
  rightToRectification: boolean;
  rightToErasure: boolean;
  rightToRestrictProcessing: boolean;
  rightToDataPortability: boolean;
  rightToObject: boolean;
  automatedDecisionMaking: boolean;
}

export interface BreachNotificationProcedure {
  procedureExists: boolean;
  notificationWithin72Hours: boolean;
  dataSubjectNotification: boolean;
  documentationProcess: boolean;
  lastBreachTest: Date;
}

export interface InternationalTransfers {
  transfersOutsideEEA: boolean;
  adequacyDecisions: boolean;
  standardContractualClauses: boolean;
  bindingCorporateRules: boolean;
  approvedCountries: string[];
}

export interface RomanianHealthCompliance {
  anspdcpRegistration: boolean; // National Supervisory Authority
  healthDataProcessingAuthorization: boolean;
  medicalRecordsRetention: number; // Years as per Romanian law
  electronicHealthRecordCompliance: boolean;
  telemedicineRegulations: boolean;
  pharmacyDataRegulations: boolean;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string;
  resourceName: string;
  ipAddress: string;
  userAgent?: string;
  sessionId: string;
  oldValue?: string;
  newValue?: string;
  description: string;
  complianceFrameworks?: ComplianceFramework[];
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Success' | 'Failed' | 'Blocked';
  changes?: AuditChange[];
  metadata?: Record<string, any>;
}

export enum AuditAction {
  CREATE = 'Create',
  READ = 'Read',
  UPDATE = 'Update',
  DELETE = 'Delete',
  EXPORT = 'Export',
  IMPORT = 'Import',
  PRINT = 'Print',
  LOGIN = 'Login',
  LOGOUT = 'Logout',
  LOGIN_FAILED = 'Login Failed',
  PASSWORD_CHANGE = 'Password Change',
  PERMISSION_CHANGE = 'Permission Change',
  CONSENT_GRANTED = 'Consent Granted',
  CONSENT_REVOKED = 'Consent Revoked',
  DATA_ACCESS_REQUEST = 'Data Access Request',
  DATA_DELETION_REQUEST = 'Data Deletion Request',
  DATA_EXPORT_REQUEST = 'Data Export Request',
  BREACH_REPORTED = 'Breach Reported',
  SYSTEM_CONFIG_CHANGE = 'System Config Change',
  APPROVE = 'Approve',
  REJECT = 'Reject',
  SUBMIT = 'Submit',
  CANCEL = 'Cancel',
  COMPLETE = 'Complete',
  SCHEDULE = 'Schedule',
  ASSIGN = 'Assign',
  TRANSFER = 'Transfer',
  ARCHIVE = 'Archive',
  RESTORE = 'Restore'
}

export enum AuditResourceType {
  EQUIPMENT = 'Equipment',
  INVENTORY = 'Inventory',
  MAINTENANCE = 'Maintenance',
  VENDOR = 'Vendor',
  USER = 'User',
  PATIENT = 'Patient',
  HEALTH_RECORD = 'Health Record',
  CONSENT = 'Consent',
  REPORT = 'Report',
  SYSTEM_CONFIG = 'System Config',
  COMPLIANCE_CONFIG = 'Compliance Config',
  SYSTEM = 'System',
  ALERT = 'Alert',
  COMPLIANCE = 'Compliance'
}

// Consent Management
export interface ConsentRecord {
  id: string;
  dataPrincipalId: string; // Patient/User ID
  dataPrincipalName: string;
  dataPrincipalEmail: string;
  consentType: ConsentType;
  purposes: string[];
  dataCategories: DataClassification[];
  grantedDate: Date;
  expiryDate?: Date;
  status: ConsentStatus;
  version: string;
  ipAddress: string;
  consentMethod: 'Electronic' | 'Paper' | 'Verbal';
  withdrawalDate?: Date;
  withdrawalReason?: string;
  frameworks: ComplianceFramework[];
  auditTrail: ConsentAuditEntry[];
}

export enum ConsentType {
  DATA_PROCESSING = 'Data Processing',
  DATA_SHARING = 'Data Sharing',
  MARKETING = 'Marketing',
  RESEARCH = 'Research',
  CROSS_BORDER_TRANSFER = 'Cross Border Transfer',
  HEALTH_RECORDS_ACCESS = 'Health Records Access',
  ABHA_LINKING = 'ABHA Linking',
  MY_HEALTH_RECORDS = 'My Health Records'
}

export enum ConsentStatus {
  ACTIVE = 'Active',
  EXPIRED = 'Expired',
  WITHDRAWN = 'Withdrawn',
  PENDING = 'Pending'
}

export interface ConsentAuditEntry {
  timestamp: Date;
  action: 'Granted' | 'Modified' | 'Renewed' | 'Withdrawn';
  performedBy: string;
  details: string;
}

// Data Subject/Principal Requests
export interface DataSubjectRequest {
  id: string;
  requestNumber: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requestType: DataSubjectRequestType;
  status: DataSubjectRequestStatus;
  submittedDate: Date;
  acknowledgedDate?: Date;
  dueDate: Date;
  completedDate?: Date;
  assignedTo: string;
  description: string;
  identityVerified: boolean;
  verificationMethod: string;
  response?: string;
  attachments: string[];
  framework: ComplianceFramework;
  auditTrail: RequestAuditEntry[];
}

export enum DataSubjectRequestType {
  ACCESS = 'Access Request',
  RECTIFICATION = 'Rectification Request',
  ERASURE = 'Erasure Request',
  RESTRICTION = 'Restriction Request',
  PORTABILITY = 'Data Portability',
  OBJECTION = 'Objection',
  GRIEVANCE = 'Grievance'
}

export enum DataSubjectRequestStatus {
  SUBMITTED = 'Submitted',
  ACKNOWLEDGED = 'Acknowledged',
  IDENTITY_VERIFICATION = 'Identity Verification',
  IN_PROGRESS = 'In Progress',
  PENDING_APPROVAL = 'Pending Approval',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected',
  APPEALED = 'Appealed'
}

export interface RequestAuditEntry {
  timestamp: Date;
  action: string;
  performedBy: string;
  notes: string;
}

// Data Breach Management
export interface DataBreach {
  id: string;
  breachNumber: string;
  discoveredDate: Date;
  occurredDate: Date;
  reportedDate?: Date;
  breachType: BreachType;
  severity: BreachSeverity;
  status: BreachStatus;
  description: string;
  dataTypesAffected: DataClassification[];
  recordsAffected: number;
  individualsAffected: number;
  cause: string;
  containmentActions: string[];
  remediationActions: string[];
  notificationRequired: boolean;
  authorityNotified: boolean;
  authorityNotificationDate?: Date;
  individualsNotified: boolean;
  individualsNotificationDate?: Date;
  reportedBy: string;
  assignedTo: string;
  frameworks: ComplianceFramework[];
  lessonsLearned?: string;
  preventiveMeasures?: string[];
  closedDate?: Date;
}

export enum BreachType {
  CONFIDENTIALITY = 'Confidentiality Breach',
  INTEGRITY = 'Integrity Breach',
  AVAILABILITY = 'Availability Breach',
  UNAUTHORIZED_ACCESS = 'Unauthorized Access',
  DATA_LOSS = 'Data Loss',
  CYBER_ATTACK = 'Cyber Attack',
  HUMAN_ERROR = 'Human Error',
  SYSTEM_FAILURE = 'System Failure'
}

export enum BreachSeverity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum BreachStatus {
  DETECTED = 'Detected',
  INVESTIGATING = 'Investigating',
  CONTAINED = 'Contained',
  NOTIFYING = 'Notifying',
  REMEDIATING = 'Remediating',
  CLOSED = 'Closed'
}

// Compliance Dashboard Statistics
export interface ComplianceDashboardStats {
  overallScore: number; // 0-100
  frameworkScores: FrameworkScore[];
  pendingTasks: number;
  overdueTasks: number;
  recentBreaches: number;
  openDataRequests: number;
  expiringConsents: number;
  upcomingAudits: number;
  trainingOverdue: number;
  certificatesExpiring: number;
}

export interface FrameworkScore {
  framework: ComplianceFramework;
  score: number;
  status: ComplianceStatus;
  lastAssessmentDate: Date;
  nextAssessmentDate: Date;
  criticalFindings: number;
  openActions: number;
}

// Compliance Task/Action Items
export interface ComplianceTask {
  id: string;
  title: string;
  description: string;
  framework: ComplianceFramework;
  category: ComplianceTaskCategory;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Completed' | 'Overdue';
  assignedTo: string;
  dueDate: Date;
  completedDate?: Date;
  recurrence?: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annually';
  evidence?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ComplianceTaskCategory {
  RISK_ASSESSMENT = 'Risk Assessment',
  POLICY_REVIEW = 'Policy Review',
  TRAINING = 'Training',
  AUDIT = 'Audit',
  DOCUMENTATION = 'Documentation',
  TECHNICAL_CONTROL = 'Technical Control',
  VENDOR_MANAGEMENT = 'Vendor Management',
  INCIDENT_RESPONSE = 'Incident Response',
  DATA_MANAGEMENT = 'Data Management'
}

// Policy Management
export interface CompliancePolicy {
  id: string;
  title: string;
  description: string;
  frameworks: ComplianceFramework[];
  version: string;
  effectiveDate: Date;
  reviewDate: Date;
  nextReviewDate: Date;
  status: 'Draft' | 'Active' | 'Under Review' | 'Archived';
  approvedBy: string;
  approvalDate: Date;
  documentUrl: string;
  acknowledgmentRequired: boolean;
  acknowledgedBy: PolicyAcknowledgment[];
}

export interface PolicyAcknowledgment {
  userId: string;
  userName: string;
  acknowledgedDate: Date;
  version: string;
}

// Training Records
export interface ComplianceTraining {
  id: string;
  title: string;
  description: string;
  frameworks: ComplianceFramework[];
  duration: number; // in minutes
  passingScore: number;
  validityPeriod: number; // in months
  status: 'Active' | 'Archived';
  completions: TrainingCompletion[];
}

export interface TrainingCompletion {
  userId: string;
  userName: string;
  completedDate: Date;
  score: number;
  passed: boolean;
  expiryDate: Date;
  certificateUrl?: string;
}

// Additional audit types for change tracking
export interface AuditChange {
  field: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
}

export enum AuditStatus {
  SUCCESS = 'Success',
  FAILURE = 'Failed',
  BLOCKED = 'Blocked',
  PENDING = 'Pending'
}

// ==========================================
// INVENTORY MANAGEMENT FEATURE MODELS
// Tags, Photos, Barcodes, Date Tracking, Checkouts, Pick Lists, Import/Export, Reports, Webhooks, Sync
// ==========================================

// Custom Tags
export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemTag {
  itemId: string;
  tagId: string;
  tagName: string;
  tagColor: string;
  taggedAt: Date;
  taggedBy: string;
}

// Item Photos
export interface ItemPhoto {
  id: string;
  itemId: string;
  storageKey: string;
  thumbnailKey?: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  displayOrder: number;
  isPrimary: boolean;
  caption?: string;
  uploadStatus: 'pending' | 'confirmed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface PresignedUrl {
  url: string;
  expiresAt: Date;
  headers: Record<string, string>;
}

// Barcodes & Labels
export enum BarcodeType {
  CODE128 = 'CODE128',
  CODE39 = 'CODE39',
  EAN13 = 'EAN13',
  UPC_A = 'UPC_A',
  QR_CODE = 'QR_CODE',
  DATA_MATRIX = 'DATA_MATRIX'
}

export interface LabelTemplate {
  id: string;
  name: string;
  description?: string;
  widthMm: number;
  heightMm: number;
  sizeName: string;
  barcodeType: BarcodeType;
  fields: LabelField[];
  templateData?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LabelField {
  fieldName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: string;
  fontWeight: string;
}

export interface LabelPrintJob {
  id: string;
  templateId: string;
  itemIds: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  outputFormat: 'pdf' | 'zpl';
  outputUrl?: string;
  labelCount: number;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ScanResult {
  barcodeValue: string;
  barcodeType: BarcodeType;
  itemId?: string;
  itemName?: string;
  itemSku?: string;
  found: boolean;
}

// ==========================================
// LOT-LEVEL BARCODE MODELS
// ==========================================

// LotBarcode represents a barcode tied to a specific lot/expiration
export interface LotBarcode {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  stockLevelId?: string;

  // Barcode information
  barcodeValue: string;
  barcodeType: BarcodeType;

  // Lot information encoded in the barcode
  lotNumber: string;
  expirationDate?: Date;
  serialNumber?: string;

  // Additional info
  manufactureDate?: Date;
  batchNumber?: string;
  gtin?: string;  // Global Trade Item Number
  ndc?: string;   // National Drug Code

  // QR code payload (JSON)
  payloadJson: string;

  // Status
  labelGenerated: boolean;
  labelGeneratedAt?: Date;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// LotBarcodePayload is the JSON structure encoded in lot QR codes
export interface LotBarcodePayload {
  version: string;        // Payload version for compatibility
  itemId: string;
  sku: string;
  lotNumber: string;
  expirationDate?: string; // YYYY-MM-DD format
  serialNumber?: string;
  gtin?: string;
  ndc?: string;
  barcodeId: string;      // For quick database lookup
}

// LotScanResult represents the result of scanning a lot-level barcode
export interface LotScanResult {
  barcodeValue: string;
  barcodeType: BarcodeType;
  found: boolean;
  isLotBarcode: boolean;
  isItemBarcode: boolean;

  // Item info (always populated if found)
  itemId?: string;
  itemName?: string;
  itemSku?: string;

  // Lot info (only for lot barcodes)
  lotBarcodeId?: string;
  lotNumber?: string;
  expirationDate?: Date;
  serialNumber?: string;
  isExpired: boolean;
  daysUntilExpiry: number;
}

// BarcodeScanHistory records a barcode scan for auditing
export interface BarcodeScanHistory {
  id: string;
  barcodeValue: string;
  barcodeType: BarcodeType;
  lotBarcodeId?: string;
  itemId?: string;
  itemBarcodeMatch: boolean;
  lotBarcodeMatch: boolean;
  scanPurpose: ScanPurpose;
  scanLocation?: string;
  deviceId?: string;
  scanSuccessful: boolean;
  errorMessage?: string;
  scannedBy?: string;
  scannedAt: Date;
}

export enum ScanPurpose {
  RECEIVE = 'receive',
  CHECKOUT = 'checkout',
  CHECKIN = 'checkin',
  INVENTORY = 'inventory',
  VERIFY = 'verify',
  SHIP = 'ship'
}

// LotLabelTemplate defines a label template for lot labels
export interface LotLabelTemplate {
  id: string;
  name: string;
  description?: string;
  widthMm: number;
  heightMm: number;
  sizeName: string;
  barcodeType: BarcodeType;

  // Which fields to include on the label
  includeItemName: boolean;
  includeSku: boolean;
  includeLotNumber: boolean;
  includeExpirationDate: boolean;
  includeSerialNumber: boolean;
  includeManufactureDate: boolean;
  includeNdc: boolean;

  fields: LabelField[];
  templateData?: string;
  isDefault: boolean;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// Date-Based Alerts
export enum TrackedDateType {
  MAINTENANCE_DUE = 'maintenance_due',
  CALIBRATION_DUE = 'calibration_due',
  WARRANTY_EXPIRY = 'warranty_expiry',
  CERTIFICATION_EXPIRY = 'certification_expiry',
  INSPECTION_DUE = 'inspection_due',
  LICENSE_EXPIRY = 'license_expiry',
  CONTRACT_RENEWAL = 'contract_renewal',
  CUSTOM = 'custom'
}

export interface ItemTrackedDate {
  id: string;
  itemId: string;
  dateType: TrackedDateType;
  customTypeName?: string;
  dueDate: Date;
  completedDate?: Date;
  notes?: string;
  isRecurring: boolean;
  recurrenceDays?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DateAlertConfig {
  id: string;
  dateType: TrackedDateType;
  customTypeName?: string;
  alertDaysBefore: number[];
  emailEnabled: boolean;
  dashboardEnabled: boolean;
  webhookEnabled: boolean;
  emailRecipients: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum DateAlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export interface DateAlert {
  id: string;
  itemId: string;
  itemName: string;
  trackedDateId: string;
  dateType: TrackedDateType;
  customTypeName?: string;
  dueDate: Date;
  daysUntilDue: number;
  severity: DateAlertSeverity;
  isAcknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  createdAt: Date;
}

// Check-in/Check-out System
export enum CheckoutStatus {
  ACTIVE = 'active',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
  LOST = 'lost',
  DAMAGED = 'damaged'
}

export interface Checkout {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  itemPhotoUrl?: string;
  quantity: number;
  checkedOutBy: string;
  checkedOutByName: string;
  checkedOutByEmail?: string;
  department?: string;
  purpose?: string;
  status: CheckoutStatus;
  checkoutDate: Date;
  expectedReturnDate: Date;
  actualReturnDate?: Date;
  returnCondition?: string;
  returnNotes?: string;
  checkedInBy?: string;
  checkedInByName?: string;
  lotNumber?: string;
  lotBarcodeId?: string;
  extensionCount?: number;
  lastReminderSent?: Date;
  isOverdue: boolean;
  daysOverdue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckoutSettings {
  itemId: string;
  isCheckable: boolean;
  maxCheckoutDays: number;
  maxQuantityPerCheckout: number;
  requiresApproval: boolean;
  approverIds: string[];
  sendReminders: boolean;
  reminderDaysBefore: number[];
}

export interface OverdueCheckoutSummary {
  totalOverdue: number;
  overdue1To7Days: number;
  overdue8To14Days: number;
  overdue15PlusDays: number;
  overdueCheckouts: Checkout[];
}

// Pick Lists & Procedure Kits
export interface ProcedureKit {
  id: string;
  name: string;
  description?: string;
  procedureType: string;
  department?: string;
  estimatedCost?: number;
  items: ProcedureKitItem[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcedureKitItem {
  id: string;
  kitId: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  quantity: number;
  isRequired: boolean;
  notes?: string;
  currentStock?: number;
  substituteItemIds?: string[];
}

export enum PickListStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  PARTIALLY_FULFILLED = 'partially_fulfilled'
}

export enum PickListPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface PickList {
  id: string;
  pickListNumber: string;
  kitId?: string;
  kitName?: string;
  requesterId: string;
  requesterName: string;
  department?: string;
  destination?: string;
  neededBy?: Date;
  status: PickListStatus;
  priority: PickListPriority;
  items: PickListItem[];
  assignedPickerId?: string;
  assignedPickerName?: string;
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum PickListItemStatus {
  PENDING = 'pending',
  PICKED = 'picked',
  PARTIALLY_PICKED = 'partially_picked',
  OUT_OF_STOCK = 'out_of_stock',
  SUBSTITUTED = 'substituted',
  SKIPPED = 'skipped'
}

export interface PickListItem {
  id: string;
  pickListId: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  quantityRequested: number;
  quantityPicked: number;
  warehouseId?: string;
  warehouseName?: string;
  location?: string;
  lotNumber?: string;
  status: PickListItemStatus;
  pickedAt?: Date;
  pickedBy?: string;
  notes?: string;
  substituteItemId?: string;
  substituteItemName?: string;
}

export interface PickingProgress {
  pickListId: string;
  totalItems: number;
  pickedItems: number;
  pendingItems: number;
  outOfStockItems: number;
  completionPercentage: number;
  estimatedCompletion?: Date;
}

// Import/Export
export enum ImportJobStatus {
  PENDING = 'pending',
  VALIDATING = 'validating',
  VALIDATED = 'validated',
  IMPORTING = 'importing',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  COMPLETED_WITH_ERRORS = 'completed_with_errors'
}

export enum ImportType {
  ITEMS = 'items',
  STOCK_LEVELS = 'stock_levels',
  SUPPLIERS = 'suppliers',
  WAREHOUSES = 'warehouses',
  TAGS = 'tags'
}

export interface ImportJob {
  id: string;
  filename?: string;
  fileName?: string;
  storageKey?: string;
  fileStorageKey?: string;
  importType?: ImportType;
  status: ImportJobStatus;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  skippedRows?: number;
  errors: ImportError[];
  warnings?: ImportWarning[];
  options: ImportOptions;
  errorMessage?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ImportOptions {
  updateExisting: boolean;
  skipErrors: boolean;
  duplicateHandling?: 'skip' | 'update' | 'error';
  defaultWarehouseId?: string;
  defaultCategoryId?: string;
  validateOnly: boolean;
  columnMappings?: Record<string, string>;
}

export interface ImportError {
  rowNumber?: number;
  row?: number;
  column: string;
  value?: string;
  errorMessage?: string;
  message?: string;
  errorCode?: string;
}

export interface ImportWarning {
  rowNumber: number;
  column: string;
  value: string;
  warningMessage: string;
}

export interface ImportTemplate {
  name: string;
  description: string;
  importType?: ImportType;
  filename?: string;
  downloadUrl: string;
  format: 'csv' | 'xlsx';
  columns?: ImportColumn[];
}

export interface ImportColumn {
  name: string;
  description: string;
  required: boolean;
  dataType: string;
  example: string;
  validValues?: string[];
}

export enum ExportJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum ExportType {
  ITEMS = 'items',
  STOCK_LEVELS = 'stock_levels',
  STOCK_MOVEMENTS = 'stock_movements',
  PURCHASE_ORDERS = 'purchase_orders',
  SUPPLIERS = 'suppliers',
  CHECKOUTS = 'checkouts',
  AUDIT_LOG = 'audit_log'
}

export enum ExportFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
  JSON = 'json'
}

export interface ExportJob {
  id: string;
  exportType?: ExportType;
  format?: ExportFormat;
  outputFormat?: 'csv' | 'xlsx';
  status: ExportJobStatus;
  filters?: ExportFilters;
  columns?: string[];
  totalRecords?: number;
  totalItems?: number;
  includePhotos?: boolean;
  includeStockLevels?: boolean;
  includeCustomFields?: boolean;
  downloadUrl?: string;
  outputUrl?: string;
  outputStorageKey?: string;
  errorMessage?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
}

export interface ExportFilters {
  categories?: string[];
  categoryIds?: string[];
  statuses?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  warehouseIds?: string[];
  tagIds?: string[];
  lowStockOnly?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  search?: string;
}

// Reports & Analytics
export enum ReportType {
  STOCK_SUMMARY = 'stock_summary',
  STOCK_VALUATION = 'stock_valuation',
  LOW_STOCK = 'low_stock',
  EXPIRING_ITEMS = 'expiring_items',
  MOVEMENT_HISTORY = 'movement_history',
  CHECKOUT_ACTIVITY = 'checkout_activity',
  REORDER_RECOMMENDATIONS = 'reorder_recommendations',
  USAGE_TRENDS = 'usage_trends',
  SUPPLIER_PERFORMANCE = 'supplier_performance',
  AUDIT_TRAIL = 'audit_trail',
  CUSTOM = 'custom'
}

export interface SavedReport {
  id: string;
  name: string;
  description?: string;
  reportType: ReportType;
  filters: ReportFilters;
  columns: string[];
  sortBy?: string;
  sortDescending: boolean;
  groupBy?: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportFilters {
  dateFrom?: Date;
  dateTo?: Date;
  categories?: string[];
  warehouses?: string[];
  suppliers?: string[];
  tags?: string[];
  statuses?: string[];
  search?: string;
  includeInactive?: boolean;
  customFilters?: Record<string, string>;
}

export enum SubscriptionFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export enum ReportExportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  XLSX = 'xlsx'
}

export interface ReportSubscription {
  id: string;
  savedReportId: string;
  savedReportName: string;
  subscriberId: string;
  subscriberEmail: string;
  frequency: SubscriptionFrequency;
  dayOfWeek?: string;
  dayOfMonth?: number;
  timeOfDay: string;
  timezone: string;
  format: ReportExportFormat;
  isActive: boolean;
  lastSentAt?: Date;
  nextScheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportResult {
  reportId: string;
  reportType: ReportType;
  title: string;
  generatedAt: Date;
  filtersApplied: ReportFilters;
  columns: ReportColumn[];
  rows: ReportRow[];
  summary: ReportSummary;
  totalRows: number;
}

export interface ReportColumn {
  key: string;
  label: string;
  dataType: string;
  format?: string;
  sortable: boolean;
  aggregate?: string;
}

export interface ReportRow {
  values: Record<string, any>;
}

export interface ReportSummary {
  totalRecords: number;
  aggregates: Record<string, number>;
  insights: ReportInsight[];
}

export enum InsightSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  POSITIVE = 'positive'
}

export interface ReportInsight {
  title: string;
  description: string;
  severity: InsightSeverity;
  metricValue: string;
  comparisonValue?: string;
  changePercentage?: number;
}

export interface InventoryAnalytics {
  totalItems: number;
  totalSkuCount: number;
  totalStockValue: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringSoonCount: number;
  itemsReceivedThisMonth: number;
  itemsIssuedThisMonth: number;
  turnoverRate: number;
  stockValueTrend: TrendDataPoint[];
  usageTrend: TrendDataPoint[];
  categoryDistribution: CategoryBreakdown[];
}

export interface TrendDataPoint {
  date: Date;
  value: number;
  label?: string;
}

export interface CategoryBreakdown {
  category: string;
  itemCount: number;
  value: number;
  percentage: number;
}

// Webhooks & API Integration
export enum WebhookEventType {
  ITEM_CREATED = 'item.created',
  ITEM_UPDATED = 'item.updated',
  ITEM_DELETED = 'item.deleted',
  STOCK_ADJUSTED = 'stock.adjusted',
  STOCK_TRANSFERRED = 'stock.transferred',
  LOW_STOCK = 'stock.low',
  STOCK_LOW = 'stock.low',
  OUT_OF_STOCK = 'stock.out',
  STOCK_OUT = 'stock.out',
  EXPIRING_SOON = 'stock.expiring',
  EXPIRED = 'stock.expired',
  CHECKED_OUT = 'checkout.created',
  CHECKOUT_CREATED = 'checkout.created',
  CHECKED_IN = 'checkout.returned',
  CHECKOUT_RETURNED = 'checkout.returned',
  CHECKOUT_OVERDUE = 'checkout.overdue',
  PO_CREATED = 'purchase_order.created',
  PO_APPROVED = 'purchase_order.approved',
  PO_RECEIVED = 'purchase_order.received',
  DATE_ALERT = 'alert.date',
  MAINTENANCE_DUE = 'alert.maintenance',
  IMPORT_COMPLETED = 'import.completed',
  EXPORT_COMPLETED = 'export.completed'
}

export enum WebhookEndpointStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  FAILING = 'failing',
  DISABLED = 'disabled'
}

export interface WebhookRetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  description?: string;
  url: string;
  secret?: string;
  events: WebhookEventType[];
  status?: WebhookEndpointStatus;
  isActive: boolean;
  headers?: Record<string, string>;
  retryConfig?: WebhookRetryConfig;
  retryPolicy?: WebhookRetryPolicy;
  stats?: WebhookEndpointStats;
  lastDeliveryAt?: Date;
  lastDeliveryStatus?: WebhookDeliveryStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookRetryConfig {
  maxAttempts: number;
  initialDelaySeconds: number;
  maxDelaySeconds: number;
  backoffMultiplier: number;
}

export interface WebhookEndpointStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  successRate: number;
  lastSuccessAt?: Date;
  lastFailureAt?: Date;
  averageResponseTimeMs: number;
}

export enum WebhookDeliveryStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  endpointName: string;
  eventType: WebhookEventType;
  eventId: string;
  status: WebhookDeliveryStatus;
  attemptNumber?: number;
  attempts?: number;
  httpStatusCode?: number;
  requestPayload?: string;
  payload?: Record<string, unknown>;
  responseBody?: string;
  errorMessage?: string;
  responseTimeMs?: number;
  createdAt: Date;
  deliveredAt?: Date;
  nextRetryAt?: Date;
}

export interface APIKey {
  id: string;
  name: string;
  description?: string;
  keyPrefix: string;
  scopes: string[];
  expiresAt?: Date;
  lastUsedAt?: Date;
  lastUsedIp?: string;
  isActive: boolean;
  rateLimit?: number;
  rateLimitPerMinute?: number;
  allowedIps?: string[];
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface APIKeyUsage {
  apiKeyId?: string;
  date: Date;
  requestCount: number;
  successCount?: number;
  errorCount: number;
  endpointUsage?: Record<string, number>;
}

// Offline Sync
export enum SyncEntityType {
  ITEM = 'item',
  STOCK_LEVEL = 'stock_level',
  CHECKOUT = 'checkout',
  WAREHOUSE = 'warehouse',
  TAG = 'tag',
  PICK_LIST = 'pick_list'
}

export enum SyncOperation {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

export interface SyncChange {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  version: number;
  changedAt: Date;
  data: string;
}

export interface SyncCursor {
  entityType: SyncEntityType;
  lastSyncVersion: number;
  lastSyncAt: Date;
}

export enum OfflineActionType {
  ADJUST_STOCK = 'adjust_stock',
  CHECKOUT = 'checkout',
  CHECKIN = 'checkin',
  SCAN_RECEIVE = 'scan_receive',
  PICK_ITEM = 'pick_item',
  CREATE_ITEM = 'create_item',
  UPDATE_ITEM = 'update_item'
}

export interface OfflineAction {
  id: string;
  clientId: string;
  deviceId: string;
  actionType: OfflineActionType;
  entityType: SyncEntityType;
  entityId?: string;
  payload: string;
  createdAt: Date;
  retryCount: number;
}

export enum OfflineActionResultStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  CONFLICT_RESOLVED = 'conflict_resolved',
  CONFLICT_REJECTED = 'conflict_rejected'
}

export interface OfflineActionResult {
  actionId: string;
  status: OfflineActionResultStatus;
  errorMessage?: string;
  conflictResolution?: string;
  serverEntityId?: string;
  serverVersion?: number;
}

export enum SyncHealth {
  HEALTHY = 'healthy',
  STALE = 'stale',
  ERROR = 'error'
}

export interface SyncStatus {
  clientId: string;
  deviceId: string;
  lastFullSync?: Date;
  lastDeltaSync?: Date;
  pendingChanges: number;
  pendingOfflineActions: number;
  isOnline: boolean;
  health: SyncHealth;
}

// ==========================================
// SHIPMENT TRACKING MODELS
// ==========================================

export enum ShipmentType {
  OUTBOUND = 'outbound',
  RETURN = 'return',
  TRANSFER = 'transfer'
}

export enum ShipmentStatus {
  PENDING = 'pending',
  READY_TO_SHIP = 'ready_to_ship',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum ReturnRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  LABEL_SENT = 'return_label_sent',
  IN_TRANSIT = 'in_transit',
  RECEIVED = 'received',
  INSPECTED = 'inspected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ReturnReason {
  END_OF_USE = 'end_of_use',
  DEFECTIVE = 'defective',
  EXCHANGE = 'exchange',
  RECALL = 'recall',
  OTHER = 'other'
}

export interface RecipientInfo {
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  shipmentType: ShipmentType;
  status: ShipmentStatus;

  // Carrier info
  carrier?: string;
  trackingNumber?: string;
  shippingMethod?: string;

  // Recipient
  recipient: RecipientInfo;

  // Internal reference
  department?: string;
  costCenter?: string;
  referenceNumber?: string;
  referenceType?: string;
  warehouseId?: string;
  warehouseName?: string;

  // Dates
  createdAt: Date;
  scheduledShipDate?: Date;
  shippedAt?: Date;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  expectedReturnDate?: Date;

  // Return info
  returnReason?: string;

  // Users
  createdBy: string;
  createdByName?: string;
  shippedBy?: string;
  shippedByName?: string;

  // Additional fields
  notes?: string;
  specialInstructions?: string;
  signatureRequired: boolean;
  insuranceValue?: number;

  // Related data
  items: ShipmentItem[];
  statusHistory?: ShipmentStatusHistory[];

  updatedAt: Date;
}

export interface ShipmentItem {
  id: string;
  shipmentId: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  stockLevelId?: string;
  quantity: number;
  lotNumber?: string;
  serialNumber?: string;
  expirationDate?: Date;
  conditionOnShip: string;
  conditionOnReturn?: string;
  checkoutId?: string;
  notes?: string;
  createdAt: Date;
}

export interface ShipmentStatusHistory {
  id: string;
  shipmentId: string;
  status: ShipmentStatus;
  location?: string;
  notes?: string;
  performedBy?: string;
  performedByName?: string;
  performedAt: Date;
  carrierEventCode?: string;
  carrierEventDescription?: string;
}

export interface ReturnRequest {
  id: string;
  returnNumber: string;
  originalShipmentId?: string;
  originalShipmentNumber?: string;
  checkoutId?: string;
  status: ReturnRequestStatus;

  // Requestor info
  requestorName: string;
  requestorEmail?: string;
  requestorPhone?: string;

  // Return details
  reason: ReturnReason;
  reasonDetails?: string;

  // Dates
  requestedAt: Date;
  approvedAt?: Date;
  expectedReturnDate?: Date;
  actualReturnDate?: Date;

  // Users
  requestedBy?: string;
  approvedBy?: string;
  receivedBy?: string;

  // Return shipping
  returnCarrier?: string;
  returnTrackingNumber?: string;
  returnLabelUrl?: string;

  // Inspection
  inspectionNotes?: string;
  inspectionPassed?: boolean;

  notes?: string;
  items: ReturnRequestItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ReturnRequestItem {
  id: string;
  returnRequestId: string;
  shipmentItemId?: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  quantity: number;
  serialNumber?: string;
  lotNumber?: string;
  expectedCondition?: string;
  actualCondition?: string;
  restockable?: boolean;
  restockNotes?: string;
}

export interface ShipmentSummary {
  totalShipments: number;
  pendingShipments: number;
  inTransitShipments: number;
  deliveredThisMonth: number;
  pendingReturns: number;
  overdueReturns: number;
}

// ==========================================
// DISCARD/EXPIRE WORKFLOW MODELS
// ==========================================

export enum DiscardStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum DisposalMethod {
  GENERAL = 'general',
  BIOHAZARD = 'biohazard',
  SHARPS = 'sharps',
  PHARMACEUTICAL = 'pharmaceutical',
  CONTROLLED = 'controlled',
  CHEMICAL = 'chemical',
  RECYCLABLE = 'recyclable'
}

export enum ExpirationAlertType {
  EXPIRING_SOON = 'expiring_soon',
  EXPIRED = 'expired'
}

export enum ResolutionType {
  DISCARDED = 'discarded',
  USED = 'used',
  EXTENDED = 'extended',
  OTHER = 'other'
}

export interface DiscardReason {
  id: string;
  code: string;
  name: string;
  description?: string;
  requiresApproval: boolean;
  requiresWitness: boolean;
  isWaste: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscardRecord {
  id: string;
  discardNumber: string;

  // Item information
  itemId: string;
  itemName: string;
  itemSku: string;
  stockLevelId?: string;
  lotBarcodeId?: string;

  // Lot tracking
  lotNumber?: string;
  serialNumber?: string;
  expirationDate?: Date;

  // Quantity and cost
  quantity: number;
  unitCost?: number;
  totalCost?: number;

  // Reason
  reasonId: string;
  reasonCode: string;
  reasonName: string;
  reasonNotes?: string;

  // Status
  status: DiscardStatus;

  // Approval
  requiresApproval: boolean;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: Date;
  approvalNotes?: string;

  // Witness (for controlled substances)
  requiresWitness: boolean;
  witnessedBy?: string;
  witnessedByName?: string;
  witnessedAt?: Date;
  witnessNotes?: string;

  // Disposal
  disposalMethod?: DisposalMethod;
  disposalLocation?: string;
  disposalVerified: boolean;
  disposalVerifiedAt?: Date;
  disposalVerifiedBy?: string;

  // Source context
  sourceType?: string;
  sourceReferenceId?: string;

  // Audit
  createdBy: string;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpirationAlert {
  id: string;

  // Item/Stock reference
  itemId: string;
  itemName: string;
  itemSku: string;
  stockLevelId?: string;
  lotBarcodeId?: string;

  // Lot info
  lotNumber?: string;
  expirationDate: Date;
  quantity: number;

  // Alert info
  alertType: ExpirationAlertType;
  daysUntilExpiry: number;

  // Alert tracking
  firstAlertedAt: Date;
  lastAlertedAt: Date;
  alertCount: number;

  // Resolution
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolvedByName?: string;
  resolutionType?: ResolutionType;
  resolutionNotes?: string;
  discardRecordId?: string;

  // Acknowledgment
  isAcknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface WasteByReason {
  reasonCode: string;
  reasonName: string;
  count: number;
  quantity: number;
  cost: number;
  percentage: number;
}

export interface WasteByItem {
  itemId: string;
  itemName: string;
  itemSku: string;
  count: number;
  quantity: number;
  cost: number;
}

export interface WasteByMonth {
  month: Date;
  count: number;
  quantity: number;
  cost: number;
}

export interface WasteReport {
  startDate: Date;
  endDate: Date;
  totalDiscards: number;
  totalQuantity: number;
  totalCost: number;
  byReason: WasteByReason[];
  byItem: WasteByItem[];
  byMonth: WasteByMonth[];
}

export interface DiscardSummary {
  pendingDiscards: number;
  pendingApprovals: number;
  completedThisMonth: number;
  totalWasteCostThisMonth: number;
  expiringAlerts: number;
  expiredAlerts: number;
}

// ==========================================
// PURCHASE ORDER & AUTO-PO MODELS
// ==========================================

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  SENT = 'sent',
  PARTIALLY_RECEIVED = 'partially_received',
  RECEIVED = 'received',
  CANCELLED = 'cancelled'
}

export interface PurchaseOrderLine {
  id: string;
  itemId: string;
  itemName: string;
  sku?: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  lineTotal: number;
  lotNumber?: string;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  lines: PurchaseOrderLine[];
  totalAmount: number;
  notes?: string;
  createdBy: string;
  createdByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  orderDate: Date;
  expectedDelivery?: Date;
  receivedDate?: Date;
  isAutoPO?: boolean;
  autoPORuleId?: string;
  autoPORuleName?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Auto-PO Configuration
export enum AutoPOTriggerType {
  REORDER_LEVEL = 'reorder_level',
  SCHEDULED = 'scheduled',
  STOCK_MOVEMENT = 'stock_movement',
  MANUAL = 'manual'
}

export enum AutoPOQuantityMethod {
  REORDER_QUANTITY = 'reorder_quantity',
  FIXED = 'fixed',
  UP_TO_MAX = 'up_to_max',
  DAYS_OF_STOCK = 'days_of_stock',
  ECONOMIC_ORDER = 'economic_order'
}

export interface AutoPORule {
  id: string;
  name: string;
  description?: string;
  isEnabled: boolean;

  // Trigger conditions
  triggerType: AutoPOTriggerType;
  thresholdPercentage: number;

  // Scope
  itemIds: string[];
  categoryFilters: string[];
  tagIds: string[];
  warehouseId?: string;

  // PO Generation settings
  defaultSupplierId?: string;
  defaultSupplierName?: string;
  quantityMethod: AutoPOQuantityMethod;
  fixedQuantity?: number;
  daysOfStock?: number;
  multiplier: number;
  minimumOrderQuantity: number;
  maximumOrderQuantity: number;

  // Approval settings
  requiresApproval: boolean;
  approvalThreshold: number;
  approverIds: string[];

  // Consolidation settings
  consolidateBySupplier: boolean;
  consolidationWindowHours: number;

  // Schedule
  scheduleCron?: string;

  // Notifications
  notifyOnCreation: boolean;
  notifyOnApprovalNeeded: boolean;
  notificationEmails: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastTriggeredAt?: Date;
  totalPOsGenerated: number;
}

export enum AutoPOExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  COMPLETED_WITH_WARNINGS = 'completed_with_warnings',
  FAILED = 'failed'
}

export enum AutoPOIssueType {
  NO_SUPPLIER = 'no_supplier',
  SUPPLIER_INACTIVE = 'supplier_inactive',
  NO_UNIT_COST = 'no_unit_cost',
  BELOW_MINIMUM = 'below_minimum',
  ABOVE_MAXIMUM = 'above_maximum',
  PENDING_PO_EXISTS = 'pending_po_exists',
  CALCULATION_ERROR = 'calculation_error'
}

export interface AutoPOExecutionIssue {
  itemId: string;
  itemName: string;
  issueType: AutoPOIssueType;
  message: string;
}

export interface AutoPOExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  executedAt: Date;
  status: AutoPOExecutionStatus;

  // Results
  itemsEvaluated: number;
  itemsBelowThreshold: number;
  posCreated: number;
  linesCreated: number;
  totalValue: number;

  // Created POs
  purchaseOrderIds: string[];

  // Issues
  issues: AutoPOExecutionIssue[];

  triggeredBy: string;
}

export interface ItemSupplierPreference {
  id: string;
  itemId: string;
  supplierId: string;
  supplierName: string;
  priority: number;
  supplierSku?: string;
  unitCost: number;
  minimumOrderQty: number;
  leadTimeDays: number;
  isActive: boolean;
  notes?: string;
  lastOrderedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutoPOSummary {
  activeRules: number;
  itemsMonitored: number;
  itemsBelowReorder: number;
  pendingAutoPOs: number;
  posCreatedToday: number;
  posCreatedThisWeek: number;
  posCreatedThisMonth: number;
  totalValueThisMonth: number;
  lastExecutionAt?: Date;
  recentExecutions: AutoPOExecution[];
}

export interface AutoPOPreviewItem {
  itemId: string;
  itemName: string;
  sku: string;
  currentQuantity: number;
  reorderLevel: number;
  suggestedQuantity: number;
  unitCost: number;
  lineTotal: number;
  supplierId?: string;
  supplierName?: string;
  hasWarning: boolean;
  warningMessage?: string;
}

export interface AutoPOPreview {
  ruleId?: string;
  items: AutoPOPreviewItem[];
  totalItems: number;
  totalPOs: number;
  totalValue: number;
  warnings: AutoPOExecutionIssue[];
}

// PO Statistics for Dashboard
export interface POStats {
  totalPOs: number;
  pendingApproval: number;
  awaitingDelivery: number;
  receivedThisMonth: number;
  totalValuePending: number;
  totalValueThisMonth: number;
  averageLeadTimeDays: number;
  onTimeDeliveryRate: number;
}

export interface POByStatus {
  status: PurchaseOrderStatus;
  count: number;
  value: number;
}

export interface POBySupplier {
  supplierId: string;
  supplierName: string;
  poCount: number;
  totalValue: number;
  averageLeadTime: number;
}

// ==========================================
// VENDOR PERFORMANCE METRICS MODELS
// ==========================================

export enum SupplierPerformanceTier {
  PLATINUM = 'platinum',
  GOLD = 'gold',
  SILVER = 'silver',
  BRONZE = 'bronze',
  AT_RISK = 'at_risk'
}

export interface DeliveryMetrics {
  totalDeliveries: number;
  onTimeDeliveries: number;
  earlyDeliveries: number;
  lateDeliveries: number;
  onTimeRate: number;
  averageLeadTimeDays: number;
  promisedLeadTimeDays: number;
  leadTimeVariance: number;
  averageDaysLate: number;
  maxDaysLate: number;
  deliveryScore: number;
  onTimeTrend: TrendPoint[];
}

export interface QualityMetrics {
  totalLineItemsReceived: number;
  itemsAccepted: number;
  itemsRejected: number;
  itemsRequiringRework: number;
  acceptanceRate: number;
  rejectionRate: number;
  defectRate: number;
  damagedItems: number;
  wrongItems: number;
  quantityDiscrepancies: number;
  documentationErrors: number;
  packagingIssues: number;
  expiredItemsReceived: number;
  qualityScore: number;
  returnRequests: number;
  returnRate: number;
}

export interface PricingMetrics {
  totalSpend: number;
  averageOrderValue: number;
  priceVariance: number;
  priceIncreases: number;
  priceDecreases: number;
  avgPriceChangePercent: number;
  priceCompetitivenessScore: number;
  costSavingsAchieved: number;
  potentialSavings: number;
  totalInvoices: number;
  accurateInvoices: number;
  invoiceDiscrepancies: number;
  invoiceAccuracyRate: number;
  pricingScore: number;
}

export interface ResponsivenessMetrics {
  avgQuoteResponseHours: number;
  avgInquiryResponseHours: number;
  avgIssueResolutionHours: number;
  avgOrderConfirmationHours: number;
  ordersRequiringFollowUp: number;
  supportTicketsOpened: number;
  supportTicketsResolved: number;
  supportSatisfactionScore: number;
  responsivenessScore: number;
}

export interface OrderMetrics {
  totalOrders: number;
  ordersCompleted: number;
  ordersCancelled: number;
  ordersPending: number;
  completionRate: number;
  cancellationRate: number;
  totalLinesOrdered: number;
  totalLinesFulfilled: number;
  lineFillRate: number;
  unitFillRate: number;
  backorderCount: number;
  backorderRate: number;
  avgBackorderDurationDays: number;
  orderScore: number;
}

export interface TrendPoint {
  date: Date;
  value: number;
  label?: string;
}

export enum PerformanceArea {
  DELIVERY = 'delivery',
  QUALITY = 'quality',
  PRICING = 'pricing',
  RESPONSIVENESS = 'responsiveness',
  ORDERS = 'orders'
}

export enum RecommendationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface PerformanceRecommendation {
  id: string;
  area: PerformanceArea;
  priority: RecommendationPriority;
  title: string;
  description: string;
  suggestedAction: string;
  potentialImpact: number;
}

export interface VendorPerformanceMetrics {
  supplierId: string;
  supplierName: string;
  periodStart: Date;
  periodEnd: Date;
  delivery: DeliveryMetrics;
  quality: QualityMetrics;
  pricing: PricingMetrics;
  responsiveness: ResponsivenessMetrics;
  orders: OrderMetrics;
  overallScore: number;
  tier: SupplierPerformanceTier;
  previousPeriodScore: number;
  scoreTrend: number;
  recommendations: PerformanceRecommendation[];
}

export interface VendorScorecard {
  supplierId: string;
  supplierName: string;
  category: VendorCategory;
  isActive: boolean;
  overallScore: number;
  tier: SupplierPerformanceTier;
  previousScore: number;
  scoreChange: number;
  deliveryScore: number;
  qualityScore: number;
  pricingScore: number;
  responsivenessScore: number;
  orderScore: number;
  totalOrders: number;
  totalSpend: number;
  onTimeRate: number;
  qualityRate: number;
  hasActiveIssues: boolean;
  contractExpiringSoon: boolean;
  daysUntilContractExpires?: number;
}

export interface VendorPerformanceSummary {
  totalActiveSuppliers: number;
  platinumTierCount: number;
  goldTierCount: number;
  silverTierCount: number;
  bronzeTierCount: number;
  atRiskCount: number;
  averageOnTimeRate: number;
  averageQualityRate: number;
  totalSpendPeriod: number;
  topPerformers: VendorScorecard[];
  needsAttention: VendorScorecard[];
  recentlyImproved: VendorScorecard[];
  declining: VendorScorecard[];
  openQualityIssues: number;
  lateDeliveriesThisMonth: number;
  contractsExpiringSoon: number;
}

export interface VendorComparisonItem {
  supplierId: string;
  supplierName: string;
  overallScore: number;
  deliveryScore: number;
  qualityScore: number;
  pricingScore: number;
  responsivenessScore: number;
  totalOrders: number;
  totalSpend: number;
}

export interface VendorComparison {
  vendors: VendorComparisonItem[];
  categoryAverage?: VendorComparisonItem;
  overallAverage?: VendorComparisonItem;
}

export enum PerformanceIssueType {
  LATE_DELIVERY = 'late_delivery',
  QUALITY_DEFECT = 'quality_defect',
  WRONG_ITEM = 'wrong_item',
  QUANTITY_SHORT = 'quantity_short',
  DAMAGED_GOODS = 'damaged_goods',
  PRICING_DISCREPANCY = 'pricing_discrepancy',
  DOCUMENTATION_ERROR = 'documentation_error',
  COMMUNICATION_FAILURE = 'communication_failure',
  BACKORDER = 'backorder',
  EXPIRED_PRODUCT = 'expired_product'
}

export enum PerformanceIssueSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum PerformanceIssueStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING_VENDOR = 'pending_vendor',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export interface VendorPerformanceIssue {
  id: string;
  supplierId: string;
  supplierName: string;
  issueType: PerformanceIssueType;
  severity: PerformanceIssueSeverity;
  title: string;
  description: string;
  relatedPoId?: string;
  relatedPoNumber?: string;
  relatedItemId?: string;
  relatedItemName?: string;
  financialImpact?: number;
  operationalImpact?: string;
  status: PerformanceIssueStatus;
  resolutionNotes?: string;
  assignedTo?: string;
  dueDate?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorScoringWeights {
  id: string;
  name: string;
  isDefault: boolean;
  deliveryWeight: number;
  qualityWeight: number;
  pricingWeight: number;
  responsivenessWeight: number;
  orderWeight: number;
  platinumThreshold: number;
  goldThreshold: number;
  silverThreshold: number;
  bronzeThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// HELP DESK / TICKETING SYSTEM MODELS
// ==========================================

export enum TicketStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  PENDING = 'Pending',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed'
}

export enum TicketPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent'
}

export enum TicketCategory {
  EQUIPMENT_ISSUE = 'Equipment Issue',
  INVENTORY_REQUEST = 'Inventory Request',
  MAINTENANCE_REQUEST = 'Maintenance Request',
  IT_SUPPORT = 'IT Support',
  GENERAL_INQUIRY = 'General Inquiry'
}

export enum SLAStatus {
  ON_TRACK = 'On Track',
  AT_RISK = 'At Risk',
  BREACHED = 'Breached'
}

export interface Ticket {
  id: string;
  tenantId: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  requesterId: string;
  requesterName: string;
  requesterEmail?: string;
  assignedToId?: string;
  assignedToName?: string;
  relatedEquipmentId?: string;
  relatedEquipmentName?: string;
  relatedInventoryItemId?: string;
  relatedInventoryItemName?: string;
  slaResponseStatus: SLAStatus;
  slaResolutionStatus: SLAStatus;
  responseDeadline?: Date;
  resolutionDeadline?: Date;
  firstResponseAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  tags?: string[];
  attachments?: TicketAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketAttachment {
  id: string;
  ticketId: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  storageKey: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  isInternal: boolean;
  attachments?: TicketAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketHistory {
  id: string;
  ticketId: string;
  action: TicketHistoryAction;
  performedById: string;
  performedByName: string;
  oldValue?: string;
  newValue?: string;
  field?: string;
  notes?: string;
  createdAt: Date;
}

export enum TicketHistoryAction {
  CREATED = 'Created',
  STATUS_CHANGED = 'Status Changed',
  PRIORITY_CHANGED = 'Priority Changed',
  ASSIGNED = 'Assigned',
  REASSIGNED = 'Reassigned',
  UNASSIGNED = 'Unassigned',
  COMMENT_ADDED = 'Comment Added',
  ATTACHMENT_ADDED = 'Attachment Added',
  CATEGORY_CHANGED = 'Category Changed',
  RESOLVED = 'Resolved',
  REOPENED = 'Reopened',
  CLOSED = 'Closed',
  ESCALATED = 'Escalated',
  SLA_BREACHED = 'SLA Breached'
}

export interface SLAConfig {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  priority: TicketPriority;
  category?: TicketCategory;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  businessHoursOnly: boolean;
  businessHoursStart: string; // HH:mm format
  businessHoursEnd: string;
  workingDays: number[]; // 0=Sunday, 1=Monday, etc.
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  pendingTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  avgResolutionTimeHours: number;
  avgFirstResponseTimeMinutes: number;
  slaComplianceRate: number;
  ticketsByCategory: { category: TicketCategory; count: number }[];
  ticketsByPriority: { priority: TicketPriority; count: number }[];
  ticketsOverTime: { date: Date; opened: number; closed: number }[];
  topAssignees: { userId: string; userName: string; ticketCount: number }[];
}

export interface TicketFilter {
  search?: string;
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assignedToId?: string;
  requesterId?: string;
  slaStatus?: SLAStatus[];
  dateFrom?: Date;
  dateTo?: Date;
}

// ==========================================
// DEPRECIATION TRACKING MODELS
// ==========================================

export enum DepreciationMethod {
  STRAIGHT_LINE = 'Straight Line',
  DECLINING_BALANCE = 'Declining Balance',
  DOUBLE_DECLINING_BALANCE = 'Double Declining Balance',
  SUM_OF_YEARS_DIGITS = 'Sum of Years Digits',
  UNITS_OF_PRODUCTION = 'Units of Production'
}

export enum DepreciationType {
  BOOK = 'Book',
  TAX = 'Tax'
}

export enum DepreciationPeriod {
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly',
  ANNUALLY = 'Annually'
}

export enum DepreciationStatus {
  ACTIVE = 'Active',
  FULLY_DEPRECIATED = 'Fully Depreciated',
  SUSPENDED = 'Suspended',
  DISPOSED = 'Disposed'
}

export interface DepreciationConfig {
  id: string;
  tenantId: string;
  equipmentId: string;
  equipmentName: string;
  equipmentInventoryNumber?: string;
  depreciationType: DepreciationType;
  method: DepreciationMethod;
  acquisitionCost: number;
  salvageValue: number;
  depreciableBasis: number; // acquisitionCost - salvageValue
  usefulLifeYears: number;
  usefulLifeMonths: number;
  totalUnits?: number; // For units of production method
  unitsUsedToDate?: number;
  placedInServiceDate: Date;
  depreciationStartDate: Date;
  expectedEndDate: Date;
  period: DepreciationPeriod;
  status: DepreciationStatus;
  accumulatedDepreciation: number;
  currentBookValue: number;
  percentDepreciated: number;
  lastCalculationDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepreciationScheduleEntry {
  id: string;
  configId: string;
  periodNumber: number;
  periodStartDate: Date;
  periodEndDate: Date;
  beginningBookValue: number;
  depreciationExpense: number;
  accumulatedDepreciation: number;
  endingBookValue: number;
  unitsProduced?: number; // For units of production method
  isActual: boolean; // true if actual, false if projected
  isProcessed: boolean;
  processedAt?: Date;
  notes?: string;
}

export interface DepreciationSummary {
  totalAssets: number;
  totalAcquisitionCost: number;
  totalAccumulatedDepreciation: number;
  totalCurrentBookValue: number;
  depreciationExpenseThisMonth: number;
  depreciationExpenseYTD: number;
  fullyDepreciatedAssets: number;
  activeDepreciatingAssets: number;
  assetsByMethod: { method: DepreciationMethod; count: number; value: number }[];
  assetsByDepartment: { department: string; count: number; bookValue: number }[];
  upcomingFullyDepreciated: DepreciationConfig[]; // Next 90 days
}

export interface DepreciationReport {
  reportDate: Date;
  periodStart: Date;
  periodEnd: Date;
  reportType: 'summary' | 'detail' | 'schedule' | 'variance';
  assets: DepreciationReportAsset[];
  totals: {
    acquisitionCost: number;
    accumulatedDepreciation: number;
    bookValue: number;
    periodExpense: number;
  };
}

export interface DepreciationReportAsset {
  equipmentId: string;
  equipmentName: string;
  inventoryNumber: string;
  department: string;
  category: string;
  method: DepreciationMethod;
  acquisitionCost: number;
  acquisitionDate: Date;
  usefulLife: number;
  salvageValue: number;
  accumulatedDepreciation: number;
  bookValue: number;
  periodExpense: number;
  percentDepreciated: number;
  status: DepreciationStatus;
}

export interface DepreciationCalculationRequest {
  equipmentId: string;
  method: DepreciationMethod;
  acquisitionCost: number;
  salvageValue: number;
  usefulLifeYears: number;
  placedInServiceDate: Date;
  period: DepreciationPeriod;
  totalUnits?: number;
  declineRate?: number; // For declining balance methods
}

export interface DepreciationCalculationResult {
  depreciableBasis: number;
  periodsCount: number;
  schedule: DepreciationScheduleEntry[];
  summary: {
    totalDepreciation: number;
    averageAnnualDepreciation: number;
    finalBookValue: number;
  };
}

// ==========================================
// MULTI-TENANCY MODELS
// ==========================================

export enum TenantStatus {
  ACTIVE = 'Active',
  SUSPENDED = 'Suspended',
  PENDING = 'Pending',
  TRIAL = 'Trial'
}

export enum SubscriptionPlan {
  BASIC = 'Basic',
  PROFESSIONAL = 'Professional',
  ENTERPRISE = 'Enterprise'
}

export enum TenantRole {
  SUPER_ADMIN = 'Super Admin',
  TENANT_ADMIN = 'Tenant Admin',
  MANAGER = 'Manager',
  STAFF = 'Staff',
  VIEWER = 'Viewer'
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  subscriptionPlan: SubscriptionPlan;
  featureFlags: TenantFeatureFlags;
  branding: TenantBranding;
  contact: TenantContactInfo;
  billing?: TenantBillingInfo;
  settings: TenantSettings;
  createdAt: Date;
  updatedAt: Date;
  trialEndsAt?: Date;
  suspendedAt?: Date;
  suspensionReason?: string;
}

export interface TenantFeatureFlags {
  maxUsers: number;
  maxEquipment: number;
  maxInventoryItems: number;
  advancedReporting: boolean;
  apiAccess: boolean;
  webhooksEnabled: boolean;
  customBranding: boolean;
  complianceModules: ComplianceFramework[];
  offlineMode: boolean;
  multiLocation: boolean;
  barcodePrinting: boolean;
  helpDesk: boolean;
  depreciation: boolean;
  advancedProcurement: boolean;
  dataExport: boolean;
}

export interface TenantBranding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  logoSmallUrl?: string;
  faviconUrl?: string;
  companyName: string;
  tagline?: string;
  emailHeaderHtml?: string;
  emailFooterHtml?: string;
  customCss?: string;
}

export interface TenantContactInfo {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
}

export interface TenantBillingInfo {
  billingEmail: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingPostalCode: string;
  billingCountry: string;
  taxId?: string;
  paymentMethod?: 'card' | 'invoice' | 'bank_transfer';
  stripeCustomerId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  monthlyAmount?: number;
  currency: string;
}

export interface TenantSettings {
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  currencySymbol: string;
  language: string;
  fiscalYearStart: string; // MM-DD format
  defaultDepartment?: string;
  defaultLocation?: string;
  maintenanceReminderDays: number;
  warrantyExpiryReminderDays: number;
  lowStockThresholdPercent: number;
  sessionTimeoutMinutes: number;
  requireMfa: boolean;
  allowedDomains?: string[];
  ipWhitelist?: string[];
}

export interface UserTenantMembership {
  id: string;
  userId: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  role: TenantRole;
  isDefault: boolean;
  status: 'active' | 'pending' | 'suspended';
  invitedBy?: string;
  invitedAt?: Date;
  acceptedAt?: Date;
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantInvitation {
  id: string;
  tenantId: string;
  tenantName: string;
  email: string;
  role: TenantRole;
  invitedBy: string;
  invitedByName: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: TenantRole;
  status: 'active' | 'inactive' | 'suspended';
  department?: string;
  title?: string;
  phone?: string;
  avatar?: string;
  lastLoginAt?: Date;
  mfaEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantStats {
  totalUsers: number;
  activeUsers: number;
  totalEquipment: number;
  totalInventoryItems: number;
  totalValue: number;
  storageUsedBytes: number;
  apiCallsThisMonth: number;
  lastActivityAt?: Date;
}

export interface TenantAuditLog {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  userAgent?: string;
  createdAt: Date;
}

export interface TenantSwitchContext {
  currentTenantId: string;
  currentTenantName: string;
  currentTenantSlug: string;
  currentRole: TenantRole;
  availableTenants: UserTenantMembership[];
}
