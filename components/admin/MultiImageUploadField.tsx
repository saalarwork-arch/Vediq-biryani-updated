'use client';

import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Star,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertCircle,
  Check,
} from 'lucide-react';
import {
  uploadImageToStorage,
  validateImageFile,
  resolveImageUrl,
  DEFAULT_FALLBACK_IMAGE,
} from '@/lib/storageUpload';

interface MultiImageUploadFieldProps {
  primaryImage: string;
  images: string[];
  onChange: (primary: string, allImages: string[]) => void;
  folder?: 'products' | 'gallery' | 'hero' | 'media' | 'general';
  showToast?: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function MultiImageUploadField({
  primaryImage,
  images,
  onChange,
  folder = 'products',
  showToast,
}: MultiImageUploadFieldProps) {
  const addFilesInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Consolidate current list: ensure primaryImage is included and clean duplicates
  const allImagesList = Array.from(
    new Set([primaryImage, ...(images || [])].filter((url) => Boolean(url && url.trim())))
  );

  // Add new photos (supports single or multi-select from file picker)
  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = validateImageFile(file);
        if (!validation.valid) {
          const errMsg = `${file.name}: ${validation.error}`;
          setUploadError(errMsg);
          if (showToast) showToast(errMsg, 'error');
          continue;
        }

        const res = await uploadImageToStorage(file, folder);
        if (res.success && res.url) {
          uploadedUrls.push(res.url);
        } else {
          const errMsg = res.error || `Failed to upload ${file.name}`;
          setUploadError(errMsg);
          if (showToast) showToast(errMsg, 'error');
        }
      }

