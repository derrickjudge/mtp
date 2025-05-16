export interface Photo {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  thumbnail_url: string;
  width?: number;
  height?: number;
  category_id?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
} 