import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, fromEvent, merge, BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged, shareReplay, startWith } from 'rxjs/operators';

export interface OfflineQueueItem {
  id: string;
  action: OfflineAction;
  entityType: 'item' | 'stock' | 'checkout' | 'picklist';
  entityId: string;
  payload: any;
  timestamp: Date;
  retryCount: number;
  lastError?: string;
}

export type OfflineAction = 'create' | 'update' | 'delete' | 'stock_adjust' | 'checkout' | 'checkin' | 'pick_item';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingChanges: number;
  lastSyncAt?: Date;
  lastSyncError?: string;
}

const DB_NAME = 'inventory_offline_db';
const DB_VERSION = 1;
const STORES = {
  items: 'items',
  stockLevels: 'stock_levels',
  checkouts: 'checkouts',
  pickLists: 'pick_lists',
  offlineQueue: 'offline_queue',
  syncMeta: 'sync_meta'
};

@Injectable({ providedIn: 'root' })
export class OfflineService {
  private readonly http = inject(HttpClient);
  private db: IDBDatabase | null = null;

  // Reactive state
  private readonly _isOnline = signal(navigator.onLine);
  private readonly _isSyncing = signal(false);
  private readonly _pendingChanges = signal(0);
  private readonly _lastSyncAt = signal<Date | undefined>(undefined);
  private readonly _lastSyncError = signal<string | undefined>(undefined);

  readonly isOnline = this._isOnline.asReadonly();
  readonly isSyncing = this._isSyncing.asReadonly();
  readonly pendingChanges = this._pendingChanges.asReadonly();
  readonly lastSyncAt = this._lastSyncAt.asReadonly();

  readonly syncStatus = computed<SyncStatus>(() => ({
    isOnline: this._isOnline(),
    isSyncing: this._isSyncing(),
    pendingChanges: this._pendingChanges(),
    lastSyncAt: this._lastSyncAt(),
    lastSyncError: this._lastSyncError()
  }));

  // Observable for online status changes
  readonly online$ = merge(
    fromEvent(window, 'online').pipe(map(() => true)),
    fromEvent(window, 'offline').pipe(map(() => false))
  ).pipe(
    startWith(navigator.onLine),
    distinctUntilChanged(),
    shareReplay(1)
  );

  constructor() {
    this.initializeDatabase();
    this.setupConnectivityListeners();
  }

  private setupConnectivityListeners(): void {
    window.addEventListener('online', () => {
      this._isOnline.set(true);
      this.syncPendingChanges();
    });

    window.addEventListener('offline', () => {
      this._isOnline.set(false);
    });
  }

  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open offline database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.updatePendingCount();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Items store
        if (!db.objectStoreNames.contains(STORES.items)) {
          const itemStore = db.createObjectStore(STORES.items, { keyPath: 'id' });
          itemStore.createIndex('sku', 'sku', { unique: true });
          itemStore.createIndex('categoryId', 'categoryId', { unique: false });
          itemStore.createIndex('syncVersion', 'syncVersion', { unique: false });
        }

        // Stock levels store
        if (!db.objectStoreNames.contains(STORES.stockLevels)) {
          const stockStore = db.createObjectStore(STORES.stockLevels, { keyPath: ['itemId', 'warehouseId'] });
          stockStore.createIndex('itemId', 'itemId', { unique: false });
          stockStore.createIndex('warehouseId', 'warehouseId', { unique: false });
        }

        // Checkouts store
        if (!db.objectStoreNames.contains(STORES.checkouts)) {
          const checkoutStore = db.createObjectStore(STORES.checkouts, { keyPath: 'id' });
          checkoutStore.createIndex('itemId', 'itemId', { unique: false });
          checkoutStore.createIndex('checkedOutBy', 'checkedOutBy', { unique: false });
          checkoutStore.createIndex('status', 'status', { unique: false });
        }

        // Pick lists store
        if (!db.objectStoreNames.contains(STORES.pickLists)) {
          const pickListStore = db.createObjectStore(STORES.pickLists, { keyPath: 'id' });
          pickListStore.createIndex('status', 'status', { unique: false });
          pickListStore.createIndex('assignedPickerId', 'assignedPickerId', { unique: false });
        }

