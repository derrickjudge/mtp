'use client';

import React, { useEffect, useState } from 'react';

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  socialMedia: {
    instagram: string;
    twitter: string;
    facebook: string;
  };
  metaTags: {
    title: string;
    description: string;
    keywords: string;
  };
}

export default function AdminSettings() {
  // Default settings with all required properties
  const defaultSettings: SiteSettings = {
    siteName: 'MTP Collective',
    siteDescription: 'Photography portfolio website',
    contactEmail: '',
    logoUrl: '',
    primaryColor: '#000000',
    secondaryColor: '#ffffff',
    socialMedia: {
      instagram: '',
      twitter: '',
      facebook: ''
    },
    metaTags: {
      title: 'MTP Collective',
      description: 'Photography portfolio website',
      keywords: 'photography, portfolio, art'
    }
  };
  
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/settings');
        
        // If successful, use the returned data
        if (response.ok) {
          const data = await response.json();
          
          // Ensure data has all required properties
          const safeData = {
            ...defaultSettings,
            ...data,
            // Ensure nested objects exist and are properly structured
            socialMedia: {
              ...defaultSettings.socialMedia,
              ...(data.socialMedia || {})
            },
            metaTags: {
              ...defaultSettings.metaTags,
              ...(data.metaTags || {})
            }
          };
          
          setSettings(safeData);
          console.log('Settings loaded successfully:', safeData);
        } else {
          // Handle gracefully for any error codes (404, 500, etc.)
          console.log(`Settings API returned status: ${response.status}. Using default settings.`);
          // We'll continue with the default values already in state
        }
      } catch (err: any) {
        // Handle network or other errors gracefully
        console.warn('Could not fetch settings, using defaults:', err.message);
        // No need to show this error to users as we're using defaults
        // setError('Failed to load settings. Using defaults.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save settings');
      }
      
      setSuccess('Settings saved successfully');
    } catch (err: any) {
      setError(err.message || 'Error saving settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setSettings(prev => {
        // Create a copy of the current settings
        const updatedSettings = { ...prev };
        
        // Ensure the section exists, if not, initialize it
        if (!updatedSettings[section as keyof SiteSettings]) {
          if (section === 'socialMedia') {
            updatedSettings.socialMedia = { instagram: '', twitter: '', facebook: '' };
          } else if (section === 'metaTags') {
            updatedSettings.metaTags = { title: '', description: '', keywords: '' };
          } else {
            // For other potential sections (though we don't expect any)
            // Use a safer type assertion that respects the original type
            const emptyValue = {} as any;
            (updatedSettings as any)[section] = emptyValue;
          }
        }
        
        const sectionData = updatedSettings[section as keyof SiteSettings];
        
        // Ensure we're working with an object type for spreading
        if (sectionData && typeof sectionData === 'object') {
          updatedSettings[section as keyof SiteSettings] = {
            ...sectionData,
            [field]: value
          };
        }
        
        return updatedSettings;
      });
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  if (loading) {
    return <p>Loading settings...</p>;
  }
  
  return (
    <div>
      <h1>Site Settings</h1>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="admin-card" style={{ marginBottom: '2rem' }}>
          <h2>General Settings</h2>
          
          <div className="form-group">
            <label htmlFor="siteName">Site Name</label>
            <input
              id="siteName"
              name="siteName"
              type="text"
              value={settings.siteName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="siteDescription">Site Description</label>
            <textarea
              id="siteDescription"
              name="siteDescription"
              value={settings.siteDescription}
              onChange={handleChange}
              rows={3}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="contactEmail">Contact Email</label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              value={settings.contactEmail}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="logoUrl">Logo URL</label>
            <input
              id="logoUrl"
              name="logoUrl"
              type="text"
              value={settings.logoUrl}
              onChange={handleChange}
              placeholder="https://example.com/logo.png"
            />
            {settings.logoUrl && (
              <div style={{ marginTop: '0.5rem' }}>
                <img 
                  src={settings.logoUrl} 
                  alt="Logo Preview" 
                  style={{ maxWidth: '200px', maxHeight: '100px' }} 
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="admin-card" style={{ marginBottom: '2rem' }}>
          <h2>Theme Settings</h2>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="primaryColor">Primary Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  id="primaryColor"
                  name="primaryColor"
                  type="color"
                  value={settings.primaryColor}
                  onChange={handleChange}
                  style={{ width: '50px', height: '30px' }}
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={handleChange}
                  name="primaryColor"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="secondaryColor">Secondary Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  id="secondaryColor"
                  name="secondaryColor"
                  type="color"
                  value={settings.secondaryColor}
                  onChange={handleChange}
                  style={{ width: '50px', height: '30px' }}
                />
                <input
                  type="text"
                  value={settings.secondaryColor}
                  onChange={handleChange}
                  name="secondaryColor"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="admin-card" style={{ marginBottom: '2rem' }}>
          <h2>Social Media</h2>
          
          <div className="form-group">
            <label htmlFor="instagram">Instagram</label>
            <input
              id="instagram"
              name="socialMedia.instagram"
              type="text"
              value={settings.socialMedia?.instagram || ''}
              onChange={handleChange}
              placeholder="@username or profile URL"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="twitter">Twitter</label>
            <input
              id="twitter"
              name="socialMedia.twitter"
              type="text"
              value={settings.socialMedia?.twitter || ''}
              onChange={handleChange}
              placeholder="@username or profile URL"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="facebook">Facebook</label>
            <input
              id="facebook"
              name="socialMedia.facebook"
              type="text"
              value={settings.socialMedia?.facebook || ''}
              onChange={handleChange}
              placeholder="Page URL"
            />
          </div>
        </div>
        
        <div className="admin-card" style={{ marginBottom: '2rem' }}>
          <h2>SEO Settings</h2>
          
          <div className="form-group">
            <label htmlFor="metaTitle">Meta Title</label>
            <input
              id="metaTitle"
              name="metaTags.title"
              type="text"
              value={settings.metaTags?.title || ''}
              onChange={handleChange}
            />
            <small>This will appear in search engine results and browser tabs.</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="metaDescription">Meta Description</label>
            <textarea
              id="metaDescription"
              name="metaTags.description"
              value={settings.metaTags?.description || ''}
              onChange={handleChange}
              rows={3}
            />
            <small>Brief description of your site for search engines (recommended: 150-160 characters).</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="metaKeywords">Meta Keywords</label>
            <input
              id="metaKeywords"
              name="metaTags.keywords"
              type="text"
              value={settings.metaTags?.keywords || ''}
              onChange={handleChange}
              placeholder="photography, portfolio, art (comma separated)"
            />
          </div>
        </div>
        
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
