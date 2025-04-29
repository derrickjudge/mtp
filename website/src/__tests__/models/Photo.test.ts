import mongoose from 'mongoose';
import Photo, { IPhoto } from '../../models/Photo';
import Category from '../../models/Category';

describe('Photo Model Test', () => {
  let categoryId: mongoose.Types.ObjectId;

  // Create a test category before testing photos
  beforeAll(async () => {
    const category = new Category({
      name: 'Test Category',
      description: 'A test category'
    });
    const savedCategory = await category.save();
    categoryId = savedCategory._id;
  });

  // Test creating a photo
  it('should create & save a photo successfully', async () => {
    const photoData = {
      title: 'Test Photo',
      description: 'A test photo description',
      category: categoryId,
      tags: ['test', 'photo'],
      fileUrl: 'https://example.com/photo.jpg',
      thumbnailUrl: 'https://example.com/thumbnail.jpg'
    };
    
    const validPhoto = new Photo(photoData);
    const savedPhoto = await validPhoto.save();
    
    // Object Id should be defined when successfully saved to MongoDB
    expect(savedPhoto._id).toBeDefined();
    expect(savedPhoto.title).toBe(photoData.title);
    expect(savedPhoto.description).toBe(photoData.description);
    expect(savedPhoto.category).toEqual(photoData.category);
    expect(savedPhoto.tags).toEqual(expect.arrayContaining(photoData.tags));
    expect(savedPhoto.fileUrl).toBe(photoData.fileUrl);
    expect(savedPhoto.thumbnailUrl).toBe(photoData.thumbnailUrl);
    expect(savedPhoto.uploadDate).toBeDefined();
  });

  // Test validation is working
  it('should fail to save a photo with missing required fields', async () => {
    const invalidPhoto = new Photo({
      title: 'Invalid Photo' // Missing other required fields
    });
    
    let error: any;
    try {
      await invalidPhoto.save();
    } catch (err) {
      error = err;
    }
    
    expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(error.errors.description).toBeDefined();
    expect(error.errors.category).toBeDefined();
    expect(error.errors.fileUrl).toBeDefined();
    expect(error.errors.thumbnailUrl).toBeDefined();
  });

  // Test retrieving photos
  it('should retrieve photos with specified category', async () => {
    // Create two photos with same category specifically for this test
    const photoData1 = {
      title: 'First Test Photo',
      description: 'First test photo in this test',
      category: categoryId,
      tags: ['test', 'first'],
      fileUrl: 'https://example.com/photo1.jpg',
      thumbnailUrl: 'https://example.com/thumbnail1.jpg'
    };
    
    const photoData2 = {
      title: 'Second Test Photo',
      description: 'Second test photo in this test',
      category: categoryId,
      tags: ['test', 'second'],
      fileUrl: 'https://example.com/photo2.jpg',
      thumbnailUrl: 'https://example.com/thumbnail2.jpg'
    };
    
    // Create both photos at once
    await Promise.all([
      new Photo(photoData1).save(),
      new Photo(photoData2).save()
    ]);
    
    // Find photos by category
    const photos = await Photo.find({ category: categoryId });
    
    expect(photos.length).toBe(2);
    expect(photos[0].category.toString()).toBe(categoryId.toString());
    expect(photos[1].category.toString()).toBe(categoryId.toString());
  });

  // Test updating a photo
  it('should update a photo successfully', async () => {
    // Create a photo to update
    const photoData = {
      title: 'Photo to Update',
      description: 'Will be updated',
      category: categoryId,
      tags: ['update', 'test'],
      fileUrl: 'https://example.com/update.jpg',
      thumbnailUrl: 'https://example.com/update-thumb.jpg'
    };
    
    const photo = new Photo(photoData);
    const savedPhoto = await photo.save();
    
    // Update the photo
    const updatedData = {
      title: 'Updated Photo',
      description: 'Has been updated',
      tags: ['updated', 'test']
    };
    
    await Photo.updateOne({ _id: savedPhoto._id }, updatedData);
    
    // Retrieve the updated photo
    const updatedPhoto = await Photo.findById(savedPhoto._id);
    
    expect(updatedPhoto).toBeDefined();
    expect(updatedPhoto?.title).toBe(updatedData.title);
    expect(updatedPhoto?.description).toBe(updatedData.description);
    expect(updatedPhoto?.tags).toEqual(expect.arrayContaining(updatedData.tags));
    // Make sure other fields remain unchanged
    expect(updatedPhoto?.category.toString()).toBe(categoryId.toString());
    expect(updatedPhoto?.fileUrl).toBe(photoData.fileUrl);
  });

  // Test deleting a photo
  it('should delete a photo successfully', async () => {
    // Create a photo to delete
    const photoData = {
      title: 'Photo to Delete',
      description: 'Will be deleted',
      category: categoryId,
      tags: ['delete', 'test'],
      fileUrl: 'https://example.com/delete.jpg',
      thumbnailUrl: 'https://example.com/delete-thumb.jpg'
    };
    
    const photo = new Photo(photoData);
    const savedPhoto = await photo.save();
    
    // Delete the photo
    await Photo.deleteOne({ _id: savedPhoto._id });
    
    // Try to retrieve the deleted photo
    const deletedPhoto = await Photo.findById(savedPhoto._id);
    
    expect(deletedPhoto).toBeNull();
  });
});
