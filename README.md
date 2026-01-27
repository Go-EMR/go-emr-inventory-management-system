# GoEMR Medical Equipment Inventory Management System

A comprehensive healthcare equipment inventory management application built with **Angular 19** and **PrimeNG 19**, featuring **multi-jurisdiction regulatory compliance** support.

## Features

### Dashboard
- Overview statistics with real-time KPIs
- Equipment status distribution chart
- Maintenance activity trends
- Active alerts panel
- Recent equipment and upcoming maintenance

### Equipment Management
- Complete equipment list with filtering and sorting
- Detailed equipment view with tabs (Overview, Maintenance History, Documents, Activity Log)
- Equipment status tracking (In Service, Under Maintenance, Awaiting Repair, Out of Service)
- Condition monitoring (Excellent, Good, Fair, Poor)
- Risk level assessment (Low, Medium, High)

### Inventory Management
- Stock level tracking with visual indicators
- Low stock alerts
- Restock functionality
- Category-based organization
- Total value calculations

### Maintenance Scheduling
- List and calendar views
- Maintenance type tracking (Preventive, Corrective, Emergency, Calibration, Safety)
- Overdue maintenance alerts
- Technician assignment

### Vendor Directory
- Vendor card grid layout
- Contract tracking with expiration alerts
- Rating system
- Contact information management

### Reports & Analytics
- KPI dashboard with trends
- Equipment, Maintenance, Inventory, and Financial reports
- Chart visualizations (Doughnut, Bar, Line, Pie)
- Export capabilities

### 🛡️ Compliance Center (Multi-Jurisdiction)

A comprehensive regulatory compliance module supporting healthcare regulations across multiple jurisdictions:

#### Supported Regulatory Frameworks

| Framework | Region | Description |
|-----------|--------|-------------|
| **HIPAA** | United States | Health Insurance Portability and Accountability Act compliance with Privacy Rule, Security Rule, and Breach Notification requirements |
| **DPDP Act** | India | Digital Personal Data Protection Act 2023 - Data Fiduciary obligations, consent management, grievance handling |
| **Ayushman Bharat / ABHA** | India | ABDM integration, Health Facility Registry (HFR), ABHA ID linking, Health Information Provider (HIP) and User (HIU) compliance |
| **Privacy Act 1988** | Australia | 13 Australian Privacy Principles (APPs), My Health Records Act compliance, Notifiable Data Breach Scheme |
| **GDPR / Romanian Health** | Romania/EU | EU General Data Protection Regulation, ANSPDCP registration, Romanian health data processing requirements |

#### Compliance Features

- **Compliance Dashboard**
  - Overall compliance score across all frameworks
  - Framework-specific compliance status and scores
  - Visual compliance radar chart
  - Trend analysis over time

- **Framework Management**
  - HIPAA: Privacy/Security Officers, Business Associate Agreements, Physical/Technical/Administrative Safeguards
  - DPDP: Data Fiduciary roles, Consent Manager, Grievance Officer, Data Principal Rights
  - ABHA: HFR ID, HIP/HIU IDs, ABDM Gateway integration, Certificate management, FHIR compliance
  - Australian: All 13 APPs status, My Health Records registration, Cross-border disclosure management
  - GDPR: DPO appointment, DPIA status, Data Subject Rights, International Transfers, Romanian-specific requirements

- **Audit Logging**
  - Comprehensive audit trail for all data access
  - User activity tracking with timestamps
  - IP address and session tracking
  - Risk level classification (Low, Medium, High, Critical)
  - Filterable by action, resource, and risk level

- **Consent Management**
  - Multi-framework consent records
  - Consent status tracking (Active, Expired, Withdrawn, Pending)
  - Purpose and data category tracking
  - Consent audit trail
  - Expiration monitoring

- **Data Subject/Principal Requests**
  - Access requests (GDPR Article 15, DPDP Right to Access)
  - Rectification requests
  - Erasure requests (Right to be Forgotten)
  - Data portability
  - Identity verification tracking
  - SLA compliance monitoring

- **Data Breach Management**
  - Breach incident tracking
  - Severity classification
  - Authority notification tracking (72-hour GDPR requirement)
  - Individual notification management
  - Containment and remediation actions
  - Lessons learned documentation

- **Compliance Tasks**
  - Task assignment and tracking
  - Priority management (Critical, High, Medium, Low)
  - Recurring task support (Daily, Weekly, Monthly, Quarterly, Annually)
  - Due date monitoring with overdue alerts

## Technology Stack

- **Framework:** Angular 19 (Standalone Components)
- **UI Library:** PrimeNG 19
- **State Management:** Signal-based reactive state
- **Styling:** SCSS with CSS Custom Properties
- **Charts:** Chart.js via PrimeNG ChartModule
- **Icons:** PrimeIcons

## Design System

