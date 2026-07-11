'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { PhotoIcon, ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { MAX_IMAGE_BYTES } from '@/lib/uploadValidation';

const MAX_IMAGE_MB = MAX_IMAGE_BYTES / (1024 * 1024);

interface PageHeader {
  key: string;
  pageName: string;
  description: string;
  value: string | null;
  defaultImage: string;
}

const PAGE_HEADERS: PageHeader[] = [
  {
    key: 'header:home',
    pageName: 'Home',
    description: 'Main hero image on the homepage',
    value: null,
    defaultImage: '/images/hero/hero.jpg'
  },
  {
    key: 'header:about',
    pageName: 'About Us',
    description: 'Hero image on the About page',
    value: null,
    defaultImage: '/images/hero/about.jpg'
  },
  {
    key: 'header:portfolio',
    pageName: 'Portfolio',
    description: 'Header image on the Portfolio page',
    value: null,
    defaultImage: '/images/hero/portfolio.jpg'
  },
  {
    key: 'header:events',
    pageName: 'Events',
    description: 'Header image on the Events page',
    value: null,
    defaultImage: '/images/hero/hero.jpg'
  },
  {
    key: 'header:contact',
    pageName: 'Contact',
    description: 'Hero image on the Contact page',
    value: null,
    defaultImage: '/images/hero/contact.jpg'
  },
  {
    key: 'header:services',
    pageName: 'Services',
    description: 'Hero image on the Services page',
    value: null,
    defaultImage: '/images/hero/services.jpg'
  }
];

