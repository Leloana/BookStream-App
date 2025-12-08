import axios from 'axios';
import { Book } from '../../domain/models/Book';
import { SearchFilters } from '../repositories/BookRepository';

const api = axios.create({
  baseURL: 'https://openlibrary.org',
  headers: {
    'User-Agent': 'BookStreamExpo/1.0 (seu-email@exemplo.com)',
  },
});

const SEARCH_FIELDS = 'key,title,author_name,first_publish_year,cover_i,ia,ebook_access,public_scan_b,number_of_pages_median,language';

interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  ia?: string[];
  public_scan_b?: boolean;
  ebook_access?: string;
  number_of_pages_median?: number;
  language?: string[];
}


// === 1. BUSCA PRINCIPAL ===
export async function searchBooks(query: string, filters?: SearchFilters): Promise<Book[]> {
  if (!query.trim() && !filters?.language && !filters?.subject) return [];
  
  // CORREÇÃO: Adicionamos 'ebook_access:public' na query para a API trazer só o que podemos baixar
  let finalQuery = `${query.trim()} ebook_access:public`;

  if (filters?.language) {
    finalQuery += ` language:${filters.language}`;
  }
  if (filters?.subject) {
    finalQuery += ` subject:${filters.subject}`;
  }

  const response = await api.get('/search.json', {
    params: {
      q: finalQuery.trim(),
      has_fulltext: true,
      limit: 30,
      fields: SEARCH_FIELDS,
    },
  });

  const docs: OpenLibraryDoc[] = response.data.docs || [];
  return mapDocsToBooks(docs);
}

// === FUNÇÃO AUXILIAR DE MAPEAMENTO ===
function mapDocsToBooks(docs: OpenLibraryDoc[]): Book[] {
    // Removemos o filtro rigoroso de JS porque já pedimos filtrado na API.
    // Mantemos apenas verificação básica de integridade (tem ID e tem Título)
    const validDocs = docs.filter(doc => doc.key && doc.title && doc.ia && doc.ia[0]);

    return validDocs.map((doc) => {
        const iaId = doc.ia![0];
        const pdfUrl = `https://archive.org/download/${iaId}/${iaId}.pdf`;

        return {
            id: doc.key,
            title: doc.title,
            author: doc.author_name?.[0],
            pageCount: doc.number_of_pages_median,
            year: doc.first_publish_year,
            coverUrl: doc.cover_i
                ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
                : undefined,
            pdfUrl: pdfUrl, 
            language: doc.language,
            source: 'openlibrary',
        } as Book;
    });
}

// === 4. DETALHES EXTRAS ===
export async function getBookDetails(workId: string): Promise<Partial<Book>> {
  try {
    const response = await api.get(`${workId}.json`);
    const data = response.data;

    let description = 'Sem descrição disponível.';
    
    if (typeof data.description === 'string') {
      description = data.description;
    } else if (data.description && data.description.value) {
      description = data.description.value;
    }

    const subjects = data.subjects ? data.subjects.slice(0, 5) : [];

    return {
      description,
      subjects
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes:', error);
    return {};
  }
}

function shuffleArray<T>(array: T[]): T[] {
  return array.sort(() => Math.random() - 0.5);
}