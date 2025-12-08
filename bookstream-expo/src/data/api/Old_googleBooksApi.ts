import axios from 'axios';
import { Book } from '../../domain/models/Book';
// Importamos a interface de filtros
import { SearchFilters } from '../repositories/BookRepository';

const api = axios.create({
  baseURL: 'https://www.googleapis.com/books/v1',
});

const GOOGLE_LANG_MAP: Record<string, string> = {
  'por': 'pt',
  'eng': 'en',
  'spa': 'es',
  'fre': 'fr',
};

interface GoogleBookVolume {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publishedDate?: string;
    description?: string;
    imageLinks?: {
      thumbnail: string;
    };
    pageCount?: number;
    language?: string;
    categories?: string[];
  };
  accessInfo: {
    pdf?: {
      isAvailable: boolean;
      downloadLink?: string;
    };
    webReaderLink?: string;
    publicDomain: boolean;
  };
}

export async function searchGoogleBooks(query: string, filters?: SearchFilters): Promise<Book[]> {
  try {
    let qParam = query.trim();

    if (filters?.subject) {
      const subjectTerm = `subject:${filters.subject}`;
      qParam = qParam ? `${qParam}+${subjectTerm}` : subjectTerm;
    }

    if (!qParam) {
        qParam = '*'; 
    }

    const params: any = {
      q: qParam, 
      filter: 'free-ebooks',
      maxResults: 15,
      printType: 'books',
    };

    if (filters?.language) {
      const googleCode = GOOGLE_LANG_MAP[filters.language] || filters.language;
      params.langRestrict = googleCode;
    }

    const response = await api.get('/volumes', { params });
    const items: GoogleBookVolume[] = response.data.items || [];

    return items.map(item => {
      const info = item.volumeInfo;
      const access = item.accessInfo;

      let pdfUrl = undefined;
      if (access.pdf?.isAvailable && access.pdf.downloadLink) {
          pdfUrl = access.pdf.downloadLink;
      }

      let cover = info.imageLinks?.thumbnail;
      if (cover && cover.startsWith('http://')) {
          cover = cover.replace('http://', 'https://');
      }

      return {
        id: item.id,
        title: info.title,
        author: info.authors?.[0] || 'Autor Desconhecido',
        year: info.publishedDate ? parseInt(info.publishedDate.substring(0, 4)) : undefined,
        pageCount: info.pageCount,
        coverUrl: cover,
        pdfUrl: pdfUrl, 
        readUrl: access.webReaderLink,
        description: info.description,
        language: info.language ? [info.language] : [],
        subjects: info.categories,
        source: 'google', // Importante para o badge funcionar
      } as Book;
    });

  } catch (error) {
    console.error('Erro na busca do Google Books:', error);
    return [];
  }
}