      if (uploadedUrls.length > 0) {
        const currentList = Array.from(
          new Set([primaryImage, ...(images || [])].filter((url) => Boolean(url && url.trim())))
        );
        const updatedList = Array.from(new Set([...currentList, ...uploadedUrls].filter(Boolean)));
        // If primary image was empty or wasn't in existing list, make the first newly uploaded photo primary
        const updatedPrimary = (!primaryImage || !currentList.includes(primaryImage))
          ? (uploadedUrls[0] || updatedList[0] || '')
          : primaryImage;

        onChange(updatedPrimary, updatedList);
        if (showToast) {
          showToast(
            uploadedUrls.length === 1
              ? 'Photo uploaded successfully!'
              : `${uploadedUrls.length} photos uploaded!`,
            'success'
          );
        }
      }
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading files');
    } finally {
      setIsUploading(false);
      if (addFilesInputRef.current) {
        addFilesInputRef.current.value = '';
      }
    }
  };

  // Replace a specific photo
  const handleReplaceSpecific = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetIdx = replaceIndexRef.current;
    const file = e.target.files?.[0];
    if (targetIdx === null || !file) return;

    setUploadError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      const errMsg = validation.error || 'Invalid image file.';
      setUploadError(errMsg);
      if (showToast) showToast(errMsg, 'error');
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadImageToStorage(file, folder);
      if (res.success && res.url) {
        const newUrl = res.url;
        const currentList = Array.from(
          new Set([primaryImage, ...(images || [])].filter((url) => Boolean(url && url.trim())))
        );
        
        // Construct the updated array by replacing the item at targetIdx
        const updatedList = [...currentList];
        if (targetIdx < updatedList.length) {
          updatedList[targetIdx] = newUrl;
        } else {
          updatedList.push(newUrl);
        }

        // Clean out any blanks or duplicates while preserving position
        const filteredList = updatedList.filter(Boolean);
        const isPrimary = targetIdx === 0 || currentList[targetIdx] === primaryImage;
        const updatedPrimary = isPrimary ? newUrl : (primaryImage || filteredList[0] || newUrl);

        onChange(updatedPrimary, filteredList);
        console.log('[IMAGE UPLOAD WORKFLOW] MultiImageUploadField updated local form state:', {
          targetIdx,
          newUrl,
          updatedPrimary,
          filteredList,
        });
        if (showToast) showToast('Photo replaced successfully!', 'success');
      } else {
        const errMsg = res.error || 'Failed to replace photo.';
        setUploadError(errMsg);
        if (showToast) showToast(errMsg, 'error');
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Error replacing photo.';
      setUploadError(errMsg);
      if (showToast) showToast(errMsg, 'error');
    } finally {
      setIsUploading(false);
      replaceIndexRef.current = null;
      if (replaceFileInputRef.current) {
        replaceFileInputRef.current.value = '';
      }
    }
  };

  // Set as Primary / Featured
  const handleSetPrimary = (url: string) => {
    const reordered = [url, ...allImagesList.filter((u) => u !== url)];
    onChange(url, reordered);
    if (showToast) showToast('Set as primary dish image', 'info');
  };

  // Delete / Remove image
  const handleDelete = (indexToDelete: number) => {
    const deletedUrl = allImagesList[indexToDelete];
    const updatedList = allImagesList.filter((_, idx) => idx !== indexToDelete);
    let updatedPrimary = primaryImage;

    if (deletedUrl === primaryImage || updatedPrimary === deletedUrl) {
      updatedPrimary = updatedList[0] || '';
    }

    onChange(updatedPrimary, updatedList);
    if (showToast) showToast('Photo removed', 'info');
  };

  // Reorder: Move Left
  const handleMoveLeft = (index: number) => {
    if (index === 0) return;
    const updated = [...allImagesList];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    onChange(updated[0], updated);
  };

  // Reorder: Move Right
  const handleMoveRight = (index: number) => {
    if (index >= allImagesList.length - 1) return;
    const updated = [...allImagesList];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    onChange(updated[0], updated);
  };

  const triggerAdd = () => {
    if (isUploading) return;
    addFilesInputRef.current?.click();
  };

  const triggerReplace = (index: number) => {
    if (isUploading) return;
    replaceIndexRef.current = index;
    replaceFileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {/* Hidden File Inputs */}
      <input
        ref={addFilesInputRef}
        type="file"
        multiple
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleAddFiles}
        className="hidden"
      />
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleReplaceSpecific}
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <div>
          <label className="font-bold text-[#1A1814] text-xs block">
            Product Photos & Gallery Showcase <span className="text-rose-500">*</span>
          </label>
          <p className="text-[11px] text-[#6B665E]">
            Upload dish photos. The first image will be used as the primary menu photo.
          </p>
        </div>

        {allImagesList.length > 0 && (
          <button
            type="button"
            onClick={triggerAdd}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF5E8] hover:bg-[#F2EFE8] border border-[#E9DCBF] text-xs font-bold text-[#8C6418] transition cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add More Photos</span>
          </button>
        )}
      </div>

      {/* Grid of Existing & Uploaded Photos */}
      {allImagesList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {allImagesList.map((url, index) => {
            const isPrimary = url === primaryImage || (index === 0 && !primaryImage);
            return (
              <div
                key={`${url}-${index}`}
                className={`rounded-2xl bg-white border p-2.5 flex flex-col justify-between shadow-xs transition group ${
                  isPrimary
                    ? 'border-[#C59A3F] ring-2 ring-[#C59A3F]/20'
                    : 'border-[#EAE6DF] hover:border-[#DDD8CE]'
                }`}
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 border border-[#DDD8CE]">
                  <img
                    src={resolveImageUrl(url)}
                    alt={`Dish photo ${index + 1}`}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== DEFAULT_FALLBACK_IMAGE) {
                        target.src = DEFAULT_FALLBACK_IMAGE;
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                  {isPrimary && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C59A3F] text-white flex items-center gap-1 shadow-xs">
                      <Star className="w-3 h-3 fill-white" />
                      <span>Primary Photo</span>
                    </span>
                  )}
                </div>

                {/* Card Controls */}
                <div className="pt-2 space-y-1.5">
                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(url)}
                      className="w-full py-1 px-2 rounded-lg bg-[#FAF8F5] hover:bg-[#FAF5E8] border border-[#DDD8CE] text-[10px] font-bold text-[#8C6418] flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Star className="w-3 h-3" />
                      <span>Set as Primary</span>
                    </button>
                  )}

                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveLeft(index)}
                        className="p-1 rounded-lg bg-[#FAF8F5] hover:bg-[#F2EFE8] text-[#5A564F] disabled:opacity-30 cursor-pointer"
                        title="Move Left"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === allImagesList.length - 1}
                        onClick={() => handleMoveRight(index)}
                        className="p-1 rounded-lg bg-[#FAF8F5] hover:bg-[#F2EFE8] text-[#5A564F] disabled:opacity-30 cursor-pointer"
                        title="Move Right"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => triggerReplace(index)}
                        className="p-1 px-2 rounded-lg bg-[#FAF5E8] hover:bg-[#F2EFE8] text-[#8C6418] text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        title="Replace this photo"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Replace</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(index)}
                        className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State: Initial Add Photo */
        <div
          onClick={triggerAdd}
          className={`rounded-2xl border-2 border-dashed border-[#DDD8CE] hover:border-[#C59A3F] bg-[#FAF8F5] hover:bg-[#FAF5E8] p-8 text-center flex flex-col items-center justify-center gap-2.5 transition cursor-pointer group ${
            isUploading ? 'opacity-70 pointer-events-none' : ''
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-[#9E7422]">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <p className="text-xs font-bold">Uploading product photos...</p>
              <p className="text-[11px] text-[#6B665E]">Uploading and storing securely</p>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#EAE6DF] text-[#9E7422] group-hover:scale-110 group-hover:border-[#C59A3F] flex items-center justify-center shadow-xs transition-transform">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1A1814] group-hover:text-[#9E7422] transition">
                  Select & Upload Dish Photos
                </p>
                <p className="text-xs text-[#6B665E] mt-0.5">
                  Click to choose 1 or more photos from your phone or computer
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#DDD8CE] text-xs font-bold text-[#8C6418] shadow-2xs group-hover:border-[#C59A3F]">
                <Plus className="w-3.5 h-3.5" />
                <span>Choose Photos (JPG, PNG, WebP)</span>
              </span>
            </>
          )}
        </div>
      )}

      {uploadError && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}
