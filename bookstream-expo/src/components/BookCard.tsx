import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Book } from '../domain/models/Book';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons'; // Importar ícones
import { getLangCode, SOURCE_MAP } from '../services/utils';

interface Props {
  book: Book;
  onPress: () => void;
  // Novos props para estado visual
  isFavorite: boolean;
  isDownloaded: boolean;
  onToggleFavorite: () => void;
}

const getSourceInfo = (source?: string) => SOURCE_MAP[source || 'default'] || SOURCE_MAP.default;

function BookCard({ book, onPress, isFavorite, isDownloaded, onToggleFavorite }: Props) {
  const langBadge = getLangCode(book.language);
  const sourceInfo = getSourceInfo(book.source);
  const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* CAPA (Versão Compacta) */}
      <View>
        {book.coverUrl ? (
            <Image 
              source={book.coverUrl} 
              style={styles.cover} 
              placeholder={blurhash} 
              contentFit="cover"   
              transition={500}   
              cachePolicy="memory-disk" 
            />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Text style={styles.coverPlaceholderText}>Sem capa</Text>
          </View>
        )}
        
        {/* Badge de Downloaded (Sobre a capa) */}
        {isDownloaded && (
            <View style={styles.downloadedBadge}>
                <Ionicons name="download-outline" size={14} color="#fff" />
            </View>
        )}
      </View>
      
      {/* INFORMAÇÕES */}
      <View style={styles.info}>
        <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={2}>
            {book.title}
            </Text>
            
            <Text style={styles.author} numberOfLines={1}>
            {book.author || 'Autor desconhecido'} 
            </Text>
            
            <View style={styles.metaContainer}>
                {/* Badge de Idioma */}
                {langBadge && (
                    <View style={styles.miniTag}>
                        <Text style={styles.miniTagText}>{langBadge}</Text>
                    </View>
                )}

                {/* Badge de Fonte */}
                <View style={[styles.miniTag, { backgroundColor: sourceInfo.color, marginLeft: 6 }]}>
                    <Text style={[styles.miniTagText, { color: sourceInfo.text }]}>
                        {sourceInfo.label}
                    </Text>
                </View>

                {book.year && (
                    <Text style={styles.year}>{book.year}</Text>
                )}
            </View>
        </View>

        {/* BOTÃO DE FAVORITAR (Lado Direito) */}
        <TouchableOpacity 
            style={styles.favButton} 
            onPress={(e) => {
                // Impede que o clique abra os detalhes do livro
                e.stopPropagation(); 
                onToggleFavorite();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={22} 
                color={isFavorite ? "#E57373" : "#CCC"} 
            />
        </TouchableOpacity>

      </View>
    </TouchableOpacity>
  );
}

export default memo(BookCard);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10, // Menos padding vertical
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  cover: {
    width: 48,  // Capa menor (antes era 55)
    height: 72, // Altura menor (antes era 85)
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  coverPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: {
    fontSize: 9,
    color: '#757575',
    textAlign: 'center',
  },
downloadedBadge: {
    position: 'absolute',
    bottom: -6, 
    right: -6,
    backgroundColor: '#4CAF50',
    borderRadius: 4, 
    width: 20,       
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5, 
    borderColor: '#fff', 
    zIndex: 10,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row', // Layout horizontal para separar texto e coração
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontWeight: '700',
    fontSize: 14, // Fonte levemente menor
    color: '#2C2C2C',
    marginBottom: 2,
    lineHeight: 18,
  },
  author: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  miniTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#555',
  },
  year: {
    fontSize: 11,
    color: '#999',
    marginLeft: 6,
  },
  favButton: {
    padding: 8,
  },
});