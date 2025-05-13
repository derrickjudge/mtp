'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type Photo = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail: string | null;
  featured: boolean;
  author: {
    id: string;
    name: string;
  };
};

type PhotoModalProps = {
  photo: Photo;
  onClose: () => void;
};

export function PhotoModal({ photo, onClose }: PhotoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    // Prevent scrolling while modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div
        ref={modalRef}
        className="relative max-w-6xl w-full bg-white rounded-lg shadow-2xl overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75 transition-opacity"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="grid md:grid-cols-2">
          <div className="relative aspect-square md:aspect-auto">
            <Image
              src={photo.url}
              alt={photo.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>

          <div className="p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-2">{photo.title}</h2>
            <p className="text-gray-600 mb-4">by {photo.author.name}</p>
            
            {photo.description && (
              <div className="prose max-w-none">
                <p className="text-gray-700">{photo.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
