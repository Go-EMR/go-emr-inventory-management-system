import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import {
  DepreciationConfig,
  DepreciationMethod,
  DepreciationType,
  DepreciationPeriod,
  DepreciationStatus,
  DepreciationScheduleEntry,
  DepreciationSummary,
  DepreciationReport,
  DepreciationReportAsset,
  DepreciationCalculationRequest,
  DepreciationCalculationResult,
  Equipment
} from '../../shared/models';
import { environment } from '../../../environments/environment';
import { MockDataService } from './mock-data.service';

@Injectable({
  providedIn: 'root'
})
export class DepreciationService {
  private http = inject(HttpClient);
  private mockDataService = inject(MockDataService);
  private baseUrl = `${environment.apiUrl}/api/v1/depreciation`;

  // Signals for reactive state
  private configsSignal = signal<DepreciationConfig[]>([]);
  private selectedConfigSignal = signal<DepreciationConfig | null>(null);
  private scheduleSignal = signal<DepreciationScheduleEntry[]>([]);
  private summarySignal = signal<DepreciationSummary | null>(null);
  private loadingSignal = signal(false);

  readonly configs = this.configsSignal.asReadonly();
  readonly selectedConfig = this.selectedConfigSignal.asReadonly();
  readonly schedule = this.scheduleSignal.asReadonly();
  readonly summary = this.summarySignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  // Computed values
  readonly activeConfigs = computed(() =>
    this.configsSignal().filter(c => c.status === DepreciationStatus.ACTIVE)
  );

  readonly fullyDepreciatedConfigs = computed(() =>
    this.configsSignal().filter(c => c.status === DepreciationStatus.FULLY_DEPRECIATED)
  );

  readonly totalBookValue = computed(() =>
    this.configsSignal().reduce((sum, c) => sum + c.currentBookValue, 0)
  );

  readonly totalAccumulatedDepreciation = computed(() =>
    this.configsSignal().reduce((sum, c) => sum + c.accumulatedDepreciation, 0)
  );

  // Mock data for development
  private mockConfigs: DepreciationConfig[] = [
    {
      id: 'dep-1',
      tenantId: 'tenant-1',
      equipmentId: 'eq-1',
      equipmentName: 'Puritan Bennett 840 Ventilator',
      equipmentInventoryNumber: 'EQ-2024-0001',
      depreciationType: DepreciationType.BOOK,
      method: DepreciationMethod.STRAIGHT_LINE,
      acquisitionCost: 45000,
      salvageValue: 5000,
      depreciableBasis: 40000,
      usefulLifeYears: 10,
      usefulLifeMonths: 120,
      placedInServiceDate: new Date('2024-01-15'),
      depreciationStartDate: new Date('2024-02-01'),
      expectedEndDate: new Date('2034-01-31'),
      period: DepreciationPeriod.MONTHLY,
      status: DepreciationStatus.ACTIVE,
      accumulatedDepreciation: 4000,
      currentBookValue: 41000,
      percentDepreciated: 10,
      lastCalculationDate: new Date(),
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date()
    },
    {
      id: 'dep-2',
      tenantId: 'tenant-1',
      equipmentId: 'eq-2',
      equipmentName: 'GE Signa MRI Scanner',
      equipmentInventoryNumber: 'EQ-2023-0015',
      depreciationType: DepreciationType.BOOK,
      method: DepreciationMethod.DOUBLE_DECLINING_BALANCE,
      acquisitionCost: 1500000,
      salvageValue: 150000,
      depreciableBasis: 1350000,
      usefulLifeYears: 15,
      usefulLifeMonths: 180,
      placedInServiceDate: new Date('2023-06-01'),
      depreciationStartDate: new Date('2023-07-01'),
      expectedEndDate: new Date('2038-06-30'),
      period: DepreciationPeriod.MONTHLY,
      status: DepreciationStatus.ACTIVE,
      accumulatedDepreciation: 200000,
      currentBookValue: 1300000,
      percentDepreciated: 14.8,
      lastCalculationDate: new Date(),
      createdAt: new Date('2023-06-01'),
      updatedAt: new Date()
    },
    {
      id: 'dep-3',
      tenantId: 'tenant-1',
      equipmentId: 'eq-3',
      equipmentName: 'Philips IntelliVue MX800 Monitor',
      equipmentInventoryNumber: 'EQ-2022-0042',
      depreciationType: DepreciationType.BOOK,
      method: DepreciationMethod.STRAIGHT_LINE,
      acquisitionCost: 25000,
      salvageValue: 2500,
      depreciableBasis: 22500,
      usefulLifeYears: 7,
      usefulLifeMonths: 84,
      placedInServiceDate: new Date('2022-03-15'),
      depreciationStartDate: new Date('2022-04-01'),
      expectedEndDate: new Date('2029-03-31'),
      period: DepreciationPeriod.MONTHLY,
      status: DepreciationStatus.ACTIVE,
      accumulatedDepreciation: 11250,
      currentBookValue: 13750,
      percentDepreciated: 50,
      lastCalculationDate: new Date(),
      createdAt: new Date('2022-03-15'),
      updatedAt: new Date()
    },
    {
      id: 'dep-4',
      tenantId: 'tenant-1',
      equipmentId: 'eq-4',
      equipmentName: 'Stryker Operating Table',
      equipmentInventoryNumber: 'EQ-2020-0008',
      depreciationType: DepreciationType.BOOK,
      method: DepreciationMethod.STRAIGHT_LINE,
      acquisitionCost: 85000,
      salvageValue: 8500,
      depreciableBasis: 76500,
      usefulLifeYears: 15,
      usefulLifeMonths: 180,
      placedInServiceDate: new Date('2020-01-01'),
      depreciationStartDate: new Date('2020-02-01'),
      expectedEndDate: new Date('2035-01-31'),
      period: DepreciationPeriod.MONTHLY,
      status: DepreciationStatus.ACTIVE,
      accumulatedDepreciation: 30600,
      currentBookValue: 54400,
      percentDepreciated: 40,
      lastCalculationDate: new Date(),
      createdAt: new Date('2020-01-01'),
      updatedAt: new Date()
    },
    {
      id: 'dep-5',
      tenantId: 'tenant-1',
      equipmentId: 'eq-5',
      equipmentName: 'Medtronic Infusion Pump',
      equipmentInventoryNumber: 'EQ-2019-0023',
      depreciationType: DepreciationType.BOOK,
      method: DepreciationMethod.STRAIGHT_LINE,
      acquisitionCost: 8500,
      salvageValue: 500,
      depreciableBasis: 8000,
      usefulLifeYears: 5,
      usefulLifeMonths: 60,
      placedInServiceDate: new Date('2019-06-01'),
      depreciationStartDate: new Date('2019-07-01'),
      expectedEndDate: new Date('2024-06-30'),
      period: DepreciationPeriod.MONTHLY,
      status: DepreciationStatus.FULLY_DEPRECIATED,
      accumulatedDepreciation: 8000,
      currentBookValue: 500,
      percentDepreciated: 100,
      lastCalculationDate: new Date('2024-06-30'),
      createdAt: new Date('2019-06-01'),
      updatedAt: new Date('2024-06-30')
    }
  ];

