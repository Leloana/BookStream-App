import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { RootStackParamList } from '../AppNavigator';
import BookSection from '../components/BookSection';
import PageHeader from '../components/PageHeader';
import { BookRepository } from '../data/repositories/BookRepository';
import { Book } from '../domain/models/Book';
import { preferencesService } from '../services/preferencesService';

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>;

const THEME = {
  background: '#FAF9F6', 
  highlightBg: '#F2E8D9', 
  textDark: '#2C2C2C',    
  textLight: '#666666',
  accent: '#C77D63',      
};

export default function DiscoverScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [forYouBooks, setForYouBooks] = useState<Book[]>([]);
  
  const [sciFiBooks, setSciFiBooks] = useState<Book[]>([]);
  const [romanceBooks, setRomanceBooks] = useState<Book[]>([]);
  const [thrillerBooks, setThrillerBooks] = useState<Book[]>([]);
  
  const [fantasyBooks, setFantasyBooks] = useState<Book[]>([]);
  const [horrorBooks, setHorrorBooks] = useState<Book[]>([]);
  const [historyBooks, setHistoryBooks] = useState<Book[]>([]);
  const [bioBooks, setBioBooks] = useState<Book[]>([]);

  useEffect(() => {
    loadAllContent();
  }, []);

  async function loadAllContent() {
    await Promise.all([
        loadRecommendations(),
        loadStaticCategories()
    ]);
    setLoading(false);
  }

  async function loadStaticCategories() {
    const [scifi, romance, thriller, fantasy, horror, history, bio] = await Promise.all([
      BookRepository.getBooksBySubject('science_fiction'),
      BookRepository.getBooksBySubject('romance'),
      BookRepository.getBooksBySubject('thriller'),
      BookRepository.getBooksBySubject('fantasy'),
      BookRepository.getBooksBySubject('horror'),
      BookRepository.getBooksBySubject('history'),
      BookRepository.getBooksBySubject('biography'),
    ]);

    setSciFiBooks(scifi);
    setRomanceBooks(romance);
    setThrillerBooks(thriller);
    setFantasyBooks(fantasy);
    setHorrorBooks(horror);
    setHistoryBooks(history);
    setBioBooks(bio);
  }

  async function loadRecommendations() {
    const topTags = await preferencesService.getTopInterests(3);
    if (topTags.length > 0) {
      const mixedBooks = await BookRepository.getMixedRecommendations(topTags);
      setForYouBooks(mixedBooks);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecommendations();
    setRefreshing(false);
  };

  const handlePress = (book: Book) => {
    navigation.navigate('BookDetails', { book });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: THEME.background }}>
      
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
      
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[THEME.accent]}
              tintColor={THEME.accent}
          />
        }
      >
        {/* CABEÇALHO */}
        <PageHeader 
          title="Descobrir" 
          subtitle="Encontre sua próxima história favorita." 
        />
        
        {/* SEÇÃO "PRA VOCÊ" */}
        {forYouBooks.length > 0 && (
          <View style={styles.highlightWrapper}>
             <View style={styles.highlightCard}>
                <BookSection 
                    title="Para Você (Mix)" 
                    books={forYouBooks} 
                    onBookPress={handlePress} 
                />
             </View>
          </View>
        )}

        {/* LISTAS DE CATEGORIAS */}
        <View style={styles.sectionsContainer}>
          
          <BookSection title="Fantasia & Magia" books={fantasyBooks} onBookPress={handlePress} />
          <BookSection title="Ficção Científica" books={sciFiBooks} onBookPress={handlePress} />
          
          <BookSection title="Terror & Suspense" books={horrorBooks} onBookPress={handlePress} />
          <BookSection title="Romance" books={romanceBooks} onBookPress={handlePress} />
          <BookSection title="Suspense & Thriller" books={thrillerBooks} onBookPress={handlePress} />
          
          {/* Categorias de Não-Ficção no final */}
          <BookSection title="História" books={historyBooks} onBookPress={handlePress} />
          <BookSection title="Biografias" books={bioBooks} onBookPress={handlePress} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: THEME.background 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: THEME.background 
  },
  
  // Cabeçalho
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20, 
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: THEME.textDark,
  },
  headerSubtitle: {
    fontSize: 14,
    color: THEME.textLight,
    fontStyle: 'italic',
    marginTop: 4,
  },

  highlightWrapper: {
    paddingVertical: 10,
    paddingHorizontal: 10,
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

  sectionsContainer: {
    marginTop: 10,
  }
});