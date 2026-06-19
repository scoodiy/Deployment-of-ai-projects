import { NextResponse } from 'next/server';

/**
 * Storage provider interface for file uploads.
 * Implementations: LocalStorage (current), R2Storage, OSSStorage (future)
 */
export interface StorageProvider {
  upload(buffer: Buffer, key: string, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}

/**
 * Local filesystem storage (for development / small deployments)
 */
export class LocalStorage implements StorageProvider {
  private baseDir: string;
  private baseUrl: string;

  constructor(baseDir = './public/uploads', baseUrl = '/uploads') {
    this.baseDir = baseDir;
    this.baseUrl = baseUrl;
  }

  async upload(buffer: Buffer, key: string, contentType: string): Promise<string> {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(this.baseDir, key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, buffer);
    return `${this.baseUrl}/${key}`;
  }

  async delete(key: string): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(this.baseDir, key);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  getUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }
}

// Singleton - switch to R2/OSS by changing this
let storage: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (!storage) {
    storage = new LocalStorage();
  }
  return storage;
}

/**
 * Allowed file types for upload
 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
export const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFile(file: File, allowedTypes: string[], maxSize = MAX_FILE_SIZE): string | null {
  if (!allowedTypes.includes(file.type)) {
    return `不支持的文件类型: ${file.type}`;
  }
  if (file.size > maxSize) {
    return `文件大小超过限制: ${(file.size / 1024 / 1024).toFixed(1)}MB > ${maxSize / 1024 / 1024}MB`;
  }
  return null;
}

/**
 * Generate a unique file key with date-based path
 */
export function generateFileKey(originalName: string, prefix = ''): string {
  const ext = originalName.split('.').pop() || 'bin';
  const date = new Date();
  const datePath = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}${datePath}/${unique}.${ext}`;
}
