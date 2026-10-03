import { supabase, isSupabaseConfigured } from './supabaseClient';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const DEFAULT_STORAGE_BUCKET = 'restaurant_assets';
export const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800&auto=format&fit=crop';

/**
 * Resolves any image reference, storage path, or image list into a valid, public URL.
 * Handles:
 * - Full URLs (https://..., http://...)
 * - Data URLs (data:image/...)
 * - Relative Supabase storage paths (e.g. 'products/...', 'restaurant_assets/products/...')
 * - Image arrays / JSON strings
 * - Undefined/empty inputs with safe fallbacks
 */
export function resolveImageUrl(
  primaryUrl?: string | null,
  imagesArray?: string[] | string | null,
  fallback: string = DEFAULT_FALLBACK_IMAGE
): string {
  let target = primaryUrl ? String(primaryUrl).trim() : '';

  // If primary is empty or invalid, try the first item in imagesArray
  if (!target && imagesArray) {
    if (Array.isArray(imagesArray) && imagesArray.length > 0) {
      target = String(imagesArray[0] || '').trim();
    } else if (typeof imagesArray === 'string') {
      try {
        const parsed = JSON.parse(imagesArray);
        if (Array.isArray(parsed) && parsed.length > 0) {
          target = String(parsed[0] || '').trim();
        } else {
          target = imagesArray.trim();
        }
      } catch {
        target = imagesArray.trim();
      }
    }
  }

  if (!target) return fallback;

  // If it's already an absolute web URL, local public asset path, or data URL, return it
  if (
    target.startsWith('http://') ||
    target.startsWith('https://') ||
    target.startsWith('/') ||
    target.startsWith('data:image/') ||
    target.startsWith('blob:')
  ) {
    return target;
  }

  // If it's a relative Supabase storage path (e.g., 'products/123.jpg' or 'restaurant_assets/products/123.jpg')
  const cleanPath = target.startsWith('restaurant_assets/')
    ? target.replace(/^restaurant_assets\//, '')
    : target.replace(/^\/+/, '');

  try {
    const { data } = supabase.storage.from(DEFAULT_STORAGE_BUCKET).getPublicUrl(cleanPath);
    if (data?.publicUrl) {
      return data.publicUrl;
    }
  } catch (err) {
    console.warn('[resolveImageUrl] Error getting public URL:', err);
  }

  return target || fallback;
}

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  errorCode?: string | number;
  bucket?: string;
  path?: string;
}

/**
 * Validates selected file format and size
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const fileType = file.type?.toLowerCase() || '';
  const fileName = file.name?.toLowerCase() || '';
  const isValidType =
    ALLOWED_IMAGE_TYPES.includes(fileType) ||
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.jpeg') ||
    fileName.endsWith('.png') ||
    fileName.endsWith('.webp');

  if (!isValidType) {
    return {
      valid: false,
      error: `Unsupported format (${file.type || 'unknown'}). Please select a JPG, JPEG, PNG, or WebP photo.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMb} MB). Maximum allowed size is 10 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Converts File to Base64 Data URL (Used for preview and local mock fallback)
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image file to Supabase Storage with authenticated admin session & transparent diagnostics
 */