        // Offline queue store
        if (!db.objectStoreNames.contains(STORES.offlineQueue)) {
          const queueStore = db.createObjectStore(STORES.offlineQueue, { keyPath: 'id' });
          queueStore.createIndex('entityType', 'entityType', { unique: false });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Sync metadata store
        if (!db.objectStoreNames.contains(STORES.syncMeta)) {
          db.createObjectStore(STORES.syncMeta, { keyPath: 'key' });
        }
      };
    });
  }

  private async updatePendingCount(): Promise<void> {
    const queue = await this.getOfflineQueue();
    this._pendingChanges.set(queue.length);
  }

  // Offline queue operations
  async queueOfflineAction(
    action: OfflineAction,
    entityType: OfflineQueueItem['entityType'],
    entityId: string,
    payload: any
  ): Promise<string> {
    const item: OfflineQueueItem = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      entityType,
      entityId,
      payload,
      timestamp: new Date(),
      retryCount: 0
    };

    await this.addToStore(STORES.offlineQueue, item);
    await this.updatePendingCount();
    return item.id;
  }

  async getOfflineQueue(): Promise<OfflineQueueItem[]> {
    return this.getAllFromStore<OfflineQueueItem>(STORES.offlineQueue);
  }

  async removeFromQueue(id: string): Promise<void> {
    await this.deleteFromStore(STORES.offlineQueue, id);
    await this.updatePendingCount();
  }

  async clearOfflineQueue(): Promise<void> {
    await this.clearStore(STORES.offlineQueue);
    this._pendingChanges.set(0);
  }

  // Sync operations
  async syncPendingChanges(): Promise<{ synced: number; failed: number; errors: string[] }> {
    if (!this._isOnline() || this._isSyncing()) {
      return { synced: 0, failed: 0, errors: ['Offline or already syncing'] };
    }

    this._isSyncing.set(true);
    const queue = await this.getOfflineQueue();
    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const item of queue) {
      try {
        await this.processOfflineItem(item);
        await this.removeFromQueue(item.id);
        synced++;
      } catch (error: any) {
        failed++;
        errors.push(`${item.entityType}/${item.entityId}: ${error.message}`);

        // Update retry count
        item.retryCount++;
        item.lastError = error.message;

        if (item.retryCount >= 5) {
          // Move to dead letter queue or mark as failed
          console.error('Max retries exceeded for offline item:', item);
        } else {
          await this.addToStore(STORES.offlineQueue, item);
        }
      }
    }

    this._isSyncing.set(false);
    this._lastSyncAt.set(new Date());

    if (failed > 0) {
      this._lastSyncError.set(`${failed} items failed to sync`);
    } else {
      this._lastSyncError.set(undefined);
    }

    return { synced, failed, errors };
  }

  private async processOfflineItem(item: OfflineQueueItem): Promise<void> {
    // In real implementation, this would call the appropriate API endpoints
    // For now, simulate a successful sync
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate occasional failures for testing
    if (Math.random() < 0.05) {
      throw new Error('Simulated sync failure');
    }
  }

  // Cache operations for items
  async cacheItems(items: any[]): Promise<void> {
    const tx = this.db!.transaction(STORES.items, 'readwrite');
    const store = tx.objectStore(STORES.items);

    for (const item of items) {
      store.put(item);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getCachedItem(id: string): Promise<any | null> {
    return this.getFromStore(STORES.items, id);
  }

  async getCachedItems(): Promise<any[]> {
    return this.getAllFromStore(STORES.items);
  }

  async searchCachedItems(query: string): Promise<any[]> {
    const items = await this.getCachedItems();
    const lowerQuery = query.toLowerCase();
    return items.filter(item =>
      item.name?.toLowerCase().includes(lowerQuery) ||
      item.sku?.toLowerCase().includes(lowerQuery) ||
      item.description?.toLowerCase().includes(lowerQuery)
    );
  }

  // Cache operations for stock levels
  async cacheStockLevels(levels: any[]): Promise<void> {
    const tx = this.db!.transaction(STORES.stockLevels, 'readwrite');
    const store = tx.objectStore(STORES.stockLevels);

    for (const level of levels) {
      store.put(level);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getCachedStockLevel(itemId: string, warehouseId: string): Promise<any | null> {
    return this.getFromStore(STORES.stockLevels, [itemId, warehouseId]);
  }

  // Cache operations for checkouts
  async cacheCheckouts(checkouts: any[]): Promise<void> {
    const tx = this.db!.transaction(STORES.checkouts, 'readwrite');
    const store = tx.objectStore(STORES.checkouts);

    for (const checkout of checkouts) {
      store.put(checkout);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getCachedCheckouts(): Promise<any[]> {
    return this.getAllFromStore(STORES.checkouts);
  }

  // Sync metadata operations
  async getSyncCursor(entityType: string): Promise<string | null> {
    const meta = await this.getFromStore<{ key: string; value: string }>(STORES.syncMeta, `cursor_${entityType}`);
    return meta?.value || null;
  }

  async setSyncCursor(entityType: string, cursor: string): Promise<void> {
    await this.addToStore(STORES.syncMeta, { key: `cursor_${entityType}`, value: cursor });
  }

  // Generic IndexedDB helpers
  private async addToStore<T>(storeName: string, item: T): Promise<void> {
    if (!this.db) await this.initializeDatabase();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getFromStore<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    if (!this.db) await this.initializeDatabase();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllFromStore<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.initializeDatabase();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteFromStore(storeName: string, key: IDBValidKey): Promise<void> {
    if (!this.db) await this.initializeDatabase();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async clearStore(storeName: string): Promise<void> {
    if (!this.db) await this.initializeDatabase();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Utility methods
  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { used: 0, quota: 0 };
  }

  async clearAllCaches(): Promise<void> {
    await this.clearStore(STORES.items);
    await this.clearStore(STORES.stockLevels);
    await this.clearStore(STORES.checkouts);
    await this.clearStore(STORES.pickLists);
    await this.clearStore(STORES.syncMeta);
  }
}
