import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for Category document
export interface ICategory extends Document {
  name: string;
  description: string;
}

// Create the Category schema
const CategorySchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true }
});

// Create and export the Category model
export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
