import axios from 'axios';
import { Book } from '../../domain/models/Book';
import { SearchFilters } from '../repositories/BookRepository';
import { LOCAL_SERVER_URL } from '../../config/apiConfig';

const api = axios.create({
  baseURL: LOCAL_SERVER_URL,
  timeout: 10000,
});

// Interface de resposta do Backend (igual para todos)
interface BookResponseDto {
  id: string;
  title: string;
  author: string;
  year: number;
  pageCount: number;
  description?: string;
  source: 'local' | 'openlibrary' | 'google'; // Adicionado 'google'
  pdfUrl?: string;
  readUrl?: string;
  coverUrl?: string;
  language?: string[];
}

// === BUSCA GOOGLE BOOKS VIA BACKEND ===
export async function searchGoogleBooks(query: string, filters?: SearchFilters): Promise<Book[]> {
  try {
    const response = await api.get<BookResponseDto[]>('/books/google', {
      params: {
        q: query,
        lang: filters?.language,
        subject: filters?.subject
      }
    });

    return response.data.map(dto => ({
      id: dto.id,
      title: dto.title,
      author: dto.author,
      pageCount: dto.pageCount,
      year: dto.year,
      coverUrl: dto.coverUrl || undefined,
      pdfUrl: dto.pdfUrl || '',
      language: dto.language,
      source: 'google',
      description: dto.description,
      readUrl: dto.readUrl || '',
    } as Book));
  } catch (error) {
    console.error('Erro ao buscar Google Books via Backend:', error);
    return [];
  }
}