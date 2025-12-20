'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { PhotoIcon, TrashIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
}

interface Event {
  id: string;
  name: string;
  date?: string;
  location?: string;
}

interface PreviewFile {
  file: File;
  preview: string;
  title: string;
  description: string;
  folderPath?: string;
  autoCategory?: string;
}

// Common tag presets for quick-apply
const TAG_PRESETS = [
  { label: 'D1', value: 'D1' },
  { label: 'Athletics', value: 'athletics' },
  { label: 'Night Game', value: 'night game' },
  { label: 'Concert', value: 'concert' },
  { label: 'Festival', value: 'festival' },
  { label: 'Live Music', value: 'live music' },
  { label: 'Automotive', value: 'automotive' },
  { label: 'Street', value: 'street' },
  { label: 'Portrait', value: 'portrait' },
];

interface BulkPhotoUploadProps {
  onUploadComplete?: () => void;
}

export function BulkPhotoUpload({ onUploadComplete }: BulkPhotoUploadProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [useAutoCategory, setUseAutoCategory] = useState(true);
  const folderInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch categories and events on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, eventsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/events')
        ]);

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }

        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          setEvents(eventsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch categories and events');
      }
    };

    fetchData();
  }, []);

  // Helper to find matching category from folder path
  const findCategoryFromPath = useCallback((filePath: string): { categoryId: string; categoryName: string } | null => {
    if (!filePath || categories.length === 0) return null;
    
    // Extract folder names from path (e.g., "Sports/Game1/photo.jpg" -> ["Sports", "Game1"])
    const parts = filePath.split('/').filter(p => p && !p.includes('.'));
    
    // Try to match each folder part to a category (case-insensitive)
    for (const folderName of parts) {
      const matchedCategory = categories.find(
        cat => cat.name.toLowerCase() === folderName.toLowerCase()
      );
      if (matchedCategory) {
        return { categoryId: matchedCategory.id, categoryName: matchedCategory.name };
      }
    }
    return null;
  }, [categories]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => {
      // Try to get the relative path from the file (webkitRelativePath for folder uploads)
      const relativePath = (file as any).webkitRelativePath || (file as any).path || '';
      const folderMatch = useAutoCategory ? findCategoryFromPath(relativePath) : null;
      
      return {
        file,
        preview: URL.createObjectURL(file),
        title: file.name.split('.')[0],
        description: '',
        folderPath: relativePath,
        autoCategory: folderMatch?.categoryName,
      };
    });

    // If auto-categorization found categories, auto-select them
    if (useAutoCategory) {
      const foundCategoryIds = new Set<string>();
      newFiles.forEach(f => {
        const match = findCategoryFromPath(f.folderPath || '');
        if (match) foundCategoryIds.add(match.categoryId);
      });
      if (foundCategoryIds.size > 0) {
        setSelectedCategories(prev => [...new Set([...prev, ...foundCategoryIds])]);
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, [useAutoCategory, findCategoryFromPath]);

  // Handle folder input change (webkitdirectory)
  const handleFolderSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    // Filter to only image files
    const imageFiles = Array.from(selectedFiles).filter(file => 
      file.type.startsWith('image/') || 
      /\.(jpe?g|png|gif|webp)$/i.test(file.name)
    );

    const newFiles = imageFiles.map(file => {
      const relativePath = (file as any).webkitRelativePath || '';
      const folderMatch = useAutoCategory ? findCategoryFromPath(relativePath) : null;
      
      return {
        file,
        preview: URL.createObjectURL(file),
        title: file.name.split('.')[0],
        description: '',
        folderPath: relativePath,
        autoCategory: folderMatch?.categoryName,
      };
    });

    // Auto-select detected categories
    if (useAutoCategory) {
      const foundCategoryIds = new Set<string>();
      newFiles.forEach(f => {
        const match = findCategoryFromPath(f.folderPath || '');
        if (match) foundCategoryIds.add(match.categoryId);
      });
      if (foundCategoryIds.size > 0) {
        setSelectedCategories(prev => [...new Set([...prev, ...foundCategoryIds])]);
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
    
    // Reset the input so same folder can be selected again
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  }, [useAutoCategory, findCategoryFromPath]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    disabled: isUploading
  });

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const updateFileTitle = (index: number, title: string) => {
    setFiles(prev => {
      const newFiles = [...prev];
      newFiles[index].title = title;
      return newFiles;
    });
  };

  const updateFileDescription = (index: number, description: string) => {
    setFiles(prev => {
      const newFiles = [...prev];
      newFiles[index].description = description;
      return newFiles;
    });
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (!tags.includes(currentTag.trim())) {
        setTags(prev => [...prev, currentTag.trim()]);
      }
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const uploadPhotos = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one photo');
      return;
    }

    setIsUploading(true);
    const uploadedPhotos: any[] = [];
    const failedUploads: string[] = [];

    try {
      // Upload photos one by one (can be parallelized later)
      for (let i = 0; i < files.length; i++) {
        const fileData = files[i];
        const fileName = fileData.file.name;
        
        try {
          setUploadProgress(prev => ({ ...prev, [fileName]: 0 }));
          
          const formData = new FormData();
          formData.append('file', fileData.file);
          formData.append('title', fileData.title);
          formData.append('description', fileData.description);
          
          // Add selected categories
          selectedCategories.forEach(categoryId => {
            formData.append('categoryIds', categoryId);
          });

          // Add tags
          tags.forEach(tag => {
            formData.append('tags', tag);
          });

          setUploadProgress(prev => ({ ...prev, [fileName]: 50 }));

          const response = await fetch('/api/photos/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload photo');
          }

          const photo = await response.json();
          uploadedPhotos.push(photo);
          
          setUploadProgress(prev => ({ ...prev, [fileName]: 100 }));
        } catch (error) {
          console.error(`Error uploading ${fileName}:`, error);
          failedUploads.push(fileName);
          setUploadProgress(prev => ({ ...prev, [fileName]: -1 }));
        }
      }

      // Associate photos with event if selected
      if (selectedEvent && uploadedPhotos.length > 0) {
        try {
          const photoIds = uploadedPhotos.map(photo => photo.id);
          
          // Get current event to preserve existing associations
          const eventResponse = await fetch(`/api/events/${selectedEvent}`);
          if (eventResponse.ok) {
            const currentEvent = await eventResponse.json();
            const existingPhotoIds = currentEvent.photos?.map((p: any) => p.id) || [];
            const allPhotoIds = [...existingPhotoIds, ...photoIds];
            
            // Update event with new photos
            await fetch(`/api/events/${selectedEvent}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...currentEvent,
                photoIds: allPhotoIds,
                categoryIds: currentEvent.categories?.map((c: any) => c.id) || [],
                articleIds: currentEvent.articles?.map((a: any) => a.id) || [],
              }),
            });
          }
        } catch (error) {
          console.error('Error associating photos with event:', error);
          toast.error('Photos uploaded but failed to associate with event');
        }
      }

      // Show results
      if (uploadedPhotos.length > 0) {
        toast.success(`Successfully uploaded ${uploadedPhotos.length} photo${uploadedPhotos.length > 1 ? 's' : ''}`);
      }
      
      if (failedUploads.length > 0) {
        toast.error(`Failed to upload ${failedUploads.length} photo${failedUploads.length > 1 ? 's' : ''}: ${failedUploads.join(', ')}`);
      }

      // Clear successful uploads
      setFiles(prev => prev.filter(f => failedUploads.includes(f.file.name)));
      setUploadProgress({});
      
      if (onUploadComplete) {
        onUploadComplete();
      }
      
      router.refresh();
    } catch (error) {
      console.error('Error during bulk upload:', error);
      toast.error('Failed to upload photos');
    } finally {
      setIsUploading(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === -1) return 'bg-red-500';
    if (progress === 100) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getProgressText = (progress: number) => {
    if (progress === -1) return 'Failed';
    if (progress === 100) return 'Completed';
    return `${progress}%`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Options */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={useAutoCategory}
              onChange={(e) => setUseAutoCategory(e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
            />
            Auto-categorize by folder name
          </label>
        </div>
      </div>

      {/* Upload Zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Files Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600 hover:border-gray-500'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''} bg-gray-800`}
        >
          <input {...getInputProps()} />
          <PhotoIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          {isDragActive ? (
            <p className="text-blue-400">Drop the images here...</p>
          ) : (
            <div>
              <p className="text-gray-300 font-medium">Drop Files or Click</p>
              <p className="text-sm text-gray-400 mt-1">Select individual images</p>
            </div>
          )}
        </div>

        {/* Folder Upload Zone */}
        <div
          onClick={() => !isUploading && folderInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            border-purple-600/50 hover:border-purple-500 bg-purple-900/10
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            ref={folderInputRef}
            type="file"
            // @ts-expect-error - webkitdirectory is not in the type definitions
            webkitdirectory="true"
            multiple
            onChange={handleFolderSelect}
            className="hidden"
            accept="image/*"
          />
          <svg className="w-10 h-10 text-purple-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p className="text-gray-300 font-medium">Select Folder</p>
          <p className="text-sm text-purple-300 mt-1">Auto-categorize by folder name</p>
        </div>
      </div>

      {useAutoCategory && (
        <div className="text-sm text-gray-400 bg-gray-800 rounded-lg p-3 mt-2">
          <strong className="text-gray-300">Tip:</strong> Name your folders after categories (e.g., &quot;Sports&quot;, &quot;Music&quot;, &quot;Street&quot;) 
          and photos will be automatically assigned to matching categories.
        </div>
      )}

      {/* File Previews */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Selected Photos ({files.length})</h3>
            <button
              onClick={() => setFiles([])}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((fileData, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4 space-y-3">
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <Image
                    src={fileData.preview}
                    alt={fileData.title}
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <input
                    type="text"
                    value={fileData.title}
                    onChange={(e) => updateFileTitle(index, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded-md text-sm"
                    placeholder="Photo title"
                  />
                  <textarea
                    value={fileData.description}
                    onChange={(e) => updateFileDescription(index, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded-md text-sm"
                    placeholder="Photo description"
                    rows={2}
                  />
                  {/* Show folder path and auto-detected category */}
                  {fileData.folderPath && (
                    <div className="text-xs text-gray-400 truncate" title={fileData.folderPath}>
                      📁 {fileData.folderPath}
                    </div>
                  )}
                  {fileData.autoCategory && (
                    <div className="inline-block px-2 py-0.5 bg-purple-600/30 text-purple-300 rounded text-xs">
                      Auto: {fileData.autoCategory}
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {uploadProgress[fileData.file.name] !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300">Upload Progress</span>
                      <span className={`${uploadProgress[fileData.file.name] === -1 ? 'text-red-400' : 'text-gray-300'}`}>
                        {getProgressText(uploadProgress[fileData.file.name])}
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(uploadProgress[fileData.file.name])}`}
                        style={{ 
                          width: `${uploadProgress[fileData.file.name] === -1 ? 100 : Math.max(0, uploadProgress[fileData.file.name])}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Event Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              <CalendarDaysIcon className="w-4 h-4 inline mr-1" />
              Associate with Event (Optional)
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select an event...</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name} {event.date ? `(${new Date(event.date).toLocaleDateString()})` : ''}
                </option>
              ))}
            </select>
            {events.length === 0 && (
              <p className="text-gray-400 text-sm mt-1">No events available. Create some events first.</p>
            )}
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Categories (Applied to all photos)
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors
                    ${selectedCategories.includes(category.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Tags (Applied to all photos)
          </label>
          
          {/* Tag Presets */}
          <div className="mb-3">
            <span className="text-xs text-gray-400 mb-1 block">Quick add presets:</span>
            <div className="flex flex-wrap gap-1">
              {TAG_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  onClick={() => {
                    if (!tags.includes(preset.value)) {
                      setTags(prev => [...prev, preset.value]);
                    }
                  }}
                  disabled={tags.includes(preset.value)}
                  className={`px-2 py-1 rounded text-xs transition-colors
                    ${tags.includes(preset.value)
                      ? 'bg-green-600/30 text-green-300 cursor-default'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                  + {preset.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Selected Tags */}
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-700 text-gray-200"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-gray-400 hover:text-gray-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={currentTag}
            onChange={(e) => setCurrentTag(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Add a custom tag and press Enter"
            className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={uploadPhotos}
            disabled={isUploading}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : `Upload ${files.length} Photo${files.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
} 