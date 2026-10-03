'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadImageToStorage, validateImageFile, resolveImageUrl, DEFAULT_FALLBACK_IMAGE } from '@/lib/storageUpload';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: 'products' | 'gallery' | 'hero' | 'media' | 'general';
  required?: boolean;
  helperText?: string;
  aspectRatio?: 'square' | 'video' | 'wide' | 'auto';
  showToast?: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ImageUploadField({
  label,
  value,
  onChange,
  folder = 'products',
  required = false,
  helperText,
  aspectRatio = 'square',
  showToast,
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        onChange(res.url);
        if (showToast) showToast('Photo uploaded successfully!', 'success');
      } else {
        const errMsg = res.error || 'Failed to upload photo.';
        setUploadError(errMsg);
        if (showToast) showToast(errMsg, 'error');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Error uploading photo.';
      setUploadError(errMsg);
      if (showToast) showToast(errMsg, 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerPicker = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const aspectClass =
    aspectRatio === 'video'
      ? 'aspect-video'
      : aspectRatio === 'wide'
      ? 'aspect-[21/9]'
      : aspectRatio === 'square'
      ? 'aspect-square'
      : 'min-h-[160px]';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="font-bold text-[#1A1814] text-xs flex items-center gap-1.5">
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
        {helperText && <span className="text-[11px] text-[#6B665E]">{helperText}</span>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {value ? (
        /* Preview Card with Replace & Remove */
        <div className="rounded-2xl border border-[#EAE6DF] bg-white p-3 space-y-3 shadow-xs">
          <div className={`relative ${aspectClass} rounded-xl overflow-hidden bg-stone-100 border border-[#DDD8CE] group`}>
            <img
              src={resolveImageUrl(value)}
              alt="Preview"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== DEFAULT_FALLBACK_IMAGE) {
                  target.src = DEFAULT_FALLBACK_IMAGE;
                }
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 z-10">
                <RefreshCw className="w-6 h-6 animate-spin text-[#C59A3F]" />
                <span className="text-xs font-bold">Uploading new photo...</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={triggerPicker}
              disabled={isUploading}
              className="flex-1 py-2 px-3 rounded-xl bg-[#FAF5E8] hover:bg-[#F2EFE8] border border-[#E9DCBF] text-xs font-bold text-[#8C6418] flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin' : ''}`} />
              <span>Replace Photo</span>
            </button>

            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-600 flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty State: Select / Add Photo Button */
        <div
          onClick={triggerPicker}
          className={`rounded-2xl border-2 border-dashed border-[#DDD8CE] hover:border-[#C59A3F] bg-[#FAF8F5] hover:bg-[#FAF5E8] p-6 text-center flex flex-col items-center justify-center gap-2.5 transition cursor-pointer group ${
            isUploading ? 'opacity-70 pointer-events-none' : ''
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-[#9E7422]">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <p className="text-xs font-bold">Uploading photo to storage...</p>
              <p className="text-[11px] text-[#6B665E]">Optimizing for web & mobile display</p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#EAE6DF] text-[#9E7422] group-hover:scale-110 group-hover:border-[#C59A3F] flex items-center justify-center shadow-xs transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1A1814] group-hover:text-[#9E7422] transition">
                  Click to Select & Upload Photo
                </p>
                <p className="text-[11px] text-[#6B665E] mt-0.5">
                  JPG, JPEG, PNG, or WebP (up to 10MB)
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#DDD8CE] text-[11px] font-bold text-[#8C6418] shadow-2xs group-hover:border-[#C59A3F]">
                <ImageIcon className="w-3 h-3" />
                <span>Choose from Device</span>
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
