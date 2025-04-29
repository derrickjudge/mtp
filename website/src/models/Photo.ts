import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for Photo document
export interface IPhoto extends Document {
  title: string;
  description: string;
  category: mongoose.Types.ObjectId;
  tags: string[];
  uploadDate: Date;
  fileUrl: string;
  thumbnailUrl: string;
}

// Create the Photo schema
const PhotoSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  tags: [{ type: String }],
  uploadDate: { type: Date, default: Date.now },
  fileUrl: { type: String, required: true },
  thumbnailUrl: { type: String, required: true }
});

// Create and export the Photo model
export default mongoose.models.Photo || mongoose.model<IPhoto>('Photo', PhotoSchema);
