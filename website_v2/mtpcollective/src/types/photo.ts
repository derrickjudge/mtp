export interface Photo {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnail: string;
  width?: number;
  height?: number;
  category_id?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  published?: boolean;
  featured?: boolean;
  metadata?: Record<string, any>;
  author_id?: string;
} 