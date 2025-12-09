import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  RefreshControl // <--- 1. IMPORTADO AQUI
} from 'react-native';
import { getInfoAsync } from 'expo-file-system/legacy';

import PageHeader from '../components/PageHeader';
import { Book } from '../domain/models/Book';
import { LibraryBook, libraryService } from '../services/libraryService';
import { storageService } from '../services/storageService';
import { Image } from 'expo-image';
import { formatFolderName } from '../services/utils';

const getLangCode = (languages?: string[]) => {
  if (!languages || languages.length === 0) return null;
  const code = languages[0].toLowerCase();
  if (code.includes('por')) return 'PT';
  if (code.includes('eng')) return 'EN';
  if (code.includes('spa')) return 'ES';
  if (code.includes('fre')) return 'FR';
  return code.substring(0, 2).toUpperCase();
};

const THEME = {
  background: '#FAF9F6',
  cardBg: '#FFFFFF',
  textDark: '#2C2C2C',
  textLight: '#666666',
  accent: '#C77D63',
  danger: '#E57373',
  dangerBg: '#FFF0F0',
  success: '#4CAF50',
  neutral: '#E0E0E0',
  webBlue: '#546E7A',
};

export default function MyBooksScreen({ navigation }: any) {
  const [items, setItems] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string>('');

  const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    setLoading(true);
    
    // 1. Carrega dados do banco
    const data = await libraryService.getAllBooks();
    
    // 2. Verifica pasta
    const folderUri = await storageService.getSavedFolder();
    if (folderUri) {
        setCurrentFolder(formatFolderName(folderUri));
    } else {
        setCurrentFolder('Não definida');
    }

    // 3. Auditoria de arquivos
    const verifiedData = await Promise.all(data.map(async (book) => {
        if (book.isDownloaded && book.localUri) {
            try {
                const info = await getInfoAsync(book.localUri);
                
                if (!info.exists) {
                    throw new Error("Arquivo não existe mais");
                }

            } catch (e) {
                console.log(`Arquivo inacessível/deletado: ${book.title}. Resetando status.`);
                
                const updatedBook = { ...book, isDownloaded: false, localUri: "" }; // Alterado para null para limpar
                
                if (libraryService.updateBookStatus) {
                    await libraryService.updateBookStatus(updatedBook); 
                }
                
                return updatedBook;
            }
        }
        return book;
    }));

    verifiedData.sort((a, b) => {
        if (a.isDownloaded && !b.isDownloaded) return -1;
        if (!a.isDownloaded && b.isDownloaded) return 1;
        return (b.downloadedAt || 0) - (a.downloadedAt || 0);
    });
    
    setItems(verifiedData);
    setLoading(false);
  }

  async function handleChangeFolder() {
    Alert.alert(
      'Gerenciar Pasta',
      'Escolha uma nova pasta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Selecionar Pasta', 
          onPress: async () => {
            try {
              await storageService.selectFolder();
              loadData(); 
            } catch (error) {
              console.error(error);
              Alert.alert('Erro', 'Não foi possível ler a pasta selecionada.');
            }
          }
        }
      ]
    );
  }

  const handleCardPress = (item: LibraryBook) => {
    navigation.navigate('BookDetails', { book: item });
  };

  async function openFile(book: LibraryBook) {
    if (!book.localUri) return;

    const uri = book.localUri;
    if (Platform.OS === 'android') {
      try {
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: uri,
          flags: 1, 
          type: 'application/pdf',
        });
        return;
      } catch (e) {
        console.log("Erro Intent...");
      }
    }
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    }
  }

  function handleDownloadPress(book: Book) {
      navigation.navigate('BookDetails', { book });
  }

  async function handleRemoveFavorite(bookId: string) {
      await libraryService.toggleFavorite({ id: bookId } as Book);
      loadData();
  }

  function confirmDelete(book: LibraryBook) {
    Alert.alert(
      'Gerenciar Arquivo',
      `O que deseja fazer com "${book.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir Arquivo', 
          style: 'destructive', 
          onPress: async () => {
            if (book.localUri) {
                await storageService.deleteFile(book.localUri);
                await libraryService.removeBook(book.id);
                loadData(); 
            }
          }
        }
      ]
    );
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const renderLibraryItem = ({ item }: { item: LibraryBook }) => {
    const langBadge = getLangCode(item.language);
    const isDownloaded = item.isDownloaded && item.localUri;
    
    const hasPdf = !!item.pdfUrl;
    const hasWeb = !!item.readUrl;

    const renderButtons = () => {
        // CASO 1: BAIXADO
        if (isDownloaded) {
            return (
                <>
                    <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: '#4CAF50' }]} 
                        onPress={() => openFile(item)}
                    >
                        <Ionicons name="book-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.buttonText}>Ler</Text>
                    </TouchableOpacity>
        
                    <TouchableOpacity 
                        style={styles.deleteButton} 
                        onPress={() => confirmDelete(item)}
                    >
                        <Ionicons name="trash-outline" size={20} color={THEME.danger} />
                    </TouchableOpacity>
                </>
            );
        }

        // CASO 2: NÃO BAIXADO + PDF
        if (hasPdf) {
            return (
                <>
                    <TouchableOpacity 
                        style={styles.downloadButton} 
                        onPress={() => handleDownloadPress(item)}
                    >
                        <Ionicons name="download-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.buttonText}>Baixar</Text>
                    </TouchableOpacity>
        
                    <TouchableOpacity 
                        style={styles.deleteButton} 
                        onPress={() => handleRemoveFavorite(item.id)}
                    >
                        <Ionicons name="heart-dislike-outline" size={20} color={THEME.textLight} />
                    </TouchableOpacity>
                </>
            );
        }

        // CASO 3: WEB
        if (hasWeb) {
            return (
                <>
                    <TouchableOpacity 
                        style={[styles.actionButton, { backgroundColor: THEME.webBlue }]} 
                        onPress={() => Linking.openURL(item.readUrl!)}
                    >
                        <Ionicons name="globe-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.buttonText}>Web</Text>
                    </TouchableOpacity>
        
                    <TouchableOpacity 
                        style={styles.deleteButton} 
                        onPress={() => handleRemoveFavorite(item.id)}
                    >
                        <Ionicons name="heart-dislike-outline" size={20} color={THEME.textLight} />
                    </TouchableOpacity>
                </>
            );
        }

        // CASO 4: INDISPONÍVEL
        return (
            <>
                <View style={styles.unavailableBadge}>
                     <Ionicons name="alert-circle-outline" size={16} color={THEME.danger} style={{marginRight: 4}}/>
                     <Text style={styles.unavailableText}>Indisponível</Text>
                </View>

                <TouchableOpacity 
                    style={styles.deleteButton} 
                    onPress={() => handleRemoveFavorite(item.id)}
                >
                    <Ionicons name="trash-outline" size={20} color={THEME.textLight} />
                </TouchableOpacity>
            </>
        );
    };

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => handleCardPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.coverShadow}>
          <View style={styles.coverContainer}>
              {item.coverUrl ? (
                  <Image 
                    source={item.coverUrl} 
                    style={styles.cover} 
                    placeholder={blurhash} 
                    contentFit="cover"   
                    transition={500}   
                    cachePolicy="memory-disk" 
                  />
              ) : (
                  <View style={[styles.cover, styles.placeholder]}>
                      <Text style={styles.placeholderText}>{item.title[0]}</Text>
                  </View>
              )}

              {langBadge && (
                <View style={styles.langBadge}>
                  <Text style={styles.langText}>{langBadge}</Text>
                </View>
              )}
          </View>
        </View>
  
        <View style={styles.infoContainer}>
          <View style={styles.textBlock}>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.author} numberOfLines={1}>
                  {item.author || 'Autor desconhecido'}
              </Text>
              
              <View style={[styles.statusBadge, isDownloaded ? styles.statusDownloaded : styles.statusWishlist]}>
                  <Ionicons 
                    name={isDownloaded ? "checkmark-circle" : "heart"} 
                    size={10} 
                    color={isDownloaded ? THEME.success : THEME.accent} 
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.statusText, { color: isDownloaded ? THEME.success : THEME.accent }]}>
                      {isDownloaded ? "Baixado em " + formatDate(item.downloadedAt) : "Na Lista de Desejos"}
                  </Text>
              </View>
          </View>
  
          <View style={styles.actionsRow}>
              {renderButtons()}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
      
      <View style={styles.headerContainer}>
         <View style={{ flex: 1 }}>
            <PageHeader 
                title="Minha Estante" 
                subtitle={`${items.length} ${items.length === 1 ? 'item' : 'itens'} • ${currentFolder}`} 
            />
         </View>
         
         <TouchableOpacity 
            style={styles.folderButton} 
            onPress={handleChangeFolder}
            activeOpacity={0.6}
         >
            <Ionicons name="folder-open-outline" size={24} color={THEME.textDark} />
         </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        
        // === ATUALIZAÇÃO DO PULL TO REFRESH ===
        refreshControl={
            <RefreshControl
                refreshing={loading}
                onRefresh={loadData}
                colors={[THEME.accent]} // Android
                tintColor={THEME.accent} // iOS
            />
        }
        
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="library-outline" size={80} color="#D1C4E9" />
                <Text style={styles.emptyTitle}>Sua estante está vazia</Text>
                <Text style={styles.emptySubtitle}>
                    Livros baixados e favoritos aparecerão aqui.
                </Text>
            </View>
        }
        renderItem={renderLibraryItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingRight: 20,
  },
  folderButton: {
    marginTop: 53,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  card: {
    flexDirection: 'row',
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    shadowColor: '#8B4513', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  
  coverShadow: {
      shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4, marginRight: 16,
  },
  coverContainer: {
      borderRadius: 6,
      overflow: 'hidden',
      position: 'relative',
  },
  cover: { width: 75, height: 115, backgroundColor: '#eee' },
  placeholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E0E0E0' },
  placeholderText: { fontSize: 24, fontWeight: 'bold', color: '#999' },

  langBadge: {
    position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4,
  },
  langText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  
  infoContainer: { flex: 1, justifyContent: 'space-between', paddingVertical: 2 },
  textBlock: { marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '700', color: THEME.textDark, marginBottom: 4, lineHeight: 20 },
  author: { fontSize: 14, color: THEME.textLight, marginBottom: 6 },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  statusDownloaded: { backgroundColor: '#E8F5E9' },
  statusWishlist: { backgroundColor: '#FFF3E0' }, 
  statusText: { fontSize: 10, fontWeight: 'bold' },

  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  
  actionButton: { flex: 1, flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  downloadButton: { flex: 1, flexDirection: 'row', backgroundColor: THEME.textDark, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  
  unavailableBadge: { flex: 1, flexDirection: 'row', backgroundColor: '#FFEBEE', paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFCDD2' },
  unavailableText: { color: '#D32F2F', fontSize: 12, fontWeight: 'bold' },

  buttonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  deleteButton: { width: 40, height: 40, backgroundColor: THEME.dangerBg, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: THEME.textDark, marginTop: 20, marginBottom: 10 },
  emptySubtitle: { fontSize: 15, color: THEME.textLight, textAlign: 'center', lineHeight: 22 }
});