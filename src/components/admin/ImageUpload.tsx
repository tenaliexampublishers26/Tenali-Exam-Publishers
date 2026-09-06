'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import {
  Upload,
  Image as ImageIcon,
  X,
  Loader2,
  CheckCircle2,
  Link2,
  ExternalLink,
  Star,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

export interface ImageUploadProps {
  images?: string[];
  value?: string;
  onChange: (images: string[], primaryImage?: string) => void;
  label?: string;
  required?: boolean;
}

export default function ImageUpload({
  images,
  value,
  onChange,
  label = 'Product Images',
  required = false,
}: ImageUploadProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive active image list safely
  const imageList: string[] = Array.isArray(images)
    ? images.filter(Boolean)
    : value
    ? [value]
    : [];

  const [isUploading, setIsUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [manualUrlInput, setManualUrlInput] = useState('');

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const maxSizeBytes = 5 * 1024 * 1024; // 5MB

  const handleFiles = async (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    // Validate files
    const validFiles: File[] = [];
    for (const f of filesArray) {
      if (!validTypes.includes(f.type)) {
        toast.error(`"${f.name}" has invalid format. Use JPG, PNG, WEBP, or GIF.`);
        continue;
      }
      if (f.size > maxSizeBytes) {
        toast.error(`"${f.name}" exceeds 5MB limit.`);
        continue;
      }
      validFiles.push(f);
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setUploadCount(validFiles.length);

    try {
      const formData = new FormData();
      for (const file of validFiles) {
        formData.append('files', file);
      }

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload images');
      }

      const newUrls: string[] = Array.isArray(data.urls)
        ? data.urls
        : data.url
        ? [data.url]
        : [];

      if (newUrls.length > 0) {
        const nextList = [...imageList, ...newUrls];
        onChange(nextList, nextList[0] || '');
        toast.success(
          newUrls.length === 1
            ? 'Image uploaded to Supabase Storage!'
            : `Successfully uploaded ${newUrls.length} images to Supabase Storage!`
        );
      }

      // Some files in the batch may have failed while others succeeded —
      // surface those individually so the admin knows exactly which image
      // needs to be retried, instead of a silent partial save.
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        data.errors.forEach((msg: string) => toast.error(msg));
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      toast.error(err.message || 'Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadCount(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleAddManualUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = manualUrlInput.trim();
    if (!trimmed) {
      toast.error('Please enter a valid URL or path');
      return;
    }
    if (imageList.includes(trimmed)) {
      toast.error('This image URL is already in the list');
      return;
    }
    const nextList = [...imageList, trimmed];
    onChange(nextList, nextList[0] || '');
    setManualUrlInput('');
    toast.success('Image URL added!');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const nextList = imageList.filter((_, idx) => idx !== indexToRemove);
    onChange(nextList, nextList[0] || '');
  };

  const handleSetPrimary = (indexToPrimary: number) => {
    if (indexToPrimary === 0 || indexToPrimary >= imageList.length) return;
    const selected = imageList[indexToPrimary];
    const rest = imageList.filter((_, idx) => idx !== indexToPrimary);
    const nextList = [selected, ...rest];
    onChange(nextList, nextList[0]);
    toast.success('Primary cover image updated!');
  };

  const handleMove = (currentIndex: number, direction: -1 | 1) => {
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= imageList.length) return;
    const nextList = [...imageList];
    const temp = nextList[currentIndex];
    nextList[currentIndex] = nextList[targetIndex];
    nextList[targetIndex] = temp;
    onChange(nextList, nextList[0] || '');
  };

  return (
    <div className="form-group sm:col-span-2 space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="form-label mb-0">
            {label} {required && <span className="text-red-500">*</span>}
            {imageList.length > 0 && (
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                {imageList.length} {imageList.length === 1 ? 'image' : 'images'}
              </span>
            )}
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select or drag multiple product images. The first image (#1) is the storefront cover.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {imageList.length > 0 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="btn btn-secondary btn-sm text-xs py-1.5 px-3 inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              Add More
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowManualUrl(!showManualUrl)}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium inline-flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30"
          >
            <Link2 size={13} />
            {showManualUrl ? 'Hide manual URL' : 'Add image via URL'}
          </button>
        </div>
      </div>

      {/* Hidden Multi-File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Manual URL Input Bar */}
      {showManualUrl && (
        <form
          onSubmit={handleAddManualUrl}
          className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700"
        >
          <input
            type="text"
            value={manualUrlInput}
            onChange={(e) => setManualUrlInput(e.target.value)}
            placeholder="Paste image URL (https://... or /images/products/...)"
            className="form-input flex-1 text-xs"
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm text-xs w-full sm:w-auto shrink-0"
          >
            Add Image
          </button>
        </form>
      )}

      {/* Uploading Banner */}
      {isUploading && (
        <div className="flex items-center gap-3 p-4 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-300">
          <Loader2 size={20} className="animate-spin shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold">
              Uploading {uploadCount > 1 ? `${uploadCount} images` : 'image'} to Supabase Storage...
            </p>
            <p className="text-[11px] opacity-80">Generating CDN URLs and storing files</p>
          </div>
        </div>
      )}

      {/* Gallery Grid of Uploaded Images */}
      {imageList.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {imageList.map((url, idx) => {
              const isCover = idx === 0;
              return (
                <div
                  key={`${url}-${idx}`}
                  className={`group relative rounded-xl overflow-hidden border transition-all duration-200 flex flex-col bg-white dark:bg-slate-900 shadow-sm ${
                    isCover
                      ? 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-blue-400'
                  }`}
                >
                  {/* Image Frame */}
                  <div className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                    <img
                      src={url}
                      alt={`Product image ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                      }}
                    />

                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                      {isCover ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-md">
                          <Star size={11} className="fill-current" /> Cover
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-black/60 text-white backdrop-blur-xs">
                          #{idx + 1}
                        </span>
                      )}

                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pointer-events-auto p-1 rounded-md bg-black/50 text-white hover:bg-black/80 transition-colors"
                        title="View high-res"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>

                    {/* Set As Cover Button (Visible on non-cover images) */}
                    {!isCover && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        className="absolute bottom-2 left-2 right-2 py-1 px-2 text-[11px] font-medium rounded-lg bg-black/75 hover:bg-emerald-600 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1 shadow-sm"
                        title="Set this image as primary store cover"
                      >
                        <Star size={12} /> Set as Cover
                      </button>
                    )}
                  </div>

                  {/* Card Footer Bar with Order Controls & Delete */}
                  <div className="p-1.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleMove(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move image earlier"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 1)}
                        disabled={idx === imageList.length - 1}
                        className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move image later"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Remove image"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Quick Add More Tile */}
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 cursor-pointer text-center transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 shadow-xs">
                <Plus size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Add More
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Click or drop files
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Large Drop Zone (When No Images Uploaded Yet) */}
      {imageList.length === 0 && (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: isDragging
              ? '2px dashed #2563eb'
              : '2px dashed rgba(203, 213, 225, 0.9)',
            background: isDragging
              ? 'rgba(59, 130, 246, 0.05)'
              : isUploading
              ? 'rgba(241, 245, 249, 0.5)'
              : 'rgba(255, 255, 255, 0.6)',
          }}
          className="relative flex flex-col items-center justify-center p-8 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-slate-800/50 transition-all duration-200 group text-center"
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 size={36} className="text-blue-600 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Uploading {uploadCount > 1 ? `${uploadCount} images` : 'image'} to Supabase Storage...
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Generating permanent CDN image URLs
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
                <Upload size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                Click to choose multiple product images, or drag & drop them here
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PNG, JPG, JPEG, WEBP or GIF (Select multiple files at once, max 5MB each)
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
