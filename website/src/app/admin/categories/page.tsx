'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Fetch categories from API
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Error loading categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Reset form
  const resetForm = () => {
    setNewCategory({ name: '', description: '' });
    setShowAddForm(false);
    setEditCategory(null);
    setFormError('');
    setFormSuccess('');
  };

  // Add new category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newCategory.name.trim()) {
      setFormError('Category name is required');
      return;
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCategory),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create category');
      }

      setFormSuccess('Category created successfully');
      resetForm();
      fetchCategories();
    } catch (err: any) {
      setFormError(err.message || 'Error creating category');
      console.error(err);
    }
  };

  // Update category
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!editCategory || !editCategory.name.trim()) {
      setFormError('Category name is required');
      return;
    }

    try {
      const response = await fetch(`/api/categories/${editCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editCategory.name,
          description: editCategory.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update category');
      }

      setFormSuccess('Category updated successfully');
      resetForm();
      fetchCategories();
    } catch (err: any) {
      setFormError(err.message || 'Error updating category');
      console.error(err);
    }
  };

  // Delete category
  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? This will affect all photos assigned to this category.')) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete category');
      }

      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Error deleting category');
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Categories</h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowAddForm(!showAddForm);
          }}
        >
          {showAddForm ? 'Cancel' : 'Add New Category'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {formError && (
        <div className="alert alert-error">
          {formError}
        </div>
      )}

      {formSuccess && (
        <div className="alert alert-success">
          {formSuccess}
        </div>
      )}

      {/* Add/Edit Category Form */}
      {(showAddForm || editCategory) && (
        <div className="admin-card" style={{ marginBottom: '2rem' }}>
          <h2>{editCategory ? 'Edit Category' : 'Add New Category'}</h2>
          <form className="admin-form" onSubmit={editCategory ? handleUpdateCategory : handleAddCategory}>
            <div className="form-group">
              <label htmlFor="name">Category Name</label>
              <input
                id="name"
                type="text"
                value={editCategory ? editCategory.name : newCategory.name}
                onChange={(e) => 
                  editCategory 
                    ? setEditCategory({ ...editCategory, name: e.target.value })
                    : setNewCategory({ ...newCategory, name: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={editCategory ? editCategory.description : newCategory.description}
                onChange={(e) => 
                  editCategory 
                    ? setEditCategory({ ...editCategory, description: e.target.value })
                    : setNewCategory({ ...newCategory, description: e.target.value })
                }
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">
                {editCategory ? 'Update Category' : 'Add Category'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      {loading ? (
        <p>Loading categories...</p>
      ) : categories.length === 0 ? (
        <div className="admin-card">
          <p>No categories found. Add a category to get started.</p>
        </div>
      ) : (
        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category.id}>
                  <td>{category.id}</td>
                  <td>{category.name}</td>
                  <td>{category.description || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setEditCategory(category)}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
