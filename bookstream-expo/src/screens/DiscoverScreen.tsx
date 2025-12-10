import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  StatusBar, 
  StyleSheet, 
  View,
  RefreshControl 
} from 'react-native';
import { RootStackParamList } from '../AppNavigator';
import BookSection from '../components/BookSection';
import PageHeader from '../components/PageHeader';
import { BookRepository } from '../data/repositories/BookRepository';
import { Book } from '../domain/models/Book';
import { preferencesService } from '../services/preferencesService';
import { libraryService } from '../services/libraryService';

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>;

const THEME = {
  background: '#FAF9F6', 
  highlightBg: '#F2E8D9', 
  textDark: '#2C2C2C',    
  textLight: '#666666',
  accent: '#C77D63',      
};

interface SectionData {
  id: string;
  title: string;
  data: Book[];
  isHighlight?: boolean;
}

const BOOKS_PER_CATEGORY = 8;

// === 1. CATEGORIAS COM SUB-GÊNEROS PARA VARIAR O CONTEÚDO ===
const CATEGORIES_TO_LOAD = [
  { id: 'science_fiction', title: 'Ficção Científica' },
  { id: 'romance', title: 'Romance' },
  { id: 'horror', title: 'Terror & Suspense' },
  { id: 'fantasy', title: 'Fantasia' },
  { id: 'history', title: 'História' },
  { id: 'biography', title: 'Biografias' },
];

const SUB_CATEGORIES: Record<string, string[]> = {
  'science_fiction': ['science_fiction', 'cyberpunk', 'time_travel', 'dystopia', 'space_opera', 'robots'],
  'romance': ['romance', 'love_stories', 'historical_romance', 'romantic_comedy', 'drama'],
  'horror': ['horror', 'ghosts', 'vampires', 'zombies', 'thriller', 'mystery'],
  'fantasy': ['fantasy', 'magic', 'mythology', 'dragons', 'wizards'],
  'history': ['history', 'ancient_civilization', 'world_war', 'brazil_history', 'biography'],
  'biography': ['biography', 'autobiography', 'memoir', 'leaders'],
};

// Função auxiliar para pegar um termo aleatório
const getRandomSubject = (categoryId: string) => {
  const variants = SUB_CATEGORIES[categoryId];
  if (!variants) return categoryId;
  return variants[Math.floor(Math.random() * variants.length)];
};

// Função auxiliar para embaralhar array (Fisher-Yates)
// Isso ajuda a não mostrar sempre os mesmos 8 primeiros livros se a API retornar os mesmos
const shuffleArray = (array: Book[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export default function DiscoverScreen({ navigation }: any) {
  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>({});
  const [sections, setSections] = useState<SectionData[]>([]);
  
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCategoryIndex, setNextCategoryIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  useEffect(() => {
    loadInitialContent();
  }, []);

  async function loadFavorites() {
    const favs = await libraryService.getFavoritesIds();
    const map: Record<string, boolean> = {};
    favs.forEach(id => map[id] = true);
    setFavoritesMap(map);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    // Ao atualizar, zeramos tudo e recarregamos, o que vai disparar novos sorteios de sub-gêneros
    await loadInitialContent();
    setRefreshing(false);
  };

  async function loadInitialContent() {
    if (!refreshing) setLoadingInitial(true);
    
    try {
      const topTags = await preferencesService.getTopInterests(3);
      let initialSections: SectionData[] = [];

      // Carrega "Para Você"
      if (topTags.length > 0) {
        // Pedimos um pouco mais (15) para poder embaralhar e mostrar 8 diferentes
        const mixedBooks = await BookRepository.getMixedRecommendations(topTags, 15);
        if (mixedBooks.length > 0) {
            initialSections.push({ 
                id: 'for_you', 
                title: 'Para Você (Mix)', 
                data: shuffleArray(mixedBooks).slice(0, BOOKS_PER_CATEGORY), // Embaralha e corta
                isHighlight: true 
            });
        }
      }

      // Carrega a primeira categoria (com sub-gênero aleatório)
      const firstCat = CATEGORIES_TO_LOAD[0];
      const randomSubject = getRandomSubject(firstCat.id);
      
      // Pedimos mais livros (20) para embaralhar e garantir variedade
      const firstBooksRaw = await BookRepository.getBooksBySubject(randomSubject, 20);
      const firstBooks = shuffleArray(firstBooksRaw).slice(0, BOOKS_PER_CATEGORY);
      
      initialSections.push({
          id: firstCat.id,
          title: firstCat.title, // Mantém o título "pai" (ex: Ficção Científica)
          data: firstBooks
      });

      setSections(initialSections);
      setNextCategoryIndex(1);

    } catch (e) {
      console.error("Erro inicial", e);
    } finally {
      setLoadingInitial(false);
    }
  }

  async function loadNextCategory() {
    if (loadingMore || nextCategoryIndex >= CATEGORIES_TO_LOAD.length) return;

    setLoadingMore(true);
    try {
      const category = CATEGORIES_TO_LOAD[nextCategoryIndex];
      
      // === ALEATORIEDADE AQUI ===
      const randomSubject = getRandomSubject(category.id);
      console.log(`Carregando ${category.title} usando termo: ${randomSubject}`);

      const booksRaw = await BookRepository.getBooksBySubject(randomSubject, 20);
      const books = shuffleArray(booksRaw).slice(0, BOOKS_PER_CATEGORY);
      
      if (books.length > 0) {
          setSections(prev => [...prev, {
              id: category.id,
              title: category.title,
              data: books
          }]);
      }
      
      setNextCategoryIndex(prev => prev + 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleToggleFavorite(book: Book) {
    const newStatus = await libraryService.toggleFavorite(book);
    setFavoritesMap(prev => ({
        ...prev,
        [book.id]: newStatus
    }));
  }

  const handlePress = (book: Book) => {
    navigation.navigate('BookDetails', { book });
  };

  const renderSection = ({ item }: { item: SectionData }) => {
    if (item.isHighlight) {
        return (
            <View style={styles.highlightWrapper}>
                 <View style={styles.highlightCard}>
                    <BookSection 
                        title={item.title} 
                        books={item.data} 
                        onBookPress={handlePress}
                        favoritesMap={favoritesMap}
                        onToggleFavorite={handleToggleFavorite}
                    />
                 </View>
            </View>
        );
    }

    return (
        <BookSection 
            title={item.title} 
            books={item.data} 
            onBookPress={handlePress}
            favoritesMap={favoritesMap}
            onToggleFavorite={handleToggleFavorite}
        />
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 40 }} />;
    return (
        <View style={{ paddingVertical: 20 }}>
            <ActivityIndicator size="small" color={THEME.accent} />
        </View>
    );
  };

  if (loadingInitial && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: THEME.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
      
      <FlatList
        data={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderSection}
        
        refreshControl={
            <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[THEME.accent]}
                tintColor={THEME.accent}
            />
        }

        ListHeaderComponent={
            <PageHeader 
                title="Descobrir" 
                subtitle="Encontre sua próxima história." 
            />
        }
        
        onEndReached={loadNextCategory}
        onEndReachedThreshold={0.5} 
        ListFooterComponent={renderFooter}
        
        removeClippedSubviews={true} 
        initialNumToRender={2}
        windowSize={3}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: THEME.background 
  },
  highlightWrapper: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  highlightCard: {
    backgroundColor: THEME.highlightBg,
    borderRadius: 16,
    paddingTop: 16,
    paddingBottom: 4,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
});