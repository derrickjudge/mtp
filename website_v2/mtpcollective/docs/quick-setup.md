# Quick Setup Guide

## 🚀 **Immediate Next Steps**

Now that authentication is working, here's how to get the admin panel fully functional:

### **1. Create Categories (Required for Photo Upload)**

Since the database needs categories, you can create them using the browser console:

1. **Go to the admin panel**: https://mtp-delta.vercel.app/admin/photos
2. **Open browser console** (F12 → Console tab)
3. **Run this script** to create default categories:

```javascript
// Create categories via API
async function createCategories() {
  const categories = [
    { name: 'Concerts', description: 'Live music and performance photography' },
    { name: 'Automotive', description: 'Car and motorsport photography' },
    { name: 'Nature', description: 'Landscape and wildlife photography' }
  ];

  for (const category of categories) {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Created: ${result.name}`);
      } else {
        const error = await response.json();
        console.log(`❌ Error: ${error.message}`);
      }
    } catch (err) {
      console.log(`❌ Failed to create ${category.name}:`, err);
    }
  }
  
  console.log('🎉 Done! Refresh the page to see categories.');
}

// Run the function
createCategories();
```

4. **Refresh the page** - you should now see categories in the dropdown!

### **2. Set Up Photo Storage (For Upload Functionality)**

Photo uploads require Cloudflare R2 configuration. See the [R2 Setup Guide](./setup-r2.md) for detailed instructions.

**Quick summary:**
1. Create a Cloudflare R2 bucket
2. Generate API tokens
3. Add environment variables to Vercel:
   - `R2_BUCKET_NAME`
   - `R2_PUBLIC_URL`
   - `R2_ENDPOINT`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`

### **3. Current Status**

✅ **Working:**
- Authentication (login/logout)
- Admin panel access
- Dark theme UI
- Category management API

⚠️ **Needs Setup:**
- Photo upload (requires R2 configuration)
- Categories (can be created via console script above)

### **4. Testing the Admin Panel**

1. **Login**: https://mtp-delta.vercel.app/admin/login
   - Email: `admin@mtpcollective.com`
   - Password: `admin123`

2. **Create categories** using the console script above

3. **Try photo upload** (will show helpful error message about R2 setup)

### **5. UI Improvements Made**

✅ **Fixed Issues:**
- Grey text is now more readable (gray-200, gray-300)
- Tags input now has proper dark theme styling
- Category dropdown has better contrast
- Upload area has improved dark theme
- Better error messages and feedback

The admin panel is now much more usable with proper dark theme styling! 