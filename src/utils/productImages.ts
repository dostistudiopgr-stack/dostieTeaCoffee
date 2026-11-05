const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function validateProductImage(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) return `${file.name}: use a JPG, PNG, or WebP image.`;
  if (file.size > MAX_FILE_BYTES) return `${file.name}: maximum image size is 5 MB.`;
  return null;
}
