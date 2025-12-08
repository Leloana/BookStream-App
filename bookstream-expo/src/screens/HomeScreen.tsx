import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  LayoutAnimation,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import { RootStackParamList } from '../AppNavigator';
import BookCard from '../components/BookCard';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import { BookRepository } from '../data/repositories/BookRepository';
import { Book } from '../domain/models/Book';

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>; 

const LANGUAGES = [
  { label: 'Português', value: 'por' },
  { label: 'Inglês', value: 'eng' },
  { label: 'Espanhol', value: 'spa' },
  { label: 'Francês', value: 'fre' },
];

const GENRES = [
  { label: 'Ficção', value: 'fiction' },
  { label: 'Romance', value: 'romance' },
  { label: 'Fantasia', value: 'fantasy' },
  { label: 'Terror', value: 'horror' },
  { label: 'Ciência', value: 'science' },
  { label: 'História', value: 'history' },
];

const SOURCES = [
  { label: 'Todas', value: null },
  { label: 'Open Library', value: 'openlibrary' },
  { label: 'Google Books', value: 'google' },
  { label: 'Servidor Local', value: 'local' },
  
  // { label: 'Gutenberg', value: 'gutenberg' }, // Se ainda estiver usando
  // { label: 'Standard Ebooks', value: 'standard' },
];

const THEME = {
  background: '#FAF9F6',
  textDark: '#2C2C2C',
  textLight: '#666666',
  accent: '#C77D63',
  border: '#E0D6CC',
};

const FilterChip = ({ label, selected, onPress }: { label: string, selected: boolean, onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.chip, selected && styles.chipSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function HomeScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(false);

  async function handleSearch() {
    Keyboard.dismiss();
    if (showFilters) toggleFiltersVisibility(); 

    if (!query.trim() && !selectedLang && !selectedGenre && !selectedSource) return;

    try {
      setLoading(true);
      setError(null);
      const result = await BookRepository.searchAll(query, {
        language: selectedLang,
        subject: selectedGenre,
        source: selectedSource,
      });
      setBooks(result);
    } catch (e) {
      console.error(e);
      setError('Não foi possível realizar a busca.');
    } finally {
      setLoading(false);
    }
  }

  const toggleFiltersVisibility = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters(!showFilters);
  };

  const toggleLang = (value: string) => setSelectedLang(prev => prev === value ? null : value);
  const toggleGenre = (value: string) => setSelectedGenre(prev => prev === value ? null : value);
  const toggleSource = (value: string | null) => setSelectedSource(value);


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />

      <PageHeader 
        title="Buscar" 
        subtitle="Encontre sua próxima história favorita." 
      />

      {/* BARRA DE BUSCA UNIFICADA */}
      <SearchBar
        value={query}
        onChangeText={setQuery}
        onSubmit={handleSearch}
        onToggleFilters={toggleFiltersVisibility}
        filtersActive={!!selectedLang || !!selectedGenre || !!selectedSource}
      />

      {/* ÁREA DE FILTROS */}
      {showFilters && (
        <View style={styles.filtersContainer}>
            <Text style={styles.filterLabel}>Filtrar por Fonte</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollFilters}>
                {SOURCES.map((source) => (
                    <FilterChip 
                    key={source.label} 
                    label={source.label} 
                    selected={selectedSource === source.value} 
                    onPress={() => toggleSource(source.value)} 
                    />
                ))}
            </ScrollView>
            <Text style={styles.filterLabel}>Filtrar Idioma</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollFilters}>
                {LANGUAGES.map((lang) => (
                    <FilterChip 
                    key={lang.value} 
                    label={lang.label} 
                    selected={selectedLang === lang.value} 
                    onPress={() => toggleLang(lang.value)} 
                    />
                ))}
            </ScrollView>

            <Text style={styles.filterLabel}>Filtrar Gênero</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollFilters}>
                {GENRES.map((genre) => (
                    <FilterChip 
                    key={genre.value} 
                    label={genre.label} 
                    selected={selectedGenre === genre.value} 
                    onPress={() => toggleGenre(genre.value)} 
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
        renderItem={({ item }) => (
          <BookCard
            book={item}
            onPress={() => navigation.navigate('BookDetails', { book: item })}
          />
        )}
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews={true}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color="#D1C4E9" />
                <Text style={styles.emptyTitle}>Encontre sua leitura</Text>
                <Text style={styles.emptyText}>
                  Digite o nome do livro ou use o ícone de opções para filtrar.
                </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: THEME.textDark,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  filtersContainer: {
    paddingVertical: 10,
    backgroundColor: '#FAF9F6', 
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  filterLabel: {
      marginLeft: 20,
      marginBottom: 8,
      fontSize: 12,
      fontWeight: 'bold',
      color: THEME.textLight,
      textTransform: 'uppercase',
      letterSpacing: 1,
  },
  scrollFilters: {
    paddingHorizontal: 16,
    marginBottom: 16,
    flexGrow: 0,
  },
  
  // Chips
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  chipSelected: {
    backgroundColor: THEME.accent,
    borderColor: THEME.accent,
  },
  chipText: {
    color: THEME.textLight,
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },

  errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      gap: 8,
  },
  errorText: { color: '#E57373', fontSize: 14 },
  
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: THEME.textDark,
      marginTop: 16,
      marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: THEME.textLight,
    lineHeight: 22,
  },
});