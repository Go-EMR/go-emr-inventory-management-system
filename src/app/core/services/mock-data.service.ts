import { Injectable, signal, computed } from '@angular/core';
import {
  Equipment,
  EquipmentType,
  EquipmentCategory,
  EquipmentStatus,
  EquipmentCondition,
  RiskLevel,
  InventoryItem,
  InventoryCategory,
  InventoryType,
  StockStatus,
  MaintenanceRecord,
  MaintenanceType,
  MaintenanceStatus,
  WorkOrder,
  WorkOrderType,
  WorkOrderPriority,
  WorkOrderStatus,
  Vendor,
  VendorCategory,
  Alert,
  AlertType,
  AlertSeverity,
  DashboardStats,
  AuditLog,
  AuditAction,
  AuditResourceType
} from '@shared/models';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  
  // Equipment Data
  private readonly _equipment = signal<Equipment[]>(this.generateEquipmentData());
  readonly equipment = this._equipment.asReadonly();
  
  // Inventory Data
  private readonly _inventory = signal<InventoryItem[]>(this.generateInventoryData());
  readonly inventory = this._inventory.asReadonly();
  
  // Maintenance Records
  private readonly _maintenanceRecords = signal<MaintenanceRecord[]>(this.generateMaintenanceData());
  readonly maintenanceRecords = this._maintenanceRecords.asReadonly();
  
  // Work Orders
  private readonly _workOrders = signal<WorkOrder[]>(this.generateWorkOrderData());
  readonly workOrders = this._workOrders.asReadonly();
  
  // Vendors
  private readonly _vendors = signal<Vendor[]>(this.generateVendorData());
  readonly vendors = this._vendors.asReadonly();
  
  // Alerts
  private readonly _alerts = signal<Alert[]>(this.generateAlertData());
  readonly alerts = this._alerts.asReadonly();
  
  // Audit Logs
  private readonly _auditLogs = signal<AuditLog[]>(this.generateAuditLogData());
  readonly auditLogs = this._auditLogs.asReadonly();
  
  // Dashboard Stats
  readonly dashboardStats = computed<DashboardStats>(() => {
    const equipment = this._equipment();
    const inventory = this._inventory();
    const workOrders = this._workOrders();
    const maintenanceRecords = this._maintenanceRecords();
    const alerts = this._alerts();
    
    return {
      totalEquipment: equipment.length,
      activeEquipment: equipment.filter(e => e.status === EquipmentStatus.IN_SERVICE).length,
      underMaintenance: equipment.filter(e => e.status === EquipmentStatus.UNDER_MAINTENANCE).length,
      outOfService: equipment.filter(e => e.status === EquipmentStatus.OUT_OF_SERVICE).length,
      totalInventoryItems: inventory.length,
      lowStockItems: inventory.filter(i => i.status === StockStatus.LOW_STOCK || i.status === StockStatus.OUT_OF_STOCK).length,
      pendingWorkOrders: workOrders.filter(w => w.status === WorkOrderStatus.OPEN || w.status === WorkOrderStatus.IN_PROGRESS).length,
      overdueMaintenances: maintenanceRecords.filter(m => m.status === MaintenanceStatus.OVERDUE).length,
      alertsCount: alerts.filter(a => !a.isRead).length,
      monthlyMaintenanceCost: 45750
    };
  });
  
  private generateEquipmentData(): Equipment[] {
    return [
      {
        id: 'EQ001',
        inventoryNumber: 'MED-2024-001',
        name: 'Portable X-Ray System',
        type: EquipmentType.IMAGING,
        category: EquipmentCategory.MONITORING_SURGICAL_ICU,
        manufacturer: 'GE Healthcare',
        model: 'Optima XR220amx',
        serialNumber: 'XR220-2024-A1234',
        location: { id: 'L1', building: 'Main Hospital', floor: '2', room: 'Radiology Suite A' },
        department: 'Radiology',
        status: EquipmentStatus.IN_SERVICE,
        condition: EquipmentCondition.EXCELLENT,
        riskLevel: RiskLevel.HIGH,
        purchaseDate: new Date('2023-06-15'),
        installationDate: new Date('2023-07-01'),
        warrantyExpiry: new Date('2026-06-15'),
        lastMaintenanceDate: new Date('2024-12-01'),
        nextMaintenanceDate: new Date('2025-03-01'),
        purchaseCost: 175000,
        currentValue: 150000,
        powerRequirements: '220V, 30A',
        operatingManualAvailable: true,
        serviceManualAvailable: true,
        createdAt: new Date('2023-06-15'),
        updatedAt: new Date('2024-12-01')
      },
      {
        id: 'EQ002',
        inventoryNumber: 'MED-2024-002',
        name: 'Patient Monitor - ICU',
        type: EquipmentType.MONITORING,
        category: EquipmentCategory.MONITORING_SURGICAL_ICU,
        manufacturer: 'Philips Healthcare',
        model: 'IntelliVue MX800',
        serialNumber: 'MX800-2024-B5678',
        location: { id: 'L2', building: 'Main Hospital', floor: '3', room: 'ICU Bay 1' },
        department: 'Intensive Care',
        status: EquipmentStatus.IN_SERVICE,
        condition: EquipmentCondition.GOOD,
        riskLevel: RiskLevel.HIGH,
        purchaseDate: new Date('2023-08-20'),
        installationDate: new Date('2023-08-25'),
        warrantyExpiry: new Date('2025-08-20'),
        lastMaintenanceDate: new Date('2024-11-15'),
        nextMaintenanceDate: new Date('2025-02-15'),
        purchaseCost: 45000,
        currentValue: 38000,
        powerRequirements: '110V, 10A',
        operatingManualAvailable: true,
        serviceManualAvailable: true,
        createdAt: new Date('2023-08-20'),
        updatedAt: new Date('2024-11-15')
      },
      {
        id: 'EQ003',
        inventoryNumber: 'MED-2024-003',
        name: 'Ventilator',
        type: EquipmentType.LIFE_SUPPORT,
        category: EquipmentCategory.LIFE_SUPPORT,
        manufacturer: 'Dräger',
        model: 'Evita V300',
        serialNumber: 'V300-2024-C9012',
        location: { id: 'L3', building: 'Main Hospital', floor: '3', room: 'ICU Bay 2' },
        department: 'Intensive Care',
        status: EquipmentStatus.UNDER_MAINTENANCE,
        condition: EquipmentCondition.FAIR,
        riskLevel: RiskLevel.HIGH,
        purchaseDate: new Date('2022-03-10'),
        installationDate: new Date('2022-03-15'),
        warrantyExpiry: new Date('2024-03-10'),
        lastMaintenanceDate: new Date('2025-01-10'),
        nextMaintenanceDate: new Date('2025-04-10'),
        purchaseCost: 65000,
        currentValue: 45000,
        powerRequirements: '220V, 15A',
        operatingManualAvailable: true,
        serviceManualAvailable: true,
        createdAt: new Date('2022-03-10'),
        updatedAt: new Date('2025-01-10')
      },
      {
        id: 'EQ004',
        inventoryNumber: 'MED-2024-004',
        name: 'Defibrillator',
        type: EquipmentType.THERAPEUTIC,
        category: EquipmentCategory.SURGICAL_ICU,
        manufacturer: 'Zoll Medical',
        model: 'R Series Plus',
        serialNumber: 'RS-2024-D3456',
        location: { id: 'L4', building: 'Main Hospital', floor: '2', room: 'Emergency Dept' },
        department: 'Emergency',
        status: EquipmentStatus.IN_SERVICE,
        condition: EquipmentCondition.EXCELLENT,
        riskLevel: RiskLevel.HIGH,
        purchaseDate: new Date('2024-01-05'),
        installationDate: new Date('2024-01-08'),
        warrantyExpiry: new Date('2027-01-05'),
        lastMaintenanceDate: new Date('2024-10-01'),
        nextMaintenanceDate: new Date('2025-01-01'),
        purchaseCost: 32000,
        currentValue: 30000,
        powerRequirements: 'Battery/110V',
        operatingManualAvailable: true,
        serviceManualAvailable: true,
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-10-01')
      },
      {
        id: 'EQ005',
        inventoryNumber: 'MED-2024-005',
        name: 'Ultrasound System',
        type: EquipmentType.DIAGNOSTIC,
        category: EquipmentCategory.MONITORING_PHYSIOLOGICAL,
        manufacturer: 'Siemens Healthineers',
        model: 'ACUSON Sequoia',
        serialNumber: 'SEQ-2024-E7890',
        location: { id: 'L5', building: 'Main Hospital', floor: '1', room: 'Imaging Suite B' },
        department: 'Radiology',
        status: EquipmentStatus.IN_SERVICE,
        condition: EquipmentCondition.GOOD,
        riskLevel: RiskLevel.MEDIUM,
        purchaseDate: new Date('2023-11-20'),
        installationDate: new Date('2023-12-01'),
        warrantyExpiry: new Date('2026-11-20'),
        lastMaintenanceDate: new Date('2024-09-15'),
        nextMaintenanceDate: new Date('2025-03-15'),
        purchaseCost: 125000,
        currentValue: 110000,
        powerRequirements: '110V, 15A',
        operatingManualAvailable: true,
        serviceManualAvailable: true,
        createdAt: new Date('2023-11-20'),
        updatedAt: new Date('2024-09-15')
      },
      {
        id: 'EQ006',
        inventoryNumber: 'MED-2024-006',
        name: 'Infusion Pump',
        type: EquipmentType.THERAPEUTIC,
        category: EquipmentCategory.SURGICAL_ICU,
        manufacturer: 'B. Braun',
        model: 'Infusomat Space',
        serialNumber: 'IS-2024-F1234',
        location: { id: 'L6', building: 'Main Hospital', floor: '4', room: 'Medical Ward A' },
        department: 'Medical',
        status: EquipmentStatus.IN_SERVICE,
        condition: EquipmentCondition.GOOD,
        riskLevel: RiskLevel.HIGH,
        purchaseDate: new Date('2024-02-15'),
        installationDate: new Date('2024-02-18'),
        warrantyExpiry: new Date('2026-02-15'),
        lastMaintenanceDate: new Date('2024-11-01'),
        nextMaintenanceDate: new Date('2025-02-01'),
        purchaseCost: 8500,
        currentValue: 7800,
        powerRequirements: 'Battery/110V',
        operatingManualAvailable: true,
        serviceManualAvailable: false,
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-11-01')
      },
      {
        id: 'EQ007',
        inventoryNumber: 'MED-2024-007',
        name: 'Anesthesia Machine',
        type: EquipmentType.LIFE_SUPPORT,
        category: EquipmentCategory.LIFE_SUPPORT,
        manufacturer: 'GE Healthcare',
        model: 'Aisys CS2',
        serialNumber: 'ACS2-2024-G5678',
        location: { id: 'L7', building: 'Main Hospital', floor: '2', room: 'OR Suite 1' },
        department: 'Surgery',
        status: EquipmentStatus.IN_SERVICE,
        condition: EquipmentCondition.EXCELLENT,
        riskLevel: RiskLevel.HIGH,
        purchaseDate: new Date('2023-09-01'),
        installationDate: new Date('2023-09-10'),
        warrantyExpiry: new Date('2026-09-01'),
        lastMaintenanceDate: new Date('2024-12-15'),
        nextMaintenanceDate: new Date('2025-03-15'),
        purchaseCost: 95000,
        currentValue: 85000,
        powerRequirements: '220V, 20A',
        operatingManualAvailable: true,
        serviceManualAvailable: true,
        createdAt: new Date('2023-09-01'),
        updatedAt: new Date('2024-12-15')
      },
      {
        id: 'EQ008',
        inventoryNumber: 'MED-2024-008',
        name: 'ECG Machine',
        type: EquipmentType.DIAGNOSTIC,
        category: EquipmentCategory.MONITORING_PHYSIOLOGICAL,
        manufacturer: 'Nihon Kohden',
        model: 'ECG-2550',
        serialNumber: 'ECG-2024-H9012',
        location: { id: 'L8', building: 'Main Hospital', floor: '1', room: 'Cardiology Dept' },
        department: 'Cardiology',
        status: EquipmentStatus.OUT_OF_SERVICE,
        condition: EquipmentCondition.POOR,
        riskLevel: RiskLevel.MEDIUM,
        purchaseDate: new Date('2021-05-20'),
        installationDate: new Date('2021-05-25'),
        warrantyExpiry: new Date('2023-05-20'),
        lastMaintenanceDate: new Date('2024-08-01'),
        nextMaintenanceDate: new Date('2024-11-01'),
        purchaseCost: 12000,
        currentValue: 4000,
        powerRequirements: '110V, 5A',
        operatingManualAvailable: true,
        serviceManualAvailable: true,
        notes: 'Awaiting replacement - display malfunction',
        createdAt: new Date('2021-05-20'),
        updatedAt: new Date('2024-08-01')
      },
      {
        id: 'EQ009',
        inventoryNumber: 'MED-2024-009',
        name: 'Laboratory Centrifuge',
        type: EquipmentType.LABORATORY,
        category: EquipmentCategory.LABORATORY_ANALYTICAL,
        manufacturer: 'Eppendorf',
        model: '5810R',
        serialNumber: 'EP5810-2024-I3456',
        location: { id: 'L9', building: 'Laboratory Building', floor: '1', room: 'Lab Room 101' },
        department: 'Laboratory',
        status: EquipmentStatus.IN_SERVICE,
        condition: EquipmentCondition.GOOD,
        riskLevel: RiskLevel.LOW,
        purchaseDate: new Date('2023-04-10'),
        installationDate: new Date('2023-04-15'),
        warrantyExpiry: new Date('2025-04-10'),
        lastMaintenanceDate: new Date('2024-10-10'),
        nextMaintenanceDate: new Date('2025-04-10'),
        purchaseCost: 18000,
        currentValue: 15000,
        powerRequirements: '220V, 10A',
        operatingManualAvailable: true,
        serviceManualAvailable: true,
        createdAt: new Date('2023-04-10'),
        updatedAt: new Date('2024-10-10')
      },
      {
        id: 'EQ010',
        inventoryNumber: 'MED-2024-010',
        name: 'Autoclave',
        type: EquipmentType.STERILIZATION,
        category: EquipmentCategory.OTHER,
        manufacturer: 'Tuttnauer',
        model: '3870EA',
        serialNumber: 'TT3870-2024-J7890',
        location: { id: 'L10', building: 'Main Hospital', floor: '0', room: 'CSSD' },
        department: 'Central Sterile',
        status: EquipmentStatus.IN_SERVICE,
        condition: EquipmentCondition.GOOD,
        riskLevel: RiskLevel.MEDIUM,
        purchaseDate: new Date('2022-08-15'),
        installationDate: new Date('2022-08-25'),
        warrantyExpiry: new Date('2024-08-15'),
        lastMaintenanceDate: new Date('2024-11-20'),
        nextMaintenanceDate: new Date('2025-02-20'),
        purchaseCost: 28000,
        currentValue: 22000,
        powerRequirements: '220V, 30A',
        operatingManualAvailable: true,
        serviceManualAvailable: true,
        createdAt: new Date('2022-08-15'),
        updatedAt: new Date('2024-11-20')
      }
    ];
  }
  
  private generateInventoryData(): InventoryItem[] {
    return [
      {
        id: 'INV001',
        sku: 'CON-ECG-001',
        name: 'ECG Electrodes (Pack of 100)',
        category: InventoryCategory.CONSUMABLES,
        type: InventoryType.MEDICAL_SUPPLIES,
        quantity: 450,
        minQuantity: 100,
        maxQuantity: 1000,
        reorderLevel: 200,
        unitOfMeasure: 'Pack',
        unitCost: 25,
        totalValue: 11250,
        location: 'Storage Room A-1',
        expiryDate: new Date('2026-06-30'),
        lotNumber: 'LOT-2024-A001',
        lastRestockDate: new Date('2024-12-01'),
        status: StockStatus.IN_STOCK,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-12-01')
      },
      {
        id: 'INV002',
        sku: 'CON-SYR-002',
        name: 'Disposable Syringes 10ml (Box of 100)',
        category: InventoryCategory.CONSUMABLES,
        type: InventoryType.MEDICAL_SUPPLIES,
        quantity: 85,
        minQuantity: 50,
        maxQuantity: 500,
        reorderLevel: 100,
        unitOfMeasure: 'Box',
        unitCost: 18,
        totalValue: 1530,
        location: 'Storage Room A-2',
        expiryDate: new Date('2027-03-15'),
        lotNumber: 'LOT-2024-B002',
        lastRestockDate: new Date('2024-11-15'),
        status: StockStatus.LOW_STOCK,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-11-15')
      },
      {
        id: 'INV003',
        sku: 'SPR-VEN-001',
        name: 'Ventilator Breathing Circuit',
        category: InventoryCategory.SPARE_PARTS,
        type: InventoryType.MAINTENANCE_PARTS,
        quantity: 25,
        minQuantity: 10,
        maxQuantity: 100,
        reorderLevel: 15,
        unitOfMeasure: 'Unit',
        unitCost: 150,
        totalValue: 3750,
        location: 'Parts Storage B-1',
        lastRestockDate: new Date('2024-10-20'),
        status: StockStatus.IN_STOCK,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-10-20')
      },
      {
        id: 'INV004',
        sku: 'REA-CBC-001',
        name: 'CBC Reagent Kit',
        category: InventoryCategory.REAGENTS,
        type: InventoryType.LABORATORY_SUPPLIES,
        quantity: 12,
        minQuantity: 5,
        maxQuantity: 30,
        reorderLevel: 8,
        unitOfMeasure: 'Kit',
        unitCost: 350,
        totalValue: 4200,
        location: 'Lab Storage L-1',
        expiryDate: new Date('2025-04-30'),
        lotNumber: 'LOT-2024-C003',
        lastRestockDate: new Date('2024-09-01'),
        status: StockStatus.IN_STOCK,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-09-01')
      },
      {
        id: 'INV005',
        sku: 'CON-GLV-001',
        name: 'Nitrile Gloves Medium (Box of 100)',
        category: InventoryCategory.CONSUMABLES,
        type: InventoryType.MEDICAL_SUPPLIES,
        quantity: 0,
        minQuantity: 50,
        maxQuantity: 500,
        reorderLevel: 100,
        unitOfMeasure: 'Box',
        unitCost: 12,
        totalValue: 0,
        location: 'Storage Room A-1',
        lastRestockDate: new Date('2024-10-01'),
        status: StockStatus.OUT_OF_STOCK,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2025-01-15')
      },
      {
        id: 'INV006',
        sku: 'SPR-MON-002',
        name: 'SpO2 Sensor Cable',
        category: InventoryCategory.ACCESSORIES,
        type: InventoryType.MAINTENANCE_PARTS,
        quantity: 18,
        minQuantity: 5,
        maxQuantity: 50,
        reorderLevel: 10,
        unitOfMeasure: 'Unit',
        unitCost: 85,
        totalValue: 1530,
        location: 'Parts Storage B-2',
        lastRestockDate: new Date('2024-11-01'),
        status: StockStatus.IN_STOCK,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-11-01')
      },
      {
        id: 'INV007',
        sku: 'CON-BLD-001',
        name: 'Blood Collection Tubes (Pack of 100)',
        category: InventoryCategory.CONSUMABLES,
        type: InventoryType.LABORATORY_SUPPLIES,
        quantity: 220,
        minQuantity: 100,
        maxQuantity: 500,
        reorderLevel: 150,
        unitOfMeasure: 'Pack',
        unitCost: 45,
        totalValue: 9900,
        location: 'Lab Storage L-2',
        expiryDate: new Date('2025-12-31'),
        lotNumber: 'LOT-2024-D004',
        lastRestockDate: new Date('2024-12-10'),
        status: StockStatus.IN_STOCK,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-12-10')
      },
      {
        id: 'INV008',
        sku: 'SPR-DEF-001',
        name: 'Defibrillator Pads (Adult)',
        category: InventoryCategory.CONSUMABLES,
        type: InventoryType.MEDICAL_SUPPLIES,
        quantity: 35,
        minQuantity: 20,
        maxQuantity: 100,
        reorderLevel: 30,
        unitOfMeasure: 'Pair',
        unitCost: 75,
        totalValue: 2625,
        location: 'Emergency Storage E-1',
        expiryDate: new Date('2026-08-15'),
        lotNumber: 'LOT-2024-E005',
        lastRestockDate: new Date('2024-08-15'),
        status: StockStatus.IN_STOCK,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-08-15')
      }
    ];
  }
  
  private generateMaintenanceData(): MaintenanceRecord[] {
    return [
      {
        id: 'MNT001',
        equipmentId: 'EQ001',
        type: MaintenanceType.PREVENTIVE,
        status: MaintenanceStatus.COMPLETED,
        scheduledDate: new Date('2024-12-01'),
        completedDate: new Date('2024-12-01'),
        technician: 'Michael Chen',
        description: 'Quarterly preventive maintenance',
        findings: 'All systems functioning normally. Calibration verified.',
        cost: 450,
        nextScheduledDate: new Date('2025-03-01'),
        createdAt: new Date('2024-11-15'),
        updatedAt: new Date('2024-12-01')
      },
      {
        id: 'MNT002',
        equipmentId: 'EQ003',
        type: MaintenanceType.CORRECTIVE,
        status: MaintenanceStatus.IN_PROGRESS,
        scheduledDate: new Date('2025-01-10'),
        technician: 'Michael Chen',
        description: 'Alarm system malfunction repair',
        createdAt: new Date('2025-01-08'),
        updatedAt: new Date('2025-01-10')
      },
      {
        id: 'MNT003',
        equipmentId: 'EQ002',
        type: MaintenanceType.CALIBRATION,
        status: MaintenanceStatus.SCHEDULED,
        scheduledDate: new Date('2025-02-15'),
        description: 'Annual calibration check',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01')
      },
      {
        id: 'MNT004',
        equipmentId: 'EQ008',
        type: MaintenanceType.CORRECTIVE,
        status: MaintenanceStatus.OVERDUE,
        scheduledDate: new Date('2024-11-01'),
        description: 'Display repair - component replacement needed',
        findings: 'Display module needs complete replacement',
        createdAt: new Date('2024-08-01'),
        updatedAt: new Date('2024-11-15')
      },
      {
        id: 'MNT005',
        equipmentId: 'EQ007',
        type: MaintenanceType.SAFETY_INSPECTION,
        status: MaintenanceStatus.COMPLETED,
        scheduledDate: new Date('2024-12-15'),
        completedDate: new Date('2024-12-15'),
        technician: 'Sarah Johnson',
        description: 'Annual safety inspection and certification',
        findings: 'Passed all safety requirements. Certificate renewed.',
        cost: 650,
        nextScheduledDate: new Date('2025-12-15'),
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-15')
      }
    ];
  }
  
  private generateWorkOrderData(): WorkOrder[] {
    return [
      {
        id: 'WO001',
        workOrderNumber: 'WO-2025-001',
        equipmentId: 'EQ003',
        type: WorkOrderType.REPAIR,
        priority: WorkOrderPriority.HIGH,
        status: WorkOrderStatus.IN_PROGRESS,
        requestedBy: 'Dr. Amanda Torres',
        requestedDate: new Date('2025-01-08'),
        assignedTo: 'Michael Chen',
        scheduledDate: new Date('2025-01-10'),
        description: 'Ventilator alarm system not functioning correctly',
        createdAt: new Date('2025-01-08'),
        updatedAt: new Date('2025-01-10')
      },
      {
        id: 'WO002',
        workOrderNumber: 'WO-2025-002',
        equipmentId: 'EQ008',
        type: WorkOrderType.REPAIR,
        priority: WorkOrderPriority.MEDIUM,
        status: WorkOrderStatus.ON_HOLD,
        requestedBy: 'Nurse Jennifer Walsh',
        requestedDate: new Date('2024-08-01'),
        description: 'ECG display showing artifacts - needs evaluation',
        resolution: 'Awaiting replacement parts from vendor',
        createdAt: new Date('2024-08-01'),
        updatedAt: new Date('2024-11-15')
      },
      {
        id: 'WO003',
        workOrderNumber: 'WO-2025-003',
        equipmentId: 'EQ005',
        type: WorkOrderType.MAINTENANCE,
        priority: WorkOrderPriority.LOW,
        status: WorkOrderStatus.OPEN,
        requestedBy: 'Biomedical Engineering',
        requestedDate: new Date('2025-01-15'),
        scheduledDate: new Date('2025-02-01'),
        description: 'Scheduled probe cleaning and calibration',
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
      },
      {
        id: 'WO004',
        workOrderNumber: 'WO-2024-048',
        equipmentId: 'EQ001',
        type: WorkOrderType.MAINTENANCE,
        priority: WorkOrderPriority.MEDIUM,
        status: WorkOrderStatus.COMPLETED,
        requestedBy: 'Biomedical Engineering',
        requestedDate: new Date('2024-11-15'),
        assignedTo: 'Michael Chen',
        scheduledDate: new Date('2024-12-01'),
        completedDate: new Date('2024-12-01'),
        description: 'Quarterly preventive maintenance',
        resolution: 'All checks completed successfully',
        laborHours: 3,
        partsCost: 150,
        totalCost: 450,
        createdAt: new Date('2024-11-15'),
        updatedAt: new Date('2024-12-01')
      }
    ];
  }
  
  private generateVendorData(): Vendor[] {
    return [
      {
        id: 'VEN001',
        name: 'GE Healthcare India',
        contactPerson: 'Rajesh Kumar',
        email: 'rajesh.kumar@gehealthcare.com',
        phone: '+91 80 4128 5000',
        address: '122, Airport Road',
        city: 'Bangalore',
        country: 'India',
        category: VendorCategory.EQUIPMENT_MANUFACTURER,
        rating: 4.5,
        contractStartDate: new Date('2023-01-01'),
        contractEndDate: new Date('2025-12-31'),
        paymentTerms: 'Net 30',
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2024-06-15')
      },
      {
        id: 'VEN002',
        name: 'Philips India Healthcare',
        contactPerson: 'Priya Sharma',
        email: 'priya.sharma@philips.com',
        phone: '+91 124 466 5000',
        address: 'DLF Cyber City, Phase 3',
        city: 'Gurgaon',
        country: 'India',
        category: VendorCategory.EQUIPMENT_MANUFACTURER,
        rating: 4.8,
        contractStartDate: new Date('2022-06-01'),
        contractEndDate: new Date('2025-05-31'),
        paymentTerms: 'Net 45',
        isActive: true,
        createdAt: new Date('2022-06-01'),
        updatedAt: new Date('2024-08-20')
      },
      {
        id: 'VEN003',
        name: 'MedSupply India Pvt Ltd',
        contactPerson: 'Amit Patel',
        email: 'amit.patel@medsupply.in',
        phone: '+91 22 2556 7890',
        address: '45, Industrial Area',
        city: 'Mumbai',
        country: 'India',
        category: VendorCategory.CONSUMABLES_SUPPLIER,
        rating: 4.2,
        paymentTerms: 'Net 15',
        isActive: true,
        createdAt: new Date('2023-03-15'),
        updatedAt: new Date('2024-10-10')
      },
      {
        id: 'VEN004',
        name: 'BioTech Solutions',
        contactPerson: 'Dr. Meera Iyer',
        email: 'meera@biotechsolutions.in',
        phone: '+91 44 2834 5678',
        address: 'Tech Park, Velachery',
        city: 'Chennai',
        country: 'India',
        category: VendorCategory.SERVICE_PROVIDER,
        rating: 4.6,
        contractStartDate: new Date('2024-01-01'),
        contractEndDate: new Date('2024-12-31'),
        paymentTerms: 'Net 30',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-07-15')
      }
    ];
  }
  
  private generateAlertData(): Alert[] {
    return [
      {
        id: 'ALT001',
        type: AlertType.LOW_STOCK,
        severity: AlertSeverity.HIGH,
        title: 'Low Stock Alert',
        message: 'Disposable Syringes 10ml stock is below reorder level (85 units)',
        relatedItemId: 'INV002',
        relatedItemType: 'inventory',
        isRead: false,
        isAcknowledged: false,
        createdAt: new Date('2025-01-20')
      },
      {
        id: 'ALT002',
        type: AlertType.LOW_STOCK,
        severity: AlertSeverity.CRITICAL,
        title: 'Out of Stock',
        message: 'Nitrile Gloves Medium is out of stock! Immediate reorder required.',
        relatedItemId: 'INV005',
        relatedItemType: 'inventory',
        isRead: false,
        isAcknowledged: false,
        createdAt: new Date('2025-01-15')
      },
      {
        id: 'ALT003',
        type: AlertType.MAINTENANCE_OVERDUE,
        severity: AlertSeverity.HIGH,
        title: 'Maintenance Overdue',
        message: 'ECG Machine (MED-2024-008) maintenance is overdue by 81 days',
        relatedItemId: 'EQ008',
        relatedItemType: 'equipment',
        isRead: true,
        isAcknowledged: false,
        createdAt: new Date('2024-11-01')
      },
      {
        id: 'ALT004',
        type: AlertType.MAINTENANCE_DUE,
        severity: AlertSeverity.MEDIUM,
        title: 'Upcoming Maintenance',
        message: 'Defibrillator (MED-2024-004) maintenance due on January 1, 2025',
        relatedItemId: 'EQ004',
        relatedItemType: 'equipment',
        isRead: true,
        isAcknowledged: true,
        createdAt: new Date('2024-12-15')
      },
      {
        id: 'ALT005',
        type: AlertType.WARRANTY_EXPIRING,
        severity: AlertSeverity.MEDIUM,
        title: 'Warranty Expiring',
        message: 'Patient Monitor ICU (MED-2024-002) warranty expires on August 20, 2025',
        relatedItemId: 'EQ002',
        relatedItemType: 'equipment',
        isRead: false,
        isAcknowledged: false,
        createdAt: new Date('2025-01-18')
      },
      {
        id: 'ALT006',
        type: AlertType.EXPIRY_WARNING,
        severity: AlertSeverity.MEDIUM,
        title: 'Reagent Expiring Soon',
        message: 'CBC Reagent Kit expires on April 30, 2025 (12 units in stock)',
        relatedItemId: 'INV004',
        relatedItemType: 'inventory',
        isRead: false,
        isAcknowledged: false,
        createdAt: new Date('2025-01-19')
      }
    ];
  }
  
  // Methods to update data
  markAlertAsRead(alertId: string): void {
    this._alerts.update(alerts => 
      alerts.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      )
    );
  }
  
  acknowledgeAlert(alertId: string): void {
    this._alerts.update(alerts =>
      alerts.map(alert =>
        alert.id === alertId ? { ...alert, isAcknowledged: true } : alert
      )
    );
  }
  
  getEquipmentById(id: string): Equipment | undefined {
    return this._equipment().find(e => e.id === id);
  }
  
  getInventoryById(id: string): InventoryItem | undefined {
    return this._inventory().find(i => i.id === id);
  }
  
  getVendorById(id: string): Vendor | undefined {
    return this._vendors().find(v => v.id === id);
  }
  
  getAuditLogById(id: string): AuditLog | undefined {
    return this._auditLogs().find(a => a.id === id);
  }
  
  private generateAuditLogData(): AuditLog[] {
    const users = [
      { id: 'USR001', name: 'System Administrator', role: 'Admin' },
      { id: 'USR002', name: 'Dr. Sarah Wilson', role: 'Manager' },
      { id: 'USR003', name: 'Michael Chen', role: 'Technician' },
      { id: 'USR004', name: 'Emily Johnson', role: 'Manager' },
      { id: 'USR005', name: 'Robert Martinez', role: 'Technician' },
      { id: 'USR006', name: 'Jennifer Lee', role: 'Viewer' }
    ];
    
    const ipAddresses = ['192.168.1.100', '192.168.1.105', '192.168.1.110', '10.0.0.50', '10.0.0.55'];
    
    return [
      {
        id: 'AUD001',
        timestamp: new Date('2025-01-22T09:15:00'),
        userId: users[0].id,
        userName: users[0].name,
        userRole: users[0].role,
        action: AuditAction.LOGIN,
        resourceType: AuditResourceType.SYSTEM,
        resourceId: 'SYS001',
        resourceName: 'GoEMR Inventory System',
        description: 'User logged into the system',
        ipAddress: ipAddresses[0],
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
        sessionId: 'SES-2025-001',
        status: 'Success'
      },
      {
        id: 'AUD002',
        timestamp: new Date('2025-01-22T09:20:00'),
        userId: users[0].id,
        userName: users[0].name,
        userRole: users[0].role,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.EQUIPMENT,
        resourceId: 'MED-2024-001',
        resourceName: 'Portable X-Ray System',
        description: 'Updated equipment maintenance schedule',
        changes: [
          { field: 'nextMaintenanceDate', fieldLabel: 'Next Maintenance Date', oldValue: '2025-02-15', newValue: '2025-02-01' },
          { field: 'notes', fieldLabel: 'Notes', oldValue: '', newValue: 'Prioritized due to high usage' }
        ],
        ipAddress: ipAddresses[0],
        sessionId: 'SES-2025-001',
        status: 'Success'
      },
      {
        id: 'AUD003',
        timestamp: new Date('2025-01-22T10:05:00'),
        userId: users[2].id,
        userName: users[2].name,
        userRole: users[2].role,
        action: AuditAction.LOGIN,
        resourceType: AuditResourceType.SYSTEM,
        resourceId: 'SYS001',
        resourceName: 'GoEMR Inventory System',
        description: 'User logged into the system',
        ipAddress: ipAddresses[1],
        sessionId: 'SES-2025-002',
        status: 'Success'
      },
      {
        id: 'AUD004',
        timestamp: new Date('2025-01-22T10:15:00'),
        userId: users[2].id,
        userName: users[2].name,
        userRole: users[2].role,
        action: AuditAction.COMPLETE,
        resourceType: AuditResourceType.MAINTENANCE,
        resourceId: 'MNT-2025-001',
        resourceName: 'Ventilator Preventive Maintenance',
        description: 'Completed scheduled maintenance task',
        changes: [
          { field: 'status', fieldLabel: 'Status', oldValue: 'In Progress', newValue: 'Completed' },
          { field: 'completedDate', fieldLabel: 'Completed Date', oldValue: null, newValue: '2025-01-22' }
        ],
        ipAddress: ipAddresses[1],
        sessionId: 'SES-2025-002',
        status: 'Success'
      },
      {
        id: 'AUD005',
        timestamp: new Date('2025-01-22T10:30:00'),
        userId: users[1].id,
        userName: users[1].name,
        userRole: users[1].role,
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.INVENTORY,
        resourceId: 'INV-2025-009',
        resourceName: 'Surgical Masks N95',
        description: 'Added new inventory item',
        ipAddress: ipAddresses[2],
        sessionId: 'SES-2025-003',
        status: 'Success'
      },
      {
        id: 'AUD006',
        timestamp: new Date('2025-01-22T11:00:00'),
        userId: users[3].id,
        userName: users[3].name,
        userRole: users[3].role,
        action: AuditAction.EXPORT,
        resourceType: AuditResourceType.REPORT,
        resourceId: 'RPT-2025-001',
        resourceName: 'Monthly Equipment Status Report',
        description: 'Exported report to PDF format',
        metadata: { format: 'PDF', pages: 12, fileSize: '2.4 MB' },
        ipAddress: ipAddresses[3],
        sessionId: 'SES-2025-004',
        status: 'Success'
      },
      {
        id: 'AUD007',
        timestamp: new Date('2025-01-22T11:30:00'),
        userId: users[0].id,
        userName: users[0].name,
        userRole: users[0].role,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.VENDOR,
        resourceId: 'VND-001',
        resourceName: 'MedEquip Solutions Inc.',
        description: 'Updated vendor contact information',
        changes: [
          { field: 'contactEmail', fieldLabel: 'Contact Email', oldValue: 'old@medequip.com', newValue: 'support@medequip.com' },
          { field: 'phone', fieldLabel: 'Phone', oldValue: '+1-555-0100', newValue: '+1-555-0150' }
        ],
        ipAddress: ipAddresses[0],
        sessionId: 'SES-2025-001',
        status: 'Success'
      },
      {
        id: 'AUD008',
        timestamp: new Date('2025-01-22T12:00:00'),
        userId: users[4].id,
        userName: users[4].name,
        userRole: users[4].role,
        action: AuditAction.SCHEDULE,
        resourceType: AuditResourceType.MAINTENANCE,
        resourceId: 'MNT-2025-005',
        resourceName: 'MRI Scanner Calibration',
        description: 'Scheduled calibration maintenance',
        ipAddress: ipAddresses[4],
        sessionId: 'SES-2025-005',
        status: 'Success'
      },
      {
        id: 'AUD009',
        timestamp: new Date('2025-01-22T13:15:00'),
        userId: users[1].id,
        userName: users[1].name,
        userRole: users[1].role,
        action: AuditAction.APPROVE,
        resourceType: AuditResourceType.COMPLIANCE,
        resourceId: 'CMP-2025-001',
        resourceName: 'HIPAA Compliance Audit',
        description: 'Approved compliance documentation',
        ipAddress: ipAddresses[2],
        sessionId: 'SES-2025-003',
        status: 'Success'
      },
      {
        id: 'AUD010',
        timestamp: new Date('2025-01-22T14:00:00'),
        userId: users[5].id,
        userName: users[5].name,
        userRole: users[5].role,
        action: AuditAction.READ,
        resourceType: AuditResourceType.EQUIPMENT,
        resourceId: 'MED-2024-003',
        resourceName: 'Patient Monitor ICU',
        description: 'Viewed equipment details',
        ipAddress: ipAddresses[3],
        sessionId: 'SES-2025-006',
        status: 'Success'
      },
      {
        id: 'AUD011',
        timestamp: new Date('2025-01-21T16:30:00'),
        userId: users[0].id,
        userName: users[0].name,
        userRole: users[0].role,
        action: AuditAction.DELETE,
        resourceType: AuditResourceType.ALERT,
        resourceId: 'ALT-2024-050',
        resourceName: 'Resolved Low Stock Alert',
        description: 'Dismissed resolved alert notification',
        ipAddress: ipAddresses[0],
        sessionId: 'SES-2025-001',
        status: 'Success'
      },
      {
        id: 'AUD012',
        timestamp: new Date('2025-01-21T15:00:00'),
        userId: users[2].id,
        userName: users[2].name,
        userRole: users[2].role,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.EQUIPMENT,
        resourceId: 'MED-2024-005',
        resourceName: 'Defibrillator AED',
        description: 'Updated equipment status',
        changes: [
          { field: 'status', fieldLabel: 'Status', oldValue: 'Under Maintenance', newValue: 'In Service' },
          { field: 'condition', fieldLabel: 'Condition', oldValue: 'Fair', newValue: 'Good' }
        ],
        ipAddress: ipAddresses[1],
        sessionId: 'SES-2025-002',
        status: 'Success'
      },
      {
        id: 'AUD013',
        timestamp: new Date('2025-01-21T11:45:00'),
        userId: users[3].id,
        userName: users[3].name,
        userRole: users[3].role,
        action: AuditAction.TRANSFER,
        resourceType: AuditResourceType.EQUIPMENT,
        resourceId: 'MED-2024-007',
        resourceName: 'Ultrasound System',
        description: 'Transferred equipment to new location',
        changes: [
          { field: 'location.building', fieldLabel: 'Building', oldValue: 'Main Building', newValue: 'East Wing' },
          { field: 'location.room', fieldLabel: 'Room', oldValue: 'Room 201', newValue: 'Room 405' },
          { field: 'department', fieldLabel: 'Department', oldValue: 'Radiology', newValue: 'Obstetrics' }
        ],
        ipAddress: ipAddresses[3],
        sessionId: 'SES-2025-004',
        status: 'Success'
      },
      {
        id: 'AUD014',
        timestamp: new Date('2025-01-21T09:00:00'),
        userId: users[1].id,
        userName: users[1].name,
        userRole: users[1].role,
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.VENDOR,
        resourceId: 'VND-010',
        resourceName: 'BioTech Instruments Ltd.',
        description: 'Added new vendor to the system',
        ipAddress: ipAddresses[2],
        sessionId: 'SES-2025-003',
        status: 'Success'
      },
      {
        id: 'AUD015',
        timestamp: new Date('2025-01-20T14:30:00'),
        userId: users[0].id,
        userName: users[0].name,
        userRole: users[0].role,
        action: AuditAction.IMPORT,
        resourceType: AuditResourceType.INVENTORY,
        resourceId: 'BATCH-2025-001',
        resourceName: 'Inventory Batch Import',
        description: 'Bulk imported 25 inventory items from CSV',
        metadata: { itemCount: 25, format: 'CSV', fileSize: '45 KB' },
        ipAddress: ipAddresses[0],
        sessionId: 'SES-2025-001',
        status: 'Success'
      },
      {
        id: 'AUD016',
        timestamp: new Date('2025-01-20T10:20:00'),
        userId: users[4].id,
        userName: users[4].name,
        userRole: users[4].role,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.MAINTENANCE,
        resourceId: 'MNT-2025-002',
        resourceName: 'CT Scanner Annual Service',
        description: 'Failed to update maintenance record - validation error',
        ipAddress: ipAddresses[4],
        sessionId: 'SES-2025-005',
        status: 'Failed',
        metadata: { errorCode: 'VAL_001', errorMessage: 'Invalid date format' }
      },
      {
        id: 'AUD017',
        timestamp: new Date('2025-01-19T16:00:00'),
        userId: users[2].id,
        userName: users[2].name,
        userRole: users[2].role,
        action: AuditAction.ASSIGN,
        resourceType: AuditResourceType.MAINTENANCE,
        resourceId: 'MNT-2025-003',
        resourceName: 'Infusion Pump Inspection',
        description: 'Assigned maintenance task to technician',
        changes: [
          { field: 'assignedTo', fieldLabel: 'Assigned To', oldValue: null, newValue: 'Robert Martinez' }
        ],
        ipAddress: ipAddresses[1],
        sessionId: 'SES-2025-002',
        status: 'Success'
      },
      {
        id: 'AUD018',
        timestamp: new Date('2025-01-19T11:30:00'),
        userId: users[0].id,
        userName: users[0].name,
        userRole: users[0].role,
        action: AuditAction.ARCHIVE,
        resourceType: AuditResourceType.EQUIPMENT,
        resourceId: 'MED-2023-015',
        resourceName: 'Old ECG Machine',
        description: 'Archived decommissioned equipment record',
        changes: [
          { field: 'status', fieldLabel: 'Status', oldValue: 'Decommissioned', newValue: 'Disposed' },
          { field: 'archived', fieldLabel: 'Archived', oldValue: false, newValue: true }
        ],
        ipAddress: ipAddresses[0],
        sessionId: 'SES-2025-001',
        status: 'Success'
      },
      {
        id: 'AUD019',
        timestamp: new Date('2025-01-18T09:45:00'),
        userId: users[1].id,
        userName: users[1].name,
        userRole: users[1].role,
        action: AuditAction.REJECT,
        resourceType: AuditResourceType.COMPLIANCE,
        resourceId: 'CMP-2025-002',
        resourceName: 'Equipment Disposal Request',
        description: 'Rejected disposal request - incomplete documentation',
        metadata: { reason: 'Missing hazardous materials certification' },
        ipAddress: ipAddresses[2],
        sessionId: 'SES-2025-003',
        status: 'Success'
      },
      {
        id: 'AUD020',
        timestamp: new Date('2025-01-18T08:00:00'),
        userId: users[0].id,
        userName: users[0].name,
        userRole: users[0].role,
        action: AuditAction.LOGOUT,
        resourceType: AuditResourceType.SYSTEM,
        resourceId: 'SYS001',
        resourceName: 'GoEMR Inventory System',
        description: 'User logged out of the system',
        ipAddress: ipAddresses[0],
        sessionId: 'SES-2024-999',
        status: 'Success'
      }
    ];
  }
}