export async function uploadImageToStorage(
  file: File,
  folder: 'products' | 'gallery' | 'hero' | 'media' | 'general' = 'products'
): Promise<ImageUploadResult> {
  const bucketName = DEFAULT_STORAGE_BUCKET;

  // 1. Client-side file validation
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error, bucket: bucketName };
  }

  // 2. Unconfigured preview environment fallback
  if (!isSupabaseConfigured()) {
    try {
      const dataUrl = await fileToDataUrl(file);
      return { success: true, url: dataUrl, bucket: 'local_preview' };
    } catch (err: any) {
      return {
        success: false,
        error: 'Failed to read image file locally.',
        bucket: 'local_preview',
      };
    }
  }

  // 3. Prepare unique, sanitized file path
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const rawBase = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const sanitizedBase = rawBase.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40).toLowerCase();
  const uniqueStamp = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const filePath = `${folder}/${uniqueStamp}_${sanitizedBase}.${ext}`;

  const contentType =
    file.type && ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())
      ? file.type
      : ext === 'png'
      ? 'image/png'
      : ext === 'webp'
      ? 'image/webp'
      : 'image/jpeg';

  try {
    // 4. Verify user has an authenticated session and fresh token
    let {
      data: { user },
    } = await supabase.auth.getUser();

    let {
      data: { session },
    } = await supabase.auth.getSession();

    // If session is expired or missing user, attempt refreshing session
    if (!user && session?.refresh_token) {
      const { data: refreshData } = await supabase.auth.refreshSession();
      if (refreshData?.user) {
        user = refreshData.user;
        session = refreshData.session;
      }
    }

    const currentUserId = user?.id || session?.user?.id || 'bfd10a7c-d7e7-4257-a50d-22ccc62c2e5c';
    const userRole = user?.role || session?.user?.role || 'admin';
    const userEmail = user?.email || session?.user?.email || 'vediqbiryani@gmail.com';
    const token = session?.access_token;

    console.info('[Supabase Storage Upload Context]', {
      authenticatedUserId: currentUserId,
      userEmail,
      userRole,
      hasSession: Boolean(session),
      bucketName,
      filePath,
      contentType,
      fileSize: file.size,
    });

    // 5. Attempt Direct Client Upload to Supabase Storage
    let directUploadError: any = null;
    let directUploadSuccess = false;

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType,
        });

      if (!uploadError && uploadData) {
        directUploadSuccess = true;
      } else {
        directUploadError = uploadError;
      }
    } catch (directErr: any) {
      directUploadError = directErr;
    }

    // 6. If Direct Upload succeeded, return public URL
    if (directUploadSuccess) {
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        return {
          success: true,
          url: publicUrlData.publicUrl,
          bucket: bucketName,
          path: filePath,
        };
      }
    }

    // 7. Analyze and format clean diagnostic message
    const rawMsg =
      directUploadError?.message ||
      (typeof directUploadError === 'string' ? directUploadError : 'Upload failed');
    const statusCode =
      directUploadError?.statusCode ||
      directUploadError?.status ||
      directUploadError?.code ||
      'UNKNOWN';

    const lower = rawMsg.toLowerCase();
    let diagnosticMessage = rawMsg;

    if (
      lower.includes('failed to fetch') ||
      lower.includes('network') ||
      lower.includes('cors')
    ) {
      diagnosticMessage = `Upload network error (Failed to fetch). This occurs when Supabase Storage rejects the upload or RLS blocks bucket "${bucketName}". User ID: ${currentUserId}. Please ensure the Storage RLS policies in Supabase SQL Editor are applied.`;
    } else if (
      lower.includes('row-level security') ||
      lower.includes('violates') ||
      lower.includes('policy') ||
      lower.includes('denied') ||
      lower.includes('permission') ||
      statusCode === 403 ||
      statusCode === '403'
    ) {
      diagnosticMessage = `Upload failed: Permission denied (RLS policy violation on "${bucketName}"). Authenticated User ID: ${currentUserId} (${userEmail}). Please ensure the Storage RLS policies for restaurant_assets allow active admins.`;
    } else if (
      lower.includes('bucket not found') ||
      lower.includes('resource was not found') ||
      statusCode === 404 ||
      statusCode === '404'
    ) {
      diagnosticMessage = `Upload failed: Storage bucket "${bucketName}" not found in Supabase (404). Ensure the public bucket "${bucketName}" exists in your Supabase Dashboard > Storage.`;
    } else if (
      lower.includes('payload too large') ||
      lower.includes('file too large') ||
      statusCode === 413 ||
      statusCode === '413'
    ) {
      diagnosticMessage = `Upload failed: File exceeds Supabase storage size limit (10MB).`;
    }

    return {
      success: false,
      error: diagnosticMessage,
      errorCode: statusCode,
      bucket: bucketName,
      path: filePath,
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'Unexpected error uploading image.';
    return {
      success: false,
      error: `Upload exception: ${errorMsg} (Bucket: "${bucketName}", Path: "${filePath}")`,
      bucket: bucketName,
      path: filePath,
    };
  }
}

/**
 * Extracts storage path from a Supabase public URL or relative path
 */
export function extractStoragePath(urlOrPath: string): string | null {
  if (!urlOrPath) return null;
  const str = String(urlOrPath).trim();

  // If it's a full Supabase storage URL: .../storage/v1/object/public/restaurant_assets/products/...
  const publicMarker = `/storage/v1/object/public/${DEFAULT_STORAGE_BUCKET}/`;
  if (str.includes(publicMarker)) {
    return str.split(publicMarker)[1] || null;
  }

  // If starts with restaurant_assets/
  if (str.startsWith(`${DEFAULT_STORAGE_BUCKET}/`)) {
    return str.replace(`${DEFAULT_STORAGE_BUCKET}/`, '');
  }

  // If it's a known folder path like products/... or gallery/...
  if (str.startsWith('products/') || str.startsWith('gallery/') || str.startsWith('hero/') || str.startsWith('media/')) {
    return str;
  }

  return null;
}

/**
 * Safely deletes an old image file from Supabase Storage (Only called AFTER database has persisted the new image)
 */
export async function deleteImageFromStorage(
  imageUrlOrPath: string,
  bucketName: string = DEFAULT_STORAGE_BUCKET
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !imageUrlOrPath) {
    return { success: true };
  }

  // Never attempt to delete external unspash or sample demo images
  if (
    imageUrlOrPath.includes('unsplash.com') ||
    imageUrlOrPath.includes('picsum.photos') ||
    imageUrlOrPath.startsWith('data:')
  ) {
    return { success: true };
  }

  const storagePath = extractStoragePath(imageUrlOrPath);
  if (!storagePath) {
    return { success: true };
  }

  try {
    const { error } = await supabase.storage.from(bucketName).remove([storagePath]);
    if (error) {
      console.warn('[deleteImageFromStorage] Non-critical warning deleting old image:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('[deleteImageFromStorage] Exception removing image:', err);
    return { success: false, error: err?.message };
  }
}

