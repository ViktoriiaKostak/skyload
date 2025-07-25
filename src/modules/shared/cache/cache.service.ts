import { Injectable } from '@nestjs/common';

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class CacheService {
  private cache = new Map<string, CacheItem<any>>();

  set<T>(key: string, value: T, ttlMs: number = 60000): void {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { value, expiresAt });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

@Injectable()
export class UploadCacheService {
  constructor(private readonly cacheService: CacheService) {}

  private getUploadKey(uploadId: string): string {
    return `upload:${uploadId}`;
  }

  private getUploadsListKey(page: number, limit: number): string {
    return `uploads:list:${page}:${limit}`;
  }

  setUpload(uploadId: string, upload: any, ttlMs: number = 300000): void {
    const key = this.getUploadKey(uploadId);
    this.cacheService.set(key, upload, ttlMs);
  }

  getUpload(uploadId: string): any | null {
    const key = this.getUploadKey(uploadId);
    return this.cacheService.get(key);
  }

  setUploadsList(
    page: number,
    limit: number,
    data: any,
    ttlMs: number = 60000,
  ): void {
    const key = this.getUploadsListKey(page, limit);
    this.cacheService.set(key, data, ttlMs);
  }

  getUploadsList(page: number, limit: number): any | null {
    const key = this.getUploadsListKey(page, limit);
    return this.cacheService.get(key);
  }

  invalidateUpload(uploadId: string): void {
    const key = this.getUploadKey(uploadId);
    this.cacheService.delete(key);
  }

  invalidateUploadsList(): void {
    const keys = Array.from(this.cacheService['cache'].keys());
    keys.forEach(key => {
      if (key.startsWith('uploads:list:')) {
        this.cacheService.delete(key);
      }
    });
  }
}
