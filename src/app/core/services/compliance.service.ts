import { Injectable, signal, computed } from '@angular/core';
import {
  ComplianceFramework,
  ComplianceStatus,
  ComplianceConfig,
  ComplianceRegion,
  HIPAACompliance,
  DPDPCompliance,
  ABHACompliance,
  AustralianPrivacyCompliance,
  GDPRCompliance,
  AuditLog,
  AuditAction,
  AuditResourceType,
  ConsentRecord,
  ConsentType,
  ConsentStatus,
  DataSubjectRequest,
  DataSubjectRequestType,
  DataSubjectRequestStatus,
  DataBreach,
  BreachType,
  BreachSeverity,
  BreachStatus,
  ComplianceDashboardStats,
  FrameworkScore,
  ComplianceTask,
  ComplianceTaskCategory,
  CompliancePolicy,
  ComplianceTraining,
  DataClassification
} from '@shared/models';

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {
  // Compliance Configuration
  private _config = signal<ComplianceConfig>(this.getDefaultConfig());
  config = this._config.asReadonly();

  // Framework-specific compliance data
  private _hipaaCompliance = signal<HIPAACompliance>(this.getDefaultHIPAA());
  private _dpdpCompliance = signal<DPDPCompliance>(this.getDefaultDPDP());
  private _abhaCompliance = signal<ABHACompliance>(this.getDefaultABHA());
  private _australianCompliance = signal<AustralianPrivacyCompliance>(this.getDefaultAustralian());
  private _gdprCompliance = signal<GDPRCompliance>(this.getDefaultGDPR());

  hipaaCompliance = this._hipaaCompliance.asReadonly();
  dpdpCompliance = this._dpdpCompliance.asReadonly();
  abhaCompliance = this._abhaCompliance.asReadonly();
  australianCompliance = this._australianCompliance.asReadonly();
  gdprCompliance = this._gdprCompliance.asReadonly();

  // Audit Logs
  private _auditLogs = signal<AuditLog[]>(this.generateMockAuditLogs());
  auditLogs = this._auditLogs.asReadonly();

  // Consent Records
  private _consents = signal<ConsentRecord[]>(this.generateMockConsents());
  consents = this._consents.asReadonly();

  // Data Subject Requests
  private _dataRequests = signal<DataSubjectRequest[]>(this.generateMockDataRequests());
  dataRequests = this._dataRequests.asReadonly();

  // Data Breaches
  private _breaches = signal<DataBreach[]>(this.generateMockBreaches());
  breaches = this._breaches.asReadonly();

  // Compliance Tasks
  private _tasks = signal<ComplianceTask[]>(this.generateMockTasks());
  tasks = this._tasks.asReadonly();

  // Policies
  private _policies = signal<CompliancePolicy[]>(this.generateMockPolicies());
  policies = this._policies.asReadonly();

  // Training
  private _trainings = signal<ComplianceTraining[]>(this.generateMockTrainings());
  trainings = this._trainings.asReadonly();

  // Dashboard Stats
  dashboardStats = computed<ComplianceDashboardStats>(() => this.calculateDashboardStats());

  // Computed values
  activeConsents = computed(() => 
    this._consents().filter(c => c.status === ConsentStatus.ACTIVE).length
  );

  pendingRequests = computed(() =>
    this._dataRequests().filter(r => 
      r.status !== DataSubjectRequestStatus.COMPLETED && 
      r.status !== DataSubjectRequestStatus.REJECTED
    ).length
  );

  openBreaches = computed(() =>
    this._breaches().filter(b => b.status !== BreachStatus.CLOSED).length
  );

  overdueTasks = computed(() =>
    this._tasks().filter(t => 
      t.status !== 'Completed' && new Date(t.dueDate) < new Date()
    ).length
  );

  private getDefaultConfig(): ComplianceConfig {
    return {
      id: 'config-001',
      organizationId: 'org-001',
      enabledFrameworks: [
        ComplianceFramework.HIPAA,
        ComplianceFramework.DPDP,
        ComplianceFramework.ABHA,
        ComplianceFramework.AUSTRALIAN_PRIVACY,
        ComplianceFramework.GDPR
      ],
      primaryRegion: ComplianceRegion.US,
      secondaryRegions: [ComplianceRegion.INDIA, ComplianceRegion.AUSTRALIA, ComplianceRegion.ROMANIA],
      dataRetentionPeriod: 84, // 7 years
      auditRetentionPeriod: 72, // 6 years
      encryptionEnabled: true,
      encryptionAlgorithm: 'AES-256-GCM',
      autoLogoutMinutes: 15,
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expiryDays: 90,
        historyCount: 12
      },
      mfaRequired: true,
      consentRequired: true,
      dataLocalization: true,
      crossBorderTransferAllowed: true,
      lastReviewDate: new Date('2024-10-15'),
      nextReviewDate: new Date('2025-04-15'),
      updatedAt: new Date()
    };
  }

  private getDefaultHIPAA(): HIPAACompliance {
    return {
      id: 'hipaa-001',
      organizationId: 'org-001',
      privacyOfficer: 'Dr. Sarah Mitchell',
      securityOfficer: 'James Chen, CISSP',
      lastRiskAssessment: new Date('2024-09-01'),
      nextRiskAssessment: new Date('2025-03-01'),
      businessAssociateAgreements: [
        {
          id: 'baa-001',
          vendorId: 'v-001',
          vendorName: 'GE Healthcare',
          agreementDate: new Date('2023-01-15'),
          expiryDate: new Date('2026-01-15'),
          status: 'Active',
          lastReviewDate: new Date('2024-06-01')
        },
        {
          id: 'baa-002',
          vendorId: 'v-002',
          vendorName: 'Philips Medical',
          agreementDate: new Date('2023-03-20'),
          expiryDate: new Date('2025-03-20'),
          status: 'Active',
          lastReviewDate: new Date('2024-08-15')
        },
        {
          id: 'baa-003',
          vendorId: 'v-003',
          vendorName: 'Cloud Storage Provider',
          agreementDate: new Date('2022-06-01'),
          expiryDate: new Date('2025-02-01'),
          status: 'Active',
          lastReviewDate: new Date('2024-07-01')
        }
      ],
      breachNotificationPlan: true,
      employeeTrainingComplete: true,
      lastTrainingDate: new Date('2024-11-15'),
      physicalSafeguards: {
        implemented: true,
        lastAuditDate: new Date('2024-08-20'),
        findings: ['Badge access needs update in Building B'],
        remediationStatus: 'In Progress'
      },
      technicalSafeguards: {
        implemented: true,
        lastAuditDate: new Date('2024-09-15'),
        findings: [],
        remediationStatus: 'Complete'
      },
      administrativeSafeguards: {
        implemented: true,
        lastAuditDate: new Date('2024-10-01'),
        findings: ['Annual policy review pending'],
        remediationStatus: 'In Progress'
      },
      minimumNecessaryPolicy: true,
      deIdentificationProcedures: true,
      patientRightsPolicy: true,
      status: ComplianceStatus.COMPLIANT
    };
  }

  private getDefaultDPDP(): DPDPCompliance {
    return {
      id: 'dpdp-001',
      organizationId: 'org-001',
      dataFiduciary: 'GoEMR Healthcare Pvt. Ltd.',
      consentManager: 'Priya Sharma',
      grievanceOfficer: {
        name: 'Rajesh Kumar',
        email: 'grievance@goemr.in',
        phone: '+91-80-12345678',
        responseTimeDays: 7
      },
      dataProcessingPurposes: [
        {
          id: 'purpose-001',
          purpose: 'Healthcare Service Delivery',
          legalBasis: 'Consent',
          dataCategories: ['Personal Identification', 'Health Records', 'Contact Information'],
          retentionPeriod: 84,
          thirdPartySharing: false
        },
        {
          id: 'purpose-002',
          purpose: 'Equipment Maintenance Records',
          legalBasis: 'Legitimate Use',
          dataCategories: ['Operational Data', 'Service Records'],
          retentionPeriod: 60,
          thirdPartySharing: true
        },
        {
          id: 'purpose-003',
          purpose: 'Regulatory Compliance',
          legalBasis: 'Legal Obligation',
          dataCategories: ['Audit Logs', 'Compliance Records'],
          retentionPeriod: 96,
          thirdPartySharing: false
        }
      ],
      consentMechanismImplemented: true,
      dataLocalizationCompliant: true,
      childDataProtection: true,
      significantDataFiduciary: true,
      dataProtectionImpactAssessment: true,
      dataPrincipalRights: {
        rightToAccess: true,
        rightToCorrection: true,
        rightToErasure: true,
        rightToPortability: true,
        rightToNominate: true,
        grievanceRedressal: true
      },
      crossBorderTransferCompliant: true,
      approvedCountries: ['United States', 'European Union', 'Australia', 'Singapore'],
      breachNotificationProcedure: true,
      status: ComplianceStatus.COMPLIANT
    };
  }

  private getDefaultABHA(): ABHACompliance {
    return {
      id: 'abha-001',
      organizationId: 'org-001',
      healthFacilityRegistryId: 'IN2024HFR00123456',
      hipId: 'goemr.hip@abdm',
      hiuId: 'goemr.hiu@abdm',
      abdmIntegrationStatus: {
        gatewayConnected: true,
        consentManagerLinked: true,
        healthLockerIntegrated: true,
        lastSyncDate: new Date('2024-12-15'),
        syncStatus: 'Active'
      },
      abhaCreationEnabled: true,
      healthRecordsLinking: true,
      consentManagerIntegration: true,
      healthLockerSupport: true,
      hiuCallbackConfigured: true,
      hipCallbackConfigured: true,
      dataExchangeProtocol: 'FHIR',
      certificateStatus: {
        certificateId: 'ABDM-CERT-2024-12345',
        issuedDate: new Date('2024-01-01'),
        expiryDate: new Date('2025-12-31'),
        status: 'Valid'
      },
      lastHealthIdVerification: new Date('2024-12-10'),
      supportedHealthRecordTypes: [
        'Prescription',
        'Diagnostic Report',
        'OP Consultation',
        'Discharge Summary',
        'Immunization Record'
      ] as any,
      status: ComplianceStatus.COMPLIANT
    };
  }

  private getDefaultAustralian(): AustralianPrivacyCompliance {
    return {
      id: 'aus-001',
      organizationId: 'org-001',
      privacyOfficer: 'Michael Thompson',
      appCompliance: [
        { appNumber: 1, appName: 'Open and transparent management', status: ComplianceStatus.COMPLIANT, lastReviewDate: new Date('2024-09-01'), notes: 'Privacy policy updated' },
        { appNumber: 2, appName: 'Anonymity and pseudonymity', status: ComplianceStatus.COMPLIANT, lastReviewDate: new Date('2024-09-01'), notes: '' },
        { appNumber: 3, appName: 'Collection of solicited personal information', status: ComplianceStatus.COMPLIANT, lastReviewDate: new Date('2024-09-01'), notes: '' },
        { appNumber: 4, appName: 'Dealing with unsolicited personal information', status: ComplianceStatus.COMPLIANT, lastReviewDate: new Date('2024-09-01'), notes: '' },
        { appNumber: 5, appName: 'Notification of collection', status: ComplianceStatus.COMPLIANT, lastReviewDate: new Date('2024-09-01'), notes: '' },
        { appNumber: 6, appName: 'Use or disclosure', status: ComplianceStatus.COMPLIANT, lastReviewDate: new Date('2024-09-01'), notes: '' },
        { appNumber: 7, appName: 'Direct marketing', status: ComplianceStatus.COMPLIANT, lastReviewDate: new Date('2024-09-01'), notes: 'Opt-out mechanism in place' },
        { appNumber: 8, appName: 'Cross-border disclosure', status: ComplianceStatus.PARTIALLY_COMPLIANT, lastReviewDate: new Date('2024-09-01'), notes: 'Additional safeguards needed for India transfer' },
        { appNumber: 9, appName: 'Adoption, use or disclosure of government identifiers', status: ComplianceStatus.COMPLIANT, lastReviewDate: new Date('2024-09-01'), notes: '' },
        { appNumber: 10, appName: 'Quality of personal information', status: ComplianceStatus.COMPLIANT, lastReviewDate: new Date('2024-09-01'), notes: '' },
        { appNumber: 11, appName: 'Security of personal information', status: ComplianceStatus.COMPLIANT, lastReviewDate: new Date('2024-09-01'), notes: 'ISO 27001 certified' },
        { appNumber: 12, appName: 'Access to personal information', status: ComplianceStatus.COMPLIANT, lastReviewDate: new Date('2024-09-01'), notes: '' },
        { appNumber: 13, appName: 'Correction of personal information', status: ComplianceStatus.COMPLIANT, lastReviewDate: new Date('2024-09-01'), notes: '' }
      ],
      notifiableDataBreachScheme: true,
      privacyPolicy: {
        exists: true,
        lastUpdated: new Date('2024-08-15'),
        publiclyAccessible: true,
        coversAllAPPs: true
      },
      myHealthRecordsAct: {
        registered: true,
        registrationId: 'MHR-ORG-2024-5678',
        uploadEnabled: true,
        accessControlConfigured: true,
        emergencyAccessProcedures: true,
        auditTrailEnabled: true
      },
      healthRecordsActVic: true,
      crossBorderDisclosure: {
        allowed: true,
        approvedCountries: ['United States', 'European Union', 'Singapore', 'New Zealand'],
        contractualProtections: true,
        consentObtained: true
      },
      directMarketingCompliance: true,
      accessAndCorrectionProcedures: true,
      status: ComplianceStatus.COMPLIANT
    };
  }

  private getDefaultGDPR(): GDPRCompliance {
    return {
      id: 'gdpr-001',
      organizationId: 'org-001',
      dataProtectionOfficer: {
        required: true,
        appointed: true,
        name: 'Elena Popescu',
        email: 'dpo@goemr.ro',
        phone: '+40-21-1234567',
        registeredWithAuthority: true
      },
      processingRegister: true,
      lawfulBasisDocumented: true,
      privacyByDesign: true,
      privacyByDefault: true,
      dpia: {
        required: true,
        completed: true,
        lastAssessmentDate: new Date('2024-07-15'),
        highRiskProcessing: true,
        mitigationMeasures: [
          'Data encryption at rest and in transit',
          'Access controls with role-based permissions',
          'Regular security assessments',
          'Data minimization practices'
        ]
      },
      dataSubjectRights: {
        rightToBeInformed: true,
        rightOfAccess: true,
        rightToRectification: true,
        rightToErasure: true,
        rightToRestrictProcessing: true,
        rightToDataPortability: true,
        rightToObject: true,
        automatedDecisionMaking: true
      },
      breachNotificationProcedure: {
        procedureExists: true,
        notificationWithin72Hours: true,
        dataSubjectNotification: true,
        documentationProcess: true,
        lastBreachTest: new Date('2024-10-01')
      },
      internationalTransfers: {
        transfersOutsideEEA: true,
        adequacyDecisions: true,
        standardContractualClauses: true,
        bindingCorporateRules: false,
        approvedCountries: ['United States', 'India', 'Australia']
      },
      processorAgreements: true,
      employeeTraining: true,
      lastTrainingDate: new Date('2024-11-01'),
      romanianSpecific: {
        anspdcpRegistration: true,
        healthDataProcessingAuthorization: true,
        medicalRecordsRetention: 30,
        electronicHealthRecordCompliance: true,
        telemedicineRegulations: true,
        pharmacyDataRegulations: true
      },
      status: ComplianceStatus.COMPLIANT
    };
  }

  private generateMockAuditLogs(): AuditLog[] {
    const logs: AuditLog[] = [];
    const actions = Object.values(AuditAction);
    const resources = Object.values(AuditResourceType);
    const users = [
      { id: 'u-001', name: 'John Smith', role: 'Admin' },
      { id: 'u-002', name: 'Sarah Johnson', role: 'Manager' },
      { id: 'u-003', name: 'Mike Wilson', role: 'Technician' },
      { id: 'u-004', name: 'Emily Brown', role: 'Viewer' }
    ];

    for (let i = 0; i < 50; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const resource = resources[Math.floor(Math.random() * resources.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);

      logs.push({
        id: `log-${String(i + 1).padStart(3, '0')}`,
        timestamp: new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000),
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: action,
        resourceType: resource,
        resourceId: `${resource.toLowerCase().replace(' ', '-')}-${Math.floor(Math.random() * 100)}`,
        resourceName: `${resource} Record #${Math.floor(Math.random() * 1000)}`,
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        sessionId: `session-${Math.random().toString(36).substr(2, 9)}`,
        description: `${action} performed on ${resource}`,
        complianceFrameworks: [ComplianceFramework.HIPAA, ComplianceFramework.GDPR],
        riskLevel: ['Low', 'Medium', 'High', 'Critical'][Math.floor(Math.random() * 4)] as any,
        status: Math.random() > 0.1 ? 'Success' : 'Failed'
      });
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private generateMockConsents(): ConsentRecord[] {
    return [
      {
        id: 'consent-001',
        dataPrincipalId: 'patient-001',
        dataPrincipalName: 'Rajesh Patel',
        dataPrincipalEmail: 'rajesh.patel@email.com',
        consentType: ConsentType.DATA_PROCESSING,
        purposes: ['Healthcare Service Delivery', 'Medical Records Management'],
        dataCategories: [DataClassification.PHI, DataClassification.HEALTH_INFORMATION],
        grantedDate: new Date('2024-06-15'),
        expiryDate: new Date('2025-06-15'),
        status: ConsentStatus.ACTIVE,
        version: '2.0',
        ipAddress: '192.168.1.100',
        consentMethod: 'Electronic',
        frameworks: [ComplianceFramework.DPDP, ComplianceFramework.ABHA],
        auditTrail: [
          { timestamp: new Date('2024-06-15'), action: 'Granted', performedBy: 'Patient', details: 'Initial consent granted' }
        ]
      },
      {
        id: 'consent-002',
        dataPrincipalId: 'patient-002',
        dataPrincipalName: 'Sarah Williams',
        dataPrincipalEmail: 'sarah.williams@email.com',
        consentType: ConsentType.HEALTH_RECORDS_ACCESS,
        purposes: ['My Health Records Integration', 'Healthcare Coordination'],
        dataCategories: [DataClassification.HEALTH_INFORMATION],
        grantedDate: new Date('2024-08-20'),
        expiryDate: new Date('2025-08-20'),
        status: ConsentStatus.ACTIVE,
        version: '1.0',
        ipAddress: '10.0.0.50',
        consentMethod: 'Electronic',
        frameworks: [ComplianceFramework.AUSTRALIAN_PRIVACY, ComplianceFramework.MY_HEALTH_RECORDS],
        auditTrail: [
          { timestamp: new Date('2024-08-20'), action: 'Granted', performedBy: 'Patient', details: 'Consent for MHR access' }
        ]
      },
      {
        id: 'consent-003',
        dataPrincipalId: 'patient-003',
        dataPrincipalName: 'Andrei Ionescu',
        dataPrincipalEmail: 'andrei.ionescu@email.ro',
        consentType: ConsentType.CROSS_BORDER_TRANSFER,
        purposes: ['International Healthcare Collaboration'],
        dataCategories: [DataClassification.PHI, DataClassification.CONFIDENTIAL],
        grantedDate: new Date('2024-03-10'),
        expiryDate: new Date('2025-03-10'),
        status: ConsentStatus.ACTIVE,
        version: '1.5',
        ipAddress: '172.16.0.25',
        consentMethod: 'Electronic',
        frameworks: [ComplianceFramework.GDPR, ComplianceFramework.ROMANIAN_HEALTH],
        auditTrail: [
          { timestamp: new Date('2024-03-10'), action: 'Granted', performedBy: 'Patient', details: 'GDPR compliant consent' },
          { timestamp: new Date('2024-09-10'), action: 'Renewed', performedBy: 'System', details: 'Annual review completed' }
        ]
      },
      {
        id: 'consent-004',
        dataPrincipalId: 'patient-004',
        dataPrincipalName: 'John Davis',
        dataPrincipalEmail: 'john.davis@email.com',
        consentType: ConsentType.DATA_PROCESSING,
        purposes: ['Treatment', 'Payment', 'Healthcare Operations'],
        dataCategories: [DataClassification.PHI],
        grantedDate: new Date('2024-01-05'),
        status: ConsentStatus.ACTIVE,
        version: '3.0',
        ipAddress: '192.168.2.75',
        consentMethod: 'Paper',
        frameworks: [ComplianceFramework.HIPAA],
        auditTrail: [
          { timestamp: new Date('2024-01-05'), action: 'Granted', performedBy: 'Front Desk', details: 'Paper consent form signed' }
        ]
      },
      {
        id: 'consent-005',
        dataPrincipalId: 'patient-005',
        dataPrincipalName: 'Priya Sharma',
        dataPrincipalEmail: 'priya.sharma@email.in',
        consentType: ConsentType.ABHA_LINKING,
        purposes: ['ABHA Health ID Linking', 'Health Records Exchange'],
        dataCategories: [DataClassification.HEALTH_INFORMATION, DataClassification.SPI],
        grantedDate: new Date('2024-11-01'),
        expiryDate: new Date('2025-11-01'),
        status: ConsentStatus.ACTIVE,
        version: '1.0',
        ipAddress: '10.10.10.100',
        consentMethod: 'Electronic',
        frameworks: [ComplianceFramework.ABHA, ComplianceFramework.ABDM, ComplianceFramework.DPDP],
        auditTrail: [
          { timestamp: new Date('2024-11-01'), action: 'Granted', performedBy: 'Patient App', details: 'ABHA linking consent via mobile app' }
        ]
      },
      {
        id: 'consent-006',
        dataPrincipalId: 'patient-006',
        dataPrincipalName: 'Michael Brown',
        dataPrincipalEmail: 'michael.brown@email.com',
        consentType: ConsentType.RESEARCH,
        purposes: ['Medical Research', 'Clinical Studies'],
        dataCategories: [DataClassification.PHI],
        grantedDate: new Date('2023-06-15'),
        expiryDate: new Date('2024-06-15'),
        status: ConsentStatus.EXPIRED,
        version: '1.0',
        ipAddress: '192.168.5.50',
        consentMethod: 'Electronic',
        frameworks: [ComplianceFramework.HIPAA, ComplianceFramework.GDPR],
        auditTrail: [
          { timestamp: new Date('2023-06-15'), action: 'Granted', performedBy: 'Patient', details: 'Research consent granted' },
          { timestamp: new Date('2024-06-15'), action: 'Withdrawn', performedBy: 'System', details: 'Consent expired' }
        ]
      }
    ];
  }

  private generateMockDataRequests(): DataSubjectRequest[] {
    return [
      {
        id: 'dsr-001',
        requestNumber: 'DSR-2024-001',
        requesterId: 'patient-007',
        requesterName: 'Maria Garcia',
        requesterEmail: 'maria.garcia@email.com',
        requestType: DataSubjectRequestType.ACCESS,
        status: DataSubjectRequestStatus.COMPLETED,
        submittedDate: new Date('2024-11-01'),
        acknowledgedDate: new Date('2024-11-02'),
        dueDate: new Date('2024-11-30'),
        completedDate: new Date('2024-11-15'),
        assignedTo: 'Privacy Team',
        description: 'Request for copy of all personal data held',
        identityVerified: true,
        verificationMethod: 'Government ID + Security Questions',
        response: 'Data package sent via secure portal',
        attachments: ['data_export_maria_garcia.zip'],
        framework: ComplianceFramework.GDPR,
        auditTrail: [
          { timestamp: new Date('2024-11-01'), action: 'Submitted', performedBy: 'Patient', notes: 'Online submission' },
          { timestamp: new Date('2024-11-02'), action: 'Acknowledged', performedBy: 'System', notes: 'Auto-acknowledgment sent' },
          { timestamp: new Date('2024-11-05'), action: 'Identity Verified', performedBy: 'Privacy Team', notes: 'ID verification complete' },
          { timestamp: new Date('2024-11-15'), action: 'Completed', performedBy: 'Privacy Team', notes: 'Data package delivered' }
        ]
      },
      {
        id: 'dsr-002',
        requestNumber: 'DSR-2024-002',
        requesterId: 'patient-008',
        requesterName: 'Amit Verma',
        requesterEmail: 'amit.verma@email.in',
        requestType: DataSubjectRequestType.ERASURE,
        status: DataSubjectRequestStatus.IN_PROGRESS,
        submittedDate: new Date('2024-12-01'),
        acknowledgedDate: new Date('2024-12-02'),
        dueDate: new Date('2024-12-08'),
        assignedTo: 'Data Management Team',
        description: 'Request to delete all marketing-related data',
        identityVerified: true,
        verificationMethod: 'Aadhaar eKYC',
        attachments: [],
        framework: ComplianceFramework.DPDP,
        auditTrail: [
          { timestamp: new Date('2024-12-01'), action: 'Submitted', performedBy: 'Patient', notes: 'Submitted via grievance portal' },
          { timestamp: new Date('2024-12-02'), action: 'Acknowledged', performedBy: 'System', notes: 'Within 7-day DPDP requirement' },
          { timestamp: new Date('2024-12-03'), action: 'Processing Started', performedBy: 'Data Management', notes: 'Identifying relevant data' }
        ]
      },
      {
        id: 'dsr-003',
        requestNumber: 'DSR-2024-003',
        requesterId: 'patient-009',
        requesterName: 'Jennifer Lee',
        requesterEmail: 'jennifer.lee@email.au',
        requestType: DataSubjectRequestType.RECTIFICATION,
        status: DataSubjectRequestStatus.PENDING_APPROVAL,
        submittedDate: new Date('2024-12-05'),
        acknowledgedDate: new Date('2024-12-05'),
        dueDate: new Date('2025-01-05'),
        assignedTo: 'Medical Records',
        description: 'Correction of incorrect date of birth in health records',
        identityVerified: true,
        verificationMethod: 'Medicare Card + Photo ID',
        attachments: ['birth_certificate.pdf'],
        framework: ComplianceFramework.AUSTRALIAN_PRIVACY,
        auditTrail: [
          { timestamp: new Date('2024-12-05'), action: 'Submitted', performedBy: 'Patient', notes: 'In-person submission with documentation' },
          { timestamp: new Date('2024-12-05'), action: 'Acknowledged', performedBy: 'Front Desk', notes: 'Documentation reviewed' },
          { timestamp: new Date('2024-12-07'), action: 'Pending Approval', performedBy: 'Medical Records', notes: 'Awaiting clinical review' }
        ]
      },
      {
        id: 'dsr-004',
        requestNumber: 'DSR-2024-004',
        requesterId: 'patient-010',
        requesterName: 'Robert Johnson',
        requesterEmail: 'robert.johnson@email.com',
        requestType: DataSubjectRequestType.PORTABILITY,
        status: DataSubjectRequestStatus.SUBMITTED,
        submittedDate: new Date('2024-12-10'),
        dueDate: new Date('2025-01-10'),
        assignedTo: 'Unassigned',
        description: 'Request for portable copy of medical records for transfer to new provider',
        identityVerified: false,
        verificationMethod: '',
        attachments: [],
        framework: ComplianceFramework.HIPAA,
        auditTrail: [
          { timestamp: new Date('2024-12-10'), action: 'Submitted', performedBy: 'Patient', notes: 'Online portal submission' }
        ]
      },
      {
        id: 'dsr-005',
        requestNumber: 'DSR-2024-005',
        requesterId: 'patient-011',
        requesterName: 'Ion Popescu',
        requesterEmail: 'ion.popescu@email.ro',
        requestType: DataSubjectRequestType.OBJECTION,
        status: DataSubjectRequestStatus.REJECTED,
        submittedDate: new Date('2024-10-15'),
        acknowledgedDate: new Date('2024-10-16'),
        dueDate: new Date('2024-11-15'),
        completedDate: new Date('2024-11-01'),
        assignedTo: 'Legal Team',
        description: 'Objection to processing for clinical audit purposes',
        identityVerified: true,
        verificationMethod: 'Romanian ID Card',
        response: 'Objection cannot be accommodated as processing is required for legal obligation under Romanian health regulations',
        attachments: [],
        framework: ComplianceFramework.GDPR,
        auditTrail: [
          { timestamp: new Date('2024-10-15'), action: 'Submitted', performedBy: 'Patient', notes: '' },
          { timestamp: new Date('2024-10-20'), action: 'Legal Review', performedBy: 'Legal Team', notes: 'Reviewed legal basis' },
          { timestamp: new Date('2024-11-01'), action: 'Rejected', performedBy: 'DPO', notes: 'Legal obligation overrides objection right' }
        ]
      }
    ];
  }

  private generateMockBreaches(): DataBreach[] {
    return [
      {
        id: 'breach-001',
        breachNumber: 'BR-2024-001',
        discoveredDate: new Date('2024-08-15'),
        occurredDate: new Date('2024-08-14'),
        reportedDate: new Date('2024-08-16'),
        breachType: BreachType.HUMAN_ERROR,
        severity: BreachSeverity.LOW,
        status: BreachStatus.CLOSED,
        description: 'Email containing patient appointment details sent to wrong recipient',
        dataTypesAffected: [DataClassification.PHI],
        recordsAffected: 1,
        individualsAffected: 1,
        cause: 'Staff selected wrong email from autocomplete',
        containmentActions: ['Contacted recipient to delete email', 'Retrieved confirmation of deletion'],
        remediationActions: ['Additional email verification training', 'Implemented send delay feature'],
        notificationRequired: false,
        authorityNotified: false,
        individualsNotified: true,
        individualsNotificationDate: new Date('2024-08-16'),
        reportedBy: 'Front Desk Staff',
        assignedTo: 'Privacy Officer',
        frameworks: [ComplianceFramework.HIPAA],
        lessonsLearned: 'Need for additional verification before sending PHI via email',
        preventiveMeasures: ['Email verification prompts', 'Secure patient portal for communications'],
        closedDate: new Date('2024-08-30')
      },
      {
        id: 'breach-002',
        breachNumber: 'BR-2024-002',
        discoveredDate: new Date('2024-11-20'),
        occurredDate: new Date('2024-11-18'),
        breachType: BreachType.UNAUTHORIZED_ACCESS,
        severity: BreachSeverity.MEDIUM,
        status: BreachStatus.REMEDIATING,
        description: 'Former employee accessed system after termination due to delayed account deactivation',
        dataTypesAffected: [DataClassification.CONFIDENTIAL, DataClassification.INTERNAL],
        recordsAffected: 45,
        individualsAffected: 0,
        cause: 'HR offboarding process delay',
        containmentActions: ['Account immediately disabled', 'Session terminated', 'Access logs reviewed'],
        remediationActions: ['Automated account deactivation process', 'Real-time HR-IT integration'],
        notificationRequired: false,
        authorityNotified: false,
        individualsNotified: false,
        reportedBy: 'IT Security',
        assignedTo: 'IT Security Manager',
        frameworks: [ComplianceFramework.HIPAA, ComplianceFramework.GDPR],
        closedDate: undefined
      },
      {
        id: 'breach-003',
        breachNumber: 'BR-2024-003',
        discoveredDate: new Date('2024-12-05'),
        occurredDate: new Date('2024-12-05'),
        breachType: BreachType.SYSTEM_FAILURE,
        severity: BreachSeverity.HIGH,
        status: BreachStatus.INVESTIGATING,
        description: 'Database backup exposed on misconfigured cloud storage',
        dataTypesAffected: [DataClassification.PHI, DataClassification.SPI],
        recordsAffected: 2500,
        individualsAffected: 500,
        cause: 'Cloud storage bucket permission misconfiguration during migration',
        containmentActions: ['Bucket permissions corrected', 'Backup removed', 'Access logs under review'],
        remediationActions: [],
        notificationRequired: true,
        authorityNotified: true,
        authorityNotificationDate: new Date('2024-12-07'),
        individualsNotified: false,
        reportedBy: 'Security Scanner',
        assignedTo: 'CISO',
        frameworks: [ComplianceFramework.HIPAA, ComplianceFramework.DPDP, ComplianceFramework.GDPR],
        closedDate: undefined
      }
    ];
  }

  private generateMockTasks(): ComplianceTask[] {
    return [
      {
        id: 'task-001',
        title: 'Annual HIPAA Risk Assessment',
        description: 'Conduct comprehensive risk assessment as required by HIPAA Security Rule',
        framework: ComplianceFramework.HIPAA,
        category: ComplianceTaskCategory.RISK_ASSESSMENT,
        priority: 'High',
        status: 'In Progress',
        assignedTo: 'Security Officer',
        dueDate: new Date('2025-03-01'),
        recurrence: 'Annually',
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-10')
      },
      {
        id: 'task-002',
        title: 'DPDP Grievance Response - DSR-2024-002',
        description: 'Complete data erasure request within 7-day timeline',
        framework: ComplianceFramework.DPDP,
        category: ComplianceTaskCategory.DATA_MANAGEMENT,
        priority: 'Critical',
        status: 'In Progress',
        assignedTo: 'Data Management Team',
        dueDate: new Date('2024-12-08'),
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-05')
      },
      {
        id: 'task-003',
        title: 'ABHA Certificate Renewal',
        description: 'Renew ABDM integration certificate before expiry',
        framework: ComplianceFramework.ABHA,
        category: ComplianceTaskCategory.DOCUMENTATION,
        priority: 'High',
        status: 'Open',
        assignedTo: 'IT Integration Team',
        dueDate: new Date('2025-11-30'),
        createdAt: new Date('2024-11-01'),
        updatedAt: new Date('2024-11-01')
      },
      {
        id: 'task-004',
        title: 'Australian Privacy Principles Review',
        description: 'Quarterly review of APP compliance status',
        framework: ComplianceFramework.AUSTRALIAN_PRIVACY,
        category: ComplianceTaskCategory.POLICY_REVIEW,
        priority: 'Medium',
        status: 'Open',
        assignedTo: 'Privacy Officer',
        dueDate: new Date('2025-01-15'),
        recurrence: 'Quarterly',
        createdAt: new Date('2024-10-15'),
        updatedAt: new Date('2024-10-15')
      },
      {
        id: 'task-005',
        title: 'GDPR Employee Training',
        description: 'Conduct annual GDPR awareness training for all staff',
        framework: ComplianceFramework.GDPR,
        category: ComplianceTaskCategory.TRAINING,
        priority: 'High',
        status: 'Completed',
        assignedTo: 'HR Department',
        dueDate: new Date('2024-11-30'),
        completedDate: new Date('2024-11-15'),
        recurrence: 'Annually',
        createdAt: new Date('2024-09-01'),
        updatedAt: new Date('2024-11-15')
      },
      {
        id: 'task-006',
        title: 'Business Associate Agreement Review',
        description: 'Review and update BAAs with all vendors handling PHI',
        framework: ComplianceFramework.HIPAA,
        category: ComplianceTaskCategory.VENDOR_MANAGEMENT,
        priority: 'Medium',
        status: 'In Progress',
        assignedTo: 'Legal Team',
        dueDate: new Date('2025-02-28'),
        recurrence: 'Annually',
        createdAt: new Date('2024-11-01'),
        updatedAt: new Date('2024-12-01')
      },
      {
        id: 'task-007',
        title: 'Data Breach Response Test',
        description: 'Conduct tabletop exercise for breach notification procedures',
        framework: ComplianceFramework.GDPR,
        category: ComplianceTaskCategory.INCIDENT_RESPONSE,
        priority: 'Medium',
        status: 'Open',
        assignedTo: 'Security Team',
        dueDate: new Date('2025-04-01'),
        recurrence: 'Quarterly',
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-01')
      },
      {
        id: 'task-008',
        title: 'ANSPDCP Registration Update',
        description: 'Update registration with Romanian data protection authority',
        framework: ComplianceFramework.ROMANIAN_HEALTH,
        category: ComplianceTaskCategory.DOCUMENTATION,
        priority: 'Low',
        status: 'Open',
        assignedTo: 'DPO',
        dueDate: new Date('2025-06-30'),
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-01')
      }
    ];
  }

  private generateMockPolicies(): CompliancePolicy[] {
    return [
      {
        id: 'policy-001',
        title: 'Information Security Policy',
        description: 'Comprehensive information security policy covering all aspects of data protection',
        frameworks: [ComplianceFramework.HIPAA, ComplianceFramework.GDPR, ComplianceFramework.DPDP],
        version: '3.2',
        effectiveDate: new Date('2024-01-01'),
        reviewDate: new Date('2024-10-15'),
        nextReviewDate: new Date('2025-04-15'),
        status: 'Active',
        approvedBy: 'CISO',
        approvalDate: new Date('2024-01-01'),
        documentUrl: '/policies/information-security-policy-v3.2.pdf',
        acknowledgmentRequired: true,
        acknowledgedBy: [
          { userId: 'u-001', userName: 'John Smith', acknowledgedDate: new Date('2024-01-15'), version: '3.2' },
          { userId: 'u-002', userName: 'Sarah Johnson', acknowledgedDate: new Date('2024-01-16'), version: '3.2' }
        ]
      },
      {
        id: 'policy-002',
        title: 'Data Retention and Disposal Policy',
        description: 'Guidelines for data retention periods and secure disposal procedures',
        frameworks: [ComplianceFramework.HIPAA, ComplianceFramework.GDPR, ComplianceFramework.AUSTRALIAN_PRIVACY],
        version: '2.0',
        effectiveDate: new Date('2024-03-01'),
        reviewDate: new Date('2024-09-01'),
        nextReviewDate: new Date('2025-03-01'),
        status: 'Active',
        approvedBy: 'Privacy Officer',
        approvalDate: new Date('2024-03-01'),
        documentUrl: '/policies/data-retention-policy-v2.0.pdf',
        acknowledgmentRequired: true,
        acknowledgedBy: []
      },
      {
        id: 'policy-003',
        title: 'Consent Management Policy',
        description: 'Procedures for obtaining, managing, and withdrawing consent',
        frameworks: [ComplianceFramework.DPDP, ComplianceFramework.GDPR, ComplianceFramework.ABHA],
        version: '1.5',
        effectiveDate: new Date('2024-06-01'),
        reviewDate: new Date('2024-12-01'),
        nextReviewDate: new Date('2025-06-01'),
        status: 'Under Review',
        approvedBy: 'DPO',
        approvalDate: new Date('2024-06-01'),
        documentUrl: '/policies/consent-management-policy-v1.5.pdf',
        acknowledgmentRequired: true,
        acknowledgedBy: []
      },
      {
        id: 'policy-004',
        title: 'Incident Response Policy',
        description: 'Procedures for responding to security incidents and data breaches',
        frameworks: [ComplianceFramework.HIPAA, ComplianceFramework.GDPR, ComplianceFramework.AUSTRALIAN_PRIVACY],
        version: '2.1',
        effectiveDate: new Date('2024-04-01'),
        reviewDate: new Date('2024-10-01'),
        nextReviewDate: new Date('2025-04-01'),
        status: 'Active',
        approvedBy: 'CISO',
        approvalDate: new Date('2024-04-01'),
        documentUrl: '/policies/incident-response-policy-v2.1.pdf',
        acknowledgmentRequired: true,
        acknowledgedBy: []
      }
    ];
  }

  private generateMockTrainings(): ComplianceTraining[] {
    return [
      {
        id: 'training-001',
        title: 'HIPAA Privacy and Security Awareness',
        description: 'Annual training on HIPAA requirements for handling PHI',
        frameworks: [ComplianceFramework.HIPAA],
        duration: 60,
        passingScore: 80,
        validityPeriod: 12,
        status: 'Active',
        completions: [
          { userId: 'u-001', userName: 'John Smith', completedDate: new Date('2024-11-15'), score: 95, passed: true, expiryDate: new Date('2025-11-15') },
          { userId: 'u-002', userName: 'Sarah Johnson', completedDate: new Date('2024-11-16'), score: 88, passed: true, expiryDate: new Date('2025-11-16') }
        ]
      },
      {
        id: 'training-002',
        title: 'GDPR Data Protection Fundamentals',
        description: 'Understanding GDPR principles and individual rights',
        frameworks: [ComplianceFramework.GDPR],
        duration: 45,
        passingScore: 75,
        validityPeriod: 12,
        status: 'Active',
        completions: [
          { userId: 'u-001', userName: 'John Smith', completedDate: new Date('2024-10-20'), score: 90, passed: true, expiryDate: new Date('2025-10-20') }
        ]
      },
      {
        id: 'training-003',
        title: 'DPDP Act Awareness',
        description: 'India Digital Personal Data Protection Act 2023 compliance training',
        frameworks: [ComplianceFramework.DPDP],
        duration: 30,
        passingScore: 80,
        validityPeriod: 12,
        status: 'Active',
        completions: []
      },
      {
        id: 'training-004',
        title: 'ABHA/ABDM Integration Training',
        description: 'Technical training on Ayushman Bharat Digital Mission integration',
        frameworks: [ComplianceFramework.ABHA, ComplianceFramework.ABDM],
        duration: 90,
        passingScore: 85,
        validityPeriod: 24,
        status: 'Active',
        completions: []
      },
      {
        id: 'training-005',
        title: 'Australian Privacy Principles',
        description: 'Comprehensive training on all 13 Australian Privacy Principles',
        frameworks: [ComplianceFramework.AUSTRALIAN_PRIVACY],
        duration: 60,
        passingScore: 80,
        validityPeriod: 12,
        status: 'Active',
        completions: []
      }
    ];
  }

  private calculateDashboardStats(): ComplianceDashboardStats {
    const frameworkScores: FrameworkScore[] = [
      {
        framework: ComplianceFramework.HIPAA,
        score: 92,
        status: ComplianceStatus.COMPLIANT,
        lastAssessmentDate: new Date('2024-09-15'),
        nextAssessmentDate: new Date('2025-03-15'),
        criticalFindings: 0,
        openActions: 2
      },
      {
        framework: ComplianceFramework.DPDP,
        score: 88,
        status: ComplianceStatus.COMPLIANT,
        lastAssessmentDate: new Date('2024-10-01'),
        nextAssessmentDate: new Date('2025-04-01'),
        criticalFindings: 0,
        openActions: 1
      },
      {
        framework: ComplianceFramework.ABHA,
        score: 95,
        status: ComplianceStatus.COMPLIANT,
        lastAssessmentDate: new Date('2024-11-15'),
        nextAssessmentDate: new Date('2025-05-15'),
        criticalFindings: 0,
        openActions: 1
      },
      {
        framework: ComplianceFramework.AUSTRALIAN_PRIVACY,
        score: 85,
        status: ComplianceStatus.PARTIALLY_COMPLIANT,
        lastAssessmentDate: new Date('2024-09-01'),
        nextAssessmentDate: new Date('2025-03-01'),
        criticalFindings: 1,
        openActions: 2
      },
      {
        framework: ComplianceFramework.GDPR,
        score: 90,
        status: ComplianceStatus.COMPLIANT,
        lastAssessmentDate: new Date('2024-10-15'),
        nextAssessmentDate: new Date('2025-04-15'),
        criticalFindings: 0,
        openActions: 3
      }
    ];

    const overallScore = Math.round(
      frameworkScores.reduce((sum, f) => sum + f.score, 0) / frameworkScores.length
    );

    return {
      overallScore,
      frameworkScores,
      pendingTasks: this._tasks().filter(t => t.status !== 'Completed').length,
      overdueTasks: this.overdueTasks(),
      recentBreaches: this._breaches().filter(b => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(b.discoveredDate) > thirtyDaysAgo;
      }).length,
      openDataRequests: this.pendingRequests(),
      expiringConsents: this._consents().filter(c => {
        if (!c.expiryDate) return false;
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return c.status === ConsentStatus.ACTIVE && new Date(c.expiryDate) < thirtyDaysFromNow;
      }).length,
      upcomingAudits: 2,
      trainingOverdue: 3,
      certificatesExpiring: 1
    };
  }

  // Action methods
  addAuditLog(log: Partial<AuditLog>): void {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date(),
      userId: log.userId || 'system',
      userName: log.userName || 'System',
      userRole: log.userRole || 'System',
      action: log.action || AuditAction.READ,
      resourceType: log.resourceType || AuditResourceType.SYSTEM_CONFIG,
      resourceId: log.resourceId || '',
      resourceName: log.resourceName || '',
      ipAddress: log.ipAddress || '127.0.0.1',
      userAgent: log.userAgent || 'System',
      sessionId: log.sessionId || 'system',
      description: log.description || '',
      complianceFrameworks: log.complianceFrameworks || [],
      riskLevel: log.riskLevel || 'Low',
      status: log.status || 'Success'
    };

    this._auditLogs.update(logs => [newLog, ...logs]);
  }

  updateTaskStatus(taskId: string, status: 'Open' | 'In Progress' | 'Completed' | 'Overdue'): void {
    this._tasks.update(tasks => 
      tasks.map(t => t.id === taskId ? { ...t, status, updatedAt: new Date() } : t)
    );
  }

  acknowledgePolicy(policyId: string, userId: string, userName: string): void {
    this._policies.update(policies =>
      policies.map(p => {
        if (p.id === policyId) {
          return {
            ...p,
            acknowledgedBy: [
              ...p.acknowledgedBy,
              { userId, userName, acknowledgedDate: new Date(), version: p.version }
            ]
          };
        }
        return p;
      })
    );
  }

  getFrameworkStatus(framework: ComplianceFramework): ComplianceStatus {
    switch (framework) {
      case ComplianceFramework.HIPAA:
        return this._hipaaCompliance().status;
      case ComplianceFramework.DPDP:
        return this._dpdpCompliance().status;
      case ComplianceFramework.ABHA:
      case ComplianceFramework.ABDM:
        return this._abhaCompliance().status;
      case ComplianceFramework.AUSTRALIAN_PRIVACY:
      case ComplianceFramework.MY_HEALTH_RECORDS:
        return this._australianCompliance().status;
      case ComplianceFramework.GDPR:
      case ComplianceFramework.ROMANIAN_HEALTH:
        return this._gdprCompliance().status;
      default:
        return ComplianceStatus.NOT_APPLICABLE;
    }
  }
}
