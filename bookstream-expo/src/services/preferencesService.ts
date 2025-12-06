import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book } from '../domain/models/Book';

const PREFS_KEY = 'USER_INTERESTS_MAP_V2'; // Mudei a chave para não conflitar com a antiga

// Tipo para o mapa de frequencia: { "author:Machado": 5, "sci-fi": 2 }
type InterestMap = Record<string, number>;

export const preferencesService = {
  // Adiciona e incrementa contadores
  addInterestFromBook: async (book: Book) => {
    try {
      const currentMap = await preferencesService.getInterestMap();

      // Função auxiliar para incrementar
      const increment = (tag: string) => {
        currentMap[tag] = (currentMap[tag] || 0) + 1;
      };

      // 1. Autor (Peso alto)
      if (book.author) {
        increment(`author:${book.author}`);
      }

      // 2. Palavras-chave do título
      const stopWords = ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'da', 'do', 'em', 'para', 'com', 'vol', 'livro', 'the', 'of'];
      const keywords = book.title
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .split(' ')
        .filter(word => word.length > 3 && !stopWords.includes(word));

      keywords.forEach(word => increment(word));

      // Salva
      await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(currentMap));
    } catch (e) {
      console.error('Erro ao salvar preferências', e);
    }
  },

  getInterestMap: async (): Promise<InterestMap> => {
    try {
      const json = await AsyncStorage.getItem(PREFS_KEY);
      return json ? JSON.parse(json) : {};
    } catch {
      return {};
    }
  },

  // A LÓGICA DE OURO: Pega as Top N tags mais frequentes
  getTopInterests: async (limit: number = 3): Promise<string[]> => {
    const map = await preferencesService.getInterestMap();
    
    // Converte objeto em array [tag, count], ordena por count descrescente
    const sortedTags = Object.entries(map)
      .sort(([, countA], [, countB]) => countB - countA) // Maior para menor
      .map(([tag]) => tag); // Pega só o nome da tag

    return sortedTags.slice(0, limit);
  }
};