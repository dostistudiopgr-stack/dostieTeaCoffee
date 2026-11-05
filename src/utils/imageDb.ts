import { STORAGE_KEYS, createId, readJson } from './storage';

const DB_NAME = 'dosti-local-data';
const DB_VERSION = 1;
const IMAGE_STORE = 'product-images';
const BACKUP_STORE = 'migration-backups';

export interface StoredProductImage {
  id: string;
  productId: string;
  file: Blob;
  name: string;
  type: string;
  size: number;
  width: number;
  height: number;
  createdAt: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(IMAGE_STORE)) database.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
      if (!database.objectStoreNames.contains(BACKUP_STORE)) database.createObjectStore(BACKUP_STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open browser image storage.'));
  });
}

export async function saveMigrationBackup(id: string, content: string): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(BACKUP_STORE, 'readwrite');
    transaction.objectStore(BACKUP_STORE).put({ id, content, createdAt: new Date().toISOString() });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not create a migration backup.'));
  });
  database.close();
}

export async function putProductImage(image: StoredProductImage): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(IMAGE_STORE, 'readwrite');
    transaction.objectStore(IMAGE_STORE).put(image);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Image storage is unavailable.'));
  });
  database.close();
}

export async function storeProductImageFile(productId: string, file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width > 6000 || bitmap.height > 6000 || bitmap.width < 1 || bitmap.height < 1) throw new Error(`${file.name} has unsupported image dimensions.`);
    const id = createId('image');
    await putProductImage({ id, productId, file, name: file.name, type: file.type, size: file.size, width: bitmap.width, height: bitmap.height, createdAt: new Date().toISOString() });
    return id;
  } finally { bitmap.close(); }
}

export async function getProductImage(id: string): Promise<StoredProductImage | undefined> {
  const database = await openDatabase();
  const image = await new Promise<StoredProductImage | undefined>((resolve, reject) => {
    const request = database.transaction(IMAGE_STORE, 'readonly').objectStore(IMAGE_STORE).get(id);
    request.onsuccess = () => resolve(request.result as StoredProductImage | undefined);
    request.onerror = () => reject(request.error ?? new Error('Image could not be loaded.'));
  });
  database.close();
  return image;
}

export async function deleteProductImage(id: string): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(IMAGE_STORE, 'readwrite');
    transaction.objectStore(IMAGE_STORE).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Image could not be removed.'));
  });
  database.close();
}

export async function getProductImages(productId?: string): Promise<StoredProductImage[]> {
  const database = await openDatabase();
  const images = await new Promise<StoredProductImage[]>((resolve, reject) => {
    const request = database.transaction(IMAGE_STORE, 'readonly').objectStore(IMAGE_STORE).getAll();
    request.onsuccess = () => {
      const all = request.result as StoredProductImage[];
      resolve(productId ? all.filter((image) => image.productId === productId) : all);
    };
    request.onerror = () => reject(request.error ?? new Error('Images could not be loaded.'));
  });
  database.close();
  return images;
}

export async function cleanupUnusedProductImages(referencedIds: Set<string>): Promise<void> {
  for (const key of [STORAGE_KEYS.ORDERS, STORAGE_KEYS.CART]) {
    const saved = readJson<unknown>(key, null);
    const records = Array.isArray(saved) ? saved : saved && typeof saved === 'object' && 'items' in saved && Array.isArray(saved.items) ? saved.items : [];
    for (const record of records) {
      if (!record || typeof record !== 'object') continue;
      const items = 'items' in record && Array.isArray(record.items) ? record.items : [record];
      for (const item of items) if (item && typeof item === 'object' && 'thumbnail' in item && typeof item.thumbnail === 'string' && !/^(https?:|data:|blob:|\/)/i.test(item.thumbnail)) referencedIds.add(item.thumbnail);
    }
  }
  const images = await getProductImages();
  await Promise.all(images.filter((image) => !referencedIds.has(image.id)).map((image) => deleteProductImage(image.id)));
}

export async function clearProductImages(): Promise<void> {
  const images = await getProductImages();
  await Promise.all(images.map((image) => deleteProductImage(image.id)));
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error ?? new Error('Could not prepare image backup.'));
    reader.readAsDataURL(blob);
  });
}

export async function exportLocalDataWithImages(localData: string): Promise<string> {
  const images = await Promise.all((await getProductImages()).map(async (image) => ({
    id: image.id, productId: image.productId, name: image.name, type: image.type, size: image.size,
    width: image.width, height: image.height, createdAt: image.createdAt, base64: await blobToBase64(image.file),
  })));
  const backup = JSON.parse(localData) as Record<string, unknown>;
  return JSON.stringify({ ...backup, images }, null, 2);
}

function base64ToBlob(value: string, type: string): Blob {
  const decoded = atob(value);
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) bytes[index] = decoded.charCodeAt(index);
  return new Blob([bytes], { type });
}

export async function restoreProductImages(images: unknown): Promise<void> {
  if (!Array.isArray(images)) throw new Error('Backup image records are invalid.');
  const restored = images.map((image) => {
    if (!image || typeof image !== 'object') throw new Error('Backup image record is invalid.');
    const record = image as Record<string, unknown>;
    if (typeof record.id !== 'string' || typeof record.productId !== 'string' || typeof record.type !== 'string' || typeof record.base64 !== 'string') throw new Error('Backup image record is incomplete.');
    return { id: record.id, productId: record.productId, name: String(record.name ?? 'image'), type: record.type, size: Number(record.size) || 0, width: Number(record.width) || 0, height: Number(record.height) || 0, createdAt: String(record.createdAt ?? new Date().toISOString()), file: base64ToBlob(record.base64, record.type) } satisfies StoredProductImage;
  });
  await clearProductImages();
  await Promise.all(restored.map(putProductImage));
}
