import axios from 'axios';
import { Book } from '../../domain/models/Book';
import { SearchFilters } from '../repositories/BookRepository';
import { LOCAL_SERVER_URL } from '../../config/apiConfig';
// DICA: No Expo, use o IP da sua máquina (ex: 192.168.x.x) ou configure variáveis de ambiente.
// O localhost (127.0.0.1) não funciona dentro do emulador/dispositivo físico.

const api = axios.create({
  baseURL: LOCAL_SERVER_URL,
  timeout: 10000, // Timeout de 10s para evitar travamentos
});

// Interface que espelha o 'BookResponseDto' do seu C# (Json serializado vira camelCase)
interface BookResponseDto {
  id: string; // O backend manda string ou guid serializado
  title: string;
  author: string;
  year: number;
  pageCount: number;
  description?: string;
  source: 'local' | 'openlibrary';
  pdfUrl?: string;
  coverUrl?: string;
  language?: string[];
}

interface BookDetailsDto {
  description: string;
  subjects: string[];
}


// === 2. BUSCA REMOTA (Open Library via Backend) ===
export async function searchOpenLibrary(query: string, filters?: SearchFilters): Promise<Book[]> {
  // Evita chamada desnecessária se não tiver query nem filtros
  if (!query.trim() && !filters?.language && !filters?.subject) return [];

  try {
    const response = await api.get<BookResponseDto[]>('/books/open-library', {
      params: {
        q: query,
        lang: filters?.language,
        subject: filters?.subject
      }
    });
    return response.data.map(mapDtoToBook);
  } catch (error) {
    console.error('Erro ao buscar na OpenLibrary via Backend:', error);
    return [];
  }
}


// === 4. DETALHES EXTRAS ===
export async function getBookDetails(workId: string): Promise<Partial<Book>> {
  try {
    // O ID deve ser passado via query param: ?id=/works/OL...
    const response = await api.get<BookDetailsDto>('/books/open-library/details', {
      params: { id: workId }
    });

    return {
      description: response.data.description,
      subjects: response.data.subjects
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes no backend:', error);
    return { description: 'Detalhes indisponíveis no momento.' };
  }
}

// === HELPER: Mapeamento DTO -> Model ===
// Transforma o JSON do C# no objeto Book que seu App usa
function mapDtoToBook(dto: BookResponseDto): Book {
  return {
    id: dto.id,
    title: dto.title,
    author: dto.author,
    pageCount: dto.pageCount,
    year: dto.year,
    coverUrl: dto.coverUrl || undefined, // Garante undefined se vir null
    pdfUrl: dto.pdfUrl || '',            // O backend já manda a URL pronta para download
    language: dto.language,
    source: dto.source,
    description: dto.description
  } as Book;
}