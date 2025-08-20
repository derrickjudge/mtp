'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { DocumentTextIcon, PlusIcon, PencilIcon, TrashIcon, PhotoIcon, TagIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

// ... existing code ...

            {/* Rich Text Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Content *
              </label>
              <textarea
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

// ... existing code ... 