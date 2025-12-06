import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Book } from '../domain/models/Book';

interface Props {
  title: string;
  books: Book[];
  onBookPress: (book: Book) => void;
}

// Helper simples para sigla do idioma
const getLangCode = (languages?: string[]) => {
  if (!languages || languages.length === 0) return null;
  const code = languages[0].toLowerCase();
  
  if (code.includes('por')) return 'PT';
  if (code.includes('eng')) return 'EN';
  if (code.includes('spa')) return 'ES';
  if (code.includes('fre')) return 'FR';
  return code.substring(0, 2).toUpperCase();
};

const SOURCE_MAP: Record<string, { label: string, color: string, text: string }> = {
  openlibrary: { label: 'Open Library', color: '#E8DED1', text: '#5D4037' }, // Bege Escuro
  google:      { label: 'Google Books', color: '#D1E8E2', text: '#2C5F2D' }, // Verde Sálvia
  gutenberg:   { label: 'Gutenberg',    color: '#E8D1D1', text: '#5F2C2C' }, // Rosado Antigo
  standard:    { label: 'Standard Ebooks', color: '#E1D1E8', text: '#4A2C5F' },
  local:       { label: 'Servidor Local', color: '#D0E0FF', text: '#003366' },
  default:     { label: 'Acervo',       color: '#F0F0F0', text: '#666' }
};

const getSourceInfo = (source?: string) => SOURCE_MAP[source || 'default'] || SOURCE_MAP.default;

export default function BookSection({ title, books, onBookPress }: Props) {
  if (books.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={books}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => {
          const langBadge = getLangCode(item.language);

          return (
            <TouchableOpacity 
              style={styles.card} 
              onPress={() => onBookPress(item)}
              activeOpacity={0.7}
            >
              {/* Container da Capa + Badge */}
              <View style={styles.coverContainer}>
                {item.coverUrl ? (
                  <Image source={{ uri: item.coverUrl }} style={styles.cover} />
                ) : (
                  <View style={[styles.cover, styles.placeholder]}>
                    <Text style={styles.placeholderText}>{item.title}</Text>
                  </View>
                )}

                {/* Badge de Idioma (Sobreposto) */}
                {langBadge && (
                  <View style={styles.langBadge}>
                    <Text style={styles.langText}>{langBadge}</Text>
                  </View>
                )}
              </View>

              {/* Informações de Texto */}
              <View style={styles.infoContainer}>
                <Text style={styles.bookTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                
                {item.author && (
                  <Text style={styles.author} numberOfLines={1}>
                    {item.author} - {getSourceInfo(item.source).label}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 12,
    color: '#222',
  },
  card: {
    marginRight: 14, // Aumentei um pouco o espaçamento
    width: 110,      // Aumentei levemente a largura para caber nomes maiores
  },
  
  // Capa e Badge
  coverContainer: {
    position: 'relative', // Necessário para o badge absoluto funcionar
    marginBottom: 6,
  },
  cover: {
    width: 110,
    height: 160, // Capa um pouco mais alta (proporção padrão de livro)
    borderRadius: 8,
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
  
  // Badge de Idioma (Estilo Netflix/Streaming)
  langBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)', // Fundo escuro semi-transparente
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  langText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
    marginBottom: 1,
  },
  year: {
    fontSize: 10,
    color: '#999',
  },
});