import { Book } from '../../domain/models/Book';
import { searchGoogleBooks } from '../api/googleBooksApi';
import { searchLocalBooks } from '../api/localApi';
import { SearchFilters, searchBooks as searchOpenLib } from '../api/openLibraryApi';
import { getStandardEbooks } from '../api/standardEbooksApi';

function deduplicateBooks(books: Book[]): Book[] {
  const seen = new Set();
  return books.filter(book => {
    // Cria uma chave única: "titulo_autor" (tudo minúsculo e sem espaços)
    const safeTitle = book.title ? book.title.toLowerCase().replace(/\s/g, '').substring(0, 15) : 'sem_titulo';
    const safeAuthor = book.author ? book.author.toLowerCase().replace(/\s/g, '').substring(0, 5) : 'desc';
    
    const key = `${safeTitle}_${safeAuthor}`;
    
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Função para embaralhar (Shuffle)
function shuffleArray<T>(array: T[]): T[] {
  return array.sort(() => Math.random() - 0.5);
}

export const BookRepository = {
  
  // === 1. BUSCA GERAL (Já existente) ===
  searchAll: async (query: string, filters?: SearchFilters): Promise<Book[]> => {
    try {
      const [localResults,openLibResults, googleResults] = await Promise.all([
        searchLocalBooks(query),
        searchOpenLib(query, filters),
        searchGoogleBooks(query, filters) 
      ]);
      const allBooks = [...localResults,...googleResults, ...openLibResults];
      return shuffleArray(allBooks);
    } catch (e) {
      console.error("Erro no repositório (searchAll):", e);
      return [];
    }
  },

  // === 2. BUSCA POR CATEGORIA (Múltiplas APIs) ===
  getBooksBySubject: async (subject: string): Promise<Book[]> => {
    try {
      // Chamamos as duas APIs passando o filtro de assunto
      // O Google aceita subject via filtro também (adaptamos isso no googleBooksApi)
      const [openLibResults, googleResults] = await Promise.all([
        searchOpenLib('', { subject: subject }), 
        searchGoogleBooks('', { subject: subject })
      ]);

      // Juntamos tudo
      const allBooks = [...googleResults, ...openLibResults];
      
      // Removemos duplicatas e embaralhamos para não ficar sempre na mesma ordem
      const unique = deduplicateBooks(allBooks);
      return shuffleArray(unique).slice(0, 15); // Retorna até 15 livros

    } catch (e) {
      console.error(`Erro no repositório (subject: ${subject}):`, e);
      return [];
    }
  },

  // === 3. RECOMENDAÇÕES MISTURADAS (Múltiplas APIs) ===
  getMixedRecommendations: async (tags: string[]): Promise<Book[]> => {
    if (tags.length === 0) return [];

    try {
      const promises = tags.map(async (tag) => {
        const isAuthor = tag.startsWith('author:');
        const cleanTag = isAuthor ? tag.replace('author:', '') : tag;

        // PREPARA AS QUERIES ESPECÍFICAS PARA CADA API
        
        // Google usa "inauthor:" para autores
        const googleQuery = isAuthor ? `inauthor:${cleanTag}` : cleanTag;
        
        // OpenLib usa "author:" para autores (a função searchOpenLib já lida com query string)
        const openLibQuery = isAuthor ? `author:${cleanTag}` : cleanTag;

        // Sorteio simples de página (para o Google usamos startIndex logicamente, 
        // mas aqui vamos confiar no shuffle das APIs com termos genéricos)
        
        // Dispara busca nas duas fontes para essa tag específica
        const [ol, gb] = await Promise.all([
             searchOpenLib(openLibQuery),
             searchGoogleBooks(googleQuery)
        ]);

        return [...gb, ...ol];
      });

      // Aguarda todas as tags serem processadas
      const resultsMatrix = await Promise.all(promises);
      
      // "Achata" o array de arrays em um só
      const allBooks = resultsMatrix.flat();

      // Limpeza final
      const uniqueBooks = deduplicateBooks(allBooks);
      
      // Embaralha tudo para parecer uma curadoria "Netflix"
      return shuffleArray(uniqueBooks).slice(0, 20);

    } catch (e) {
      console.error("Erro no repositório (recommendations):", e);
      return [];
    }
  },

  getRestoredClassics: async (): Promise<Book[]> => {
    try {
      // Chama a API direta
      const books = await getStandardEbooks();
      // Não precisa filtrar muito pois a curadoria deles já é perfeita
      return books;
    } catch (e) {
      console.error("Erro ao buscar clássicos:", e);
      return [];
    }
  },
};