import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Book } from '../domain/models/Book';

interface Props {
  book: Book;
  onPress: () => void;
}

const getLangCode = (languages?: string[]) => {
  if (!languages || languages.length === 0) return null;
  const code = languages[0].toLowerCase();
  
  if (code.includes('por')) return 'PT';
  if (code.includes('eng')) return 'EN';
  if (code.includes('spa')) return 'ES';
  if (code.includes('fre')) return 'FR';
  return code.substring(0, 2).toUpperCase();
};

// Configuração das fontes
const SOURCE_MAP: Record<string, { label: string, color: string, text: string }> = {
  openlibrary: { label: 'Open Library', color: '#E8DED1', text: '#5D4037' }, // Bege Escuro
  google:      { label: 'Google Books', color: '#D1E8E2', text: '#2C5F2D' }, // Verde Sálvia
  gutenberg:   { label: 'Gutenberg',    color: '#E8D1D1', text: '#5F2C2C' }, // Rosado Antigo
  standard:    { label: 'Standard Ebooks', color: '#E1D1E8', text: '#4A2C5F' },
  local:       { label: 'Servidor Local', color: '#D0E0FF', text: '#003366' },
  default:     { label: 'Acervo',       color: '#F0F0F0', text: '#666' }
};

const getSourceInfo = (source?: string) => SOURCE_MAP[source || 'default'] || SOURCE_MAP.default;

export default function BookCard({ book, onPress }: Props) {
  const langBadge = getLangCode(book.language);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {book.coverUrl ? (
        <Image source={{ uri: book.coverUrl }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Text style={styles.coverPlaceholderText}>Sem capa</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        {book.author && (
          <Text style={styles.author} numberOfLines={1}>
            {book.author} 
          </Text>
        )}
        {book.year && (
          <Text style={styles.year}>{book.year} - {langBadge}</Text>
        )}

        <Text style={styles.year}>{getSourceInfo(book.source).label}</Text>


      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  cover: {
    width: 60,
    height: 90,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  coverPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: {
    fontSize: 10,
    color: '#555',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
    fontSize: 14,
  },
  author: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  year: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});
