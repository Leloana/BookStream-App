import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  BackHandler,
  RefreshControl
} from 'react-native';

// Imports do Projeto
import { RootStackParamList } from '../AppNavigator';
import SearchBar from '../components/SearchBar';
import GridBookItem from '../components/GridBookItem'; // <--- IMPORTADO
import { BookRepository } from '../data/repositories/BookRepository';
import { Book } from '../domain/models/Book';
import { LibraryBook, libraryService } from '../services/libraryService';

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>;

// Mantemos as constantes aqui também para configurar o espaçamento da FlatList
const ITEM_SPACING = 8; 
const SCREEN_PADDING = 16;

const THEME = {
  background: '#FFFFFF',
  textDark: '#262626',
  accent: '#C77D63',
  placeholder: '#DBDBDB',
};

export default function HomeScreen({ navigation }: any) {
  // ESTADOS PRINCIPAIS
  const [viewMode, setViewMode] = useState<'feed' | 'searching' | 'results'>('feed');
  const [query, setQuery] = useState('');
  
  const [refreshing, setRefreshing] = useState(false);
  // DADOS
  const [feedBooks, setFeedBooks] = useState<Book[]>([]); 
  const [resultBooks, setResultBooks] = useState<Book[]>([]); 
  const [recentSearches, setRecentSearches] = useState<string[]>([]); 
  
  // CONTROLE
  const [loading, setLoading] = useState(false);
  const [feedPage, setFeedPage] = useState(0); 
  const [libraryStatus, setLibraryStatus] = useState<Record<string, LibraryBook>>({});

  // 1. CARREGA STATUS E BACK HANDLER
  useFocusEffect(
    useCallback(() => {
      loadLibraryStatus();
      
      const onBackPress = () => {
          if (viewMode !== 'feed') {
              handleCancelSearch();
              return true;
          }
          return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();

    }, [viewMode])
  );

  // 2. CARREGA O FEED INICIAL
  useEffect(() => {
      loadMoreFeed();
  }, []);

  async function loadLibraryStatus() {
    const allBooks = await libraryService.getAllBooks();
    const statusMap: Record<string, LibraryBook> = {};
    allBooks.forEach(b => statusMap[b.id] = b);
    setLibraryStatus(statusMap);
  }

  const handleRefresh = async () => {
      // Só faz sentido atualizar se estiver no modo Feed
      if (viewMode !== 'feed') return;

      setRefreshing(true);

      try {
          // Lógica similar ao loadMoreFeed, mas para SUBSTITUIR os dados
          const topics = ['ficção', 'tecnologia', 'história', 'arte', 'ciência', 'brasil', 'biografia', 'negócios'];
          const randomTopic = topics[Math.floor(Math.random() * topics.length)];
          
          const newBooks = await BookRepository.searchAll(randomTopic);
          
          // Embaralha
          const shuffled = newBooks.sort(() => 0.5 - Math.random());
          
          // AQUI É A DIFERENÇA: Substituímos o estado em vez de adicionar
          setFeedBooks(shuffled);
          setFeedPage(1); // Reseta a paginação
          
      } catch (error) {
          console.log("Erro ao atualizar feed", error);
      } finally {
          setRefreshing(false);
      }
  };

  // --- LÓGICA DO FEED INFINITO ---
  async function loadMoreFeed() {
      if (loading && viewMode === 'feed') return;
      
      try {
          if(feedBooks.length === 0) setLoading(true); 
          
          const topics = ['ficção', 'tecnologia', 'história', 'arte', 'ciência', 'brasil'];
          const randomTopic = topics[Math.floor(Math.random() * topics.length)];
          
          const newBooks = await BookRepository.searchAll(randomTopic);
          
          const shuffled = newBooks.sort(() => 0.5 - Math.random());
          
          setFeedBooks(prev => {
              const existingIds = new Set(prev.map(b => b.id));
              const uniqueNew = shuffled.filter(b => !existingIds.has(b.id));
              return [...prev, ...uniqueNew];
          });
          
          setFeedPage(p => p + 1);
      } catch (error) {
          console.log("Erro ao carregar feed", error);
      } finally {
          setLoading(false);
      }
  }

  // --- LÓGICA DE BUSCA ---
  const handleFocus = () => {
      setViewMode('searching');
  };

  const handleCancelSearch = () => {
      Keyboard.dismiss();
      setQuery('');
      setViewMode('feed');
      setResultBooks([]);
  };

  const handleSearchSubmit = async (textToSearch = query) => {
      if (!textToSearch.trim()) return;
      
      Keyboard.dismiss();
      setQuery(textToSearch);
      setLoading(true);
      setViewMode('results');

      if (!recentSearches.includes(textToSearch)) {
          setRecentSearches(prev => [textToSearch, ...prev].slice(0, 5));
      }

      try {
          const results = await BookRepository.searchAll(textToSearch);
          setResultBooks(results);
      } catch (error) {
          console.error(error);
      } finally {
          setLoading(false);
      }
  };

  const handleRemoveRecent = (term: string) => {
      setRecentSearches(prev => prev.filter(t => t !== term));
  };

  // --- RENDERIZADORES ---
  const renderGridItem = ({ item }: { item: Book }) => {
      const isFavorite = libraryStatus[item.id]?.isFavorite || false;
      return (
          <GridBookItem 
              book={item} 
              isFavorite={isFavorite}
              onPress={() => navigation.navigate('BookDetails', { book: item })}
          />
      );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />

      {/* HEADER: BARRA DE BUSCA FIXA */}
      <View style={styles.headerContainer}>
          <View style={{flex: 1}}>
            <SearchBar
                value={query}
                onChangeText={setQuery}
                onSubmit={() => handleSearchSubmit()}
                onToggleFilters={() => {}}
                filtersActive={false}
                onFocus={handleFocus}
            />
          </View>
          
          {viewMode !== 'feed' && (
              <TouchableOpacity onPress={handleCancelSearch} style={styles.cancelButton}>
                  <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
          )}
      </View>

      {/* CONTEÚDO PRINCIPAL */}
      {viewMode === 'searching' && query.length === 0 ? (
          // --- MODO: HISTÓRICO RECENTE ---
          <View style={styles.historyContainer}>
              <View style={styles.historyHeader}>
                  <Text style={styles.historyTitle}>Recentes</Text>
                  {recentSearches.length > 0 && (
                       <TouchableOpacity onPress={() => setRecentSearches([])}>
                           <Text style={styles.clearHistory}>Limpar tudo</Text>
                       </TouchableOpacity>
                  )}
              </View>
              
              {recentSearches.map((term, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.historyItem}
                    onPress={() => handleSearchSubmit(term)}
                  >
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                          <Ionicons name="time-outline" size={20} color="#999" style={{marginRight: 10}} />
                          <Text style={styles.historyText}>{term}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveRecent(term)} style={{padding: 5}}>
                          <Ionicons name="close" size={18} color="#999" />
                      </TouchableOpacity>
                  </TouchableOpacity>
              ))}
              
              {recentSearches.length === 0 && (
                  <Text style={styles.emptyHistoryText}>Sem buscas recentes</Text>
              )}
          </View>
      ) : (
          // --- MODO: FEED OU RESULTADOS (GRID) ---
          <FlatList
            data={viewMode === 'results' ? resultBooks : feedBooks}
            keyExtractor={(item) => item.id}
            numColumns={3}
            renderItem={renderGridItem}
            
            // Layout do Grid
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.flatListContent}
            
            // Scroll Infinito
            onEndReached={viewMode === 'feed' ? loadMoreFeed : null}
            onEndReachedThreshold={0.5}

            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={[THEME.accent]} // Cor do spinner no Android
                    tintColor={THEME.accent} // Cor do spinner no iOS
                    enabled={viewMode === 'feed'} // Só permite puxar se estiver no feed
                />
            }
            
            // Footer & Empty
            ListFooterComponent={loading ? <ActivityIndicator size="small" color={THEME.accent} style={{margin: 20}} /> : null}
            ListEmptyComponent={!loading ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="images-outline" size={48} color="#E0E0E0" />
                    <Text style={styles.emptyText}>
                        {viewMode === 'results' ? 'Nenhum livro encontrado.' : 'Carregando sugestões...'}
                    </Text>
                </View>
            ) : null}
            
            showsVerticalScrollIndicator={false}
          />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  
  // Header
  headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: THEME.background,
      zIndex: 10,
      marginTop: 15,
  },
  cancelButton: {
      marginTop: 15,
      marginRight: 10,       
      width: 40,  
      height: 40,  
      borderRadius: 12, 
      backgroundColor: '#E53935',
      justifyContent: 'center', 
      alignItems: 'center',     
      
      // Sombra suave
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 4,
  },

  // Layout da Lista
  flatListContent: {
      paddingHorizontal: SCREEN_PADDING,
      paddingBottom: 20,
      paddingTop: 10,
  },
  columnWrapper: {
      gap: ITEM_SPACING,
      marginBottom: 16, 
  },

  // Histórico
  historyContainer: {
      padding: 16,
  },
  historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
  },
  historyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: THEME.textDark,
  },
  clearHistory: {
      fontSize: 12,
      color: '#0095F6',
  },
  historyItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
  },
  historyText: {
      fontSize: 14,
      color: '#262626',
  },
  emptyHistoryText: {
      color: '#999',
      textAlign: 'center',
      marginTop: 20,
  },

  // Empty State
  emptyContainer: {
      alignItems: 'center',
      marginTop: 100,
  },
  emptyText: {
      color: '#999',
      marginTop: 10,
  },
});