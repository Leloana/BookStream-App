import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book } from '../domain/models/Book';
import { generateFileName } from './utils';

const LIBRARY_KEY = 'MY_LIBRARY_BOOKS'; // Livros baixados (Físicos)
const FAVORITES_DATA_KEY = 'FAVORITE_BOOKS_DATA'; // Favoritos (Metadados)

// 1. ATUALIZAÇÃO DA INTERFACE
export interface LibraryBook extends Book {
  localUri?: string; 
  downloadedAt?: number; 
  isDownloaded?: boolean; 
  isFavorite?: boolean;  
}

export const libraryService = {
  
  addBook: async (book: Book, localUri: string) => {
    try {
      const storedBooks = await libraryService.getBooks();
      
      const newBook: LibraryBook = {
        ...book,
        localUri,
        downloadedAt: Date.now(),
      };

      const updatedBooks = [
        newBook,
        ...storedBooks.filter(b => b.id !== book.id)
      ];

      await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(updatedBooks));
    } catch (e) {
      console.error(e);
    }
  },

  getBooks: async (): Promise<LibraryBook[]> => {
    try {
      const json = await AsyncStorage.getItem(LIBRARY_KEY);
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  },

  removeBook: async (bookId: string) => {
    try {
      const storedBooks = await libraryService.getBooks();
      const filtered = storedBooks.filter(b => b.id !== bookId);
      await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error(e);
    }
  },

  updateBookStatus: async (updatedBook: LibraryBook) => {
     try {
       const books = await libraryService.getBooks();
       // Substitui o livro antigo pelo atualizado (sem localUri)
       const newBooksList = books.map(b => b.id === updatedBook.id ? updatedBook : b);
       
       await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(newBooksList));
     } catch (e) {
       console.error("Erro ao atualizar status do livro", e);
     }
  },

// Posso usar futuramente
  resetAllDownloads: async () => {
    try {
      const storedBooks = await libraryService.getBooks();
      

      const booksReset = storedBooks.map(book => ({
        ...book,
        localUri: null,
        isDownloaded: false, 
      }));


      await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(booksReset));
      
    } catch (e) {
      console.error("Erro ao resetar downloads:", e);
    }
  },

  // Posso usar futuramente
  syncBooksWithFolder: async (folderUri: string) => {
    try {
      const storedBooks = await libraryService.getBooks();

      const { StorageAccessFramework } = require('expo-file-system'); 
      const existingFiles = await StorageAccessFramework.readDirectoryAsync(folderUri);

      const syncedBooks = storedBooks.map(book => {        
        const expectedFileName = generateFileName(book.title);

        const foundFileUri = existingFiles.find((uri: string) => {
            const decodedUri = decodeURIComponent(uri);
            return decodedUri.endsWith(expectedFileName);
        });

        if (foundFileUri) {
          return {
            ...book,
            localUri: foundFileUri,
            isDownloaded: true
          };
        } else {
          return {
            ...book,
            localUri: null,
            isDownloaded: false
          };
        }
      });

      await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(syncedBooks));
      
      const recoveredCount = syncedBooks.filter(b => b.isDownloaded).length;
      return recoveredCount;

    } catch (e) {
      console.error("Erro ao sincronizar pasta:", e);
      throw new Error("Falha ao ler arquivos da pasta.");
    }
  },

  // === MÉTODOS DE FAVORITOS (REFATORADOS) ===

  // Recupera a lista completa de objetos favoritos
  _getFavoriteBooksData: async (): Promise<Book[]> => {
    try {
        const json = await AsyncStorage.getItem(FAVORITES_DATA_KEY);
        return json ? JSON.parse(json) : [];
    } catch { return []; }
  },

  // Agora derivamos os IDs diretamente dos dados, sem precisar de um storage separado
  getFavoritesIds: async (): Promise<string[]> => {
    try {
      const books = await libraryService._getFavoriteBooksData();
      return books.map(b => b.id);
    } catch { return []; }
  },

  isFavorite: async (bookId: string): Promise<boolean> => {
    const favoriteIds = await libraryService.getFavoritesIds();
    return favoriteIds.includes(bookId);
  },

  toggleFavorite: async (book: Book) => {
    try {
        const favoritesData = await libraryService._getFavoriteBooksData();
        const exists = favoritesData.some(b => b.id === book.id);
        
        let newFavoritesData;

        if (exists) {
            // Remove
            newFavoritesData = favoritesData.filter(b => b.id !== book.id);
        } else {
            // Adiciona
            newFavoritesData = [...favoritesData, book];
        }
        
        // Salvamos apenas em UM lugar agora
        await AsyncStorage.setItem(FAVORITES_DATA_KEY, JSON.stringify(newFavoritesData));
        
        return !exists;
    } catch (e) {
        console.error(e);
        return false;
    }
  },

  getAllBooks: async (): Promise<LibraryBook[]> => {
    try {
      const downloaded = await libraryService.getBooks(); 
      const favoritesData = await libraryService._getFavoriteBooksData(); 

      const mergedMap = new Map<string, LibraryBook>();

      downloaded.forEach(b => {
        mergedMap.set(b.id, { 
            ...b, 
            isDownloaded: true,
            isFavorite: favoritesData.some(fav => fav.id === b.id) 
        });
      });

      favoritesData.forEach(b => {
        if (mergedMap.has(b.id)) {
          const existing = mergedMap.get(b.id)!;
          mergedMap.set(b.id, { ...existing, isFavorite: true });
        } else {
          mergedMap.set(b.id, { 
              ...b, 
              isFavorite: true, 
              isDownloaded: false,
          });
        }
      });

      return Array.from(mergedMap.values());
    } catch (e) {
      console.error("Erro no getAllBooks", e);
      return [];
    }
  }
};