- **Color Palette:** Healthcare-focused green primary (#10b981), blue secondary (#3b82f6), rose alerts (#f43f5e)
- **Typography:** Plus Jakarta Sans (display), Inter (body)
- **Effects:** Glassmorphism, smooth transitions, responsive design
- **Theme:** Light/Dark mode support

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm 9+

### Installation

```bash
# Clone or extract the project
cd goemr-inventory

# Install dependencies
npm install

# Start development server
ng serve

# Open browser at http://localhost:4200
```

### Demo Accounts

| Role       | Username   | Password    | Permissions                           |
|------------|------------|-------------|---------------------------------------|
| Admin      | admin      | admin123    | Full access including Compliance      |
| Manager    | manager    | manager123  | Management + operations + Compliance  |
| Technician | technician | tech123     | Maintenance operations                |
| Viewer     | viewer     | viewer123   | Read-only access                      |

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   └── services/
│   │       ├── auth.service.ts
│   │       ├── compliance.service.ts      # Multi-jurisdiction compliance
│   │       ├── mock-data.service.ts
│   │       └── theme.service.ts
│   ├── features/
│   │   ├── auth/
│   │   │   └── components/login/
│   │   ├── dashboard/
│   │   │   └── components/dashboard/
│   │   ├── equipment/
│   │   │   └── components/
│   │   │       ├── equipment-list/
│   │   │       └── equipment-detail/
│   │   ├── inventory/
│   │   │   └── components/inventory-list/
│   │   ├── maintenance/
│   │   │   └── components/maintenance-list/
│   │   ├── vendors/
│   │   │   └── components/vendor-list/
│   │   ├── reports/
│   │   │   └── components/reports/
│   │   └── compliance/                     # Regulatory compliance module
│   │       └── components/
│   │           └── compliance-dashboard/
│   ├── layout/
│   │   └── components/main-layout/
│   ├── shared/
│   │   └── models/                         # Includes comprehensive compliance models
│   ├── app.component.ts
│   └── app.routes.ts
├── styles.scss
├── main.ts
└── index.html
```

## Data Models

Based on WHO Medical Device Technical Series guidelines:

- **Equipment:** Medical devices with status, condition, risk level, location, department, warranty, acquisition info
- **Inventory:** Consumables and spare parts with stock levels, reorder points, expiration tracking
- **Maintenance:** Scheduled and completed maintenance records with type, cost, technician assignment
- **Vendor:** Equipment manufacturers, suppliers, service providers with contracts and ratings
- **Alert:** System notifications for maintenance, stock levels, warranty expiration

### Compliance Models

- **ComplianceConfig:** Multi-framework configuration with encryption, MFA, data localization settings
- **HIPAACompliance:** Privacy/Security officers, BAAs, safeguards status
- **DPDPCompliance:** Data Fiduciary, Consent Manager, Grievance Officer, Data Principal Rights
- **ABHACompliance:** HFR ID, HIP/HIU IDs, ABDM integration status, Certificate management
- **AustralianPrivacyCompliance:** 13 APPs status, My Health Records, Cross-border disclosure
- **GDPRCompliance:** DPO, DPIA, Data Subject Rights, International Transfers, Romanian-specific
- **AuditLog:** Comprehensive activity logging with risk levels
- **ConsentRecord:** Multi-framework consent management
- **DataSubjectRequest:** Rights request handling (access, rectification, erasure, portability)
- **DataBreach:** Incident management with notification tracking

## Key Features by Role

### Admin
- Full CRUD on all entities
- User management
- System configuration
- Report export/scheduling
- **Full Compliance Center access**

### Manager
- Equipment and inventory management
- Maintenance scheduling
- Vendor management
- Report viewing
- **Compliance dashboard and task management**

### Technician
- View equipment details
- Complete maintenance tasks
- Update equipment status

### Viewer
- Read-only access to all modules
- Dashboard viewing
- Report viewing

## Compliance Quick Reference

### HIPAA (US) Requirements Covered
- ✅ Privacy Rule - Minimum necessary standard
- ✅ Security Rule - Administrative, Physical, Technical Safeguards
- ✅ Breach Notification - 60-day notification requirement
- ✅ Business Associate Agreements tracking
- ✅ Employee training records

### DPDP Act (India) Requirements Covered
- ✅ Data Fiduciary obligations
- ✅ Consent mechanism implementation
- ✅ Data localization compliance
- ✅ Child data protection
- ✅ Grievance Officer appointment (7-day response)
- ✅ Cross-border transfer compliance

### Ayushman Bharat / ABHA Requirements Covered
- ✅ Health Facility Registry (HFR) registration
- ✅ HIP/HIU integration
- ✅ ABDM Gateway connectivity
- ✅ Consent Manager integration
- ✅ Health Locker support
- ✅ FHIR data exchange protocol

### Australian Privacy Act Requirements Covered
- ✅ All 13 Australian Privacy Principles (APPs)
- ✅ My Health Records Act compliance
- ✅ Notifiable Data Breach Scheme
- ✅ Cross-border disclosure management
- ✅ Victorian Health Records Act

### GDPR / Romanian Requirements Covered
- ✅ Data Protection Officer (DPO) appointment
- ✅ Data Protection Impact Assessment (DPIA)
- ✅ All Data Subject Rights implementation
- ✅ 72-hour breach notification
- ✅ International transfer safeguards (SCCs, adequacy decisions)
- ✅ ANSPDCP registration (Romania)
- ✅ Romanian medical records retention (30 years)

## Future Enhancements

- [ ] Backend API integration (REST/GraphQL)
- [ ] Real-time updates via WebSocket
- [ ] Barcode/QR code scanning
- [ ] Bulk import/export (CSV, Excel)
- [ ] Email notifications
- [ ] Mobile app (Ionic/Capacitor)
- [ ] Offline support (Service Workers)
- [ ] Advanced search with filters
- [x] ~~Audit logging~~ ✅ Implemented
- [ ] Multi-tenancy support
- [x] ~~Multi-jurisdiction compliance~~ ✅ Implemented

## License

Proprietary - Cyberbit Healthcare Solutions

---

Built with ❤️ for healthcare equipment management and regulatory compliance
