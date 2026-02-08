import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, interval, Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, switchMap, filter, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { OfflineService } from './offline.service';
import { SyncChange, SyncCursor, OfflineAction as SyncOfflineAction, SyncStatus, SyncEntityType, SyncActionType } from '../../shared/models';

export interface DeltaSyncRequest {
  cursors: SyncCursor[];
  maxChanges?: number;
}

export interface DeltaSyncResponse {
  changes: SyncChange[];
  cursors: SyncCursor[];
  hasMore: boolean;
}

export interface SubmitOfflineActionsRequest {
  actions: SyncOfflineAction[];
}

export interface SubmitOfflineActionsResponse {
  processed: number;
  failed: number;
  conflicts: SyncConflict[];
  newCursors: SyncCursor[];
}

export interface SyncConflict {
  actionId: string;
  entityType: SyncEntityType;
  entityId: string;
  conflictType: 'version_mismatch' | 'deleted' | 'permission_denied';
  serverVersion?: number;
  clientVersion?: number;
  resolution?: 'client_wins' | 'server_wins' | 'merge';
}

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly http = inject(HttpClient);
  private readonly offlineService = inject(OfflineService);
  private readonly apiUrl = `${environment.apiUrl}/inventory/sync`;
  private readonly USE_MOCK = true;

  private readonly destroy$ = new Subject<void>();
  private readonly syncInProgress$ = new BehaviorSubject<boolean>(false);
  private readonly lastSyncTime$ = new BehaviorSubject<Date | null>(null);

  private autoSyncEnabled = false;
  private autoSyncInterval = 60000; // 1 minute default

  // Mock data for delta sync
  private mockSyncVersion = 100;
  private mockChanges: SyncChange[] = [];

  constructor() {
    // Auto-sync when coming back online
    this.offlineService.online$.pipe(
      filter(online => online),
      tap(() => this.performSync())
    ).subscribe();
  }

  startAutoSync(intervalMs: number = 60000): void {
    this.autoSyncInterval = intervalMs;
    this.autoSyncEnabled = true;

    interval(this.autoSyncInterval).pipe(
      takeUntil(this.destroy$),
      filter(() => this.autoSyncEnabled && this.offlineService.isOnline()),
      switchMap(() => this.performSync())
    ).subscribe();
  }

  stopAutoSync(): void {
    this.autoSyncEnabled = false;
  }

  async performSync(): Promise<SyncStatus> {
    if (this.syncInProgress$.value) {
      return this.getCurrentSyncStatus();
    }

    this.syncInProgress$.next(true);

    try {
      // Step 1: Push local changes
      const pushResult = await this.pushLocalChanges();

      // Step 2: Pull remote changes
      const pullResult = await this.pullRemoteChanges();

      // Step 3: Apply changes to local cache
      await this.applyChangesToCache(pullResult.changes);

      this.lastSyncTime$.next(new Date());
      this.syncInProgress$.next(false);

      return {
        lastSyncAt: new Date(),
        pendingActions: 0,
        lastSyncStatus: 'success',
        syncErrors: []
      };
    } catch (error: any) {
      this.syncInProgress$.next(false);
      return {
        lastSyncAt: this.lastSyncTime$.value || undefined,
        pendingActions: this.offlineService.pendingChanges(),
        lastSyncStatus: 'error',
        syncErrors: [error.message]
      };
    }
  }

  private async pushLocalChanges(): Promise<SubmitOfflineActionsResponse> {
    const offlineQueue = await this.offlineService.getOfflineQueue();

    if (offlineQueue.length === 0) {
      return { processed: 0, failed: 0, conflicts: [], newCursors: [] };
    }

    const actions: SyncOfflineAction[] = offlineQueue.map(item => ({
      id: item.id,
      entityType: this.mapEntityType(item.entityType),
      entityId: item.entityId,
      actionType: this.mapActionType(item.action),
      payload: item.payload,
      clientTimestamp: item.timestamp,
      clientVersion: 1
    }));

    const response = await this.submitOfflineActions({ actions }).toPromise();

    // Remove successfully processed items from queue
    for (const action of actions) {
      const conflict = response!.conflicts.find(c => c.actionId === action.id);
      if (!conflict) {
        await this.offlineService.removeFromQueue(action.id);
      }
    }

    return response!;
  }

  private mapEntityType(type: string): SyncEntityType {
    const mapping: Record<string, SyncEntityType> = {
      'item': SyncEntityType.ITEM,
      'stock': SyncEntityType.STOCK_LEVEL,
      'checkout': SyncEntityType.CHECKOUT,
      'picklist': SyncEntityType.PICK_LIST
    };
    return mapping[type] || SyncEntityType.ITEM;
  }

  private mapActionType(action: string): SyncActionType {
    const mapping: Record<string, SyncActionType> = {
      'create': SyncActionType.CREATE,
      'update': SyncActionType.UPDATE,
      'delete': SyncActionType.DELETE,
      'stock_adjust': SyncActionType.UPDATE,
      'checkout': SyncActionType.CREATE,
      'checkin': SyncActionType.UPDATE,
      'pick_item': SyncActionType.UPDATE
    };
    return mapping[action] || SyncActionType.UPDATE;
  }

  private async pullRemoteChanges(): Promise<DeltaSyncResponse> {
    const cursors: SyncCursor[] = [];

    // Get cursors for each entity type
    for (const entityType of ['items', 'stock_levels', 'checkouts', 'pick_lists']) {
      const cursor = await this.offlineService.getSyncCursor(entityType);
      cursors.push({
        entityType: entityType as any,
        lastSyncVersion: cursor ? parseInt(cursor) : 0,
        lastSyncAt: new Date()
      });
    }

    const response = await this.getDeltaSync({ cursors }).toPromise();

    // Update cursors
    for (const cursor of response!.cursors) {
      await this.offlineService.setSyncCursor(cursor.entityType, cursor.lastSyncVersion.toString());
    }

    return response!;
  }

  private async applyChangesToCache(changes: SyncChange[]): Promise<void> {
    const itemChanges = changes.filter(c => c.entityType === SyncEntityType.ITEM);
    const stockChanges = changes.filter(c => c.entityType === SyncEntityType.STOCK_LEVEL);
    const checkoutChanges = changes.filter(c => c.entityType === SyncEntityType.CHECKOUT);

    // Apply item changes
    if (itemChanges.length > 0) {
      const itemsToCache = itemChanges
        .filter(c => c.changeType !== 'delete')
        .map(c => c.data);
      await this.offlineService.cacheItems(itemsToCache);
    }

    // Apply stock changes
    if (stockChanges.length > 0) {
      const stockToCache = stockChanges
        .filter(c => c.changeType !== 'delete')
        .map(c => c.data);
      await this.offlineService.cacheStockLevels(stockToCache);
    }

    // Apply checkout changes
    if (checkoutChanges.length > 0) {
      const checkoutsToCache = checkoutChanges
        .filter(c => c.changeType !== 'delete')
        .map(c => c.data);
      await this.offlineService.cacheCheckouts(checkoutsToCache);
    }
  }

  getDeltaSync(request: DeltaSyncRequest): Observable<DeltaSyncResponse> {
    if (this.USE_MOCK) {
      // Simulate incremental changes
      const changes: SyncChange[] = [];
      const newVersion = this.mockSyncVersion + 1;
      this.mockSyncVersion = newVersion;

      return of({
        changes,
        cursors: request.cursors.map(c => ({
          ...c,
          lastSyncVersion: newVersion,
          lastSyncAt: new Date()
        })),
        hasMore: false
      }).pipe(delay(300));
    }
    return this.http.post<DeltaSyncResponse>(`${this.apiUrl}/delta`, request);
  }

  submitOfflineActions(request: SubmitOfflineActionsRequest): Observable<SubmitOfflineActionsResponse> {
    if (this.USE_MOCK) {
      // Simulate processing offline actions
      const conflicts: SyncConflict[] = [];

      // Simulate occasional conflicts (5% chance)
      for (const action of request.actions) {
        if (Math.random() < 0.05) {
          conflicts.push({
            actionId: action.id,
            entityType: action.entityType,
            entityId: action.entityId,
            conflictType: 'version_mismatch',
            serverVersion: (action.clientVersion || 1) + 1,
            clientVersion: action.clientVersion
          });
        }
      }

      return of({
        processed: request.actions.length - conflicts.length,
        failed: conflicts.length,
        conflicts,
        newCursors: [
          { entityType: SyncEntityType.ITEM, lastSyncVersion: this.mockSyncVersion, lastSyncAt: new Date() },
          { entityType: SyncEntityType.STOCK_LEVEL, lastSyncVersion: this.mockSyncVersion, lastSyncAt: new Date() },
          { entityType: SyncEntityType.CHECKOUT, lastSyncVersion: this.mockSyncVersion, lastSyncAt: new Date() },
          { entityType: SyncEntityType.PICK_LIST, lastSyncVersion: this.mockSyncVersion, lastSyncAt: new Date() }
        ]
      }).pipe(delay(500));
    }
    return this.http.post<SubmitOfflineActionsResponse>(`${this.apiUrl}/submit`, request);
  }

  getSyncStatus(): Observable<SyncStatus> {
    if (this.USE_MOCK) {
      return of({
        lastSyncAt: this.lastSyncTime$.value || undefined,
        pendingActions: this.offlineService.pendingChanges(),
        lastSyncStatus: 'success',
        syncErrors: []
      }).pipe(delay(100));
    }
    return this.http.get<SyncStatus>(`${this.apiUrl}/status`);
  }

  resolveConflict(conflict: SyncConflict, resolution: 'client_wins' | 'server_wins' | 'merge', mergedData?: any): Observable<void> {
    if (this.USE_MOCK) {
      return of(void 0).pipe(delay(300));
    }
    return this.http.post<void>(`${this.apiUrl}/resolve-conflict`, {
      conflict,
      resolution,
      merged_data: mergedData
    });
  }

  forceFullSync(): Observable<SyncStatus> {
    // Clear all sync cursors and perform full sync
    return new Observable(observer => {
      (async () => {
        try {
          // Clear cursors
          for (const entityType of ['items', 'stock_levels', 'checkouts', 'pick_lists']) {
            await this.offlineService.setSyncCursor(entityType, '0');
          }

          // Clear caches
          await this.offlineService.clearAllCaches();

          // Perform sync
          const status = await this.performSync();
          observer.next(status);
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      })();
    });
  }

  private getCurrentSyncStatus(): SyncStatus {
    return {
      lastSyncAt: this.lastSyncTime$.value || undefined,
      pendingActions: this.offlineService.pendingChanges(),
      lastSyncStatus: this.syncInProgress$.value ? 'syncing' : 'success',
      syncErrors: []
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
