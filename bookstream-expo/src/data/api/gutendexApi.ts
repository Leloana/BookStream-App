import axios from 'axios';
import { Book } from '../../domain/models/Book';
import { SearchFilters } from '../repositories/BookRepository';

const api = axios.create({
  baseURL: 'https://gutendex.com',
});

// Interface de resposta do Gutendex
interface GutendexBook {
  id: number;
  title: string;
  authors: { name: string; birth_year?: number; death_year?: number }[];
  languages: string[];
  // Formatos vêm como: { "image/jpeg": "url...", "text/html": "url..." }
  formats: Record<string, string>; 
  download_count: number;
  summaries?: string[];
}

export async function searchGutendex(query: string, filters?: SearchFilters): Promise<Book[]> {
  try {
    const params: any = {
      search: query.trim(), // Busca geral
    };

    // 1. Filtro de Idioma (Gutendex usa 2 letras: 'pt', 'en')
    if (filters?.language) {
      const langMap: Record<string, string> = { por: 'pt', eng: 'en', spa: 'es', fre: 'fr' };
      params.languages = langMap[filters.language] || filters.language;
    }

    // 2. Filtro de Assunto (Gutendex chama de 'topic')
    if (filters?.subject) {
      params.topic = filters.subject;
    }

    const response = await api.get('/books', { params });
    const results: GutendexBook[] = response.data.results || [];

    return results.map(item => {
      // Formata o nome do autor (Vem "Assis, Machado de" -> "Machado de Assis")
      let authorName = 'Desconhecido';
      if (item.authors.length > 0) {
        const parts = item.authors[0].name.split(',');
        authorName = parts.length > 1 ? `${parts[1].trim()} ${parts[0].trim()}` : parts[0];
      }

      // Mapeia os formatos disponíveis
      const formats = item.formats;
      
      // Tenta achar PDF (raro no Gutenberg)
      const pdfUrl = formats['application/pdf'];
      
      // Tenta achar link de leitura (HTML ou TXT)
      const readUrl = formats['text/html'] || formats['text/plain'] || formats['text/html; charset=utf-8'];
      
      // Capa
      const coverUrl = formats['image/jpeg'];

      return {
        id: `gutenberg_${item.id}`, // Prefixo para evitar conflito de IDs
        title: item.title,
        author: authorName,
        year: item.authors[0]?.birth_year, // Gutenberg não tem ano de publicação fácil, usamos ano do autor
        coverUrl: coverUrl,
        pdfUrl: pdfUrl,   // Geralmente undefined
        readUrl: readUrl, // Geralmente preenchido
        description: item.summaries ? item.summaries[0] : undefined,
        language: item.languages,
        pageCount: undefined, // Gutenberg não fornece contagem de páginas
        source: 'gutenberg',
      } as Book;
    });

  } catch (error) {
    console.error('Erro Gutendex:', error);
    return [];
  }
}