import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book } from '../domain/models/Book';

const LIBRARY_KEY = 'MY_LIBRARY_BOOKS'; // Livros baixados
const FAVORITES_KEY = 'MY_FAVORITES_IDS'; // IDs dos favoritos
const FAVORITES_DATA_KEY = 'FAVORITE_BOOKS_DATA'; // Dados completos dos favoritos

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

  // === MÉTODOS DE FAVORITOS ===

  _getFavoriteBooksData: async (): Promise<Book[]> => {
    try {
        const json = await AsyncStorage.getItem(FAVORITES_DATA_KEY);
        return json ? JSON.parse(json) : [];
    } catch { return []; }
  },

  getFavorites: async (): Promise<string[]> => {
    try {
      const json = await AsyncStorage.getItem(FAVORITES_KEY);
      return json ? JSON.parse(json) : [];
    } catch { return []; }
  },

  isFavorite: async (bookId: string): Promise<boolean> => {
    const favorites = await libraryService.getFavorites();
    return favorites.includes(bookId);
  },

  toggleFavorite: async (book: Book) => {
    try {
        const favoritesData = await libraryService._getFavoriteBooksData();
        const exists = favoritesData.some(b => b.id === book.id);
        
        let newFavoritesData;
        let newIds;

        if (exists) {
            // Remove
            newFavoritesData = favoritesData.filter(b => b.id !== book.id);
        } else {
            // Adiciona
            newFavoritesData = [...favoritesData, book];
        }
        
        newIds = newFavoritesData.map(b => b.id);

        await AsyncStorage.setItem(FAVORITES_DATA_KEY, JSON.stringify(newFavoritesData));
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newIds));
        
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