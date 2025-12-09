import { Book } from '../../domain/models/Book';

import { searchGoogleBooks } from '../api/googleBooksApi';

import { searchLocalBooks } from '../api/localApi';

import { searchOpenLibrary } from '../api/openLibraryApi';

import { getStandardEbooks } from '../api/standardEbooksApi';

export interface SearchFilters {
  language?: string | null;
  subject?: string | null;
  source?: string | null;
}

const API_TIMEOUT = 5000;

// === FUNÇÕES AUXILIARES ===

// 1. Proteção contra demora (CORRIGIDO: Limpa o timer se der sucesso)
async function withTimeout<T>(promise: Promise<T[]>, ms: number, apiName: string): Promise<T[]> {
    let timeoutId: any;

    const timeoutPromise = new Promise<T[]>((resolve) => {
        timeoutId = setTimeout(() => {
            console.warn(`⚠️ Timeout: ${apiName} demorou mais que ${ms}ms e foi ignorado.`);
            resolve([]); 
        }, ms);
    });

    const apiPromise = promise
        .then((result) => {
            clearTimeout(timeoutId);
            return result;
        })
        .catch((error) => {
            clearTimeout(timeoutId); 
            throw error; 
        });

    return Promise.race([apiPromise, timeoutPromise]);
}

function deduplicateBooks(books: Book[]): Book[] {
  const seen = new Set();
  return books.filter(book => {
    const safeTitle = book.title ? book.title.toLowerCase().replace(/\s/g, '').substring(0, 15) : 'sem_titulo';
    const safeAuthor = book.author ? book.author.toLowerCase().replace(/\s/g, '').substring(0, 5) : 'desc';
    
    const key = `${safeTitle}_${safeAuthor}`;
    
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function shuffleArray<T>(array: T[]): T[] {
  return array.sort(() => Math.random() - 0.5);
}

export const BookRepository = {

  searchAll: async (query: string, filters?: SearchFilters): Promise<Book[]> => {
    console.log(`[Repo] Buscando: "${query}" | Fonte: ${filters?.source} | Idioma: ${filters?.language}`);
    try {
      const promises: Promise<Book[]>[] = [];
      const src = filters?.source;

      if (!src || src === 'local') {
        promises.push(searchLocalBooks(query));
      }

      if (!src || src === 'openlibrary') {
        promises.push(
            withTimeout(searchOpenLibrary(query, filters), API_TIMEOUT, 'OpenLibrary')
        );
      }

      if (!src || src === 'google') {
        promises.push(
            withTimeout(searchGoogleBooks(query, filters), API_TIMEOUT, 'GoogleBooks')
        );
      }
      if (promises.length === 0) return [];
      const resultsMatrix = await Promise.all(promises);

      const allBooks = resultsMatrix.flat();
      
      return allBooks;

    } catch (e) {
      console.error("Erro no repositório (searchAll):", e);
      return [];
    }
  },

  getBooksBySubject: async (subject: string, limit: number = 10): Promise<Book[]> => {
    try {
      const [openLibResults, googleResults] = await Promise.all([
        searchOpenLibrary('', { subject: subject }), 
        searchGoogleBooks('', { subject: subject })
      ]);


      const allBooks = [...googleResults, ...openLibResults];
      
 
      return allBooks.slice(0, limit);

    } catch (e) {
      console.error(`Erro no repositório (subject: ${subject}):`, e);
      return [];
    }
  },
  


  getMixedRecommendations: async (tags: string[], limit: number = 10): Promise<Book[]> => {
    if (tags.length === 0) return [];

    try {
      const promises = tags.map(async (tag) => {
        const isAuthor = tag.startsWith('author:');
        const cleanTag = isAuthor ? tag.replace('author:', '') : tag;

        const googleQuery = isAuthor ? `inauthor:${cleanTag}` : cleanTag;

        const openLibQuery = isAuthor ? `author:${cleanTag}` : cleanTag;

        const [ol, gb] = await Promise.all([
             searchOpenLibrary(openLibQuery),
             searchGoogleBooks(googleQuery)
        ]);
        const allBooks = [...gb, ...ol];
        
        return allBooks.slice(0, limit);
      });

      const resultsMatrix = await Promise.all(promises);
      
      const allBooks = resultsMatrix.flat();

      return allBooks.slice(0, limit);

    } catch (e) {
      console.error("Erro no repositório (recommendations):", e);
      return [];
    }
  },

  getRestoredClassics: async (): Promise<Book[]> => {
    try {
      return await withTimeout(getStandardEbooks(), API_TIMEOUT, 'Standard Classics');
    } catch (e) {
      console.error("Erro ao buscar clássicos:", e);
      return [];
    }
  },
};