import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book } from '../domain/models/Book';
import { generateFileName } from './utils';
import { storageService } from './storageService';

const LIBRARY_KEY = 'MY_LIBRARY_BOOKS'; // Livros baixados (Físicos)
const FAVORITES_DATA_KEY = 'FAVORITE_BOOKS_DATA'; // Favoritos (Metadados)

// 1. ATUALIZAÇÃO DA INTERFACE
export interface LibraryBook extends Book {
  localUri?: string; 
  downloadedAt?: number; 
  isDownloaded?: boolean; 
  isFavorite?: boolean;  
  isLocalOnly?: boolean;
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
  },
  updateBookMetadata: async (bookId: string, newMetadata: Partial<Book>) => {
      try {
          const books = await libraryService.getBooks();
          const updatedList = books.map(b => {
              if (b.id === bookId) {
                  return { ...b, ...newMetadata };
              }
              return b;
          });
          await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(updatedList));
      } catch (e) {
          console.error("Erro ao editar livro", e);
      }
  },

  // === A GRANDE FUNÇÃO DE SINCRONIZAÇÃO ===
// No arquivo libraryService.ts

  syncFileSystemWithStore: async (): Promise<LibraryBook[]> => {
    try {
      // 1. Carrega as listas separadas
      const storedDownloads = await libraryService.getBooks(); // Livros que o app ACHA que estão baixados
      const favoritesList = await libraryService._getFavoriteBooksData(); // Lista de desejos
      
      // 2. Mapeia a realidade da pasta
      const fileMap = await storageService.getFolderFileMap();
      const usedFileNames = new Set<string>();

      // === ETAPA A: Limpeza dos Downloads (LIBRARY_KEY) ===
      // Vamos criar uma nova lista apenas com o que realmente existe na pasta
      const validDownloads: LibraryBook[] = [];

      for (const book of storedDownloads) {
        if (book.localUri) {
             const currentFileName = storageService.getFileNameFromUri(book.localUri);
             
             if (fileMap[currentFileName]) {
                 // ARQUIVO EXISTE: Mantém na lista de downloads
                 validDownloads.push({
                     ...book,
                     localUri: fileMap[currentFileName], // Atualiza URI
                     isDownloaded: true
                 });
                 usedFileNames.add(currentFileName);
             } else {
                 // ARQUIVO NÃO EXISTE:
                 // Simplesmente ignoramos. Ele não entra no validDownloads.
                 // Se ele for favorito, será re-adicionado na Etapa C vindo da lista de favoritos.
                 console.log(`Arquivo sumiu: ${book.title} - Removendo dos downloads.`);
             }
        }
      }

      // === ETAPA B: Descobrir Novos Arquivos Locais ===
      const fileNamesInFolder = Object.keys(fileMap);
      for (const fileName of fileNamesInFolder) {
          if (!usedFileNames.has(fileName)) {
              // Arquivo novo (colocado manualmente na pasta)
              const newLocalBook: LibraryBook = {
                  id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                  title: fileName.replace('.pdf', '').replace(/_/g, ' '),
                  author: 'Arquivo Local',
                  coverUrl: undefined,
                  source: 'local',
                  localUri: fileMap[fileName],
                  isDownloaded: true,
                  downloadedAt: Date.now(),
                  isLocalOnly: true,
                  description: 'Arquivo detectado na pasta sincronizada.'
              };
              validDownloads.push(newLocalBook);
          }
      }

      // SALVA O ESTADO LIMPO DOS DOWNLOADS
      // Aqui garantimos que o storage LIBRARY_KEY só tem o que existe fisicamente
      await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(validDownloads));


      // === ETAPA C: Mesclagem para Exibição (O "Pulo do Gato") ===
      // Agora montamos a lista visual juntando Favoritos + Downloads Válidos
      
      const displayMap = new Map<string, LibraryBook>();

      // 1. Adiciona TODOS os favoritos primeiro (Assumindo não baixado)
      favoritesList.forEach(fav => {
          displayMap.set(fav.id, { 
              ...fav, 
              isDownloaded: false, 
              localUri: undefined,
              isFavorite: true 
          });
      });

      // 2. Sobrepõe com os Downloads Válidos
      // Se o livro já estava no mapa (era favorito), ele é atualizado para isDownloaded = true
      // Se não estava (era só um download ou arquivo local), ele é criado
      validDownloads.forEach(downloadedBook => {
          const isFav = displayMap.has(downloadedBook.id); // Checa se já estava na lista de favoritos
          
          displayMap.set(downloadedBook.id, {
              ...downloadedBook,
              isFavorite: isFav, // Mantém o status de favorito se já existia
              isDownloaded: true
          });
      });

      // 3. Converte o Mapa para Array e Ordena
      const finalDisplayList = Array.from(displayMap.values());

      finalDisplayList.sort((a, b) => {
        // Prioridade 1: Baixados aparecem antes
        if (a.isDownloaded && !b.isDownloaded) return -1;
        if (!a.isDownloaded && b.isDownloaded) return 1;
        
        // Prioridade 2: Mais recentes primeiro
        return (b.downloadedAt || 0) - (a.downloadedAt || 0);
      });

      return finalDisplayList;

    } catch (e) {
      console.error("Erro no sync:", e);
      return [];
    }
  },
  emergencyReset: async () => {
    try {
      console.log("Iniciando limpeza de emergência...");
      await AsyncStorage.removeItem(LIBRARY_KEY);       // Remove livros salvos
      await AsyncStorage.removeItem(FAVORITES_DATA_KEY); // Remove favoritos
      // Se quiser resetar a pasta escolhida também, descomente a linha abaixo:
      // await AsyncStorage.removeItem('USER_BOOKS_FOLDER_URI'); 
      
      console.log("Storage limpo com sucesso!");
    } catch (e) {
      console.error("Erro ao limpar storage:", e);
    }
  },
};