  constructor() {
    this.configsSignal.set(this.mockConfigs);
  }

  // ==================== Configuration CRUD ====================

  createConfig(config: Omit<DepreciationConfig, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Observable<DepreciationConfig> {
    const newConfig: DepreciationConfig = {
      ...config,
      id: `dep-${Date.now()}`,
      tenantId: 'tenant-1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.mockConfigs.unshift(newConfig);
    this.configsSignal.set([...this.mockConfigs]);

    return of(newConfig).pipe(delay(500));
  }

  getConfig(id: string): Observable<DepreciationConfig | undefined> {
    const config = this.mockConfigs.find(c => c.id === id);
    if (config) {
      this.selectedConfigSignal.set(config);
    }
    return of(config).pipe(delay(300));
  }

  getConfigByEquipmentId(equipmentId: string): Observable<DepreciationConfig | undefined> {
    const config = this.mockConfigs.find(c => c.equipmentId === equipmentId);
    return of(config).pipe(delay(300));
  }

  listConfigs(status?: DepreciationStatus): Observable<DepreciationConfig[]> {
    let configs = [...this.mockConfigs];
    if (status) {
      configs = configs.filter(c => c.status === status);
    }
    this.configsSignal.set(configs);
    return of(configs).pipe(delay(300));
  }

  updateConfig(id: string, updates: Partial<DepreciationConfig>): Observable<DepreciationConfig> {
    const config = this.mockConfigs.find(c => c.id === id);
    if (config) {
      Object.assign(config, updates, { updatedAt: new Date() });
      this.configsSignal.set([...this.mockConfigs]);
      this.selectedConfigSignal.set(config);
    }
    return of(config!).pipe(delay(500));
  }

  deleteConfig(id: string): Observable<void> {
    const index = this.mockConfigs.findIndex(c => c.id === id);
    if (index > -1) {
      this.mockConfigs.splice(index, 1);
      this.configsSignal.set([...this.mockConfigs]);
    }
    return of(void 0).pipe(delay(300));
  }

  // ==================== Depreciation Calculations ====================

  calculateDepreciation(request: DepreciationCalculationRequest): Observable<DepreciationCalculationResult> {
    const { method, acquisitionCost, salvageValue, usefulLifeYears, placedInServiceDate, period } = request;
    const depreciableBasis = acquisitionCost - salvageValue;

    let periodsPerYear: number;
    switch (period) {
      case DepreciationPeriod.MONTHLY: periodsPerYear = 12; break;
      case DepreciationPeriod.QUARTERLY: periodsPerYear = 4; break;
      case DepreciationPeriod.ANNUALLY: periodsPerYear = 1; break;
      default: periodsPerYear = 12;
    }

    const totalPeriods = usefulLifeYears * periodsPerYear;
    const schedule: DepreciationScheduleEntry[] = [];

    let bookValue = acquisitionCost;
    let accumulatedDep = 0;
    const startDate = new Date(placedInServiceDate);

    for (let i = 1; i <= totalPeriods; i++) {
      let expense: number;

      switch (method) {
        case DepreciationMethod.STRAIGHT_LINE:
          expense = depreciableBasis / totalPeriods;
          break;

        case DepreciationMethod.DECLINING_BALANCE:
          const rateDB = (1 / usefulLifeYears) * 1.5;
          expense = Math.max(0, Math.min(bookValue * rateDB / periodsPerYear, bookValue - salvageValue));
          break;

        case DepreciationMethod.DOUBLE_DECLINING_BALANCE:
          const rateDDB = (1 / usefulLifeYears) * 2;
          expense = Math.max(0, Math.min(bookValue * rateDDB / periodsPerYear, bookValue - salvageValue));
          break;

        case DepreciationMethod.SUM_OF_YEARS_DIGITS:
          const sumOfYears = (usefulLifeYears * (usefulLifeYears + 1)) / 2;
          const yearNumber = Math.ceil(i / periodsPerYear);
          const remainingYears = usefulLifeYears - yearNumber + 1;
          expense = (remainingYears / sumOfYears) * depreciableBasis / periodsPerYear;
          break;

        case DepreciationMethod.UNITS_OF_PRODUCTION:
          const totalUnits = request.totalUnits || 100000;
          const unitsPerPeriod = totalUnits / totalPeriods;
          expense = (unitsPerPeriod / totalUnits) * depreciableBasis;
          break;

        default:
          expense = depreciableBasis / totalPeriods;
      }

      // Ensure we don't depreciate below salvage value
      if (bookValue - expense < salvageValue) {
        expense = bookValue - salvageValue;
      }

      const periodStartDate = new Date(startDate);
      const periodEndDate = new Date(startDate);

      switch (period) {
        case DepreciationPeriod.MONTHLY:
          periodStartDate.setMonth(startDate.getMonth() + i - 1);
          periodEndDate.setMonth(startDate.getMonth() + i);
          periodEndDate.setDate(periodEndDate.getDate() - 1);
          break;
        case DepreciationPeriod.QUARTERLY:
          periodStartDate.setMonth(startDate.getMonth() + (i - 1) * 3);
          periodEndDate.setMonth(startDate.getMonth() + i * 3);
          periodEndDate.setDate(periodEndDate.getDate() - 1);
          break;
        case DepreciationPeriod.ANNUALLY:
          periodStartDate.setFullYear(startDate.getFullYear() + i - 1);
          periodEndDate.setFullYear(startDate.getFullYear() + i);
          periodEndDate.setDate(periodEndDate.getDate() - 1);
          break;
      }

      accumulatedDep += expense;

      schedule.push({
        id: `entry-${i}`,
        configId: '',
        periodNumber: i,
        periodStartDate,
        periodEndDate,
        beginningBookValue: bookValue,
        depreciationExpense: Math.round(expense * 100) / 100,
        accumulatedDepreciation: Math.round(accumulatedDep * 100) / 100,
        endingBookValue: Math.round((bookValue - expense) * 100) / 100,
        isActual: false,
        isProcessed: false
      });

      bookValue -= expense;
    }

    const result: DepreciationCalculationResult = {
      depreciableBasis,
      periodsCount: totalPeriods,
      schedule,
      summary: {
        totalDepreciation: depreciableBasis,
        averageAnnualDepreciation: depreciableBasis / usefulLifeYears,
        finalBookValue: salvageValue
      }
    };

    return of(result).pipe(delay(500));
  }

  getSchedule(configId: string): Observable<DepreciationScheduleEntry[]> {
    const config = this.mockConfigs.find(c => c.id === configId);
    if (!config) {
      return of([]).pipe(delay(300));
    }

    // Generate schedule for this config
    const request: DepreciationCalculationRequest = {
      equipmentId: config.equipmentId,
      method: config.method,
      acquisitionCost: config.acquisitionCost,
      salvageValue: config.salvageValue,
      usefulLifeYears: config.usefulLifeYears,
      placedInServiceDate: config.placedInServiceDate,
      period: config.period
    };

    return this.calculateDepreciation(request).pipe(
      delay(300)
    ) as unknown as Observable<DepreciationScheduleEntry[]>;
  }

  // ==================== Summary & Reports ====================

  getSummary(): Observable<DepreciationSummary> {
    const allConfigs = this.mockConfigs;
    const activeConfigs = allConfigs.filter(c => c.status === DepreciationStatus.ACTIVE);

    // Calculate monthly expense (simplified)
    let monthlyExpense = 0;
    let ytdExpense = 0;
    const currentMonth = new Date().getMonth();

    activeConfigs.forEach(config => {
      if (config.period === DepreciationPeriod.MONTHLY) {
        const monthlyDep = config.depreciableBasis / config.usefulLifeMonths;
        monthlyExpense += monthlyDep;
        ytdExpense += monthlyDep * (currentMonth + 1);
      }
    });

    // Assets by method
    const methodGroups = new Map<DepreciationMethod, { count: number; value: number }>();
    allConfigs.forEach(c => {
      const existing = methodGroups.get(c.method);
      if (existing) {
        existing.count++;
        existing.value += c.currentBookValue;
      } else {
        methodGroups.set(c.method, { count: 1, value: c.currentBookValue });
      }
    });
    const assetsByMethod = Array.from(methodGroups.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      value: data.value
    }));

    // Assets by department (using mock department data)
    const assetsByDepartment = [
      { department: 'Radiology', count: 2, bookValue: 1350000 },
      { department: 'ICU', count: 1, bookValue: 41000 },
      { department: 'Surgery', count: 1, bookValue: 54400 },
      { department: 'General', count: 1, bookValue: 500 }
    ];

    // Upcoming fully depreciated (next 90 days)
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
    const upcomingFullyDepreciated = activeConfigs.filter(c =>
      c.expectedEndDate <= ninetyDaysFromNow
    );

    const summary: DepreciationSummary = {
      totalAssets: allConfigs.length,
      totalAcquisitionCost: allConfigs.reduce((sum, c) => sum + c.acquisitionCost, 0),
      totalAccumulatedDepreciation: allConfigs.reduce((sum, c) => sum + c.accumulatedDepreciation, 0),
      totalCurrentBookValue: allConfigs.reduce((sum, c) => sum + c.currentBookValue, 0),
      depreciationExpenseThisMonth: Math.round(monthlyExpense * 100) / 100,
      depreciationExpenseYTD: Math.round(ytdExpense * 100) / 100,
      fullyDepreciatedAssets: allConfigs.filter(c => c.status === DepreciationStatus.FULLY_DEPRECIATED).length,
      activeDepreciatingAssets: activeConfigs.length,
      assetsByMethod,
      assetsByDepartment,
      upcomingFullyDepreciated
    };

    this.summarySignal.set(summary);
    return of(summary).pipe(delay(300));
  }

