import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { File, Paths } from 'expo-file-system';
import { getInfoAsync } from 'expo-file-system/legacy';

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { RootStackParamList } from '../AppNavigator';
import { getBookDetails } from '../data/api/openLibraryApi';
import { LibraryBook, libraryService } from '../services/libraryService';
import { preferencesService } from '../services/preferencesService';
import { storageService } from '../services/storageService';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { generateFileName, getLangCode } from '../services/utils';
import { SOURCE_MAP } from '../services/utils';

type Props = NativeStackScreenProps<RootStackParamList, 'BookDetails'>;



const getSourceInfo = (source?: string) => SOURCE_MAP[source || 'default'] || SOURCE_MAP.default;

// TEMA CONSISTENTE (Papel & Café)
const THEME = {
  background: '#FAF9F6', // Creme
  textDark: '#2C2C2C',
  textLight: '#666666',
  accent: '#C77D63',      // Terracota
  accentDark: '#A0523D',  // Terracota escuro para sombras/texto forte
  tagBg: '#E8DED1',       // Bege para tags
  divider: '#E0D6CC',
};

export default function BookDetailsScreen({ route }: Props) {
  const { book } = route.params;
  const [downloading, setDownloading] = useState(false);

  const [fileSize, setFileSize] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  const [fullDescription, setFullDescription] = useState<string | null>(book.description || null);
  const [subjects, setSubjects] = useState<string[]>(book.subjects || []);
  const [loadingDetails, setLoadingDetails] = useState(book.source === 'openlibrary');

  const [isFavorite, setIsFavorite] = useState(false); 
  const [localUri, setLocalUri] = useState<string | null>(null);

  const languageLabel = getLangCode(book.language);
  const sourceInfo = getSourceInfo(book.source);

  useEffect(() => {
    checkPdfAvailability();
    checkLibraryStatus();
    book.source === 'openlibrary'? loadExtraDetails() : setLoadingDetails(false);

  }, []);

  async function checkLibraryStatus() {
    checkFavoriteStatus();

    const allDownloaded = await libraryService.getBooks();
    const found = allDownloaded.find(b => b.id === book.id);
    
    if (found && found.localUri) {
        // Confirma se o arquivo ainda existe no disco
        const info = await getInfoAsync(found.localUri);
        if (info.exists) {
            setLocalUri(found.localUri);
        }
    }
  }

  async function openFile() {
    if (!localUri) return;

    const uri = localUri;
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

  async function checkFavoriteStatus() {
    const status = await libraryService.isFavorite(book.id);
    setIsFavorite(status);
  }

  async function handleToggleFavorite() {
    const newStatus = await libraryService.toggleFavorite(book);
    setIsFavorite(newStatus);
  }
  async function loadExtraDetails() {
    const details = await getBookDetails(book.id);
    setFullDescription(details.description || 'Nenhuma sinopse disponível para este título.');
    setSubjects(details.subjects || []);
    setLoadingDetails(false);
  }

  async function checkPdfAvailability() {
    if (!book.pdfUrl) {
      setChecking(false);
      return;
    }
    try {
      const response = await fetch(book.pdfUrl, { method: 'HEAD' });
      if (response.ok || (book.source === 'local' && response.status === 405)) {
        setIsAvailable(true);
        const bytes = response.headers.get('Content-Length');
        if (bytes) {
          const mb = (parseInt(bytes, 10) / (1024 * 1024)).toFixed(2);
          setFileSize(`${mb} MB`);
        }
      } else {
        setIsAvailable(false);
      }
    } catch (error) {
      setIsAvailable(false);
    } finally {
      setChecking(false);
    }
  }

  async function handleDownloadAndRead() {
       if (!book.pdfUrl) return;

       const cleanTitle = book.title.replace(/[^a-z0-9]/gi, '_');
       const fileNameWithExt = generateFileName(book.title);
       try {
         setDownloading(true);
         let folderUri = await storageService.getSavedFolder();

         if (!folderUri) {
            Alert.alert(
                "Configuração Necessária",
                "Para baixar livros, precisamos que você escolha uma pasta no seu dispositivo onde eles serão salvos.",
                [
                    { text: "Cancelar", style: "cancel", onPress: () => setDownloading(false) },
                    { 
                        text: "Escolher Pasta", 
                        onPress: async () => {
                            const newFolder = await storageService.selectFolder();
                            if (newFolder) {
                                handleDownloadAndRead(); 
                            } else {
                                setDownloading(false); 
                            }
                        }
                    }
                ]
            );
            return; 
        }
         const alreadyExists = await storageService.checkForDuplicate(fileNameWithExt);
         if (alreadyExists) {
           setDownloading(false);
           Alert.alert('Arquivo Duplicado', 'Já baixado.');
           return; 
         }
         const tempFile = new File(Paths.cache, fileNameWithExt);
         const output = await File.downloadFileAsync(book.pdfUrl, tempFile);
         if (!output.exists) throw new Error('Erro arquivo.');
         
         const finalUri = await storageService.saveToUserFolder(output.uri, cleanTitle, 'application/pdf');
         
         if (tempFile.exists) tempFile.delete(); 
         
         await libraryService.addBook(book, finalUri);
         await preferencesService.addInterestFromBook(book); 
         
         setLocalUri(finalUri);

       } catch (e) {
         Alert.alert('Erro', 'Falha ao salvar.');
       } finally {
         setDownloading(false);
       }
  }

  const renderSubjects = () => {
    if (loadingDetails) return <ActivityIndicator color={THEME.accent} style={{ marginVertical: 10 }} />;
    if (subjects.length === 0) return null;

    return (
      <View style={styles.tagsSection}>
        <Text style={styles.sectionTitleSm}>Gêneros</Text>
        <View style={styles.tagsContainer}>
          {subjects.map((subject, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{subject}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

const renderActionButton = () => {
    if (checking) return <ActivityIndicator size="small" color={THEME.textDark} />;
    
    if (localUri) {
        return (
            <TouchableOpacity 
                style={[styles.mainButton, { backgroundColor: '#4CAF50' }]} // Verde
                onPress={openFile}
                activeOpacity={0.8}
            >
                <Ionicons name="book-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.mainButtonText}>Ler Agora</Text>
            </TouchableOpacity>
        );
    }

    if (downloading) {
      return (
        <View style={styles.progressContainer}>
          <ActivityIndicator color={THEME.accent} />
          <Text style={styles.progressText}>Baixando... ({fileSize})</Text>
        </View>
      );
    }

    if (isAvailable && book.pdfUrl) {
      return (
        <TouchableOpacity 
          style={styles.mainButton} 
          onPress={handleDownloadAndRead}
          activeOpacity={0.8}
        >
          <Text style={styles.mainButtonText}>Baixar PDF ({fileSize || '?'})</Text>
        </TouchableOpacity>
      );
    }

    if (book.readUrl) {
      return (
        <View style={{ width: '100%', alignItems: 'center' }}>
            <View style={styles.unavailableContainer}>
                <Text style={styles.unavailableText}>PDF direto indisponível.</Text>
                <Text style={styles.mainButtonText}>O autor ou editora disponibilizou apenas leitura web.</Text>
            </View>

            <TouchableOpacity 
                style={[styles.mainButton, { backgroundColor: '#4A6572', marginTop: 10 }]} // Cor diferente para Web
                onPress={() => Linking.openURL(book.readUrl!)}
                activeOpacity={0.8}
            >
                <Text style={styles.mainButtonText}>Ler no Navegador 🌐</Text>
            </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.unavailableContainer}>
        <Text style={styles.unavailableText}>Livro indisponível.</Text>
        <Text style={styles.mainButtonText}>Não encontramos versão digital gratuita.</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: THEME.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
      
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* SEÇÃO 1: Cabeçalho Principal */}
        <View style={styles.headerSection}>
          <View style={styles.coverContainer}>
             <Image source={{ uri: book.coverUrl }} style={styles.cover} resizeMode="cover" />
          </View>
          
          <View style={styles.headerInfo}>
        <TouchableOpacity 
            onPress={handleToggleFavorite} 
            style={styles.favButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Aumenta área de toque
        >
            <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={26} 
                color={isFavorite ? "#E57373" : THEME.textLight} 
            />
        </TouchableOpacity>
              <Text style={styles.title}>{book.title}</Text>


              {book.author && <Text style={styles.author}>{book.author}</Text>}
              
              <View style={styles.infoRow}>
                  {book.year && <Text style={styles.infoText}>{book.year}</Text>}
                  
                  {book.year && (book.pageCount || languageLabel) && <Text style={styles.separator}>•</Text>}
                  
                  {book.pageCount && (
                      <Text style={styles.infoText}>{book.pageCount} págs.</Text>
                  )}

                  {book.pageCount && languageLabel && <Text style={styles.separator}>•</Text>}

                  {languageLabel && (
                      <Text style={styles.infoText}>{languageLabel}</Text>
                  )}
              </View>
               <View style={styles.badgesRow}>
                <View style={[styles.sourceBadge, { backgroundColor: sourceInfo.color }]}>
                    <Text style={[styles.sourceText, { color: sourceInfo.text }]}>
                        {sourceInfo.label}
                    </Text>
                </View>
            </View>
          </View>
        </View>

        <View style={styles.actionSection}>
          {renderActionButton()}
        </View>
 
        <View style={styles.divider} />
        <View style={styles.detailsSection}>
          {/* Tags */}
          {renderSubjects()}

          {/* Sinopse */}
          <View style={styles.sinopseSection}>
              <Text style={styles.sectionTitle}>Sinopse</Text>
              {loadingDetails ? (
                  <ActivityIndicator color={THEME.accent} style={{ alignSelf: 'flex-start', margin: 10 }} />
              ) : (
                  <Text style={styles.description}>{fullDescription}</Text>
              )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.background,
    paddingBottom: 40,
  },
  
  // ============ CABEÇALHO ============
  headerSection: {
    flexDirection: 'row', 
    padding: 20,
    alignItems: 'flex-start',
  },
  coverContainer: {
    shadowColor: '#5C3A21', // Sombra marrom escuro
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
    marginRight: 20,
  },
  cover: {
    width: 120,
    height: 180,
    borderRadius: 6,
    backgroundColor: '#EAEAEA',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.textDark,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', // Fonte serifada
    lineHeight: 30,
  },
  author: {
    fontSize: 18,
    color: THEME.accent,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  infoText: {
    fontSize: 14,
    color: THEME.textLight,
    fontWeight: '500',
  },
  sourceName: {
    fontSize: 14,
    color: THEME.textLight,
    fontWeight: '500',
    marginTop: 10,
  },
  separator: {
    marginHorizontal: 8,
    color: '#CCC',
  },

  // ============ AÇÃO ============
  actionSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  mainButton: {
    backgroundColor: THEME.accent,
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 14,
    width: '100%',
    flexDirection: 'row', // Adicionado para ícone + texto
    justifyContent: 'center', // Centraliza
    alignItems: 'center',
    shadowColor: THEME.accentDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EBE5',
    padding: 14,
    borderRadius: 14,
    width: '100%',
    justifyContent: 'center',
  },
  progressText: {
    marginLeft: 10,
    fontSize: 16,
    color: THEME.accentDark,
    fontWeight: '600',
  },

  // ============ DIVISOR ============
  divider: {
    height: 1,
    backgroundColor: THEME.divider,
    marginHorizontal: 20,
  },

  // ============ DETALHES ============
  detailsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.textDark,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  sectionTitleSm: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textLight,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  // Tags
  tagsSection: {
    marginBottom: 30,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: THEME.tagBg, // Bege quente
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 13,
    color: '#4A4036', // Marrom escuro
    fontWeight: '600',
  },

  // Sinopse
  sinopseSection: {},
  description: {
    fontSize: 17, // Letra um pouco maior para leitura confortável
    color: '#3C3C3C',
    lineHeight: 26, // Bom espaçamento entre linhas
    textAlign: 'left',
  },

  // Unavailable states
  unavailableContainer: { alignItems: 'center', padding: 14, backgroundColor: '#F9EBEB', borderRadius: 12, width: '100%' },
  unavailableText: { color: '#D32F2F', fontWeight: '600', fontSize: 15 },
  webReaderButton: { marginTop: 10, backgroundColor: '#7D7D7D', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  webReaderText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  favButton: {
      padding: 4, // Área de toque maior
  },
    // Estilos novos para o Badge da Fonte
  badgesRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12, // Borda redonda estilo "chip"
    alignSelf: 'flex-start',
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});