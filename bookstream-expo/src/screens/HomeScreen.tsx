import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native'; // Importante
import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  LayoutAnimation,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView // Import ScrollView
} from 'react-native';
import { RootStackParamList } from '../AppNavigator';
import BookCard from '../components/BookCard';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import { BookRepository } from '../data/repositories/BookRepository';
import { Book } from '../domain/models/Book';

// Importe seu serviço de biblioteca
import { libraryService, LibraryBook } from '../services/libraryService';

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>;

// Filtros Simplificados
const LANGUAGES = [
  { label: 'Todos', value: null },
  { label: 'PT', value: 'pt' }, // Backend usa 'pt'
  { label: 'EN', value: 'en' },
  { label: 'ES', value: 'es' },
  { label: 'FR', value: 'fr' },
];

const SOURCES = [
  { label: 'Todas', value: null },
  { label: 'Local', value: 'local' },
  { label: 'OpenLib', value: 'openlibrary' },
  { label: 'Google', value: 'google' },
];

const THEME = {
  background: '#FAF9F6',
  textDark: '#2C2C2C',
  textLight: '#666666',
  accent: '#C77D63',
  border: '#E0D6CC',
};

// Componente de Filtro Compacto (Bolinha)
const FilterBadge = ({ label, selected, onPress }: { label: string, selected: boolean, onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.filterBadge, selected && styles.filterBadgeSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function HomeScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados dos Filtros
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Estado Local da Biblioteca (Para saber se baixou ou favoritou)
  // Usamos um Map para busca rápida O(1) pelo ID
  const [libraryStatus, setLibraryStatus] = useState<Record<string, LibraryBook>>({});

  // 1. CARREGA STATUS DA BIBLIOTECA AO ENTRAR NA TELA
  useFocusEffect(
    useCallback(() => {
      loadLibraryStatus();
    }, [])
  );

  async function loadLibraryStatus() {
    // Pega todos os livros (baixados + favoritos)
    const allBooks = await libraryService.getAllBooks();
    
    // Transforma num Dicionário: { "id_do_livro": ObjetoLivro }
    const statusMap: Record<string, LibraryBook> = {};
    allBooks.forEach(b => {
        statusMap[b.id] = b;
    });
    
    setLibraryStatus(statusMap);
  }

  async function handleSearch() {
    Keyboard.dismiss();
    if (!query.trim() && !selectedLang && !selectedSource) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await BookRepository.searchAll(query, {
        language: selectedLang || undefined,
        source: selectedSource || undefined,
      });
      
      setBooks(result);
    } catch (e) {
      console.error(e);
      setError('Não foi possível realizar a busca.');
    } finally {
      setLoading(false);
    }
  }

  // 2. FUNÇÃO DE FAVORITAR DIRETO DA LISTA
  async function handleToggleFavorite(book: Book) {
    // Chama o serviço
    const newStatus = await libraryService.toggleFavorite(book);
    
    // Atualiza o estado local IMEDIATAMENTE para o usuário ver a cor mudar
    setLibraryStatus(prev => {
        const current = prev[book.id] || { ...book, isDownloaded: false, isFavorite: false };
        return {
            ...prev,
            [book.id]: { ...current, isFavorite: newStatus }
        };
    });
  }

  const toggleFiltersVisibility = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters(!showFilters);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />

      <PageHeader 
        title="Explorar" 
        subtitle="O mundo inteiro em páginas." 
      />

      {/* BARRA DE BUSCA */}
      <SearchBar
        value={query}
        onChangeText={setQuery}
        onSubmit={handleSearch}
        onToggleFilters={toggleFiltersVisibility}
        filtersActive={!!selectedLang || !!selectedSource}
      />

      {/* FILTROS COMPACTOS (Expandível) */}
      {showFilters && (
        <View style={styles.filtersWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
                <Text style={styles.filterTitle}>Fonte:</Text>
                {SOURCES.map(source => (
                    <FilterBadge 
                        key={source.label} 
                        label={source.label} 
                        selected={selectedSource === source.value}
                        onPress={() => setSelectedSource(source.value)}
                    />
                ))}
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
                <Text style={styles.filterTitle}>Idioma:</Text>
                {LANGUAGES.map(lang => (
                    <FilterBadge 
                        key={lang.label} 
                        label={lang.label} 
                        selected={selectedLang === lang.value}
                        onPress={() => setSelectedLang(lang.value)}
                    />
                ))}
            </ScrollView>
        </View>
      )}

      {loading && <ActivityIndicator size="large" color={THEME.accent} style={{ marginTop: 20 }} />}

      {error && (
        <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={24} color="#E57373" />
            <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
            // Checa no mapa se esse livro já existe na biblioteca
            const savedState = libraryStatus[item.id];
            const isFav = savedState?.isFavorite || false;
            const isDown = savedState?.isDownloaded || false;

            return (
                <BookCard
                    book={item}
                    isFavorite={isFav}
                    isDownloaded={isDown}
                    onToggleFavorite={() => handleToggleFavorite(item)}
                    onPress={() => navigation.navigate('BookDetails', { book: item })}
                />
            );
        }}
        initialNumToRender={8}
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 5 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading ? (
            <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#D1C4E9" />
                <Text style={styles.emptyText}>Busque por título, autor ou assunto.</Text>
            </View>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  
  filtersWrapper: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  filtersRow: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    marginRight: 8,
  },
  filterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  filterBadgeSelected: {
    backgroundColor: THEME.accent,
    borderColor: THEME.accent,
  },
  filterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },

  errorContainer: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 8,
  },
  errorText: { color: '#E57373', fontSize: 14 },
  
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', color: THEME.textLight, marginTop: 10 },
});