  generateReport(
    reportType: 'summary' | 'detail' | 'schedule' | 'variance',
    startDate: Date,
    endDate: Date
  ): Observable<DepreciationReport> {
    const assets: DepreciationReportAsset[] = this.mockConfigs.map(c => ({
      equipmentId: c.equipmentId,
      equipmentName: c.equipmentName,
      inventoryNumber: c.equipmentInventoryNumber || '',
      department: 'General',
      category: 'Medical Equipment',
      method: c.method,
      acquisitionCost: c.acquisitionCost,
      acquisitionDate: c.placedInServiceDate,
      usefulLife: c.usefulLifeYears,
      salvageValue: c.salvageValue,
      accumulatedDepreciation: c.accumulatedDepreciation,
      bookValue: c.currentBookValue,
      periodExpense: c.depreciableBasis / c.usefulLifeMonths,
      percentDepreciated: c.percentDepreciated,
      status: c.status
    }));

    const report: DepreciationReport = {
      reportDate: new Date(),
      periodStart: startDate,
      periodEnd: endDate,
      reportType,
      assets,
      totals: {
        acquisitionCost: assets.reduce((sum, a) => sum + a.acquisitionCost, 0),
        accumulatedDepreciation: assets.reduce((sum, a) => sum + a.accumulatedDepreciation, 0),
        bookValue: assets.reduce((sum, a) => sum + a.bookValue, 0),
        periodExpense: assets.reduce((sum, a) => sum + a.periodExpense, 0)
      }
    };

    return of(report).pipe(delay(500));
  }

  // ==================== Equipment List (for configuration) ====================

  getEquipmentWithoutDepreciation(): Observable<Equipment[]> {
    const configuredEquipmentIds = new Set(this.mockConfigs.map(c => c.equipmentId));
    const availableEquipment = this.mockDataService.equipment().filter(
      e => !configuredEquipmentIds.has(e.id)
    );
    return of(availableEquipment).pipe(delay(300));
  }

  getEquipmentById(id: string): Observable<Equipment | undefined> {
    const equipment = this.mockDataService.equipment().find(e => e.id === id);
    return of(equipment).pipe(delay(200));
  }
}
