import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the interface for User document
export interface IUser extends Document {
  username: string;
  password: string;
  role: string;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

// Create the User schema
const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' }
});

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  const user = this as IUser;
  
  // Only hash the password if it's modified or new
  if (!user.isModified('password')) return next();
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Create and export the User model
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
