import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import {
  Vendor,
  VendorCategory,
  VendorPerformanceMetrics,
  VendorScorecard,
  VendorPerformanceSummary,
  VendorComparison,
  VendorComparisonItem,
  VendorPerformanceIssue,
  VendorScoringWeights,
  SupplierPerformanceTier,
  DeliveryMetrics,
  QualityMetrics,
  PricingMetrics,
  ResponsivenessMetrics,
  OrderMetrics,
  PerformanceRecommendation,
  PerformanceArea,
  RecommendationPriority,
  PerformanceIssueType,
  PerformanceIssueSeverity,
  PerformanceIssueStatus,
  TrendPoint,
  PaginatedResponse
} from '../../shared/models';
import { environment } from '../../../environments/environment';

export interface PerformanceIssueFilter {
  supplierId?: string;
  issueType?: PerformanceIssueType;
  severity?: PerformanceIssueSeverity;
  status?: PerformanceIssueStatus;
  assignedTo?: string;
  openOnly?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VendorPerformanceService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1/inventory`;

  // Signals
  private summarySignal = signal<VendorPerformanceSummary | null>(null);
  private scorecardsSignal = signal<VendorScorecard[]>([]);
  private loadingSignal = signal(false);

  readonly summary = this.summarySignal.asReadonly();
  readonly scorecards = this.scorecardsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  // Mock vendors
  private mockVendors: Vendor[] = [
    { id: 'sup-1', tenantId: 'tenant-1', name: 'MedSupply Corp', contactPerson: 'John Doe', email: 'john@medsupply.com', phone: '555-0101', address: '123 Medical Dr', city: 'Boston', country: 'USA', category: VendorCategory.CONSUMABLES_SUPPLIER, rating: 4.5, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'sup-2', tenantId: 'tenant-1', name: 'LabEquip Inc', contactPerson: 'Jane Smith', email: 'jane@labequip.com', phone: '555-0102', address: '456 Lab Ave', city: 'Chicago', country: 'USA', category: VendorCategory.EQUIPMENT_MANUFACTURER, rating: 4.8, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'sup-3', tenantId: 'tenant-1', name: 'PharmaDist LLC', contactPerson: 'Bob Wilson', email: 'bob@pharmadist.com', phone: '555-0103', address: '789 Pharma Blvd', city: 'New York', country: 'USA', category: VendorCategory.DISTRIBUTOR, rating: 3.8, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'sup-4', tenantId: 'tenant-1', name: 'BioTech Solutions', contactPerson: 'Sarah Johnson', email: 'sarah@biotech.com', phone: '555-0104', address: '321 Bio Lane', city: 'San Francisco', country: 'USA', category: VendorCategory.SERVICE_PROVIDER, rating: 4.2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { id: 'sup-5', tenantId: 'tenant-1', name: 'SurgicalPro Ltd', contactPerson: 'Mike Brown', email: 'mike@surgicalpro.com', phone: '555-0105', address: '654 Surgery Way', city: 'Los Angeles', country: 'USA', category: VendorCategory.PARTS_SUPPLIER, rating: 3.5, isActive: true, createdAt: new Date(), updatedAt: new Date() }
  ];

  // Mock scorecards
  private mockScorecards: VendorScorecard[] = [
    {
      supplierId: 'sup-1', supplierName: 'MedSupply Corp', category: VendorCategory.CONSUMABLES_SUPPLIER, isActive: true,
      overallScore: 92, tier: SupplierPerformanceTier.PLATINUM, previousScore: 89, scoreChange: 3,
      deliveryScore: 95, qualityScore: 94, pricingScore: 88, responsivenessScore: 90, orderScore: 93,
      totalOrders: 145, totalSpend: 125000, onTimeRate: 96, qualityRate: 98,
      hasActiveIssues: false, contractExpiringSoon: false
    },
    {
      supplierId: 'sup-2', supplierName: 'LabEquip Inc', category: VendorCategory.EQUIPMENT_MANUFACTURER, isActive: true,
      overallScore: 88, tier: SupplierPerformanceTier.GOLD, previousScore: 90, scoreChange: -2,
      deliveryScore: 85, qualityScore: 95, pricingScore: 82, responsivenessScore: 92, orderScore: 86,
      totalOrders: 52, totalSpend: 280000, onTimeRate: 88, qualityRate: 99,
      hasActiveIssues: true, contractExpiringSoon: false
    },
    {
      supplierId: 'sup-3', supplierName: 'PharmaDist LLC', category: VendorCategory.DISTRIBUTOR, isActive: true,
      overallScore: 72, tier: SupplierPerformanceTier.SILVER, previousScore: 75, scoreChange: -3,
      deliveryScore: 68, qualityScore: 78, pricingScore: 75, responsivenessScore: 70, orderScore: 69,
      totalOrders: 89, totalSpend: 95000, onTimeRate: 72, qualityRate: 85,
      hasActiveIssues: true, contractExpiringSoon: true, daysUntilContractExpires: 45
    },
    {
      supplierId: 'sup-4', supplierName: 'BioTech Solutions', category: VendorCategory.SERVICE_PROVIDER, isActive: true,
      overallScore: 85, tier: SupplierPerformanceTier.GOLD, previousScore: 82, scoreChange: 3,
      deliveryScore: 88, qualityScore: 90, pricingScore: 78, responsivenessScore: 85, orderScore: 84,
      totalOrders: 34, totalSpend: 45000, onTimeRate: 91, qualityRate: 94,
      hasActiveIssues: false, contractExpiringSoon: false
    },
    {
      supplierId: 'sup-5', supplierName: 'SurgicalPro Ltd', category: VendorCategory.PARTS_SUPPLIER, isActive: true,
      overallScore: 58, tier: SupplierPerformanceTier.AT_RISK, previousScore: 62, scoreChange: -4,
      deliveryScore: 55, qualityScore: 60, pricingScore: 65, responsivenessScore: 50, orderScore: 60,
      totalOrders: 28, totalSpend: 32000, onTimeRate: 58, qualityRate: 72,
      hasActiveIssues: true, contractExpiringSoon: false
    }
  ];

  // Mock performance issues
  private mockIssues: VendorPerformanceIssue[] = [
    {
      id: 'issue-1', supplierId: 'sup-2', supplierName: 'LabEquip Inc',
      issueType: PerformanceIssueType.LATE_DELIVERY, severity: PerformanceIssueSeverity.MEDIUM,
      title: 'Delayed microscope delivery', description: 'Order PO-2026-0042 was delivered 5 days late',
      relatedPoId: 'po-42', relatedPoNumber: 'PO-2026-0042',
      financialImpact: 0, operationalImpact: 'Lab testing delayed',
      status: PerformanceIssueStatus.IN_PROGRESS, assignedTo: 'John Smith',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), updatedAt: new Date()
    },
    {
      id: 'issue-2', supplierId: 'sup-3', supplierName: 'PharmaDist LLC',
      issueType: PerformanceIssueType.QUALITY_DEFECT, severity: PerformanceIssueSeverity.HIGH,
      title: 'Damaged packaging on medical supplies', description: 'Multiple boxes arrived with water damage',
      relatedPoId: 'po-38', relatedPoNumber: 'PO-2026-0038', relatedItemId: 'item-15', relatedItemName: 'Sterile Bandages',
      financialImpact: 450, operationalImpact: 'Had to source replacement from backup supplier',
      status: PerformanceIssueStatus.PENDING_VENDOR, assignedTo: 'Jane Doe',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), updatedAt: new Date()
    },
    {
      id: 'issue-3', supplierId: 'sup-5', supplierName: 'SurgicalPro Ltd',
      issueType: PerformanceIssueType.COMMUNICATION_FAILURE, severity: PerformanceIssueSeverity.CRITICAL,
      title: 'No response to urgent order inquiry', description: 'No response received after 72 hours for critical part inquiry',
      operationalImpact: 'Surgery equipment maintenance delayed',
      status: PerformanceIssueStatus.OPEN, assignedTo: 'Mike Johnson',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), updatedAt: new Date()
    },
    {
      id: 'issue-4', supplierId: 'sup-3', supplierName: 'PharmaDist LLC',
      issueType: PerformanceIssueType.PRICING_DISCREPANCY, severity: PerformanceIssueSeverity.LOW,
      title: 'Invoice price mismatch', description: 'Invoice showed 5% higher price than quoted',
      relatedPoId: 'po-35', relatedPoNumber: 'PO-2026-0035',
      financialImpact: 125, status: PerformanceIssueStatus.RESOLVED,
      resolutionNotes: 'Credit note issued by supplier',
      resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), updatedAt: new Date()
    }
  ];

  // ==================== Performance Summary ====================

  getPerformanceSummary(period = '90d'): Observable<VendorPerformanceSummary> {
    const summary: VendorPerformanceSummary = {
      totalActiveSuppliers: 5,
      platinumTierCount: 1,
      goldTierCount: 2,
      silverTierCount: 1,
      bronzeTierCount: 0,
      atRiskCount: 1,
      averageOnTimeRate: 81,
      averageQualityRate: 89.6,
      totalSpendPeriod: 577000,
      topPerformers: this.mockScorecards.filter(s => s.tier === SupplierPerformanceTier.PLATINUM || s.tier === SupplierPerformanceTier.GOLD).slice(0, 3),
      needsAttention: this.mockScorecards.filter(s => s.tier === SupplierPerformanceTier.AT_RISK || s.hasActiveIssues),
      recentlyImproved: this.mockScorecards.filter(s => s.scoreChange > 0).slice(0, 3),
      declining: this.mockScorecards.filter(s => s.scoreChange < 0).slice(0, 3),
      openQualityIssues: 2,
      lateDeliveriesThisMonth: 4,
      contractsExpiringSoon: 1
    };

    this.summarySignal.set(summary);
    return of(summary).pipe(delay(300));
  }

  // ==================== Scorecards ====================

  listScorecards(
    categoryFilter?: VendorCategory,
    tierFilter?: SupplierPerformanceTier,
    sortBy = 'score',
    sortDesc = true
  ): Observable<VendorScorecard[]> {
    let scorecards = [...this.mockScorecards];

    if (categoryFilter) {
      scorecards = scorecards.filter(s => s.category === categoryFilter);
    }
    if (tierFilter) {
      scorecards = scorecards.filter(s => s.tier === tierFilter);
    }

    scorecards.sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortBy) {
        case 'spend': aVal = a.totalSpend; bVal = b.totalSpend; break;
        case 'orders': aVal = a.totalOrders; bVal = b.totalOrders; break;
        case 'on_time_rate': aVal = a.onTimeRate; bVal = b.onTimeRate; break;
        default: aVal = a.overallScore; bVal = b.overallScore;
      }
      return sortDesc ? bVal - aVal : aVal - bVal;
    });

    this.scorecardsSignal.set(scorecards);
    return of(scorecards).pipe(delay(300));
  }

  getScorecard(supplierId: string): Observable<VendorScorecard | undefined> {
    const scorecard = this.mockScorecards.find(s => s.supplierId === supplierId);
    return of(scorecard).pipe(delay(300));
  }

  // ==================== Detailed Metrics ====================

  getPerformanceMetrics(supplierId: string, period = '90d'): Observable<VendorPerformanceMetrics> {
    const scorecard = this.mockScorecards.find(s => s.supplierId === supplierId);
    const vendor = this.mockVendors.find(v => v.id === supplierId);

    const now = new Date();
    const periodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const generateTrend = (baseValue: number): TrendPoint[] => {
      const points: TrendPoint[] = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        points.push({
          date,
          value: baseValue + (Math.random() - 0.5) * 10,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      }
      return points;
    };

    const metrics: VendorPerformanceMetrics = {
      supplierId,
      supplierName: vendor?.name || 'Unknown',
      periodStart,
      periodEnd: now,
      delivery: {
        totalDeliveries: 45,
        onTimeDeliveries: Math.round(45 * (scorecard?.onTimeRate || 80) / 100),
        earlyDeliveries: 5,
        lateDeliveries: Math.round(45 * (1 - (scorecard?.onTimeRate || 80) / 100)),
        onTimeRate: scorecard?.onTimeRate || 80,
        averageLeadTimeDays: 5.2,
        promisedLeadTimeDays: 5,
        leadTimeVariance: 0.2,
        averageDaysLate: 2.5,
        maxDaysLate: 7,
        deliveryScore: scorecard?.deliveryScore || 75,
        onTimeTrend: generateTrend(scorecard?.onTimeRate || 80)
      },
      quality: {
        totalLineItemsReceived: 320,
        itemsAccepted: Math.round(320 * (scorecard?.qualityRate || 90) / 100),
        itemsRejected: Math.round(320 * (1 - (scorecard?.qualityRate || 90) / 100)),
        itemsRequiringRework: 5,
        acceptanceRate: scorecard?.qualityRate || 90,
        rejectionRate: 100 - (scorecard?.qualityRate || 90),
        defectRate: 2.5,
        damagedItems: 3,
        wrongItems: 2,
        quantityDiscrepancies: 4,
        documentationErrors: 2,
        packagingIssues: 3,
        expiredItemsReceived: 0,
        qualityScore: scorecard?.qualityScore || 85,
        returnRequests: 2,
        returnRate: 1.5
      },
      pricing: {
        totalSpend: scorecard?.totalSpend || 50000,
        averageOrderValue: (scorecard?.totalSpend || 50000) / (scorecard?.totalOrders || 30),
        priceVariance: 2.3,
        priceIncreases: 2,
        priceDecreases: 1,
        avgPriceChangePercent: 1.5,
        priceCompetitivenessScore: 78,
        costSavingsAchieved: 2500,
        potentialSavings: 1200,
        totalInvoices: 42,
        accurateInvoices: 40,
        invoiceDiscrepancies: 2,
        invoiceAccuracyRate: 95.2,
        pricingScore: scorecard?.pricingScore || 80
      },
      responsiveness: {
        avgQuoteResponseHours: 4.5,
        avgInquiryResponseHours: 8.2,
        avgIssueResolutionHours: 24,
        avgOrderConfirmationHours: 2.1,
        ordersRequiringFollowUp: 3,
        supportTicketsOpened: 8,
        supportTicketsResolved: 7,
        supportSatisfactionScore: 4.2,
        responsivenessScore: scorecard?.responsivenessScore || 82
      },
      orders: {
        totalOrders: scorecard?.totalOrders || 30,
        ordersCompleted: Math.round((scorecard?.totalOrders || 30) * 0.95),
        ordersCancelled: 1,
        ordersPending: 2,
        completionRate: 95,
        cancellationRate: 3.3,
        totalLinesOrdered: 150,
        totalLinesFulfilled: 145,
        lineFillRate: 96.7,
        unitFillRate: 98.2,
        backorderCount: 2,
        backorderRate: 1.3,
        avgBackorderDurationDays: 5,
        orderScore: scorecard?.orderScore || 85
      },
      overallScore: scorecard?.overallScore || 78,
      tier: scorecard?.tier || SupplierPerformanceTier.SILVER,
      previousPeriodScore: scorecard?.previousScore || 75,
      scoreTrend: scorecard?.scoreChange || 0,
      recommendations: this.generateRecommendations(scorecard)
    };

    return of(metrics).pipe(delay(500));
  }

  private generateRecommendations(scorecard?: VendorScorecard): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    if (!scorecard) return recommendations;

    if (scorecard.deliveryScore < 80) {
      recommendations.push({
        id: 'rec-1',
        area: PerformanceArea.DELIVERY,
        priority: scorecard.deliveryScore < 60 ? RecommendationPriority.HIGH : RecommendationPriority.MEDIUM,
        title: 'Improve delivery performance',
        description: `On-time delivery rate is ${scorecard.onTimeRate}%, below target of 90%`,
        suggestedAction: 'Schedule meeting with supplier to discuss delivery improvement plan',
        potentialImpact: 10
      });
    }

    if (scorecard.qualityScore < 85) {
      recommendations.push({
        id: 'rec-2',
        area: PerformanceArea.QUALITY,
        priority: RecommendationPriority.HIGH,
        title: 'Address quality concerns',
        description: 'Quality acceptance rate needs improvement',
        suggestedAction: 'Request quality improvement action plan from supplier',
        potentialImpact: 8
      });
    }

    if (scorecard.pricingScore < 75) {
      recommendations.push({
        id: 'rec-3',
        area: PerformanceArea.PRICING,
        priority: RecommendationPriority.MEDIUM,
        title: 'Review pricing competitiveness',
        description: 'Current pricing is above market average',
        suggestedAction: 'Negotiate better pricing or explore alternative suppliers',
        potentialImpact: 5
      });
    }

    if (scorecard.responsivenessScore < 70) {
      recommendations.push({
        id: 'rec-4',
        area: PerformanceArea.RESPONSIVENESS,
        priority: RecommendationPriority.MEDIUM,
        title: 'Improve communication response times',
        description: 'Response times are slower than expected',
        suggestedAction: 'Establish escalation contacts for urgent matters',
        potentialImpact: 7
      });
    }

    if (scorecard.contractExpiringSoon) {
      recommendations.push({
        id: 'rec-5',
        area: PerformanceArea.ORDERS,
        priority: RecommendationPriority.HIGH,
        title: 'Contract renewal needed',
        description: `Contract expires in ${scorecard.daysUntilContractExpires} days`,
        suggestedAction: 'Begin contract renewal negotiations',
        potentialImpact: 0
      });
    }

    return recommendations;
  }

  // ==================== Vendor Comparison ====================

  compareVendors(supplierIds: string[], includeCategoryAvg = true, includeOverallAvg = true): Observable<VendorComparison> {
    const vendors: VendorComparisonItem[] = supplierIds.map(id => {
      const scorecard = this.mockScorecards.find(s => s.supplierId === id);
      return {
        supplierId: id,
        supplierName: scorecard?.supplierName || 'Unknown',
        overallScore: scorecard?.overallScore || 0,
        deliveryScore: scorecard?.deliveryScore || 0,
        qualityScore: scorecard?.qualityScore || 0,
        pricingScore: scorecard?.pricingScore || 0,
        responsivenessScore: scorecard?.responsivenessScore || 0,
        totalOrders: scorecard?.totalOrders || 0,
        totalSpend: scorecard?.totalSpend || 0
      };
    });

    const comparison: VendorComparison = { vendors };

    if (includeCategoryAvg) {
      comparison.categoryAverage = {
        supplierId: 'category-avg',
        supplierName: 'Category Average',
        overallScore: 78,
        deliveryScore: 80,
        qualityScore: 85,
        pricingScore: 75,
        responsivenessScore: 78,
        totalOrders: 65,
        totalSpend: 115000
      };
    }

    if (includeOverallAvg) {
      comparison.overallAverage = {
        supplierId: 'overall-avg',
        supplierName: 'All Suppliers Average',
        overallScore: 79,
        deliveryScore: 78,
        qualityScore: 83,
        pricingScore: 78,
        responsivenessScore: 77,
        totalOrders: 70,
        totalSpend: 115400
      };
    }

    return of(comparison).pipe(delay(400));
  }

  // ==================== Performance Issues ====================

  listPerformanceIssues(filter?: PerformanceIssueFilter): Observable<VendorPerformanceIssue[]> {
    let issues = [...this.mockIssues];

    if (filter?.supplierId) {
      issues = issues.filter(i => i.supplierId === filter.supplierId);
    }
    if (filter?.issueType) {
      issues = issues.filter(i => i.issueType === filter.issueType);
    }
    if (filter?.severity) {
      issues = issues.filter(i => i.severity === filter.severity);
    }
    if (filter?.status) {
      issues = issues.filter(i => i.status === filter.status);
    }
    if (filter?.openOnly) {
      issues = issues.filter(i => i.status !== PerformanceIssueStatus.RESOLVED && i.status !== PerformanceIssueStatus.CLOSED);
    }

    return of(issues).pipe(delay(300));
  }

  getPerformanceIssue(id: string): Observable<VendorPerformanceIssue | undefined> {
    const issue = this.mockIssues.find(i => i.id === id);
    return of(issue).pipe(delay(200));
  }

  createPerformanceIssue(issue: Partial<VendorPerformanceIssue>): Observable<VendorPerformanceIssue> {
    const newIssue: VendorPerformanceIssue = {
      id: `issue-${Date.now()}`,
      supplierId: issue.supplierId!,
      supplierName: issue.supplierName || this.mockVendors.find(v => v.id === issue.supplierId)?.name || 'Unknown',
      issueType: issue.issueType!,
      severity: issue.severity!,
      title: issue.title!,
      description: issue.description!,
      relatedPoId: issue.relatedPoId,
      relatedPoNumber: issue.relatedPoNumber,
      relatedItemId: issue.relatedItemId,
      relatedItemName: issue.relatedItemName,
      financialImpact: issue.financialImpact,
      operationalImpact: issue.operationalImpact,
      status: PerformanceIssueStatus.OPEN,
      assignedTo: issue.assignedTo,
      dueDate: issue.dueDate,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.mockIssues.unshift(newIssue);
    return of(newIssue).pipe(delay(500));
  }

  updatePerformanceIssue(id: string, updates: Partial<VendorPerformanceIssue>): Observable<VendorPerformanceIssue> {
    const issue = this.mockIssues.find(i => i.id === id);
    if (issue) {
      Object.assign(issue, updates, { updatedAt: new Date() });
    }
    return of(issue!).pipe(delay(400));
  }

  resolvePerformanceIssue(id: string, resolutionNotes: string): Observable<VendorPerformanceIssue> {
    const issue = this.mockIssues.find(i => i.id === id);
    if (issue) {
      issue.status = PerformanceIssueStatus.RESOLVED;
      issue.resolutionNotes = resolutionNotes;
      issue.resolvedAt = new Date();
      issue.updatedAt = new Date();
    }
    return of(issue!).pipe(delay(400));
  }

  // ==================== Scoring Configuration ====================

  getScoringWeights(): Observable<VendorScoringWeights> {
    const weights: VendorScoringWeights = {
      id: 'default',
      name: 'Default Scoring',
      isDefault: true,
      deliveryWeight: 25,
      qualityWeight: 30,
      pricingWeight: 20,
      responsivenessWeight: 15,
      orderWeight: 10,
      platinumThreshold: 90,
      goldThreshold: 80,
      silverThreshold: 70,
      bronzeThreshold: 60,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return of(weights).pipe(delay(200));
  }

  updateScoringWeights(weights: Partial<VendorScoringWeights>): Observable<VendorScoringWeights> {
    const updated: VendorScoringWeights = {
      id: weights.id || 'default',
      name: weights.name || 'Default Scoring',
      isDefault: weights.isDefault ?? true,
      deliveryWeight: weights.deliveryWeight || 25,
      qualityWeight: weights.qualityWeight || 30,
      pricingWeight: weights.pricingWeight || 20,
      responsivenessWeight: weights.responsivenessWeight || 15,
      orderWeight: weights.orderWeight || 10,
      platinumThreshold: weights.platinumThreshold || 90,
      goldThreshold: weights.goldThreshold || 80,
      silverThreshold: weights.silverThreshold || 70,
      bronzeThreshold: weights.bronzeThreshold || 60,
      createdAt: weights.createdAt || new Date(),
      updatedAt: new Date()
    };

    return of(updated).pipe(delay(400));
  }

  // ==================== Utilities ====================

  getVendors(): Observable<Vendor[]> {
    return of(this.mockVendors).pipe(delay(200));
  }

  getTierLabel(tier: SupplierPerformanceTier): string {
    const labels: Record<SupplierPerformanceTier, string> = {
      [SupplierPerformanceTier.PLATINUM]: 'Platinum',
      [SupplierPerformanceTier.GOLD]: 'Gold',
      [SupplierPerformanceTier.SILVER]: 'Silver',
      [SupplierPerformanceTier.BRONZE]: 'Bronze',
      [SupplierPerformanceTier.AT_RISK]: 'At Risk'
    };
    return labels[tier] || tier;
  }

  getTierColor(tier: SupplierPerformanceTier): string {
    const colors: Record<SupplierPerformanceTier, string> = {
      [SupplierPerformanceTier.PLATINUM]: '#E5E4E2',
      [SupplierPerformanceTier.GOLD]: '#FFD700',
      [SupplierPerformanceTier.SILVER]: '#C0C0C0',
      [SupplierPerformanceTier.BRONZE]: '#CD7F32',
      [SupplierPerformanceTier.AT_RISK]: '#DC3545'
    };
    return colors[tier] || '#6c757d';
  }
}
