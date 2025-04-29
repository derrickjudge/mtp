import mongoose from 'mongoose';
import Category, { ICategory } from '../../models/Category';

describe('Category Model Test', () => {
  // Test creating a category
  it('should create & save a category successfully', async () => {
    const categoryData = {
      name: 'Concerts',
      description: 'Live music and concert photography'
    };
    
    const validCategory = new Category(categoryData);
    const savedCategory = await validCategory.save();
    
    // Object Id should be defined when successfully saved to MongoDB
    expect(savedCategory._id).toBeDefined();
    expect(savedCategory.name).toBe(categoryData.name);
    expect(savedCategory.description).toBe(categoryData.description);
  });

  // Test validation is working
  it('should fail to save a category with missing required fields', async () => {
    const invalidCategory = new Category({
      name: 'Invalid Category' // Missing description
    });
    
    let error: any;
    try {
      await invalidCategory.save();
    } catch (err) {
      error = err;
    }
    
    expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(error.errors.description).toBeDefined();
  });

  // Test uniqueness constraint of category name
  it('should fail to save a category with duplicate name', async () => {
    // Create first category
    const firstCategory = new Category({
      name: 'Nature',
      description: 'Nature and landscape photography'
    });
    await firstCategory.save();
    
    // Try to create another category with the same name
    const duplicateCategory = new Category({
      name: 'Nature', // Same name as the first category
      description: 'Different description'
    });
    
    let error;
    try {
      await duplicateCategory.save();
    } catch (err) {
      error = err;
    }
    
    expect(error).toBeDefined();
    // The error should be a duplicate key error
    expect(error.code).toBe(11000); // MongoDB duplicate key error code
  });

  // Test retrieving categories
  it('should retrieve all categories', async () => {
    // Create multiple categories for this test
    await Promise.all([
      new Category({
        name: 'Cars',
        description: 'Automotive photography'
      }).save(),
      new Category({
        name: 'Concerts',
        description: 'Live music photography'
      }).save()
    ]);
    
    // Find all categories
    const categories = await Category.find({});
    
    // We should have at least 2 categories created in this test
    expect(categories.length).toBeGreaterThanOrEqual(2);
  });

  // Test updating a category
  it('should update a category successfully', async () => {
    // Create a category to update
    const categoryData = {
      name: 'Category to Update',
      description: 'Will be updated'
    };
    
    const category = new Category(categoryData);
    const savedCategory = await category.save();
    
    // Update the category
    const updatedData = {
      name: 'Updated Category',
      description: 'Has been updated'
    };
    
    await Category.updateOne({ _id: savedCategory._id }, updatedData);
    
    // Retrieve the updated category
    const updatedCategory = await Category.findById(savedCategory._id);
    
    expect(updatedCategory).toBeDefined();
    expect(updatedCategory?.name).toBe(updatedData.name);
    expect(updatedCategory?.description).toBe(updatedData.description);
  });

  // Test deleting a category
  it('should delete a category successfully', async () => {
    // Create a category to delete
    const categoryData = {
      name: 'Category to Delete',
      description: 'Will be deleted'
    };
    
    const category = new Category(categoryData);
    const savedCategory = await category.save();
    
    // Delete the category
    await Category.deleteOne({ _id: savedCategory._id });
    
    // Try to retrieve the deleted category
    const deletedCategory = await Category.findById(savedCategory._id);
    
    expect(deletedCategory).toBeNull();
  });
});
