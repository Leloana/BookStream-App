// src/domain/models/Book.ts
export interface Book {
  id: string;
  title: string;
  author?: string;
  year?: number;
  coverUrl?: string;
  source: 'openlibrary' | 'google' | 'gutenberg'| 'standard' | 'local';
  iaId?: string; 
  readUrl?: string;         
  isPublicDomain?: boolean; 
  pdfUrl?: string;
  
  description?: string;
  subjects?: string[]; 
  pageCount?: number;
  language?: string[];
}
