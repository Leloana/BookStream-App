import React, { memo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Book } from '../domain/models/Book';
import { getLangCode, SOURCE_MAP } from '../services/utils';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  title: string;
  books: Book[];
  onBookPress: (book: Book) => void;
  // Novos props para gerenciar favoritos
  favoritesMap: Record<string, boolean>;
  onToggleFavorite: (book: Book) => void;
}

const getSourceInfo = (source?: string) => SOURCE_MAP[source || 'default'] || SOURCE_MAP.default;

function BookSection({ title, books, onBookPress, favoritesMap, onToggleFavorite }: Props) {  
  if (!books || books.length === 0) return null;
  
  const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

  const renderItem = ({ item }: { item: Book }) => {
    const langBadge = getLangCode(item.language);
    const isFavorite = favoritesMap[item.id] || false;

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => onBookPress(item)}
        activeOpacity={0.9}
      >
        {/* Container da Capa + Badges */}
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
              <Text style={styles.placeholderText}>{item.title}</Text>
            </View>
          )}

          {/* Badge de Idioma (Canto Superior Direito) */}
          {langBadge && (
            <View style={styles.langBadge}>
              <Text style={styles.langText}>{langBadge}</Text>
            </View>
          )}

          {/* === BOTÃO DE FAVORITAR (Canto Inferior Direito - Estilo Pinterest) === */}
          <TouchableOpacity 
            style={styles.favButton}
            onPress={() => onToggleFavorite(item)}
            activeOpacity={0.7}
          >
             <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={16} 
                color={isFavorite ? "#E57373" : "#FFF"} 
             />
          </TouchableOpacity>
        </View>

        {/* Informações de Texto */}
        <View style={styles.infoContainer}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {item.title}
          </Text>
          
          <Text style={styles.author} numberOfLines={1}>
            {item.author || 'Autor desc.'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={books}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={renderItem}
        // Otimização da lista horizontal
        initialNumToRender={4}
        windowSize={3}
      />
    </View>
  );
}

export default memo(BookSection);

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800', // Mais grosso
    marginLeft: 16,
    marginBottom: 12,
    color: '#2C2C2C',
    fontFamily: 'System', // Ou sua fonte personalizada
  },
  card: {
    marginRight: 14, 
    width: 110,      
  },
  
  // Capa e Badge
  coverContainer: {
    position: 'relative', 
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden', // Importante para o botão não sair da borda arredondada
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cover: {
    width: 110,
    height: 160, 
    backgroundColor: '#ddd',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  placeholderText: {
    fontSize: 10,
    textAlign: 'center',
    color: '#555',
  },
  
  // Badges
  langBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)', 
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  langText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },

  // Botão Favoritar Sobreposto
  favButton: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)', // Fundo escuro para contraste
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Textos
  infoContainer: {
    paddingHorizontal: 2,
  },
  bookTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },
  author: {
    fontSize: 11,
    color: '#666',
  },
});