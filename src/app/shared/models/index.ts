// Equipment Types and Interfaces based on WHO Medical Device Technical Series

export interface Equipment {
  id: string;
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