export default function AdminHeadersPage() {
  const [headers, setHeaders] = useState<PageHeader[]>(PAGE_HEADERS);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchHeaders();
    fetchLogo();
  }, []);

  const fetchHeaders = async () => {
    try {
      const response = await fetch('/api/settings?prefix=header:', { cache: 'no-store' });
      if (response.ok) {
        const settings = await response.json();
        
        // Merge settings with default headers
        setHeaders(prevHeaders => 
          prevHeaders.map(header => {
            const setting = settings.find((s: { key: string }) => s.key === header.key);
            return {
              ...header,
              value: setting?.value || null
            };
          })
        );
      }
    } catch (error) {
      console.error('Error fetching headers:', error);
      toast.error('Failed to load page headers');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogo = async () => {
    try {
      const response = await fetch('/api/settings?key=site:logo', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (data?.value) {
          setLogoUrl(data.value);
        }
      }
    } catch (error) {
      console.error('Error fetching logo:', error);
    }
  };

  const handleLogoSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(`Logo must be less than ${MAX_IMAGE_MB}MB`);
      return;
    }

    setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'logos');

      const uploadResponse = await fetch('/api/upload/asset', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload logo');
      }

      const uploadResult = await uploadResponse.json();
      const imageUrl = uploadResult.url;

      const settingsResponse = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'site:logo',
          value: imageUrl,
          metadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString()
          }
        })
      });

      if (!settingsResponse.ok) {
        throw new Error('Failed to save logo setting');
      }

      setLogoUrl(imageUrl);
      toast.success('Logo updated!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Are you sure you want to remove the logo? The text "MTP COLLECTIVE" will be displayed instead.')) {
      return;
    }

    try {
      const response = await fetch('/api/settings?key=site:logo', {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove logo');
      }

      setLogoUrl(null);
      toast.success('Logo removed. Text will be displayed instead.');
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('Failed to remove logo');
    }
  };

  const handleFileSelect = async (key: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(`Image must be less than ${MAX_IMAGE_MB}MB`);
      return;
    }

    setUploadingFor(key);

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'headers');

      // Upload the image (using asset endpoint - no Photo record created)
      const uploadResponse = await fetch('/api/upload/asset', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const uploadResult = await uploadResponse.json();
      const imageUrl = uploadResult.url;

      // Save the URL to settings
      const settingsResponse = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          value: imageUrl,
          metadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString()
          }
        })
      });

      if (!settingsResponse.ok) {
        throw new Error('Failed to save setting');
      }

      // Update local state
      setHeaders(prevHeaders =>
        prevHeaders.map(h =>
          h.key === key ? { ...h, value: imageUrl } : h
        )
      );

      toast.success('Header image updated!');
    } catch (error) {
      console.error('Error uploading header:', error);
      toast.error('Failed to upload header image');
    } finally {
      setUploadingFor(null);
    }
  };

  const handleRemoveHeader = async (key: string) => {
    if (!confirm('Are you sure you want to remove this custom header? The default image will be used.')) {
      return;
    }

    try {
      const response = await fetch(`/api/settings?key=${encodeURIComponent(key)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove header');
      }

      // Update local state
      setHeaders(prevHeaders =>
        prevHeaders.map(h =>
          h.key === key ? { ...h, value: null } : h
        )
      );

      toast.success('Custom header removed. Default image will be used.');
    } catch (error) {
      console.error('Error removing header:', error);
      toast.error('Failed to remove header');
    }
  };

  const triggerFileInput = (key: string) => {
    fileInputRefs.current[key]?.click();
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Site Branding & Page Headers</h1>
        <p className="text-gray-400">
          Customize your site logo and the hero images displayed at the top of each main page.
        </p>
      </div>

      {/* Logo Section */}
      <div className="mb-10 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-1">Site Logo</h2>
          <p className="text-sm text-gray-400">
            Upload a logo to replace the text &quot;MTP COLLECTIVE&quot; in the navigation. 
            Recommended: PNG with transparent background, height around 75px.
          </p>
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-6">
            {/* Logo Preview */}
            <div className="flex-shrink-0 min-w-[180px] h-[75px] bg-gray-900 rounded-lg flex items-center justify-center border border-gray-600 px-2">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Site Logo"
                  width={225}
                  height={75}
                  className="h-[75px] w-auto object-contain"
                />
              ) : (
                <span className="text-xl font-bold tracking-wider text-white">MTP COLLECTIVE</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Hidden file input */}
              <input
                type="file"
                ref={logoInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoSelect(file);
                  e.target.value = '';
                }}
                accept="image/*"
                className="hidden"
              />

              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {uploadingLogo ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpTrayIcon className="w-5 h-5" />
                    <span>{logoUrl ? 'Replace Logo' : 'Upload Logo'}</span>
                  </>
                )}
              </button>

              {logoUrl && (
                <button
                  onClick={handleRemoveLogo}
                  disabled={uploadingLogo}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {/* Status */}
            <div className="ml-auto">
              {logoUrl ? (
                <span className="px-3 py-1 bg-green-500/20 text-green-300 text-sm font-medium rounded-full">
                  Custom Logo
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-500/20 text-gray-300 text-sm font-medium rounded-full">
                  Using Text
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section Header for Page Headers */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-1">Page Hero Images</h2>
        <p className="text-sm text-gray-400">
          Upload high-quality images (recommended: 1920x1080 or larger).
        </p>
      </div>

      {/* Headers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {headers.map((header) => (
          <div 
            key={header.key}
            className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700"
          >
            {/* Preview Image */}
            <div className="relative aspect-video bg-gray-900">
              <Image
                src={header.value || header.defaultImage}
                alt={`${header.pageName} header`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              
              {/* Overlay with status */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              {/* Status badge */}
              <div className="absolute top-3 right-3">
                {header.value ? (
                  <span className="px-2 py-1 bg-green-500/80 text-white text-xs font-medium rounded-full">
                    Custom
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-gray-500/80 text-white text-xs font-medium rounded-full">
                    Default
                  </span>
                )}
              </div>

              {/* Page name overlay */}
              <div className="absolute bottom-3 left-3">
                <h3 className="text-xl font-bold text-white">{header.pageName}</h3>
                <p className="text-sm text-gray-300">{header.description}</p>
              </div>

              {/* Upload overlay on hover */}
              {uploadingFor === header.key && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-2" />
                    <span className="text-white text-sm">Uploading...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 flex items-center gap-3">
              {/* Hidden file input */}
              <input
                type="file"
                ref={el => { fileInputRefs.current[header.key] = el; }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(header.key, file);
                  e.target.value = '';
                }}
                accept="image/*"
                className="hidden"
              />
              
              {/* Upload button */}
              <button
                onClick={() => triggerFileInput(header.key)}
                disabled={uploadingFor !== null}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <ArrowUpTrayIcon className="w-5 h-5" />
                <span>{header.value ? 'Replace Image' : 'Upload Image'}</span>
              </button>

              {/* Remove button (only if custom image) */}
              {header.value && (
                <button
                  onClick={() => handleRemoveHeader(header.key)}
                  disabled={uploadingFor !== null}
                  className="p-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  title="Remove custom header"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Help text */}
      <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="flex items-start gap-3">
          <PhotoIcon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-white font-medium mb-1">Image Guidelines</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Recommended size: 1920x1080 pixels or larger</li>
              <li>• Supported formats: JPG, PNG, WebP</li>
              <li>• Maximum file size: {MAX_IMAGE_MB}MB</li>
              <li>• Images will be automatically optimized for web delivery</li>
              <li>• Use high-contrast images that work well with text overlays</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

