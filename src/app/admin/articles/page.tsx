'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { DocumentTextIcon, PlusIcon, PencilIcon, TrashIcon, PhotoIcon, TagIcon, UserIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
// TinyMCE Editor removed - using textarea instead
import Image from 'next/image';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  publishDate?: string;
  published: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  authorName?: string;
  categories?: Category[];
  tags?: Tag[];
  events?: Event[];
  photos?: ArticlePhoto[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface Photo {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
}

/** A photo already linked to an article, carrying its curated display order. */
interface ArticlePhoto extends Photo {
  position: number;
}

interface Event {
  id: string;
  name: string;
  slug: string;
  description?: string;
  date?: string;
  location?: string;
}

const EMPTY_FORM = {
  title: '',
  content: '',
  excerpt: '',
  coverImage: '',
  publishDate: '',
  authorName: '',
  published: false,
  featured: false,
  categoryIds: [] as string[],
  tagIds: [] as string[],
  eventIds: [] as string[],
  photoIds: [] as string[],
};

/** Photo ids for an article's set, in curated display order. */
function articlePhotoIds(article: Article): string[] {
  return [...(article.photos || [])]
    .sort((a, b) => a.position - b.position)
    .map(photo => photo.id);
}

interface PhotoPickerModalProps {
  title: string;
  photos: Photo[];
  isSelected: (photo: Photo) => boolean;
  onSelect: (photo: Photo) => void;
  onClose: () => void;
  /** Optional confirm/cancel footer. Without it, selecting acts immediately. */
  footer?: React.ReactNode;
}

/**
 * Thumbnail-grid picker used for both the single-select cover image and the
 * multi-select photo set; the caller decides what selection means.
 */
function PhotoPickerModal({
  title,
  photos,
  isSelected,
  onSelect,
  onClose,
  footer,
}: PhotoPickerModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close photo picker"
            className="text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                isSelected(photo)
                  ? 'border-blue-500 ring-2 ring-blue-500'
                  : 'border-transparent hover:border-gray-500'
              }`}
              onClick={() => onSelect(photo)}
            >
              <Image
                src={photo.thumbnail || photo.url}
                alt={photo.title}
                fill
                className="object-cover"
              />
              {isSelected(photo) && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  &#10003;
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-xs truncate">
                {photo.title}
              </div>
            </div>
          ))}
        </div>
        {photos.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No photos available. Upload some photos first.
          </div>
        )}
        {footer}
      </div>
    </div>
  );
}

interface PhotoSetPickerModalProps {
  photos: Photo[];
  /** The set as it stands; picks are staged against this copy. */
  selectedIds: string[];
  onConfirm: (photoIds: string[]) => void;
  onClose: () => void;
}

/**
 * Multi-select picker for an article's photo set. Picks are staged locally so
 * dismissing the dialog discards them; only "Add Photos" commits. New picks are
 * appended, which keeps the existing curated order intact.
 */
function PhotoSetPickerModal({ photos, selectedIds, onConfirm, onClose }: PhotoSetPickerModalProps) {
  const [draftIds, setDraftIds] = useState<string[]>(selectedIds);

  const toggle = (photo: Photo) => {
    setDraftIds(prev =>
      prev.includes(photo.id) ? prev.filter(id => id !== photo.id) : [...prev, photo.id]
    );
  };

  return (
    <PhotoPickerModal
      title="Select Photos for This Article"
      photos={photos}
      isSelected={(photo) => draftIds.includes(photo.id)}
      onSelect={toggle}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(draftIds)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Photos
          </button>
        </div>
      }
    />
  );
}

export default function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [showPhotoSetSelector, setShowPhotoSetSelector] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [articlesRes, categoriesRes, eventsRes, photosRes] = await Promise.all([
        fetch('/api/articles'),
        fetch('/api/categories'),
        fetch('/api/events'),
        fetch('/api/photos?take=50'), // Get recent photos for selection
      ]);

      if (articlesRes.ok) {
        const articlesData = await articlesRes.json();
        setArticles(articlesData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      }

      if (photosRes.ok) {
        const photosData = await photosRes.json();
        setPhotos(photosData.photos || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Article title is required');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Article content is required');
      return;
    }

    setIsCreating(true);

    try {
      const url = editingArticle ? `/api/articles/${editingArticle.id}` : '/api/articles';
      const method = editingArticle ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save article');
      }

      const article = await response.json();
      
      if (editingArticle) {
        setArticles(prev => prev.map(art => art.id === article.id ? article : art));
        toast.success('Article updated successfully');
        setEditingArticle(null);
      } else {
        setArticles(prev => [...prev, article]);
        toast.success('Article created successfully');
      }

      setFormData(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save article');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || '',
      coverImage: article.coverImage || '',
      publishDate: article.publishDate ? article.publishDate.split('T')[0] : '',
      authorName: article.authorName || '',
      published: article.published,
      featured: article.featured,
      categoryIds: article.categories?.map(c => c.id) || [],
      tagIds: article.tags?.map(t => t.id) || [],
      eventIds: article.events?.map(e => e.id) || [],
      photoIds: articlePhotoIds(article),
    });
    setShowForm(true);
  };

  const handleDelete = async (article: Article) => {
    if (!confirm(`Are you sure you want to delete "${article.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete article');
      }

      setArticles(prev => prev.filter(art => art.id !== article.id));
      toast.success('Article deleted successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete article');
    }
  };

  const handleCancel = () => {
    setEditingArticle(null);
    setFormData(EMPTY_FORM);
    setShowForm(false);
  };

  const togglePublished = async (article: Article) => {
    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...article,
          published: !article.published,
          authorName: article.authorName,
          categoryIds: article.categories?.map(c => c.id) || [],
          tagIds: article.tags?.map(t => t.id) || [],
          eventIds: article.events?.map(e => e.id) || [],
          photoIds: articlePhotoIds(article),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update article');
      }

      const updatedArticle = await response.json();
      setArticles(prev => prev.map(art => art.id === article.id ? updatedArticle : art));
      toast.success(`Article ${updatedArticle.published ? 'published' : 'unpublished'}`);
    } catch (err) {
      toast.error('Failed to update article status');
    }
  };

  const handlePhotoSelect = (photo: Photo) => {
    setFormData(prev => ({ ...prev, coverImage: photo.url }));
    setShowPhotoSelector(false);
    toast.success('Cover image selected');
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
  };

  const handleEventToggle = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      eventIds: prev.eventIds.includes(eventId)
        ? prev.eventIds.filter(id => id !== eventId)
        : [...prev.eventIds, eventId]
    }));
  };

  const handlePhotoSetConfirm = (photoIds: string[]) => {
    setFormData(prev => ({ ...prev, photoIds }));
    setShowPhotoSetSelector(false);
  };

  // Reorders the photo set; array order is what the API persists as `position`
  const movePhotoInSet = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;

    setFormData(prev => {
      if (target < 0 || target >= prev.photoIds.length) return prev;

      const photoIds = [...prev.photoIds];
      [photoIds[index], photoIds[target]] = [photoIds[target], photoIds[index]];
      return { ...prev, photoIds };
    });
  };

  const removePhotoFromSet = (photoId: string) => {
    setFormData(prev => ({
      ...prev,
      photoIds: prev.photoIds.filter(id => id !== photoId)
    }));
  };

  // The library dropdown only holds the 50 most recent photos, so an article
  // can reference a photo that is not in `photos`. Fall back to the copy that
  // came back with the article so older sets stay visible and reorderable.
  const selectedSetPhotos = formData.photoIds.map(id => ({
    id,
    photo:
      photos.find(photo => photo.id === id) ??
      editingArticle?.photos?.find(photo => photo.id === id),
  }));

  const getAuthorName = (authorName: string | undefined) => authorName || 'Anonymous Author';

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Article Management</h1>
          <p className="text-gray-400 mt-1">Write and manage your photography articles and stories</p>
        </div>
        {/* Hidden while the editor is open: the form is already on screen, so
            the button had nothing to do and read as broken. */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New Article
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Article Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-100">
            {editingArticle ? 'Edit Article' : 'Create New Article'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-200 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter article title"
                required
              />
            </div>

            {/* Author and Publish Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Author Name */}
              <div>
                <label htmlFor="authorName" className="block text-sm font-medium text-gray-200 mb-2">
                  <UserIcon className="w-4 h-4 inline mr-1" />
                  Author
                </label>
                <input
                  type="text"
                  id="authorName"
                  value={formData.authorName}
                  onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                  className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Anonymous Author"
                  maxLength={100}
                />
                <p className="text-xs text-gray-400 mt-1">Any name, no account required. Leave empty for &quot;Anonymous Author&quot;</p>
              </div>

              {/* Publish Date */}
              <div>
                <label htmlFor="publishDate" className="block text-sm font-medium text-gray-200 mb-2">
                  <CalendarDaysIcon className="w-4 h-4 inline mr-1" />
                  Article Date
                </label>
                <input
                  type="date"
                  id="publishDate"
                  value={formData.publishDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, publishDate: e.target.value }))}
                  className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Can be in the past - controls article display order</p>
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label htmlFor="excerpt" className="block text-sm font-medium text-gray-200 mb-2">
                Excerpt
              </label>
              <textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                rows={2}
                className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Brief description or excerpt for SEO and previews"
              />
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Cover Image
              </label>
              <div className="flex items-center space-x-4">
                {formData.coverImage && (
                  <div className="relative w-32 h-20 rounded-md overflow-hidden">
                    <Image
                      src={formData.coverImage}
                      alt="Cover image"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowPhotoSelector(true)}
                    className="inline-flex items-center px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                  >
                    <PhotoIcon className="w-4 h-4 mr-2" />
                    Select Photo
                  </button>
                  {formData.coverImage && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, coverImage: '' }))}
                      className="px-3 py-2 text-red-300 bg-red-600/20 rounded-md hover:bg-red-600/30"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Categories
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.categoryIds.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Events */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Events
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {events.map((event) => (
                  <label key={event.id} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.eventIds.includes(event.id)}
                      onChange={() => handleEventToggle(event.id)}
                      className="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-gray-300">
                      {event.name}
                      {event.date && ` (${new Date(event.date).toLocaleDateString()})`}
                    </span>
                  </label>
                ))}
              </div>
              {events.length === 0 && (
                <p className="text-gray-400 text-sm">No events available. Create some events first.</p>
              )}
            </div>

            {/* Photo Set */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Photo Set
              </label>
              <p className="text-xs text-gray-400 mb-3">
                Photos shown as a gallery within the article. Drag order is set with the arrows below.
              </p>
              <button
                type="button"
                onClick={() => setShowPhotoSetSelector(true)}
                className="inline-flex items-center px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              >
                <PhotoIcon className="w-4 h-4 mr-2" />
                Select Photos
              </button>

              {selectedSetPhotos.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {selectedSetPhotos.map(({ id, photo }, index) => (
                    <li
                      key={id}
                      className="flex items-center gap-3 bg-gray-700 rounded-md p-2"
                    >
                      <span className="text-xs text-gray-400 w-6 text-center">{index + 1}</span>
                      <div className="relative w-16 h-12 rounded overflow-hidden flex-shrink-0 bg-gray-600">
                        {photo && (
                          <Image
                            src={photo.thumbnail || photo.url}
                            alt={photo.title}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <span className="flex-1 text-sm text-gray-200 truncate">
                        {photo ? photo.title : 'Photo no longer available'}
                      </span>
                      <button
                        type="button"
                        onClick={() => movePhotoInSet(index, 'up')}
                        disabled={index === 0}
                        aria-label={`Move ${photo?.title || 'photo'} earlier`}
                        className="px-2 py-1 text-sm text-gray-200 bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-40 disabled:hover:bg-gray-600"
                      >
                        &uarr;
                      </button>
                      <button
                        type="button"
                        onClick={() => movePhotoInSet(index, 'down')}
                        disabled={index === selectedSetPhotos.length - 1}
                        aria-label={`Move ${photo?.title || 'photo'} later`}
                        className="px-2 py-1 text-sm text-gray-200 bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-40 disabled:hover:bg-gray-600"
                      >
                        &darr;
                      </button>
                      <button
                        type="button"
                        onClick={() => removePhotoFromSet(id)}
                        aria-label={`Remove ${photo?.title || 'photo'} from set`}
                        className="px-2 py-1 text-sm text-red-300 bg-red-600/20 rounded hover:bg-red-600/30"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-gray-400">No photos linked to this article yet.</p>
              )}
            </div>

            {/* Rich Text Editor */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-200 mb-2">
                Content *
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={15}
                className="w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                placeholder="Write your article content here... You can use basic HTML tags like <p>, <h2>, <h3>, <strong>, <em>, <ul>, <li>, etc."
                required
              />
              <p className="mt-2 text-xs text-gray-400">
                You can use basic HTML tags for formatting: &lt;p&gt;, &lt;h2&gt;, &lt;h3&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt;, etc.
              </p>
            </div>

            {/* Publishing Options */}
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-200">Publish immediately</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                  className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-200">Featured article</span>
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isCreating}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isCreating ? 'Saving...' : editingArticle ? 'Update Article' : 'Create Article'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cover Image Selector Modal */}
      {showPhotoSelector && (
        <PhotoPickerModal
          title="Select Cover Image"
          photos={photos}
          isSelected={(photo) => photo.url === formData.coverImage}
          onSelect={handlePhotoSelect}
          onClose={() => setShowPhotoSelector(false)}
        />
      )}

      {/* Photo Set Selector Modal */}
      {showPhotoSetSelector && (
        <PhotoSetPickerModal
          photos={photos}
          selectedIds={formData.photoIds}
          onConfirm={handlePhotoSetConfirm}
          onClose={() => setShowPhotoSetSelector(false)}
        />
      )}

      {/* Articles List */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-100">Your Articles</h2>
        
        {articles.length > 0 ? (
          <div className="space-y-4">
            {articles.map((article) => (
              <div key={article.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-white">{article.title}</h3>
                      <div className="flex gap-1">
                        <span className={`px-2 py-1 text-xs rounded ${
                          article.published 
                            ? 'bg-green-600/20 text-green-300' 
                            : 'bg-yellow-600/20 text-yellow-300'
                        }`}>
                          {article.published ? 'Published' : 'Draft'}
                        </span>
                        {article.featured && (
                          <span className="px-2 py-1 text-xs rounded bg-purple-600/20 text-purple-300">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                    {article.excerpt && (
                      <p className="text-sm text-gray-300 mb-2">{article.excerpt}</p>
                    )}
                    
                    {/* Author and Date info */}
                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                      <div className="flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        {getAuthorName(article.authorName)}
                      </div>
                      {article.publishDate && (
                        <div className="flex items-center gap-1">
                          <CalendarDaysIcon className="w-3 h-3" />
                          Article Date: {formatDate(article.publishDate)}
                        </div>
                      )}
                    </div>

                    {article.categories && article.categories.length > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <TagIcon className="w-4 h-4 text-gray-500" />
                        <div className="flex gap-1">
                          {article.categories.map((category) => (
                            <span key={category.id} className="text-xs text-blue-300 bg-blue-600/20 px-2 py-1 rounded">
                              {category.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {article.events && article.events.length > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                        <div className="flex gap-1">
                          {article.events.map((event) => (
                            <span key={event.id} className="text-xs text-purple-300 bg-purple-600/20 px-2 py-1 rounded">
                              📅 {event.name}
                              {event.date && ` (${new Date(event.date).toLocaleDateString()})`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Created: {new Date(article.createdAt).toLocaleDateString()}
                      {article.updatedAt !== article.createdAt && (
                        <span className="ml-2">
                          • Updated: {new Date(article.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => togglePublished(article)}
                      className={`px-3 py-1 text-sm rounded ${
                        article.published
                          ? 'text-yellow-300 bg-yellow-600/20 hover:bg-yellow-600/30'
                          : 'text-green-300 bg-green-600/20 hover:bg-green-600/30'
                      }`}
                    >
                      {article.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleEdit(article)}
                      aria-label="Edit article"
                      className="px-3 py-1 text-sm text-blue-300 bg-blue-600/20 rounded hover:bg-blue-600/30"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(article)}
                      aria-label="Delete article"
                      className="px-3 py-1 text-sm text-red-300 bg-red-600/20 rounded hover:bg-red-600/30"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <div className="text-gray-400 text-lg mb-2">No articles yet</div>
            <p className="text-gray-500 mb-4">Start sharing your photography stories and experiences</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Write Your First Article
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 